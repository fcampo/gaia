/* global LazyLoader, FtuLauncher, Basket */

'use strict';

var NewsletterManager = {
  start: function() {
    console.log('> S > starting');
    LazyLoader.load('/shared/js/basket_client.js', function basketLoaded() {
      Basket.getDataStore().then(function gotDS(store) {
        console.log('> S > getting item 1');
        store.get(1).then(function(itemRetrieved) {
          if (typeof itemRetrieved === 'undefined' || itemRetrieved.emailSent) {
            // either no item stored or it was already sent
            return;
          } else {
            console.log('> S > trying to send');
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
    console.log('> S > sending newsletter');
    LazyLoader.load('/shared/js/basket_client.js', function basketLoaded() {
      Basket.send(emailAddress, function itemSent(err, data) {
        console.log('> S > sent');
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
            console.log('> S > updated!');
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
    console.log('> S > online, send');
    NewsletterManager.sendNewsletter(email);
  } else {
    // wait for connection
    console.log('> S > offline,');
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
