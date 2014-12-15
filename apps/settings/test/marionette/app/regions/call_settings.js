'use strict';
var Base = require('../base');

/**
 * Abstraction around settings call settings panel
 * @param {Marionette.Client} client for operations.
 */
function CallSettingsPanel(client) {

  // Call the Base constructor to initiate base class.
  Base.call(this, client, null, CallSettingsPanel.Selectors);

}

module.exports = CallSettingsPanel;

CallSettingsPanel.Selectors = {
};

CallSettingsPanel.prototype = {

  __proto__: Base.prototype

};
