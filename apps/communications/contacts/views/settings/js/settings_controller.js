/* global ConfirmDialog */
/* global Loader */
/* global fbLoader */
/* global IccHandler */
/* global LazyLoader */
/* global Overlay */
/* global Rest */
/* global SimContactsImporter */
/* global SimDomGenerator */
/* global utils */
/* global VCFReader */
/* global ContactsService */
/* global ExtServices */
/* global SettingsUI */

'use strict';

(function(exports) {
  var PENDING_LOGOUT_KEY = 'pendingLogout';

  var _activity = null;
  var _changedContacts = [];

  // Initialise the settings screen (components, listeners ...)
  function init() {
    // Create the DOM for our SIM cards and listen to any changes
    IccHandler.init(new SimDomGenerator(), SettingsUI.cardStateChanged);

    // TODO rename (includes outlook and gmail too) and delete FB part
    fbLoader.load();


    window.addEventListener('close-ui', function() {
      window.history.back();
    });

    window.addEventListener('delete-ui', function() {
      //TODO apply the new list call when ready
      window.location.href = '/contacts/views/list/list.html?action=delete';
    });

    // Given an event, select which element should be targeted
    function getSource(dataset) {
      var source = dataset.source;
      // Check special cases
      if (source && source.indexOf('-') != -1) {
        source = source.substr(0, source.indexOf('-'));
      }
      return source;
    }

    function handleImport(event) {
      /* jshint validthis:true */
      console.log('> SETTINGS > CTRL > IMPORT');
      var dataset = event.detail.target.parentNode.dataset;
      var source = getSource(dataset);
      console.log('-- source: ' + source);
      switch (source) {
        case 'sim':
          var iccId = dataset.iccid;
          window.setTimeout(
            requireSimImport.bind(this, onSimImport.bind(this, iccId)), 0);
          break;
        case 'sd':
          window.setTimeout(requireOverlay.bind(this, onSdImport), 0);
          break;
        case 'gmail':
          ExtServices.importGmail();
          break;
        case 'live':
          ExtServices.importLive();
          break;
      }
    }

    window.addEventListener('importClicked', handleImport);

    function handleExport(event){
      console.log('> SETTINGS > CTRL > handle export');
      var dataset = event.detail.target.parentNode.dataset;
      var source = getSource(dataset);
      var location = '/contacts/views/list/list.html' +
                     '?action=export&destination=' +
                     source;

      switch (source) {
        case 'sim':
          var iccId = dataset.iccid;
          location += '&' + iccId;
          break;
        case 'sd':
        case 'bluetooth':
          break;
      }
      //TODO apply the new list call when ready
      window.location.href = location;
    }
    window.addEventListener('exportClicked', handleExport);
  }

  function checkNoContacts() {
    return new Promise((resolve, reject) => {
      ContactsService.isEmpty(function(error, isEmpty) {
        if (error) {
          reject(error);
        } else {
          resolve(isEmpty);
        }
      });
    });
  }

  /**
   * Loads the overlay class before showing
   */
  function requireOverlay(callback) {
    Loader.utility('Overlay', callback);
  }

  function saveStatus(data) {
    window.asyncStorage.setItem(PENDING_LOGOUT_KEY, data);
  }

  function automaticLogout() {
    if (navigator.offLine === true) {
      return;
    }

    LazyLoader.load(['/shared/js/contacts/utilities/http_rest.js'],
    function() {
      window.asyncStorage.getItem(PENDING_LOGOUT_KEY, function(data) {
        if (!data) {
          return;
        }
        var services = Object.keys(data);
        var numResponses = 0;

        services.forEach(function(service) {
          var url = data[service];

          var callbacks = {
            success: function logout_success() {
              numResponses++;
              window.console.log('Successfully logged out: ', service);
              delete data[service];
              if (numResponses === services.length) {
                saveStatus(data);
              }
            },
            error: function logout_error() {
              numResponses++;
              if (numResponses === services.length) {
                saveStatus(data);
              }
            },
            timeout: function logout_timeout() {
              numResponses++;
              if (numResponses === services.length) {
                saveStatus(data);
              }
            }
          };
          Rest.get(url, callbacks);
        });
      });
    });
  }

  /**
   * Loads required libraries for sim import
   */
  function requireSimImport(callback) {
    var libraries = ['Import_sim_contacts'];
    var pending = libraries.length;

    libraries.forEach(function onPending(library) {
      Loader.utility(library, next);
    });

    function next() {
      if (!(--pending)) {
        callback();
      }
    }
  }

  // Import contacts from SIM card and updates ui
  function onSimImport(iccId, done) {
    var icc = IccHandler.getIccById(iccId);
    if (icc === null) {
      return;
    }
    Overlay.showActivityBar('simContacts-reading', true);

    var wakeLock = navigator.requestWakeLock('cpu');

    var cancelled = false,
        contactsRead = false;
    var importer = new SimContactsImporter(icc);
    Overlay.oncancel = function() {
      cancelled = true;
      importer.finish();
      if (contactsRead) {
        // A message about canceling will be displayed while the current chunk
        // is being cooked
       Overlay.showActivityBar('messageCanceling', true);
      } else {
        importer.onfinish(); // Early return while reading contacts
      }
    };
    var totalContactsToImport;
    var importedContacts = 0;
    // Delay for showing feedback to the user after importing
    var DELAY_FEEDBACK = 200;

    importer.onread = function(n) {
      contactsRead = true;
      totalContactsToImport = n;
      if (totalContactsToImport > 0) {
        Overlay.showProgressBar('simContacts-importing', totalContactsToImport);
      }
    };

    importer.onfinish = function(numDupsMerged) {
      window.setTimeout(function onfinish_import() {
        resetWait(wakeLock);
        if (importedContacts > 0) {
          var source = 'sim-' + iccId;
          utils.misc.setTimestamp(source, function() {
            // Once the timestamp is saved, update the list
            window.dispatchEvent(new CustomEvent('contactsimportdone'));
          });
        }
        if (!cancelled) {
          utils.status.show({
            id: 'simContacts-imported3',
            args: {
              n: importedContacts
            }
          },
          !numDupsMerged ? null : {
            id: 'contactsMerged',
            args: {
              numDups: numDupsMerged
            }
          });
        }

        typeof done === 'function' && done();

      }, DELAY_FEEDBACK);

      importer.onfinish = null;
    };

    importer.onimported = function() {
      importedContacts++;
      if (!cancelled) {
        Overlay.updateProgressBar();
      }
    };

    importer.onerror = function() {
      var cancel = {
        title: 'cancel',
        callback: function() {
          ConfirmDialog.hide();
        }
      };
      var retry = {
        title: 'retry',
        isRecommend: true,
        callback: function() {
          ConfirmDialog.hide();
          // And now the action is reproduced one more time
          window.setTimeout(requireSimImport.bind(this,
            onSimImport.bind(this, iccId)), 0);
        }
      };
      ConfirmDialog.show(null, 'simContacts-error', cancel, retry);
      resetWait(wakeLock);
    };

    importer.start();
  }

  function onSdImport(cb) {
    console.log('> SETTINGS > CTRL > SD IMPORT');
    // Delay for showing feedback to the user after importing
    var DELAY_FEEDBACK = 200;
    var importedContacts = 0;
    var cancelled = false;
    var importer = null;

    var wakeLock = navigator.requestWakeLock('cpu');

    Overlay.showActivityBar('memoryCardContacts-reading');
    Overlay.oncancel = function() {
      cancelled = true;
      importer ? importer.finish() : Overlay.hide();
    };

    utils.sdcard.retrieveFiles([
      'text/vcard',
      'text/x-vcard',
      'text/directory;profile=vCard',
      'text/directory'
    ], ['vcf', 'vcard'], function(err, fileArray) {
      if (err) {
        return import_error(err, cb);
      }
      if (cancelled) {
        return;
      }

      if (fileArray.length) {
        utils.sdcard.getTextFromFiles(fileArray, '', onFiles);
      } else {
        import_error('No contacts were found.', cb);
      }
    });

    function onFiles(err, text) {
      if (err) {
        return import_error(err, cb);
      }
      if (cancelled) {
        return;
      }
      console.log('> SD > Text = ' + text);
      importer = new VCFReader(text);
      if (!text || !importer) {
        return import_error('No contacts were found.', cb);
      }

      importer.onread = import_read;
      importer.onimported = imported_contact;
      importer.onerror = import_error;

      importer.process(function import_finish(total, numDupsMerged) {
        console.log('> finished importing');
        window.setTimeout(function onfinish_import() {
          utils.misc.setTimestamp('sd', function() {
            // Once the timestamp is saved, update the list
            window.dispatchEvent(new CustomEvent('contactsimportdone'));
            if (_changedContacts) {
              console.log('> storing changed contacts: ' +
                JSON.stringify(_changedContacts));
              sessionStorage.setItem('contactChanges',
                                     JSON.stringify(_changedContacts));
            }
            resetWait(wakeLock);

            if (!cancelled) {
              var msg1 = {
                id: 'memoryCardContacts-imported3',
                args: {
                  n: importedContacts
                }
              };
              var msg2 = !numDupsMerged ? null : {
                id: 'contactsMerged',
                args: {
                  numDups: numDupsMerged
                }
              };

              utils.status.show(msg1, msg2);

              if (typeof cb === 'function') {
                cb();
              }
            }
          });
        }, DELAY_FEEDBACK);
      });
    }

    function import_read(n) {
      console.log('> read contact - ' + n);
      Overlay.showProgressBar('memoryCardContacts-importing', n);
    }

    function imported_contact(contact) {
      console.log('> imported contact -- ' + JSON.stringify(contact));
      importedContacts++;

      var contactEvent = {
        contactID: contact.id,
        reason: 'update'
      };
      _changedContacts.unshift(contactEvent);
      console.log('> updated contact list: ' + JSON.stringify(contactEvent));

      Overlay.updateProgressBar();
    }

    function import_error(e, cb) {
      var cancel = {
        title: 'cancel',
        callback: function() {
          ConfirmDialog.hide();
        }
      };

      var retry = {
        title: 'retry',
        isRecommend: true,
        callback: function() {
          ConfirmDialog.hide();
          // And now the action is reproduced one more time
          window.setTimeout(requireOverlay.bind(this, onSdImport), 0);
        }
      };
      ConfirmDialog.show(null, 'memoryCardContacts-error', cancel, retry);
      resetWait(wakeLock);
      if (typeof cb === 'function') {
        cb();
      }
    }
  }

  function resetWait(wakeLock) {
    Overlay.hide();
    if (wakeLock) {
      wakeLock.unlock();
    }
  }

  exports.SettingsController = {
    'init': init,
    'checkNoContacts': checkNoContacts,
    'automaticLogout': automaticLogout,
    get activity() {
      return _activity;
    },
    set activity(value) {
      _activity = value;
    }
  };

})(window);
