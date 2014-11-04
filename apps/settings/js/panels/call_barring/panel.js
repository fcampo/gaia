/* global DsdsSettings */

define(function(require) {
  'use strict';

  var SettingsPanel = require('modules/settings_panel');
  var CallBarring = require('panels/call_barring/call_barring');
  var InputPasscodeScreen = require('panels/call_barring/cb_passcode_dialog');
  var Toaster = require('shared/toaster');

  return function ctor_call_barring() {
    var _callBarring = CallBarring();
    var _passcodeScreen = InputPasscodeScreen();

    var _cbAction = {
      CALL_BARRING_BAOC: 0,     // BAOC: Barring All Outgoing Calls
      CALL_BARRING_BOIC: 1,     // BOIC: Barring Outgoing International Calls
      CALL_BARRING_BOICexHC: 2, // BOICexHC: Barring Outgoing International
                                //           Calls Except  to Home Country
      CALL_BARRING_BAIC: 3,     // BAIC: Barring All Incoming Calls
      CALL_BARRING_BAICr: 4     // BAICr: Barring All Incoming Calls in Roaming
    };

    var _cbServiceMapper = {
      'li-cb-baoc': _cbAction.CALL_BARRING_BAOC,
      'li-cb-boic': _cbAction.CALL_BARRING_BOIC,
      'li-cb-boic-exhc': _cbAction.CALL_BARRING_BOICexHC,
      'li-cb-baic': _cbAction.CALL_BARRING_BAIC,
      'li-cb-baic-r': _cbAction.CALL_BARRING_BAICr
    };

    var _mobileConnection = null,
        _voiceServiceClassMask = null;

    var cbSettings = {};

    var refresh;

    function refresh_on_load(e) {
      // Refresh when:
      //  - we load the panel from #call
      //  - we re-load the panel after hide (screen off or change app)
      // But NOT when:
      //  - we come back from changing the password
      if (e.detail.current === '#call-cbSettings' &&
          e.detail.previous === '#call-barring-passcode-change') {
            refresh = false;
      }
    }


    /**
     * Updates a Call Barring item with a new status.
     * @parameter item DOM 'li' element to update
     * @parameter newStatus Object with data for the update. Of the form:
     * {
     *   disabled:[true|false], // optional, new disabled state
     *   checked: [true|false], // optional, new checked state for the input
     *   message: [string]      // optional, new message for the description
     * }
     */
    function _updateCallBarringItem(item, newStatus) {
      var descText = item.querySelector('small');
      var input = item.querySelector('input');

      // disable the item
      if (typeof newStatus.disabled === 'boolean') {
        newStatus.disabled ?
          item.setAttribute('aria-disabled', true) :
          item.removeAttribute('aria-disabled');

        if (input) {
          input.disabled = newStatus.disabled;
        }
      }

      // update the input value
      if (input && typeof newStatus.checked === 'boolean') {
        input.checked = newStatus.checked;
      }

      // update the description
      var text = newStatus.message;
      if (!text) {
        text = input && input.checked ? 'enabled' : 'disabled';
      }
      if (descText) {
        navigator.mozL10n.setAttributes(descText, text);
      }
    }

    /**
     * Enable all the elements of the Call Barring screen.
     * @param description Message to show after enabling.
     * @param callback In case it's needed to know when the process ends.
     */
    function _enableAllCallBarring(description, callback) {
      [].forEach.call(
        document.querySelectorAll('#call-cbSettings li'),
        function enable(item) {
          var newStatus = {
            'disabled': false,
            'message': description
          };
          _updateCallBarringItem(item, newStatus);
        }
      );

      // When barring All Outgoing, disable the rest of outgoing services
      if (cbSettings.baoc.querySelector('input').checked) {
        _updateCallBarringItem(cbSettings.boic, {'disabled': true});
        _updateCallBarringItem(cbSettings.boicExhc, {'disabled': true});
      }
      // When barring All Incoming, disable the rest of incoming services
      if (cbSettings.baic.querySelector('input').checked) {
        _updateCallBarringItem(cbSettings.baicR, {'disabled': true});
      }

      if (typeof callback === 'function') {
        callback();
      }
    }

    /**
     * Disable all the elements of the Call Barring screen.
     * @param description Message to show while disabled.
     * @param callback In case it's needed to know when the process ends.
     */
    function _disableAllCallBarring(description, callback) {
      [].forEach.call(
        document.querySelectorAll('#call-cbSettings li'),
        function disable(item) {
          var newStatus = {
            'disabled': true,
            'message': description
          };
          _updateCallBarringItem(item, newStatus);
        }
      );
      if (typeof callback === 'function') {
        callback();
      }
    }

    /**
     * Makes a request to the RIL to change the current state of a specific
     * call barring option.
     * @param id of the service we want to update
     * @param options Object with the details of the new state
     * {
     *   'program':      // id of the service to update
     *   'enabled':      // new state for the service
     *   'password':     // password introduced by the user
     *   'serviceClass': // type of RIL service (voice in this case)
     * }
     */
    function _setCallBarring(id, options) {
      // disable tap on all inputs while we deal with server
      _disableAllCallBarring('callSettingsQuery');

      _callBarring.setRequest(_mobileConnection, options)
      .catch(function error(requestError) {
        /* requestError = { name, message } */
        // revert visual changes
        _updateCallBarringItem(document.getElementById(id),
                               {'checked': !options.enabled});
        var toast = {
          messageL10nId: 'callBarring-update-item-error',
          messageL10nArgs: {'error': requestError.name},
          latency: 3000,
          useTransition: true
        };
        Toaster.showToast(toast);
      }).then(function doAnyways() {
        _enableAllCallBarring();
      });
    }

    /**
     * Makes a request to the RIL for the current state of a specific
     * call barring option.
     * @param id of the service we want to request the state of
     * @returns result of the request as a Promise
     */
    function _getCallBarring(id) {
      var options = {
        'program': _cbServiceMapper[id],
        'serviceClass': _voiceServiceClassMask
      };

      return _callBarring.getRequest(_mobileConnection, options);
    }

    /**
     * Update the state of all the Call Barring subpanels
     */
    function _updateCallBarringSubpanels(callback) {
      var error = null;
      // disable all, change description to 'requesting network info'
      _disableAllCallBarring('callSettingsQuery');

      // make the request for each one
      var cbOptions = [];
      var currentID = '';

      currentID = 'li-cb-baoc';
      _getCallBarring(currentID).then(function gotValue(value) {
        cbOptions.push({'id': currentID, 'checked': value});
        currentID = 'li-cb-boic';
        return _getCallBarring(currentID);
      }).then(function gotValue(value) {
        cbOptions.push({'id': currentID, 'checked': value});
        currentID = 'li-cb-boic-exhc';
        return _getCallBarring(currentID);
      }).then(function gotValue(value) {
        cbOptions.push({'id': currentID, 'checked': value});
        currentID = 'li-cb-baic';
        return _getCallBarring(currentID);
      }).then(function gotValue(value) {
        cbOptions.push({'id': currentID, 'checked': value});
        currentID = 'li-cb-baic-r';
        return _getCallBarring(currentID);
      }).then(function gotValue(value) {
        cbOptions.push({'id': currentID, 'checked': value});
        // update each with the values received
        cbOptions.forEach(function updateItem(listItem) {
          var item = document.getElementById(listItem.id);
          _updateCallBarringItem(item, {'checked': listItem.checked});
        });
      }).catch(function errorWhileProcessing(err) {
        error = err;
      }).then(function afterEverythingDone() {
        _enableAllCallBarring(null, function finished() {
          if (typeof callback === 'function') {
            callback(error);
          }
        });
      });

    }

    /**
     * Shows the passcode input screen for the user to introduce the PIN
     * needed to activate/deactivate a service
     */
    function _callBarringClick(evt) {
      var input = evt.target;

      // Show password screen
      _passcodeScreen.show().then(
        // password screen confirmed
        function confirmed(password) {
          var inputID = input.parentNode.parentNode.id;
          // Create the options object
          var options = {
            'program': _cbServiceMapper[inputID],
            'enabled': input.checked,
            'password': password,
            'serviceClass': _voiceServiceClassMask
          };

          _setCallBarring(inputID, options);
        },
        // password screen canceled
        function canceled() {
          // revert visual changes
          input.checked = !input.checked;
        }
      );
    }

    return SettingsPanel({
      onInit: function cb_onInit(panel) {
        console.log('> on init');
        _mobileConnection = window.navigator.mozMobileConnections[
          DsdsSettings.getIccCardIndexForCallSettings()
        ];
        _voiceServiceClassMask = _mobileConnection.ICC_SERVICE_CLASS_VOICE;

        cbSettings = {
          baoc: document.getElementById('li-cb-baoc'),
          boic: document.getElementById('li-cb-boic'),
          boicExhc: document.getElementById('li-cb-boic-exhc'),
          baic: document.getElementById('li-cb-baic'),
          baicR: document.getElementById('li-cb-baic-r')
        };

        for (var i in cbSettings) {
          cbSettings[i].querySelector('input').
            addEventListener('change', _callBarringClick);
        }

        _passcodeScreen.init();
      },

      onBeforeShow: function cb_onBeforeShow() {
        console.log('> on beforeshow');
        refresh = true;
        window.addEventListener('panelready', refresh_on_load);
        ///////// observe and react on change?
        // cbSettings.forEach(function(setting) {
        //   _callBarring.observe(setting, function(newValue) {
        //   });
        // });
      },

      onShow: function cb_onShow() {
        console.log('> on show');
        if (refresh) {
          // _callBarring.refresh();
          _updateCallBarringSubpanels();
        }
      },

      onBeforeHide: function dp_onBeforeHide() {
        console.log('> on beforehide');
        /////////// unobserve
        // cbSettings.forEach(function(setting) {
        //   _callBarring.unobserve(setting, function(newValue) {
        //   });
        // });
      },

      onHide: function cb_onHide() {
        console.log('> on hide');
        window.removeEventListener('panelready', refresh_on_load);
      }

    });
  };
});
