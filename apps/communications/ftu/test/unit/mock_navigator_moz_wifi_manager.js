'use strict';

(function(window) {

  function _getFakeNetworks() {
    // var request = this.networks ?
    //               { result: this.networks } :
    //               { error: { name: 'Networks not found' } };

    // setTimeout(function() {
    //   if (request.onsuccess) {
    //     request.onsuccess();
    //   } else {
    //     request.onerror();
    //   }
    // }, 100);

    // return request;
    var self = this;
    return {
      result: self.networks,
      set onsuccess(callback) {
        self.result = self.networks;
        callback(self);
      }
    };
  }

  function _setFakeNetworks(newNetworks) {
    this.networks = newNetworks;
  }

  window.MockNavigatorMozWifiManager = {
    // modify the current fake list of networks
    setNetworks: _setFakeNetworks,

    // true if the wifi is enabled
    enabled: false,
    macAddress: 'xx:xx:xx:xx:xx:xx',

    // enables/disables the wifi
    setEnabled: function fakeSetEnabled(bool) {
      var self = this;
      var request = { result: bool };

      setTimeout(function() {
        if (request.onsuccess) {
          request.onsuccess();
        }
        if (bool) {
          self.onenabled();
        } else {
          self.ondisabled();
        }
      });

      self.enabled = bool;
      return request;
    },

    // returns a list of visible/known networks
    getNetworks: _getFakeNetworks,
    getKnownNetworks: _getFakeNetworks,

    // selects a network
    associate: function fakeAssociate(network) {
      var self = this;
      var connection = { result: network };
      var networkEvent = self.connection;//{ network: network };

      setTimeout(function fakeConnecting() {
        self.connection.network = network;
        self.connection.status = 'connecting';
        self.onstatuschange(networkEvent);

        setTimeout(function fakeAssociated() {
          self.connection.network = network;
          self.connection.status = 'associated';
          self.onstatuschange(networkEvent);

          setTimeout(function fakeConnected() {
            network.connected = true;
            self.connected = network;
            self.connection.network = network;
            self.connection.status = 'connected';
            self.onstatuschange(networkEvent);
            return connection;
          }, 200);
        }, 100);
      }, 0);
    },

    // forgets a network (disconnect)
    forget: function fakeForget(network) {
      var self = this;
      var networkEvent = self.connection;//{ network: network };

      setTimeout(function() {
        network.connected = false;
        self.connected = null;
        self.connection.network = null;
        self.connection.status = 'disconnected';
        self.onstatuschange(networkEvent);
      }, 0);
    },

    // event listeners
    onenabled: function(event) {},
    ondisabled: function(event) {},
    onstatuschange: function(event) {},

    // returns a network object for the currently connected network (if any)
    connected: null,

    connection: {
      network: null
    }
  };
  })(this);
