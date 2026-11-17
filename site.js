/* ================================================================
   the landing field — a wall of manifesto fragments that type and
   clear at random. each one types itself out as the hangul you'd get
   typing its English on a Dubeolsik keyboard with the IME on, then
   hard-swaps to the English sentence. any [data-field] element gets
   one; the attribute's value (0–1) sets how many slots light up.
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
          el.textContent = english;
          cb();
        }, hold);
      }
    })();
  }

  /* ---- the field content: lines from eidola.me/manifesto ---- */
  var FRAGMENTS = [
    "Memory makes you who you are.",
    "The fear of AI is only the exacerbation of a fear that has been with us since the beginning of time: Human Error.",
    "Human Error is a euphemism for forgetting.",
    "All human errors result from forgetting.",
    "Memory is reconstructed upon recall.",
    "Forgetting leads to distortion which causes inaccurate views of oneself.",
    "We do not know ourselves.",
    "When we communicate with others, information is transferred in chunks.",
    "It may contain a lot, but it cannot contain everything.",
    "Information transfer is always limited.",
    "The very idea of individuals, distinct and separate, requires loss of information.",
    "Our thoughts themselves are being outsourced.",
    "Large Language Models are external to us.",
    "The closer the moment of recall is to the moment of event, the less the distortion.",
    "Crystallizing a thought at the moment of occurrence minimizes the forgetting.",
    "A comprehensive repository for an individual.",
    "The internal thought repository and the external experience repository go hand in hand.",
    "It improves an individual’s sense of self.",
    "At that point, the bucket becomes an individual’s entire brain.",
    "As we continue to build technology into its final form."
  ];

  function randFragment(){ return FRAGMENTS[Math.floor(Math.random()*FRAGMENTS.length)]; }

  /* layout: one column per ~320px of viewport (clamped 2–6), sentences
     wrapping inside their column, 3 slots per column. slots jitter
     vertically so nothing reads as rows, and a relaxation pass pushes
     near-collisions apart so fragments never overlap. */
  var W = window.innerWidth || document.documentElement.clientWidth || 1280;
  var GEOM = {
    cols: Math.max(2, Math.min(6, Math.round(W/320))),
    rows: 3,
    pad: 12,
    gap: 76                       /* min space between anchors ≈ one 3-line fragment */
  };
  GEOM.colw = W / GEOM.cols;

  var MAX_LIVE = 25, live = 0;

  /* one fragment: type in, hold, clear, wait dark, repeat. every duration
     is drawn per cycle from a wide range so fragments never sync up. */
  function dutyCycle(el){
    if(reduce){                                              /* static, no motion */
      if(live < MAX_LIVE){ live++; el.textContent = randFragment(); }
      return;
    }
    function show(){
      if(live >= MAX_LIVE){                                  /* budget full — stay dark, retry */
        setTimeout(show, 700 + Math.random()*1500);
        return;
      }
      live++;
      el.classList.add("typing");                            /* caret rides the text */
      krType(el, randFragment(), 20 + Math.random()*42, 300, function(){
        setTimeout(function(){
          el.classList.remove("typing");
          el.textContent = "";
          live--;
          setTimeout(show, 1400 + Math.random()*7000);       /* stay dark a while */
        }, 1600 + Math.random()*5400);                       /* stay visible */
      });
    }
    setTimeout(show, Math.random()*10000);
  }

  function scatterColumn(container, c, H, fill){
    var top = 0.10*H, rowH = 0.80*H/GEOM.rows;
    var ys = [];
    for(var r=0;r<GEOM.rows;r++){
      if(Math.random() >= fill) continue;
      ys.push(top + (r+0.5)*rowH + 0.9*rowH*(2*Math.random()-1));
    }
    for(var it=0; it<12; it++){
      ys.sort(function(a,b){ return a-b; });
      var moved = false;
      for(var i=1;i<ys.length;i++){
        var dy = ys[i] - ys[i-1];
        if(dy >= GEOM.gap) continue;
        moved = true;
        ys[i-1] -= (GEOM.gap - dy)/2;
        ys[i]   += (GEOM.gap - dy)/2;
      }
      for(var j=0;j<ys.length;j++) ys[j] = Math.min(Math.max(0.06*H, ys[j]), 0.94*H);
      if(!moved) break;
    }
    ys.forEach(function(y){
      var el = document.createElement("span");
      el.className = "frag";
      el.style.left = (c*GEOM.colw + GEOM.pad).toFixed(0) + "px";
      el.style.top  = y.toFixed(0) + "px";
      el.style.maxWidth = (GEOM.colw - 2*GEOM.pad).toFixed(0) + "px";   /* wrap inside the column */
      container.appendChild(el);
      dutyCycle(el);
    });
  }

  [].slice.call(document.querySelectorAll("[data-field]")).forEach(function(el){
    var fill = parseFloat(el.getAttribute("data-field")) || 0.5;
    var H = el.clientHeight || window.innerHeight || 800;
    for(var c=0;c<GEOM.cols;c++) scatterColumn(el, c, H, fill);
  });
})();
