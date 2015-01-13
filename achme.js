(function() {
  var active_btns = [
    void 0, false, false, false
  ];

  var getMessageId = (function() {
    var counter = 0;
    return function() {
      return counter++;
    };
  })();

  var oncontextmenu_enable = window.oncontextmenu;
  var oncontextmenu_disable = function () {
    return false; // cancel default menu
  };

  var element_is_text_editable = function(e) {
    return e.nodeName === "INPUT" ||
      e.nodeName === "TEXTAREA";
  };

  document.addEventListener('mousedown', function(e) {
    var text;
    if (e.which === 1) {
      window.oncontextmenu = oncontextmenu_disable;
    }

    active_btns[e.which] = true;
    if (active_btns[1] && e.which !== 1) { // mouse 1 is currently pressed

      e.preventDefault();

      var sel = window.getSelection();
      var word_under_cursor = getWordAtPoint(e.target, e.x, e.y);

      if (e.which === 2) {
        // "exec"
        if (element_is_text_editable(e.target)) {
          if (sel.toString()) {
            text = sel.toString();
            sel.deleteFromDocument();
            e.target.value = e.target.value.replace(text, '');
          }
        } else {
          text = word_under_cursor;
        }
        if (!!text) {
          send_message({
            action: 'snarf_stack->push',
            text: text
          });
        }
      } else if (e.which === 3 && !active_btns[2]) {
        text = sel.toString() ? sel.toString() : word_under_cursor;
        window.find(text, true, false, true);
      } else if (e.which === 3 && active_btns[2]) {
        if (element_is_text_editable(e.target)) {
          send_message({
            action: 'snarf_stack->peek'
          }).withResult(function(result) {
            try {
              insertAtCaret(e.target, result);
            } catch (E) {
              e.target.value += result;
            }
          });
        }
        /// a.k.a DOM-paste :D
        // var textNode = document.createTextNode(kill_ring.slice(-1));
        // e.target.parentNode.insertBefore(textNode, e.target);
      }
    }
  });

  document.addEventListener('mouseup', function(e) {
    active_btns[e.which] = false;
    if (e.which === 1) {
      window.oncontextmenu = oncontextmenu_enable;
    }
  });

  function insertAtCaret(element,text) {
    if (!element || !text) {
      return false;
    }
    var scrollPos = element.scrollTop;
    var strPos = 0;
    var range;
    var br = ((element.selectionStart || element.selectionStart == '0') ?
              "ff" : (document.selection ? "ie" : false ) );

    if (br === "ie") {
      element.focus();
      range = document.selection.createRange();
      range.moveStart ('character', -element.value.length);
      strPos = range.text.length;
    } else if (br === "ff") {
      strPos = element.selectionStart;
    }

    var front = element.value.substring(0, strPos);
    var back = element.value.substring(strPos, element.value.length);
    element.value = front + text + back;
    strPos = strPos + text.length;
    if (br === "ie") {
      element.focus();
      range = document.selection.createRange();
      range.moveStart ('character', -element.value.length);
      range.moveStart ('character', strPos);
      range.moveEnd ('character', 0);
      range.select();
    } else if (br === "ff") {
      element.selectionStart = strPos;
      element.selectionEnd = strPos;
      element.focus();
    }
    element.scrollTop = scrollPos;

    // set the inserted value as selected.
    element.setSelectionRange(strPos - text.length, strPos);

    return true;
  }

  function getWordAtPoint(element, x, y) {
    // 'Range.detach' is now a no-op, as per the DOM spec
    // (http://dom.spec.whatwg.org/#dom-range-detach).
    var range;
    if(element.nodeType === element.TEXT_NODE) {
      range = element.ownerDocument.createRange();
      range.selectNodeContents(element);
      var currentPos = 0;
      var endPos = range.endOffset;
      while(currentPos + 1 < endPos) {
        range.setStart(element, currentPos);
        range.setEnd(element, currentPos+1);
        if(range.getBoundingClientRect().left <= x &&
           range.getBoundingClientRect().right >= x &&
           range.getBoundingClientRect().top <= y &&
           range.getBoundingClientRect().bottom >= y) {
          range.expand("word");
          return range.toString();
        }
        currentPos += 1;
      }
    } else {
      for(var i = 0; i < element.childNodes.length; i++) {
        range = element.childNodes[i].ownerDocument.createRange();
        range.selectNodeContents(element.childNodes[i]);
        if(range.getBoundingClientRect().left <= x &&
           range.getBoundingClientRect().right >= x &&
           range.getBoundingClientRect().top <= y &&
           range.getBoundingClientRect().bottom >= y) {
          return getWordAtPoint(element.childNodes[i], x, y);
        }
      }
    }

    return null;
  }

  var available_actions = {
    'snarf_stack->push': 1,
    'snarf_stack->peek': 1,
    'snarf_stack->pop': 1,
    'snarf_stack->list': 1
  };

  var messages = [];

  function send_message(message) {
    var id = getMessageId();
    messages[id] = function () {};

    var handler = {
      withResult: function (callback) {
        messages[id] = function (result) {
          callback(result);
        };
      }
    };
    if (!message) {
      return handler;
    }

    message.id = id;

    window.postMessage(message, "*");

    return handler;
  }

  var on_postMessage = function(event) {
    if (event.data &&
        //event.data.action in available_actions &&
        event.data.result !== void 0) {
      messages[event.data.id].call(null, event.data.result);
      messages[event.data.id] = null;
    }
  };
  window.addEventListener('message', on_postMessage);

})();
