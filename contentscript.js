
// Inject `achme` script into page.
var s = document.createElement('script');
s.src = chrome.extension.getURL('achme.js');
(document.head||document.documentElement).appendChild(s);
s.onload = function() {
  // remove script, once loaded.
  s.parentNode.removeChild(s);
};

var available_actions = {
  'snarf_stack->push': 1,
  'snarf_stack->peek': 1,
  'snarf_stack->pop': 1,
  'snarf_stack->list': 1
};

// communications port between background script and
// this content script.
var port = chrome.runtime.connect({ name: 'achme' });

// window.postMessage event listener.
window.addEventListener("message", function(event) {
  // We only accept messages from ourselves
  if (event.source != window) {
    return;
  }

  if (event.data &&
      event.data.result === void 0 && // result isn't defined
      event.data.action in available_actions) {
    // message comes from embedded script, post it to background:
    port.postMessage(event.data);
  }
}, false);

port.onMessage.addListener(function(message) {
  if (message &&
      message.result !== void 0) {
    // a message from background, with a defined result.
    window.postMessage(message, '*');
  }
});
