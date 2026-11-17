/* ================================================================
   light / dark — loaded in <head> so the theme is set before the
   first paint. an explicit choice is remembered; until one is made,
   the page follows the OS setting.
   ================================================================ */
(function(){
  "use strict";

  var KEY = "theme";
  var root = document.documentElement;
  var mq = window.matchMedia && window.matchMedia("(prefers-color-scheme: light)");

  function stored(){
    try { return localStorage.getItem(KEY); } catch(e){ return null; }
  }
  function system(){ return mq && mq.matches ? "light" : "dark"; }

  function label(){
    var next = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
    [].slice.call(document.querySelectorAll("[data-theme-toggle]")).forEach(function(b){
      b.textContent = next;
      b.setAttribute("aria-label", "Switch to " + next + " mode");
      b.hidden = false;
    });
  }

  function apply(t){
    root.setAttribute("data-theme", t);
    label();
  }

  apply(stored() || system());

  /* follow the OS while the visitor hasn't picked */
  if(mq){
    var onChange = function(){ if(!stored()) apply(system()); };
    if(mq.addEventListener) mq.addEventListener("change", onChange);
    else if(mq.addListener) mq.addListener(onChange);
  }

  document.addEventListener("DOMContentLoaded", function(){
    label();
    document.addEventListener("click", function(e){
      var b = e.target.closest && e.target.closest("[data-theme-toggle]");
      if(!b) return;
      var t = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
      try { localStorage.setItem(KEY, t); } catch(err){}
      apply(t);
    });
  });
})();
