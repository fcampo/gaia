'use strict';

var MockWifiManager = {
  scan: function() {},
  forget: function() {},
  connection: {
    network: {
      get status() {
        return 'connected';
      },
      get ssid() {
        return 'mozilla guest';
      }
    }
  }
};

var MockWifiUI = {
  renderNetworks: function() {}
};
