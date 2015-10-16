'use strict';
/* exported MockfbLoader */

var MockfbLoader = function() {
  return {
    loaded: true,
    load: function(callback) {
      if (callback) {
        callback();
      }
    }
  };
}();
