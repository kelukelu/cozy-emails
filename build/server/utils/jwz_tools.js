// Generated by CoffeeScript 1.8.0
var IGNORE_ATTRIBUTES, REGEXP, flattenMailboxTreeLevel, sanitizeHtml, _;

_ = require('lodash');

sanitizeHtml = require('sanitize-html');

REGEXP = {
  hasReOrFwD: /^(Re|Fwd)/i,
  subject: /(?:(?:Re|Fwd)(?:\[[\d+]\])?\s?:\s?)*(.*)/i,
  messageId: /<([^<>]+)>/
};

IGNORE_ATTRIBUTES = ['\\HasNoChildren', '\\HasChildren'];

module.exports = {
  isReplyOrForward: function(subject) {
    var match;
    match = subject.match(REGEXP.hasReOrFwD);
    if (match) {
      return true;
    } else {
      return false;
    }
  },
  normalizeSubject: function(subject) {
    var match;
    match = subject.match(REGEXP.subject);
    if (match) {
      return match[1];
    } else {
      return false;
    }
  },
  normalizeMessageID: function(messageId) {
    var match;
    match = messageId.match(REGEXP.messageId);
    if (match) {
      return match[1];
    } else {
      return null;
    }
  },
  flattenMailboxTree: function(tree) {
    var boxes, delimiter, path, root;
    boxes = [];
    if (Object.keys(tree).length === 1 && (root = tree['INBOX'])) {
      delimiter = root.delimiter;
      path = 'INBOX' + delimiter;
      boxes.push({
        label: 'INBOX',
        delimiter: delimiter,
        path: 'INBOX',
        tree: ['INBOX'],
        attribs: _.difference(root.attribs, IGNORE_ATTRIBUTES)
      });
      flattenMailboxTreeLevel(boxes, root.children, path, [], delimiter);
    } else {
      flattenMailboxTreeLevel(boxes, tree, '', [], '/');
    }
    return boxes;
  },
  sanitizeHTML: function(html, messageId, attachments) {
    html = html.replace(/cid:/gim, 'cid;', function(url) {
      var attachment, cid, name, _ref;
      url = url.toString();
      if (0 === url.indexOf('cid;')) {
        cid = url.substring(4);
        attachment = attachments.filter(function(att) {
          return att.contentId === cid;
        });
        name = (_ref = attachment[0]) != null ? _ref.fileName : void 0;
        if (name) {
          return "/message/" + messageId + "/attachments/" + name;
        } else {
          return null;
        }
      } else {
        return url;
      }
    });
    html = sanitizeHtml(html, {
      allowedTags: sanitizeHtml.defaults.allowedTags.concat(['img', 'head', 'link', 'meta']),
      allowedClasses: false
    });
    return html;
  }
};

flattenMailboxTreeLevel = function(boxes, children, pathStr, pathArr, parentDelimiter) {
  var child, delimiter, name, subPathArr, subPathStr, _results;
  _results = [];
  for (name in children) {
    child = children[name];
    delimiter = child.delimiter || parentDelimiter;
    subPathStr = pathStr + name + delimiter;
    subPathArr = pathArr.concat(name);
    flattenMailboxTreeLevel(boxes, child.children, subPathStr, subPathArr, delimiter);
    _results.push(boxes.push({
      label: name,
      delimiter: delimiter,
      path: pathStr + name,
      tree: subPathArr,
      attribs: _.difference(child.attribs, IGNORE_ATTRIBUTES)
    }));
  }
  return _results;
};
