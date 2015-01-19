/* export ChangePasscodeScreen */

define(function(require) {
  'use strict';

  var ChangePasscodeScreen = function() {

      /**
       * Makes a RIL request to change the passcode.
       * @param api Object mobileConnection to be used for the call.
       * @param data info related to the PIN code. In the form:
       * {
       *    'pin':    // current passcode
       *    'newPin': // new passcode
       * }
       */
      function _changeCallBarringPasscode(api, pinData) {
        console.log('> REQUEST TO CHANGE PASSWORD >');
        return new Promise(function finished(resolve, reject) {
          var request = api.changeCallBarringPassword(pinData);
          request.onsuccess = function() {
            console.log('>> SUCCESS');
            resolve();
          };
          request.onerror = function() {
            console.log('>> ERROR: ' +
              request.error.name +
              ' - ' + request.message);
            /* request.error = { name, message } */
            reject(request.error);
          };
        });
      }

    return {
      change: _changeCallBarringPasscode
    };
  };

  return ChangePasscodeScreen;
});
