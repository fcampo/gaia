/* global require, module */
'use strict';
var Base = require('../base');

/**
 * Abstraction around settings callbarring panel
 * @param {Marionette.Client} client for operations.
 */
function CallBarringPanel(client) {
  // Call the Base constructor to initiate base class.
  Base.call(this, client, null, CallBarringPanel.Selectors);

}

module.exports = CallBarringPanel;

CallBarringPanel.Selectors = {
  'baocInput': '#li-cb-baoc input',
  'boicInput': '#li-cb-boic input',
  'boicExhcInput': '#li-cb-boicExhc input',
  'baicInput': '#li-cb-li-cb-baic input',
  'baicRInput': '#li-cb-baicR input',
  'passcodeChangeButton': '#li-cb-pswd a'
};

CallBarringPanel.prototype = {
  __proto__: Base.prototype,

  get isBaocChecked() {
    return !!this.findElement('baocInput').getAttribute('checked');
  },
  get isBoicChecked() {
    return !!this.findElement('boicInput').getAttribute('checked');
  },
  get isBoicExhcChecked() {
    return !!this.findElement('boicExhcInput').getAttribute('checked');
  },
  get isBaicChecked() {
    return !!this.findElement('baicInput').getAttribute('checked');
  },
  get isBaicRChecked() {
    return !!this.findElement('baicRInput').getAttribute('checked');
  },

  tapChangeBaoc: function() {
    this.waitForElement('baocInput').tap();
  },
  tapChangeBoic: function() {
    this.waitForElement('boicInput').tap();
  },
  tapChangeBoicExhc: function() {
    this.waitForElement('boicExhcInput').tap();
  },
  tapChangeBaic: function() {
    this.waitForElement('baicInput').tap();
  },
  tapChangeBaicR: function() {
    this.waitForElement('baicRInput').tap();
  },

  tapChangePasscode: function() {
    this.waitForElement('passcodeChangeButton').tap();
  }

};
