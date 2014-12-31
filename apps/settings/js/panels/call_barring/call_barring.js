/**
 *  Call Barring Settings
 *  Manage the state of the different services of call barring
 */
define(function(require) {
  'use strict';

  var Observable = require('modules/mvvm/observable');

  var call_barring_prototype = {
    // settings
    baoc: '',
    boic: '',
    boicExhc: '',
    baic: '',
    baicR: '',

    init: function() {
      this.baoc = false;
      this.boic = false;
      this.boicExhc = false;
      this.baic = false;
      this.baicR = false;
    }
  };

  var callBarring = Observable(call_barring_prototype);
  return callBarring;
});
