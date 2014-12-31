/* global DsdsSettings */

define(function(require) {
  'use strict';

  var SettingsPanel = require('modules/settings_panel');
  var CallBarring = require('panels/call_barring/call_barring');

  return function ctor_call_barring() {
    var _callBarring = CallBarring;

    var _mobileConnection;
    var _cbSettings = {};

    return SettingsPanel({
      onInit: function cb_onInit(panel) {
        _cbSettings = {
          baoc: document.getElementById('li-cb-baoc'),
          boic: document.getElementById('li-cb-boic'),
          boicExhc: document.getElementById('li-cb-boicExhc'),
          baic: document.getElementById('li-cb-baic'),
          baicR: document.getElementById('li-cb-baicR')
        };

        _mobileConnection = window.navigator.mozMobileConnections[
          DsdsSettings.getIccCardIndexForCallSettings()
        ];

        _callBarring.init();
      },

      onBeforeShow: function cb_onBeforeShow() {
      },

      onShow: function cb_onShow() {
      },

      onBeforeHide: function cb_onHide() {
      }

    });
  };
});
