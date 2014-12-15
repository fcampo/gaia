'use strict';
var Settings = require('../app/app'),
    assert = require('assert');

marionette('manipulate Call Barring settings', function() {
  var client = marionette.client({
    settings: {
      'ftu.manifestURL': null,
      'lockscreen.enabled': false
    }
  });
  var settingsApp;
  var callSettingsPanel,
      callBarringPanel;

  setup(function() {
    settingsApp = new Settings(client);
    settingsApp.launch();
    // Navigate to the Call Barring menu
    callSettingsPanel = settingsApp.callSettingsPanel;
    callBarringPanel = settingsApp.callBarringPanel;
  });

  test('Barring All Outgoing Calls is enabled', function() {
    assert.ok(callBarringPanel.isBaocChecked(),
      'baoc is not checked');
  });

  test('Enable Barring All Outgoing Calls', function() {
    assert.ok(!callBarringPanel.isBaocChecked, 'baoc is not checked');
    callBarringPanel.tapChangeBaoc();
    client.waitFor(function() {
      return callBarringPanel.isBaocChecked;
    }.bind(this));

    assert.ok(callBarringPanel.isBaocChecked, 'baoc is now checked');
  });

});
