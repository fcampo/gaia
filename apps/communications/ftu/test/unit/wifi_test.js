'use strict';

requireApp('communications/ftu/test/unit/mock_l10n.js');
requireApp('communications/ftu/test/unit/mock_utils.js');
requireApp('communications/ftu/test/unit/mock_wifi_helper.js');
requireApp('communications/ftu/test/unit/mock_wifi_manager.js');
requireApp('communications/ftu/test/unit/mock_navigator_settings.js');
requireApp('communications/ftu/test/unit/mock_navigator_wifi_manager.js');
requireApp(
  'communications/shared/test/unit/mocks/mock_navigator_moz_settings.js');

requireApp('communications/ftu/js/wifi.js');

var _;
var mocksHelperForWifi = new MocksHelper([
  'utils',
  'WifiHelper'
]).init();

suite('wifi > ', function() {
  var realL10n,
      realSettings;

  var networksDOM;
  var fakeNetworks = [
      {
        ssid: 'Mozilla Guest',
        bssid: 'xx:xx:xx:xx:xx:xx',
        capabilities: [],
        relSignalStrength: 98,
        connected: false
      },
      {
        ssid: 'Livebox 6752',
        bssid: 'xx:xx:xx:xx:xx:xx',
        capabilities: ['WEP'],
        relSignalStrength: 89,
        connected: false
      },
      {
        ssid: 'Mozilla-G',
        bssid: 'xx:xx:xx:xx:xx:xx',
        capabilities: ['WPA-EAP'],
        relSignalStrength: 67,
        connected: false
      },
      {
        ssid: 'Freebox 8953',
        bssid: 'xx:xx:xx:xx:xx:xx',
        capabilities: ['WPA2-PSK'],
        relSignalStrength: 32,
        connected: false
      }
    ];

  function createDOM() {
    var markup =
    '<ol id="progress-bar" class="step-state"></ol>' +
    '<section id="activation-screen">' +
    ' <header>' +
    '  <h1 id="main-title"></h1>' +
    ' </header>' +
    ' <section id="wifi">' +
    '  <div id="wifi-wrapper">' +
    '    <article id="networks">' +
    '    </article>' +
    '    <button id="join-hidden-button">' +
    '      Join hidden network' +
    '    </button>' +
    '  </div>' +
    ' </section>' +
    ' <section id="configure_network">' +
    '  <section id="configure_network_params">' +
    '    <form>' +
    '      <input type="text" id="wifi_ssid" class="hidden"></input>' +
    '      <label id="label_wifi_user">User</label>' +
    '      <input type="text" id="wifi_user"></input>' +
    '      <label>Password</label>' +
    '      <input type="password" id="wifi_password"></input>' +
    '      <label id="label_show_password">' +
    '        <input type="checkbox" data-ignore name="show_password" />' +
    '        <span></span>' +
    '        <p id="wifi_show_password">Show Password</p>' +
    '      </label>' +
    '    </form>' +
    '  </section>' +
    ' </section>' +
    ' <section id="hidden-wifi-authentication">' +
    '  <div>' +
    '    <form>' +
    '      <label id="label_wifi_ssid">' +
    '        SSID Network Name' +
    '      </label>' +
    '      <input type="text" name="wifi_ssid" id="hidden-wifi-ssid"/>' +
    '      <label id="label_wifi_security">' +
    '        Security' +
    '      </label>' +
    '      <select id="hidden-wifi-security">' +
    '        <option>none</option>' +
    '        <option>WEP</option>' +
    '        <option>WPA-PSK</option>' +
    '        <option>WPA-EAP</option>' +
    '      </select>' +
    '      <div class="hidden" id="hidden-wifi-identity-box">' +
    '        <label id="label_wifi_identity">' +
    '          Identity' +
    '        </label>' +
    '        <input type="text" id="hidden-wifi-identity"/>' +
    '      </div>' +
    '      <label id="label_hidden_wifi_password">' +
    '        Password' +
    '      </label>' +
    '      <input type="password" id="hidden-wifi-password" />' +
    '      <label id="label_show_password">' +
    '        <input type="checkbox" id="hidden-wifi-show-password" />' +
    '        <span></span>' +
    '        <p>Show Password</p>' +
    '      </label>' +
    '    </form>' +
    '  </div>' +
    ' </section>' +
    ' <menu id="nav-bar">' +
    '   <button id="back">Back</button>' +
    '   <button id="forward">Next</button>' +
    '   <button id="wifi-join-button">Join</button>' +
    '   <button id="unlock-sim-button">Send</button>' +
    '   <button id="skip-pin-button">Skip</button>' +
    ' </menu>' +
    '</section>';

    container = document.createElement('div');
    container.insertAdjacentHTML('beforeend', markup);
    document.body.appendChild(container);
  }

  mocksHelperForWifi.attachTestHelpers();

  suiteSetup(function() {
    realL10n = navigator.mozL10n;
    navigator.mozL10n = MockL10n;

    realSettings = navigator.mozSettings;
    navigator.mozSettings = MockNavigatorSettings;

    realWifiManager = navigator.mozWifiManager;
    navigator.mozWifiManager = MockNavigatorWifiManager;

    mocksHelper.suiteSetup();
  });

  setup(function() {
    createDOM();
    mocksHelper.setup();
    WifiManager.init();
    // we need to overwrite the api initialized on init()
    WifiManager.api = navigator.mozWifiManager;
  });

  teardown(function() {
    mocksHelper.teardown();
    container.parentNode.removeChild(container);
  });

  suiteTeardown(function() {
    navigator.mozL10n = realL10n;
    realL10n = null;

    navigator.mozSettings = realSettings;
    realSettings = null;

    mocksHelper.suiteTeardown();
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
        assert.isTrue(utils.overlay.showing, 'shows loading overlay');
        assert.isDefined(networks, 'return networks');
        assert.isNotNull(networks, 'return valid networks');
        assert.equal(networks, fakeNetworks, 'return existing networks');
        done();
      });
    });
  });

  suite('render networks when none available >', function() {
    var networksDOM;

    setup(function() {
      networksDOM = document.getElementById('networks');
      WifiUI.renderNetworks();
    });

    test('no networks, no paint', function() {
      var elements = networksDOM.querySelectorAll('li');
      assert.equal(elements.length, 0, 'no elements created');
    });

    test('no networks shows warning', function() {
      var warning = document.getElementById('no-result-container');
      assert.isNotNull(warning, 'warning is shown');
    });

    test('some available', function(done) {
      MockNavigatorMozWifiManager.setNetworks(fakeNetworks);
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

  suite('render available networks >', function() {
    var networksDOM;

    setup(function() {
      networksDOM = document.getElementById('networks');
      WifiUI.renderNetworks(fakeNetworks);
    });

    test('creates network list', function() {
      assert.isNotNull(document.getElementById('networks-list'));
    });

    test('paints as many networks as detected', function() {
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

    suite('connect to network', function() {
      var networkList,
          currentEvent;

      setup(function() {
        networkList = fakeNetworks;

        currentEvent = {
          target: {
            dataset: {}
          }
        };
      });

      teardown(function() {
        networkList = null;
        currentEvent = null;
      });

      test('connect to open wifi', function(done) {
        currentEvent.target.dataset = fakeNetworks[0]; // Mozilla Guest [Open]
        var element = document.getElementById(currentEvent.target.dataset.ssid);
        WifiUI.chooseNetwork(currentEvent);
        assert.equal(element.dataset.wifiSelected, 'true');
        // If it's OPEN, it tries to connect to the network directly
        assert.include(element.querySelector('aside').classList, 'connecting');
        setTimeout(function() {
console.log(element.querySelector('aside').classList);
        assert.include(element.querySelector('aside').classList, 'connecting');
          done();
        }, 1000);
      });

      test('connect to WEP', function() {
        currentEvent.target.dataset = fakeNetworks[1]; // Livebox 6752 [WEP]
        var element = document.getElementById(currentEvent.target.dataset.ssid);
        WifiUI.chooseNetwork(currentEvent);
        assert.equal(element.dataset.wifiSelected, 'true');

      });
      test('connect to WPA-PSK', function() {

      });
      test('connect to WPA-EAP', function() {

      });
    });
  });

});
