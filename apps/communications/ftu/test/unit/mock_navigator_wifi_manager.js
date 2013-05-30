'use strict';

var MockWifiManager = {
  networks: null,

  scan: function() {},
  forget: function() {},
  setNetworks: function(newNetworks) {
    this.networks = newNetworks;
  },
  getNetworks: function() {
    var self = this;
    return {
      set onsuccess(callback) {
        this.result = self.networks;
        callback.call(this);
      },
      set onerror(callback) {}
    };
  },
  connection: {
    network: {
      get status() {
        return 'connected';
      },
      get ssid() {
        return 'Network_SSID';
      }
    }
  }
};

var MockWifiUI = {
  renderNetworks: function() {}
};
