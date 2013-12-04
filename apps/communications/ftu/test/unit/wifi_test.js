'use strict';

requireApp('communications/ftu/test/unit/mock_l10n.js');
requireApp('communications/ftu/test/unit/mock_utils.js');
requireApp('communications/ftu/test/unit/mock_settings.js');
requireApp('communications/ftu/test/unit/mock_ui_manager.js');
requireApp('communications/ftu/test/unit/mock_navigator_moz_wifi_manager.js');
requireApp(
  'communications/shared/test/unit/mocks/mock_navigator_moz_settings.js');

requireApp('communications/ftu/js/wifi.js');
requireApp('communications/shared/js/wifi_helper.js');

require('/shared/test/unit/load_body_html_helper.js');

var _;

var mocksHelperForWifi = new MocksHelper([
  'utils',
  'UIManager'
]).init();

suite('wifi > ', function() {
  var realL10n,
      realSettings,
      realWifiManager;

  var container,
      networksDOM;
  var fakeNetworks = [
      {
        ssid: 'Mozilla Guest',
        bssid: 'xx:xx:xx:xx:xx:xx',
        capabilities: [],
        relSignalStrength: 89,
        connected: false
      },
      {
        ssid: 'Livebox 6752',
        bssid: 'xx:xx:xx:xx:xx:xx',
        capabilities: ['WEP'],
        relSignalStrength: 98,
        connected: false
      },
      {
        ssid: 'Mozilla-G',
        bssid: 'xx:xx:xx:xx:xx:xx',
        capabilities: ['WPA-EAP'],
        relSignalStrength: 32,
        connected: false
      },
      {
        ssid: 'Freebox 8953',
        bssid: 'xx:xx:xx:xx:xx:xx',
        capabilities: ['WPA2-PSK'],
        relSignalStrength: 67,
        connected: false
      }
    ];

  suiteSetup(function() {
    loadBodyHTML('/ftu/index.html');
    mocksHelperForWifi.suiteSetup();

    realL10n = navigator.mozL10n;
    navigator.mozL10n = MockL10n;

    realSettings = navigator.mozSettings;
    navigator.mozSettings = MockNavigatorSettings;

    realWifiManager = navigator.mozWifiManager;
    navigator.mozWifiManager = MockNavigatorMozWifiManager;
    WifiManager.init();

    networksDOM = document.getElementById('networks');
  });

  suiteTeardown(function() {
    document.body.innerHTML = '';
    mocksHelperForWifi.suiteTeardown();

    navigator.mozL10n = realL10n;
    realL10n = null;

    navigator.mozSettings = realSettings;
    realSettings = null;

    navigator.mozWifiManager = realWifiManager;
    realWifiManager = null;

  });

  test('enables wifi on start', function() {
    assert.isTrue(MockNavigatorSettings.mSettings['wifi.enabled']);
  });
  test('enables debugging on start', function() {
    assert.isTrue(MockNavigatorSettings.mSettings['wifi.debugging.enabled']);
  });
  test('disconnect from network at start', function() {
    assert.isNull(WifiManager.gCurrentNetwork);
  });
  test('disables debugging when exits', function() {
    WifiManager.finish();
    assert.isFalse(MockNavigatorSettings.mSettings['wifi.debugging.enabled']);
  });

  suite('scan networks', function() {
    var showOverlayStub;

    setup(function() {
      showOverlayStub = this.sinon.spy(utils.overlay, 'show');
    });

    test('none available', function(done) {
      WifiManager.scan(function(networks) {
        assert.ok(showOverlayStub.calledOnce, 'shows loading overlay');
        assert.isUndefined(networks, 'return zero networks');
        done();
      });
    });

    test('some available', function(done) {
      navigator.mozWifiManager.setNetworks(fakeNetworks);
      WifiManager.scan(function(networks) {
        assert.ok(showOverlayStub.calledOnce, 'shows loading overlay');
        assert.isDefined(networks, 'return networks');
        assert.isNotNull(networks, 'return valid networks');
        assert.equal(networks, fakeNetworks, 'return existing networks');
        done();
      });
    });

    test('error while scanning', function(done) {
      var consoleSpy = this.sinon.spy(console, 'error');
      var stub = this.sinon.stub(MockNavigatorMozWifiManager, 'getNetworks',
        function() {
          return {
            set onerror(callback) {
              this.error = {
                name: 'error'
              };
              callback();
            }
          };
        }
      );
      WifiManager.scan(function(networks) {
        assert.ok(showOverlayStub.calledOnce, 'shows loading overlay');
        assert.isUndefined(networks, 'no networks returned');
        assert.ok(consoleSpy.calledOnce);
        done();
      });
    });

    test('timeout error', function(done) {
      var clock = this.sinon.useFakeTimers();
      var consoleSpy = this.sinon.spy(console, 'warn');
      var stub = this.sinon.stub(MockNavigatorMozWifiManager, 'getNetworks',
        function() {
          return {};
      });
      WifiManager.scan(function(networks) {
        assert.ok(showOverlayStub.calledOnce, 'shows loading overlay');
        assert.isUndefined(networks, 'no networks returned');
        assert.ok(consoleSpy.calledOnce);
        done();
      });
      clock.tick(10000);
    });

  });

  suite('render networks when none available >', function() {
    var showOverlayStub;

    setup(function() {
      showOverlayStub = this.sinon.spy(utils.overlay, 'show');
      WifiManager.networks = null;
      WifiUI.renderNetworks();
    });

    test('shouldn\'t paint any network', function() {
      var elements = networksDOM.querySelectorAll('li');
      assert.equal(elements.length, 0, 'no elements created');
    });

    test('should show a warning', function() {
      var warning = document.getElementById('no-result-container');
      assert.isNotNull(warning, 'warning is shown');
    });

  });

  suite('render available networks >', function() {

    setup(function() {
      WifiManager.networks = fakeNetworks;
      WifiUI.renderNetworks(fakeNetworks);
    });

    test('creates network list', function() {
      assert.isNotNull(document.getElementById('networks-list'));
    });

    test('with as many networks as detected', function() {
      var elements = networksDOM.querySelectorAll('li');
      assert.equal(elements.length, fakeNetworks.length, 'elements created');
    });

    test('ordered by signal strength', function() {
      var elements = networksDOM.querySelectorAll('li'),
          networkLevels = [],
          sorted = true,
          icon;

      for (var i = 0; i < elements.length; i++) {
        icon = elements[i].querySelector('aside');
        // trusting here that all the icons are styled adding
        // the classes in the same order
        // { 'pack-end', 'wifi-icon', 'level-<n>', 'wifi-signal' }
        networkLevels.push(icon.classList[2].split('-').pop());
      }

      for (var i = 1; i < networkLevels.length; i++) {
        if (networkLevels[i - 1] < networkLevels[i]) {
          sorted = false;
          break;
        }
      }
      assert.isTrue(sorted);
    });

    suite('connect to rendered network', function() {
      var element,
          network,
          networkList,
          currentEvent,
          connectSpy,
          userInput;

      setup(function() {
        userInput = document.getElementById('label_wifi_user');
        networkList = fakeNetworks;
        WifiUI.networks = networkList;
        currentEvent = {
          target: {
            dataset: {}
          }
        };
        connectSpy = this.sinon.spy(WifiManager, 'connect');
      });

      teardown(function() {
        element =
          network =
            networkList =
              currentEvent =
                userInput = null;
        connectSpy.reset();
      });

      test('connect to open wifi', function() { // Mozilla Guest [Open]
        network = currentEvent.target.dataset = fakeNetworks[0];
        element = document.getElementById(network.ssid);

        WifiUI.chooseNetwork(currentEvent);

        // If it's OPEN, it should try to connect to the network directly
        assert.equal(element.dataset.wifiSelected, 'true');
        assert.include(element.querySelector('aside').classList, 'connecting');
        assert.ok(connectSpy.calledOnce);
        assert.ok(connectSpy.calledWith(network.ssid));
      });

      test('connect to WEP', function() { // Livebox 6752 [WEP]
        network = currentEvent.target.dataset = fakeNetworks[1];
        currentEvent.target.dataset;
        element = document.getElementById(network.ssid);
        WifiUI.chooseNetwork(currentEvent);

        // UI changes
        assert.equal(window.location.hash, '#configure_network');
        assert.equal(UIManager.mainTitle.textContent, network.ssid);
        assert.isTrue(userInput.classList.contains('hidden'));

        document.getElementById('wifi_password').value = 'password';
        document.getElementById('wifi_user').value = '';

        // Connection
        WifiUI.joinNetwork();
        assert.equal(element.dataset.wifiSelected, 'true');
        assert.ok(connectSpy.calledOnce);
        assert.ok(connectSpy.calledWithExactly(network.ssid, 'password', ''));
      });

      test('connect to WPA-EAP', function() { // Mozilla-G [WPA-EAP]
        network = currentEvent.target.dataset = fakeNetworks[2];
        currentEvent.target.dataset;
        element = document.getElementById(network.ssid);
        WifiUI.chooseNetwork(currentEvent);

        // UI changes
        assert.equal(window.location.hash, '#configure_network');
        assert.equal(UIManager.mainTitle.textContent, network.ssid);
        assert.isFalse(userInput.classList.contains('hidden'));

        document.getElementById('wifi_password').value = 'password';
        document.getElementById('wifi_user').value = 'user';
        // Connection
        WifiUI.joinNetwork();
        assert.equal(element.dataset.wifiSelected, 'true');
        assert.ok(connectSpy.calledOnce);
        assert.ok(connectSpy.calledWith(network.ssid, 'password', 'user'));
      });

      test('connect to WPA-PSK', function() { // Freebox 8953 [WPA-PSK]
        network = currentEvent.target.dataset = fakeNetworks[3];
        element = document.getElementById(network.ssid);
        WifiUI.chooseNetwork(currentEvent);

        // UI changes
        assert.equal(window.location.hash, '#configure_network');
        assert.equal(UIManager.mainTitle.textContent, network.ssid);
        assert.isTrue(userInput.classList.contains('hidden'));


        document.getElementById('wifi_password').value = 'password';
        document.getElementById('wifi_user').value = '';
        // Connection
        WifiUI.joinNetwork();
        assert.equal(element.dataset.wifiSelected, 'true');
        assert.ok(connectSpy.calledOnce);
        assert.ok(connectSpy.calledWith(network.ssid, 'password', ''));
      });
    });
  });

});
