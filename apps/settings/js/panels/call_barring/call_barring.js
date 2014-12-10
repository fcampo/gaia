/**
 *  Call Barring Settings
 *  Manage the state of the different services of call barring
 */
define(function(require) {
  'use strict';

  var Observable = require('modules/mvvm/observable');

  var _mobileConnection,
      _voiceServiceClassMask;

  var _cbAction = {
    CALL_BARRING_BAOC: 0,     // BAOC: Barring All Outgoing Calls
    CALL_BARRING_BOIC: 1,     // BOIC: Barring Outgoing International Calls
    CALL_BARRING_BOICexHC: 2, // BOICexHC: Barring Outgoing International
                              //           Calls Except  to Home Country
    CALL_BARRING_BAIC: 3,     // BAIC: Barring All Incoming Calls
    CALL_BARRING_BAICr: 4     // BAICr: Barring All Incoming Calls in Roaming
  };

  var _cbServiceMapper = {
    'baoc': _cbAction.CALL_BARRING_BAOC,
    'boic': _cbAction.CALL_BARRING_BOIC,
    'boicExhc': _cbAction.CALL_BARRING_BOICexHC,
    'baic': _cbAction.CALL_BARRING_BAIC,
    'baicR': _cbAction.CALL_BARRING_BAICr
  };

  var call_barring_prototype = {
    // settings
    baoc: '',
    boic: '',
    boicExhc: '',
    baic: '',
    baicR: '',
    // enabled state for the settings
    baoc_enabled: '',
    boic_enabled: '',
    boicExhc_enabled: '',
    baic_enabled: '',
    baicR_enabled: '',
    // updatingState
    updating: false,

    // rest of functions
    init: function(mobileConn, voiceService) {
      _mobileConnection = mobileConn;
      _voiceServiceClassMask = voiceService;
    },

    _enable: function(elementArray) {
      elementArray.forEach(function disable(element) {
        this[element + '_enabled'] = true;
      }.bind(this));

      // If barring All Outgoing is set, disable the rest of outgoing calls
      if (!!this.baoc) {
        this.boic_enabled = false;
        this.boicExhc_enabled = false;
      }
      // If barring All Incoming is active, disable the rest of incoming calls
      if (!!this.baic) {
        this.baicR_enabled = false;
      }

    },
    _disable: function(elementArray) {
      elementArray.forEach(function disable(element) {
        this[element + '_enabled'] = false;
      }.bind(this));
    },

    /**
     * Makes a request to the RIL for the current state of a specific
     * call barring option.
     * @param id Code of the service we want to request the state of
     * @returns Promise with result/error of the request
     */
    _getRequest: function(id) {
      var callOptions = {
        'program': id,
        'serviceClass': _voiceServiceClassMask
      };

      return new Promise(function (resolve, reject) {
        // Send the request
        var request = _mobileConnection.getCallBarringOption(callOptions);
        request.onsuccess = function() {
          resolve(request.result.enabled);
        };
        request.onerror = function() {
          /* request.error = { name, message } */
          reject(request.error);
        };
      });
    },

    /**
     * Makes a request to the RIL to change the current state of a specific
     * call barring option.
     * @param options Object with the details of the new state
     * {
     *   'program':      // id of the service to update
     *   'enabled':      // new state for the service
     *   'password':     // password introduced by the user
     *   'serviceClass': // type of RIL service (voice in this case)
     * }
     */
    _setRequest: function(options) {
      return new Promise(function (resolve, reject) {
        // Send the request
        var request = _mobileConnection.setCallBarringOption(options);
        request.onsuccess = function() {
          resolve();
        };
        request.onerror = function() {
          /* request.error = { name, message } */
          reject(request.error);
        };
      });
    },

    set: function(setting, password) {

      // Check for updating in progress
      if (!!this.updating) {
        return;
      }

      var self = this;
      return new Promise(function (resolve, reject) {
        self.updating = true;
        var allElements = [
          'baoc',
          'boic',
          'boicExhc',
          'baic',
          'baicR'
        ];
        self._disable(allElements);

        // get options
        var options = {
          'program': _cbServiceMapper[setting],
          'enabled': !self[setting],
          'password': password,
          'serviceClass': _voiceServiceClassMask
        };
        var error = null;
        self._setRequest(options).then(function success() {
          self[setting] = !self[setting];
        }).catch(function errored(err) {
          error = err;
        }).then(function doAnyways() {
          self.updating = false;
          self._enable(allElements);
          if (!error) {
            resolve();
          } else {
            reject(error);
          }
        });
      });
    },

    getAll: function() {
      // Check for updating in progress
      if (this.updating) {
        return;
      }

      this.updating = true;

      var allElements = [
        'baoc',
        'boic',
        'boicExhc',
        'baic',
        'baicR'
      ];
      this._disable(allElements);

      var self = this;
      var setting = 'baoc';
      self._getRequest(_cbServiceMapper[setting]).then(
        function received(value) {
        self[setting] = value;
        setting = 'boic';
        return self._getRequest(_cbServiceMapper[setting]);
      }).then(function received(value) {
        self[setting] = value;
        setting = 'boicExhc';
        return self._getRequest(_cbServiceMapper[setting]);
      }).then(function received(value) {
        self[setting] = value;
        setting = 'baic';
        return self._getRequest(_cbServiceMapper[setting]);
      }).then(function received(value) {
        self[setting] = value;
        setting = 'baicR';
        return self._getRequest(_cbServiceMapper[setting]);
      }).then(function received(value) {
        self[setting] = value;
      }).catch(function errorWhileProcessing(err) {
        console.error('Error receiving Call Barring status: ' +
          err.name + ' - ' + err.message);
      }).then(function afterEverythingDone() {
        self.updating = false;
        self._enable(allElements);
      });
    }
  };

  var callBarring = Observable(call_barring_prototype);

  return callBarring;
});
