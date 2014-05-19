/* global LazyLoader, FtuLauncher, Basket */

'use strict';

var NewsletterManager = {
  start: function() {
    LazyLoader.load('/shared/js/basket_client.js', function basketLoaded() {
      Basket.getDataStore().then(function gotDS(store) {
        store.get(1).then(function(itemRetrieved) {
          if (typeof itemRetrieved === 'undefined' || itemRetrieved.emailSent) {
            // either no item stored or it was already sent
            return;
          } else {
            // try to send the email
            sendWhenOnline(itemRetrieved.newsletter_email);
          }
        });
      }).catch(function promiseFailed(error) {
        console.error('Something failed: ' + error);
      });
    });
  },

  sendNewsletter: function(emailAddress) {
    LazyLoader.load('/shared/js/basket_client.js', function basketLoaded() {
      Basket.send(emailAddress, function itemSent(err, data) {
        if (err) {
          console.error('Error sending data: ' + err);
          return;
        }

        if (data && data.status === 'ok') {
          // Once is sent, we update the DataStore
          Basket.getDataStore().then(function gotDS(store) {
            var newObj = {
              'emailSent': true
            };
            store.put(newObj, 1);
          }).catch(function error(err) {
            console.error('Something went wrong: ' + err);
          });
        }
      });
    });
  }
};

function sendWhenOnline(email) {
  if (navigator.onLine) {
    // send it inmediately
    NewsletterManager.sendNewsletter(email);
  } else {
    // wait for connection
    window.addEventListener('online', function online() {
      window.removeEventListener('online', online);
      NewsletterManager.sendNewsletter(email);
    });
  }
}

var idleObserver = {
  time: 10,
  onidle: function() {
    // if FTU is running we don't want to do anything
    if (FtuLauncher.isFtuRunning()) {
      return;
    }

    navigator.removeIdleObserver(idleObserver);
    NewsletterManager.start();
  }
};

// starting when we get a chance
navigator.mozL10n.once(function loadWhenIdle() {
  navigator.addIdleObserver(idleObserver);
});
