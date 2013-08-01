'use strict';

requireApp(
    'communications/shared/test/unit/mocks/mock_navigator_moz_settings.js');
requireApp('communications/shared/test/unit/mocks/mock_icc_helper.js');
requireApp('communications/ftu/test/unit/mock_settings.js');
requireApp('communications/ftu/js/data_mobile.js');

suite('mobile data >', function() {
  var realSettings,
      settingToggleKey = 'ril.data.enabled',
      settingApnKey = 'ril.data.apnSettings';

  suiteSetup(function() {
    realSettings = navigator.mozSettings;
    navigator.mozSettings = window.MockNavigatorSettings;

    DataMobile.init();
  });

  suiteTeardown(function() {
    navigator.mozSettings = realSettings;
    realSettings = null;
  });

  suite('Load APN values from database', function() {
    var result;

    setup(function(done) {
      window.MockNavigatorSettings.mSettings[settingApnKey] = '[[]]';
      DataMobile.getAPN(function(response) {
        result = response;
        done();
      });
    });

    test('Values are loaded', function() {
      assert.isNotNull(result);
    });

    test('Observer is added before', function() {
      assert.isNotNull(window.MockNavigatorSettings.mObservers);
    });

    test('Observer is removed after', function() {
      assert.isNotNull(window.MockNavigatorSettings.mRemovedObservers);
    });
  });

  suite('Toggle status of mobile data', function() {

    test('turn off mobile data', function(done) {
      MockNavigatorSettings.mSettings[settingKey] = true;
      DataMobile.toggle(false, function() {
        assert.isFalse(MockNavigatorSettings.mSettings[settingKey]);
        done();
      });
    });

    test('turn on mobile data', function(done) {
      MockNavigatorSettings.mSettings[settingKey] = false;
      DataMobile.toggle(true, function() {
        assert.isTrue(MockNavigatorSettings.mSettings[settingKey]);
        done();
      });
    });
  });

});
