/* ================================================================
   shared behavior — the hangul-typing signature + page chrome.

   THE SIGNATURE: every [data-krtype] element types itself out as
   the hangul you'd get typing its English text on a Dubeolsik
   keyboard with the IME on — nonsense until it finishes — then
   hard-swaps to the English sentence. no fades.

   content authors: write plain English in the markup; this file
   never needs editing to change copy.
   ================================================================ */
(function(){
  "use strict";

  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* Dubeolsik layout: what each latin key prints with the IME on */
  var DUBEOLSIK = {
    q:"ㅂ", w:"ㅈ", e:"ㄷ", r:"ㄱ", t:"ㅅ", y:"ㅛ", u:"ㅕ", i:"ㅑ", o:"ㅐ", p:"ㅔ",
    a:"ㅁ", s:"ㄴ", d:"ㅇ", f:"ㄹ", g:"ㅎ", h:"ㅗ", j:"ㅓ", k:"ㅏ", l:"ㅣ",
    z:"ㅋ", x:"ㅌ", c:"ㅊ", v:"ㅍ", b:"ㅠ", n:"ㅜ", m:"ㅡ"
  };

  function toHangul(text){
    var out = "";
    for(var i=0;i<text.length;i++){
      var ch = text[i];
      out += DUBEOLSIK[ch.toLowerCase()] || ch;
    }
    return out;
  }

  /* type hangul nonsense into el, hold, hard-swap to english */
  function krType(el, english, speed, hold, cb){
    if(reduce){
      el.textContent = english;
      if(cb) cb();
      return;
    }
    /* lock current height so the swap can't shift layout */
    var h = el.getBoundingClientRect().height;
    if(h) el.style.minHeight = h + "px";
    el.classList.add("kr-live");
    var nonsense = toHangul(english);
    var k = 0;
    (function step(){
      if(k <= nonsense.length){
        el.textContent = nonsense.slice(0,k);
        k++;
        setTimeout(step, speed);
      } else {
        setTimeout(function(){
          el.classList.remove("kr-live");
          el.textContent = english;   /* the swap — hard cut, no fade */
          if(cb) cb();
        }, hold);
      }
    })();
  }

  /* ---- expose the scramble engine so page-specific scripts can reuse it ---- */
  window.KR = { krType: krType, toHangul: toHangul, reduce: reduce };

  /* ---- auto-run every [data-krtype] in document order, sequentially ---- */
  var queue = [].slice.call(document.querySelectorAll("[data-krtype]"));
  queue.forEach(function(el){
    var txt = el.textContent.replace(/\s+/g," ").trim();
    el.setAttribute("data-text", txt);
    el.setAttribute("aria-label", txt);      /* AT reads the sentence, not the scramble */
  });

  function runQueue(i){
    if(i >= queue.length) return;
    var el = queue[i];
    var speed = parseInt(el.getAttribute("data-speed") || "24", 10);
    var hold  = parseInt(el.getAttribute("data-hold")  || "320", 10);
    krType(el, el.getAttribute("data-text"), speed, hold, function(){
      runQueue(i+1);
    });
  }
  if(queue.length) runQueue(0);

  /* ---- persistent ether overlay: same trick, cycling fragments ---- */
  var ETHER_FRAGMENTS = [
    "i keep a recording of a day i no longer remember",
    "the fair was in march. i remember it in blue.",
    "sunwoo, frank, choi — three names for one person",
    "the event happened once. the account keeps changing.",
    "the eeg knows a signal i never felt",
    "a file holds what it was given. a memory edits.",
    "i read the trace back and it disagrees with me",
    "every recall rewrites the thing it is recalling",
    "i am the last person to trust about my own past",
    "what i saved and what i remember are different files",
    "the account comes after the event and takes its place",
    "i remember the room. i think i invented the light."
  ];

  var etherText = document.getElementById("ether-text");
  if(etherText){
    if(reduce){
      etherText.textContent = "> " + ETHER_FRAGMENTS[0];
    } else {
      var prev = -1;
      (function cycle(){
        var i = Math.floor(Math.random()*ETHER_FRAGMENTS.length);
        if(i === prev) i = (i+1) % ETHER_FRAGMENTS.length;
        prev = i;
        krType(etherText, "> " + ETHER_FRAGMENTS[i], 46, 900, function(){
          setTimeout(cycle, 3600);
        });
      })();
    }
  }

  /* ---- corner HUD: frame counter, ok-computer numerals ---- */
  var hud = document.getElementById("hud");
  if(hud){
    var frame = Math.floor(Math.random()*900);
    function tick(){
      var bits = "";
      for(var b=0;b<8;b++) bits += (Math.random()<.5 ? "0" : "1");
      hud.textContent = "[ " + String(frame).padStart(4,"0") + " // " + bits + " ]";
      frame++;
    }
    tick();
    if(!reduce) setInterval(tick, 1600);
  }
})();
