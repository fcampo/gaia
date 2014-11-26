/* global loadBodyHTML, MockNavigatorMozMobileConnections */
'use strict';

require('/shared/test/unit/load_body_html_helper.js');
require('/shared/test/unit/mocks/mock_navigator_moz_mobile_connections.js');

suite('CallBarringPanel', function() {
  var modules = [
    'panels/call_barring/panel'
  ];
  var map = {
    '*': {
      'modules/settings_panel': 'MockSettingsPanel',
      'panels/call_barring/call_barring': 'MockCallBarring',
      'panels/call_barring/cb_passcode_dialog': 'MockPasscode'
    }
  };

  var realDsdsSettings,
      realMozMobileConnections;

  var _mobileConnection,
      _serviceClass;

  var _cbServiceMapper = {
    'li-cb-baoc': 0,
    'li-cb-boic': 1,
    'li-cb-boic-exhc': 2,
    'li-cb-baic': 3,
    'li-cb-baic-r': 4
  };

  suiteSetup(function() {
    realDsdsSettings = window.DsdsSettings;
    window.DsdsSettings = {
      getIccCardIndexForCallSettings: function() {
        return 0;
      }
    };

    realMozMobileConnections = navigator.mozMobileConnections;
    navigator.mozMobileConnections = MockNavigatorMozMobileConnections;

    _mobileConnection = MockNavigatorMozMobileConnections[0];
    _serviceClass = _mobileConnection.ICC_SERVICE_CLASS_VOICE;
  });

  setup(function(done) {
    // Create a new requirejs context
    var requireCtx = testRequire([], map, function() {});
    var that = this;

    loadBodyHTML('_call_cb_settings.html');

    // Define MockSettingsPanel
    define('MockSettingsPanel', function() {
      return function(options) {
        return {
          init: options.onInit,
          beforeShow: options.onBeforeShow,
          show: options.onShow,
          beforeHide: options.onBeforeHide
        };
      };
    });

    // Define MockCallBarring
    this.mockCallBarring = {
      getRequest: function() {
        return new Promise(function (res, rej) {
          res();
        });
      },
      setRequest: function() {}
    };
    define('MockCallBarring', function() {
      return function() {
        return that.mockCallBarring;
      };
    });

    // Define MockPasscode
    this.mockPasscode = {
      init: function() {},
      show: function() {}
    };
    define('MockPasscode', function() {
      return function() {
        return that.mockPasscode;
      };
    });

    requireCtx(modules, function(CallBarringPanel) {
      that.panel = CallBarringPanel();
      done();
    });
  });

  suiteTeardown(function() {
    window.DsdsSettings = realDsdsSettings;
    navigator.mozMobileConnections = realMozMobileConnections;
  });

  test('panel starts passcode on init', function() {
    this.sinon.stub(this.mockPasscode, 'init');
    this.panel.init(document.body);
    assert.isTrue(this.mockPasscode.init.calledOnce);
  });

  test('listen to panelready before showing', function() {
    this.sinon.stub(window, 'addEventListener');
    this.panel.init(document.body);
    this.panel.beforeShow(document.body);
    assert.isTrue(window.addEventListener.calledWith('panelready'));
  });

  test('stop listening when hiding', function() {
    this.sinon.stub(window, 'removeEventListener');
    this.panel.init(document.body);
    this.panel.beforeHide(document.body);
    assert.isTrue(window.removeEventListener.calledWith('panelready'));
  });

  test('request updated data for UI on show', function(done) {
    this.sinon.stub(this.mockCallBarring, 'getRequest')
      .returns(Promise.resolve('false'));

    this.panel.init(document.body);
    this.panel.beforeShow(document.body);
    this.panel.show(document.body);

    setTimeout(function() {
      sinon.assert.alwaysCalledWith(this.mockCallBarring.getRequest,
      _mobileConnection);
      sinon.assert.callCount(this.mockCallBarring.getRequest, 5);
      done();
    }.bind(this));
  });
});
