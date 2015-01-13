(function() {
  var snarf_stack = [];

  var achme_ext = window.achme = {}
  achme_ext.snarf_stack = function() {
    return snarf_stack.slice(0);
  };

  var port = chrome.runtime.connect({ name: 'achme' });

  chrome.runtime.onConnect.addListener(function(port) {
    console.assert(port.name === 'achme');

    port.onMessage.addListener(function(message) {
      port.postMessage({
        'snarf_stack->push': function() {
          snarf_stack.push(message.text);
          return {
            id: message.id,
            result: 200
          };
        },
        'snarf_stack->peek': function() {
          return {
            id: message.id,
            result: snarf_stack.slice(-1)[0]
          };
        },
        'snarf_stack->pop': function() {
          return {
            id: message.id,
            result: snarf_stack.pop()
          };
        },
        'snarf_stack->list': function() {
          return {
            id: message.id,
            result: snarf_stack.slice(0)
          };
        }
      }[message.action].call());
    });
  });

})();
