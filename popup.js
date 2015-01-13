window.init = (function() {
  var g = function(id) {
    return document.getElementById(id);
  };

  var bgp = chrome.extension.getBackgroundPage();

  var btn_show_snarf_stack;

  var init = function () {
    btn_show_snarf_stack = g('btn_gss');
    btn_show_snarf_stack.addEventListener('click', function(event) {
      var ss = bgp.achme.snarf_stack();
      var out = g('snarf_ring_contents');
      ss.forEach(function(str) {
        var p = document.createElement('p');
        p.innerHTML = str
        out.appendChild(p);
      });
    });
  };
  document.addEventListener("DOMContentLoaded", init);

})();
