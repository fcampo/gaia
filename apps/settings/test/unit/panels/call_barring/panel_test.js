/* global loadBodyHTML, MockL10n, MockNavigatorMozMobileConnections */
'use strict';

require('/shared/test/unit/mocks/mock_l10n.js');
require('/shared/test/unit/load_body_html_helper.js');
require('/shared/test/unit/mocks/mock_navigator_moz_mobile_connections.js');

suite('Call Barring Panel >', function() {
  var modules = [
    'panels/call_barring/panel'
  ];
  var map = {
    '*': {
      'modules/settings_panel': 'MockSettingsPanel',
      'panels/call_barring/call_barring': 'MockCallBarring',
      'panels/call_barring/cb_passcode_dialog': 'MockPasscode',
      'shared/toaster': 'MockToaster'
    }
  };

  var realL10n,
      realDsdsSettings,
      realMozMobileConnections;

  var _mobileConnection,
      _serviceClass;

  var baocElement,
      boicElement,
      boicExhcElement,
      baicElement,
      baicRElement;

  suiteSetup(function() {
    realDsdsSettings = window.DsdsSettings;
    window.DsdsSettings = {
      getIccCardIndexForCallSettings: function() {
        return 0;
      }
    };

    realL10n = navigator.mozL10n;
    navigator.mozL10n = MockL10n;

    realMozMobileConnections = navigator.mozMobileConnections;
    navigator.mozMobileConnections = MockNavigatorMozMobileConnections;

    _mobileConnection = MockNavigatorMozMobileConnections[0];
    _serviceClass = _mobileConnection.ICC_SERVICE_CLASS_VOICE;
  });

  suiteTeardown(function() {
    window.DsdsSettings = realDsdsSettings;
    navigator.mozL10n = realL10n;
    navigator.mozMobileConnections = realMozMobileConnections;
  });

  function resetHTML() {
    document.body.innerHTML = '';
    loadBodyHTML('_call_barring.html');

    baocElement = document.getElementById('li-cb-baoc');
    boicElement = document.getElementById('li-cb-boic');
    boicExhcElement = document.getElementById('li-cb-boicExhc');
    baicElement = document.getElementById('li-cb-baic');
    baicRElement = document.getElementById('li-cb-baicR');
  }

  function isItemDisabled(element) {
    // getAttribute returns a 'string', asserts errors if not a boolean
    return element.getAttribute('aria-disabled') === 'true';
  }
  function isItemChecked(element) {
    return element.querySelector('input').checked || false;
  }

  setup(function(done) {
    // Create a new requirejs context
    var requireCtx = testRequire([], map, function() {});
    var that = this;

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
      getAll: function(api) {},
      set: function(api , setting, passcode) {
        return new Promise(function (res, rej) {
          res();
        });
      },
      observe: function() {},
      unobserve: function() {}
    };
    define('MockCallBarring', function() {
      return that.mockCallBarring;
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

    // Define MockToaster
    this.mockToaster = {
      showToast: function() {}
    };
    define('MockToaster', function() {
      return that.mockToaster;
    });

    requireCtx(modules, function(CallBarringPanel) {
      that.panel = CallBarringPanel();
      done();
    });

    resetHTML();
  });


  test('listen to \'panelready\' before showing >', function() {
    this.sinon.stub(window, 'addEventListener');
    this.panel.init(document.body);
    this.panel.beforeShow(document.body);
    assert.isTrue(window.addEventListener.calledWith('panelready'));
  });

  test('observe settings status before showing >', function() {
    this.sinon.stub(this.mockCallBarring, 'observe');
    this.panel.init(document.body);
    this.panel.beforeShow(document.body);
    assert.isTrue(this.mockCallBarring.observe.calledWith('baoc'));
    assert.isTrue(this.mockCallBarring.observe.calledWith('boic'));
    assert.isTrue(this.mockCallBarring.observe.calledWith('boicExhc'));
    assert.isTrue(this.mockCallBarring.observe.calledWith('baic'));
    assert.isTrue(this.mockCallBarring.observe.calledWith('baicR'));
  });

  test('observe settings availability before showing >', function() {
    this.sinon.stub(this.mockCallBarring, 'observe');
    this.panel.init(document.body);
    this.panel.beforeShow(document.body);
    assert.isTrue(this.mockCallBarring.observe.calledWith('baoc_enabled'));
    assert.isTrue(this.mockCallBarring.observe.calledWith('boic_enabled'));
    assert.isTrue(this.mockCallBarring.observe.calledWith('boicExhc_enabled'));
    assert.isTrue(this.mockCallBarring.observe.calledWith('baic_enabled'));
    assert.isTrue(this.mockCallBarring.observe.calledWith('baicR_enabled'));
  });

  test('observe updating status before showing >', function() {
    this.sinon.stub(this.mockCallBarring, 'observe');
    this.panel.init(document.body);
    this.panel.beforeShow(document.body);
    assert.isTrue(this.mockCallBarring.observe.calledWith('updating'));
  });

  test('stop listening to \'panelready\' before hiding >', function() {
    this.sinon.stub(window, 'removeEventListener');
    this.panel.init(document.body);
    this.panel.beforeHide();
    assert.isTrue(window.removeEventListener.calledWith('panelready'));
  });

  test('stop observing settings status before hiding >', function() {
    this.sinon.stub(this.mockCallBarring, 'unobserve');
    this.panel.init(document.body);
    this.panel.beforeHide();
    assert.isTrue(this.mockCallBarring.unobserve.calledWith('baoc'));
    assert.isTrue(this.mockCallBarring.unobserve.calledWith('boic'));
    assert.isTrue(this.mockCallBarring.unobserve.calledWith('boicExhc'));
    assert.isTrue(this.mockCallBarring.unobserve.calledWith('baic'));
    assert.isTrue(this.mockCallBarring.unobserve.calledWith('baicR'));
  });

  test('stop observing settings availability before hiding >', function() {
    this.sinon.stub(this.mockCallBarring, 'unobserve');
    this.panel.init(document.body);
    this.panel.beforeHide();
    assert.isTrue(this.mockCallBarring.unobserve.calledWith('baoc_enabled'));
    assert.isTrue(this.mockCallBarring.unobserve.calledWith('boic_enabled'));
    assert.isTrue(this.mockCallBarring.unobserve.calledWith(
      'boicExhc_enabled'));
    assert.isTrue(this.mockCallBarring.unobserve.calledWith('baic_enabled'));
    assert.isTrue(this.mockCallBarring.unobserve.calledWith('baicR_enabled'));
  });

  test('stop observing update status before hiding >', function() {
    this.sinon.stub(this.mockCallBarring, 'unobserve');
    this.panel.init(document.body);
    this.panel.beforeHide();
    assert.isTrue(this.mockCallBarring.unobserve.calledWith('updating'));
  });

  test('get data when showing >', function() {
    this.sinon.stub(this.mockCallBarring, 'getAll');
    this.panel.init(document.body);
    this.panel.beforeShow();
    this.panel.show();
    assert.isTrue(this.mockCallBarring.getAll.calledWith(_mobileConnection));
  });

  suite('Click on item, cancel password >', function () {
    setup(function() {
      resetHTML();
      this.panel.init(document.body);

      this.sinon.stub(this.mockPasscode, 'show', function() {
        return Promise.reject();
      });
      this.sinon.spy(this.mockCallBarring, 'set');
    });

    teardown(function() {
      document.body.innerHTML = '';
    });

    test('Barring All Outgoing Calls', function(done) {
      var target = baocElement.querySelector('input');
      target.click();

      assert.isFalse(target.checked, 'state doesn\'t change on click');
      assert.isTrue(this.mockPasscode.show.called, 'show passcode screen');
      setTimeout(function() {
        assert.isFalse(this.mockCallBarring.set.called,
          'doesn\'t set a new value');
        assert.isFalse(target.checked, 'state remains the same');
        done();
      }.bind(this));
    });
    test('Barring Outgoing International Calls', function(done) {
      var target = boicElement.querySelector('input');
      target.click();

      assert.isFalse(target.checked, 'state doesn\'t change on click');
      assert.isTrue(this.mockPasscode.show.called, 'show passcode screen');
      setTimeout(function() {
        assert.isFalse(this.mockCallBarring.set.called,
          'doesn\'t set a new value');
        assert.isFalse(target.checked, 'state remains the same');
        done();
      }.bind(this));
    });
    test('Barring International Calls Except ro Home Country', function(done) {
      var target = boicExhcElement.querySelector('input');
      target.click();

      assert.isFalse(target.checked, 'state doesn\'t change on click');
      assert.isTrue(this.mockPasscode.show.called, 'show passcode screen');
      setTimeout(function() {
        assert.isFalse(this.mockCallBarring.set.called,
          'doesn\'t set a new value');
        assert.isFalse(target.checked, 'state remains the same');
        done();
      }.bind(this));
    });
    test('Barring All Incoming Calls', function(done) {
      var target = baicElement.querySelector('input');
      target.click();

      assert.isFalse(target.checked, 'state doesn\'t change on click');
      assert.isTrue(this.mockPasscode.show.called, 'show passcode screen');
      setTimeout(function() {
        assert.isFalse(this.mockCallBarring.set.called,
          'doesn\'t set a new value');
        assert.isFalse(target.checked, 'state remains the same');
        done();
      }.bind(this));
    });
    test('Barring All Incoming Calls on Roaming', function(done) {
      var target = baicRElement.querySelector('input');
      target.click();

      assert.isFalse(target.checked, 'state doesn\'t change on click');
      assert.isTrue(this.mockPasscode.show.called, 'show passcode screen');
      setTimeout(function() {
        assert.isFalse(this.mockCallBarring.set.called,
          'doesn\'t set a new value');
        assert.isFalse(target.checked, 'state remains the same');
        done();
      }.bind(this));
    });
  });

  suite('Click on item, insert wrong password >', function () {
    setup(function() {
      resetHTML();
      this.panel.init(document.body);

      this.sinon.stub(this.mockPasscode, 'show', function() {
        return Promise.resolve('0000');
      });
      this.sinon.stub(this.mockCallBarring, 'set', function() {
        return Promise.reject({
          'name': 'wrong_password',
          'message': ''
        });
      });
      this.sinon.stub(this.mockToaster, 'showToast');
    });

    teardown(function() {
      document.body.innerHTML = '';
    });

    test('Barring All Outgoing Calls', function(done) {
      var target = baocElement.querySelector('input');
      target.click();

      assert.isFalse(target.checked, 'state doesn\'t change on click');
      assert.isTrue(this.mockPasscode.show.called, 'show passcode screen');
      setTimeout(function() {
        assert.isTrue(this.mockCallBarring.set.called,
          'try to set a new value');
        assert.isTrue(this.mockToaster.showToast.called, 'should show error');
        assert.isFalse(target.checked, 'state remains the same');
        done();
      }.bind(this));
    });
    test('Barring Outgoing International Calls', function(done) {
      var target = boicElement.querySelector('input');
      target.click();
      assert.isFalse(target.checked, 'state doesn\'t change on click');
      assert.isTrue(this.mockPasscode.show.called, 'show passcode screen');
      setTimeout(function() {
        assert.isTrue(this.mockCallBarring.set.called,
          'try to set a new value');
        assert.isTrue(this.mockToaster.showToast.called, 'should show error');
        assert.isFalse(target.checked, 'state remains the same');
        done();
      }.bind(this));
    });
    test('Barring International Calls Except ro Home Country', function(done) {
      var target = boicExhcElement.querySelector('input');
      target.click();
      assert.isFalse(target.checked, 'state doesn\'t change on click');
      assert.isTrue(this.mockPasscode.show.called, 'show passcode screen');
      setTimeout(function() {
        assert.isTrue(this.mockCallBarring.set.called,
          'try to set a new value');
        assert.isTrue(this.mockToaster.showToast.called, 'should show error');
        assert.isFalse(target.checked, 'state remains the same');
        done();
      }.bind(this));
    });
    test('Barring All Incoming Calls', function(done) {
      var target = baicElement.querySelector('input');
      target.click();
      assert.isFalse(target.checked, 'state doesn\'t change on click');
      assert.isTrue(this.mockPasscode.show.called, 'show passcode screen');
      setTimeout(function() {
        assert.isTrue(this.mockCallBarring.set.called,
          'try to set a new value');
        assert.isTrue(this.mockToaster.showToast.called, 'should show error');
        assert.isFalse(target.checked, 'state remains the same');
        done();
      }.bind(this));
    });
    test('Barring All Incoming Calls on Roaming', function(done) {
      var target = baicRElement.querySelector('input');
      target.click();
      assert.isFalse(target.checked, 'state doesn\'t change on click');
      assert.isTrue(this.mockPasscode.show.called, 'show passcode screen');
      setTimeout(function() {
        assert.isTrue(this.mockCallBarring.set.called,
          'try to set a new value');
        assert.isTrue(this.mockToaster.showToast.called, 'should show error');
        assert.isFalse(target.checked, 'state remains the same');
        done();
      }.bind(this));
    });
  });

  suite('Click on item, insert correct password >', function () {
    setup(function() {
      resetHTML();
      this.panel.init(document.body);

      this.sinon.stub(this.mockPasscode, 'show', function() {
        return Promise.resolve('0000');
      });
      this.sinon.stub(this.mockCallBarring, 'set', function() {
        return Promise.resolve();
      });

      this.sinon.stub(this.mockToaster, 'showToast');
    });

    teardown(function() {
      document.body.innerHTML = '';
    });

    test('Barring All Outgoing Calls', function(done) {
      var target = baocElement.querySelector('input');
      target.click();

      assert.isFalse(target.checked, 'state doesn\'t change on click');
      assert.isTrue(this.mockPasscode.show.called, 'show passcode screen');
      setTimeout(function() {
        assert.isTrue(this.mockCallBarring.set.called,
          'try to set a new value');
        assert.isFalse(this.mockToaster.showToast.called,
          'shouldn\'t show any error');
        done();
      }.bind(this));
    });
    test('Barring Outgoing International Calls', function(done) {
      var target = boicElement.querySelector('input');
      target.click();

      assert.isFalse(target.checked, 'state doesn\'t change on click');
      assert.isTrue(this.mockPasscode.show.called, 'show passcode screen');
      setTimeout(function() {
        assert.isTrue(this.mockCallBarring.set.called,
          'try to set a new value');
        assert.isFalse(this.mockToaster.showToast.called,
          'shouldn\'t show any error');
        done();
      }.bind(this));
    });
    test('Barring International Calls Except ro Home Country', function(done) {
      var target = boicExhcElement.querySelector('input');
      target.click();

      assert.isFalse(target.checked, 'state doesn\'t change on click');
      assert.isTrue(this.mockPasscode.show.called, 'show passcode screen');
      setTimeout(function() {
        assert.isTrue(this.mockCallBarring.set.called,
          'try to set a new value');
        assert.isFalse(this.mockToaster.showToast.called,
          'shouldn\'t show any error');
        done();
      }.bind(this));
    });
    test('Barring All Incoming Calls', function(done) {
      var target = baicElement.querySelector('input');
      target.click();

      assert.isFalse(target.checked, 'state doesn\'t change on click');
      assert.isTrue(this.mockPasscode.show.called, 'show passcode screen');
      setTimeout(function() {
        assert.isTrue(this.mockCallBarring.set.called,
          'try to set a new value');
        assert.isFalse(this.mockToaster.showToast.called,
          'shouldn\'t show any error');
        done();
      }.bind(this));
    });
    test('Barring All Incoming Calls on Roaming', function(done) {
      var target = baicRElement.querySelector('input');
      target.click();

      assert.isFalse(target.checked, 'state doesn\'t change on click');
      assert.isTrue(this.mockPasscode.show.called, 'show passcode screen');
      setTimeout(function() {
        assert.isTrue(this.mockCallBarring.set.called,
          'try to set a new value');
        assert.isFalse(this.mockToaster.showToast.called,
          'shouldn\'t show any error');
        done();
      }.bind(this));
    });
  });

  suite('Update UI when data changes >', function() {
    setup(function() {
      resetHTML();

      this.sinon.stub(this.mockCallBarring, 'observe',
        function observe(data, callback) {
        callback(this.mockCallBarring[data]);
      }.bind(this));

      this.panel.init(document.body);
    });

    teardown(function() {
      document.body.innerHTML = '';
    });

    test('activating BAOC', function() {
      baocElement.querySelector('input').checked = false;
      this.mockCallBarring.baoc = true;
      this.panel.beforeShow(document.body);
      assert.isTrue(isItemChecked(baocElement));
    });
    test('activating BOIC', function() {
      boicElement.querySelector('input').checked = false;
      this.mockCallBarring.boic = true;
      this.panel.beforeShow(document.body);
      assert.isTrue(isItemChecked(boicElement));
    });
    test('activating BOIC-ExHc', function() {
      boicExhcElement.querySelector('input').checked = false;
      this.mockCallBarring.boicExhc = true;
      this.panel.beforeShow(document.body);
      assert.isTrue(isItemChecked(boicExhcElement));
    });
    test('activating BAIC', function() {
      baicElement.querySelector('input').checked = false;
      this.mockCallBarring.baic = true;
      this.panel.beforeShow(document.body);
      assert.isTrue(isItemChecked(baicElement));
    });
    test('activating BAIC-R', function() {
      baicRElement.querySelector('input').checked = false;
      this.mockCallBarring.baicR = true;
      this.panel.beforeShow(document.body);
      assert.isTrue(isItemChecked(baicRElement));
    });

    test('deactivating BAOC', function() {
      baocElement.querySelector('input').checked = true;
      this.mockCallBarring.baoc = false;
      this.panel.beforeShow(document.body);
      assert.isFalse(isItemChecked(baocElement));
    });
    test('deactivating BOIC', function() {
      boicElement.querySelector('input').checked = true;
      this.mockCallBarring.boic = false;
      this.panel.beforeShow(document.body);
      assert.isFalse(isItemChecked(boicElement));
    });
    test('deactivating BOIC-ExHc', function() {
      boicExhcElement.querySelector('input').checked = true;
      this.mockCallBarring.boicExhc = false;
      this.panel.beforeShow(document.body);
      assert.isFalse(isItemChecked(boicExhcElement));
    });
    test('deactivating BAIC', function() {
      baicElement.querySelector('input').checked = true;
      this.mockCallBarring.baic = false;
      this.panel.beforeShow(document.body);
      assert.isFalse(isItemChecked(baicElement));
    });
    test('deactivating BAIC-R', function() {
      baicRElement.querySelector('input').checked = true;
      this.mockCallBarring.baicR = false;
      this.panel.beforeShow(document.body);
      assert.isFalse(isItemChecked(baicRElement));
    });

    test('enabling BAOC DOM element', function() {
      baocElement.setAttribute('aria-disabled', 'true');
      this.mockCallBarring.baoc_enabled = true;
      this.panel.beforeShow(document.body);
      assert.isFalse(isItemDisabled(baocElement));
    });
    test('enabling BOIC DOM element', function() {
      boicElement.setAttribute('aria-disabled', 'true');
      this.mockCallBarring.boic_enabled = true;
      this.panel.beforeShow(document.body);
      assert.isFalse(isItemDisabled(boicElement));
    });
    test('enabling BOIC-ExHc DOM element', function() {
      boicExhcElement.setAttribute('aria-disabled', 'true');
      this.mockCallBarring.boicExhc_enabled = true;
      this.panel.beforeShow(document.body);
      assert.isFalse(isItemDisabled(boicExhcElement));
    });
    test('enabling BAIC DOM element', function() {
      baicElement.setAttribute('aria-disabled', 'true');
      this.mockCallBarring.baic_enabled = true;
      this.panel.beforeShow(document.body);
      assert.isFalse(isItemDisabled(baicElement));
    });
    test('enabling BAIC-R DOM element', function() {
      baicRElement.setAttribute('aria-disabled', 'true');
      this.mockCallBarring.baicR_enabled = true;
      this.panel.beforeShow(document.body);
      assert.isFalse(isItemDisabled(baicRElement));
    });

    test('disabling BAOC DOM element', function() {
      baocElement.setAttribute('aria-disabled', 'false');
      this.mockCallBarring.baoc_enabled = false;
      this.panel.beforeShow(document.body);
      assert.isTrue(isItemDisabled(baocElement));
    });
    test('disabling BOIC DOM element', function() {
      boicElement.setAttribute('aria-disabled', 'false');
      this.mockCallBarring.boic_enabled = false;
      this.panel.beforeShow(document.body);
      assert.isTrue(isItemDisabled(boicElement));
    });
    test('disabling BOIC-ExHc DOM element', function() {
      boicExhcElement.setAttribute('aria-disabled', 'false');
      this.mockCallBarring.boicExhc_enabled = false;
      this.panel.beforeShow(document.body);
      assert.isTrue(isItemDisabled(boicExhcElement));
    });
    test('disabling BAIC DOM element', function() {
      baicElement.setAttribute('aria-disabled', 'false');
      this.mockCallBarring.baic_enabled = false;
      this.panel.beforeShow(document.body);
      assert.isTrue(isItemDisabled(baicElement));
    });
    test('disabling BAIC-R DOM element', function() {
      baicRElement.setAttribute('aria-disabled', 'false');
      this.mockCallBarring.baicR_enabled = false;
      this.panel.beforeShow(document.body);
      assert.isTrue(isItemDisabled(baicRElement));
    });
  });

});
