/**
 *  Call Barring Settings
 *  Manage the state of the different services of call barring
 */
define(function(require) {
  'use strict';

  var Observable = require('modules/mvvm/observable');

  function _getCallBarringOption(api, options) {
    return new Promise(function (resolve, reject) {
      // Send the request
      var request = api.getCallBarringOption(options);
      request.onsuccess = function() {
        resolve(request.result.enabled);
      };
      request.onerror = function() {
        /* request.error = { name, message } */
        reject(request.error);
      };
    });
  }

  function _setCallBarringOption(api, options) {
    return new Promise(function (resolve, reject) {
      // Send the request
      var request = api.setCallBarringOption(options);
      request.onsuccess = function() {
        resolve();
      };
      request.onerror = function() {
        /* request.error = { name, message } */
        reject(request.error);
      };
    });
  }

  var CallBarring = {
    getRequest: _getCallBarringOption,
    setRequest: _setCallBarringOption
  };

  return function ctor_callBarring() {
    // Create the observable object using the prototype.
    var callBarring = Observable(CallBarring);
    return callBarring;
  };
});
