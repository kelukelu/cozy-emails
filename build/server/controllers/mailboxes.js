// Generated by CoffeeScript 1.9.3
var Account, BadRequest, Mailbox, Message, _, async, log;

async = require('async');

Account = require('../models/account');

Mailbox = require('../models/mailbox');

Message = require('../models/message');

BadRequest = require('../utils/errors').BadRequest;

log = require('../utils/logging')({
  prefix: 'mailbox:controller'
});

_ = require('lodash');

async = require('async');

module.exports.fetch = function(req, res, next) {
  var id;
  id = req.params.mailboxID;
  return Mailbox.find(req.params.mailboxID, function(err, mailbox) {
    if (err) {
      return next(err);
    }
    req.mailbox = mailbox;
    return next();
  });
};

module.exports.fetchParent = function(req, res, next) {
  if (!req.body.parentID) {
    return async.nextTick(next);
  }
  return Mailbox.find(req.body.parentID, function(err, mailbox) {
    if (err) {
      return next(err);
    }
    req.parentMailbox = mailbox;
    return next();
  });
};

module.exports.refresh = function(req, res, next) {
  var account;
  account = req.account;
  if (account.isRefreshing()) {
    return res.status(202).send({
      info: 'in progress'
    });
  } else if (!account.supportRFC4551) {
    return next(new BadRequest('Cant refresh a non RFC4551 box'));
  } else {
    return req.mailbox.imap_refresh({
      limitByBox: null,
      firstImport: false,
      supportRFC4551: true
    }, function(err, shouldNotif) {
      if (err) {
        return next(err);
      }
      return res.send(req.mailbox);
    });
  }
};

module.exports.create = function(req, res, next) {
  var account, label, parent;
  log.info(("Creating " + req.body.label + " under " + req.body.parentID) + (" in " + req.body.accountID));
  account = req.account;
  parent = req.parentMailbox;
  label = req.body.label;
  return Mailbox.imapcozy_create(account, parent, label, function(err) {
    if (err) {
      return next(err);
    }
    res.account = account;
    return next();
  });
};

module.exports.update = function(req, res, next) {
  var account, favorites, mailbox, newPath, parentPath, path;
  log.info("Updating " + req.params.mailboxID + " to " + req.body.label);
  account = req.account;
  mailbox = req.mailbox;
  if (req.body.label) {
    path = mailbox.path;
    parentPath = path.substring(0, path.lastIndexOf(mailbox.label));
    newPath = parentPath + req.body.label;
    return mailbox.imapcozy_rename(req.body.label, newPath, function(err, updated) {
      if (err) {
        return next(err);
      }
      res.account = account;
      return next(null);
    });
  } else if (req.body.favorite != null) {
    favorites = _.without(account.favorites, mailbox.id);
    if (req.body.favorite) {
      favorites.push(mailbox.id);
    }
    return account.updateAttributes({
      favorites: favorites
    }, function(err, updated) {
      if (err) {
        return next(err);
      }
      res.account = updated;
      return next(null);
    });
  } else {
    return next(new BadRequest('Unsuported request for mailbox update'));
  }
};

module.exports["delete"] = function(req, res, next) {
  var account;
  log.info("Deleting " + req.params.mailboxID);
  account = req.account;
  return req.mailbox.imapcozy_delete(account, function(err) {
    if (err) {
      return next(err);
    }
    res.account = account;
    return next(null);
  });
};

module.exports.expunge = function(req, res, next) {
  var account;
  log.info("Expunging " + req.params.mailboxID);
  account = req.account;
  if (account.trashMailbox === req.params.mailboxID) {
    if (account.isTest()) {
      return Message.safeRemoveAllFromBox(req.params.mailboxID, function(err) {
        if (err) {
          return next(err);
        }
        res.account = account;
        return next(null);
      });
    } else {
      return req.mailbox.imap_expungeMails(function(err) {
        if (err) {
          return next(err);
        }
        res.account = account;
        return next(null);
      });
    }
  } else {
    return next(new BadRequest('You can only expunge trash mailbox'));
  }
};
