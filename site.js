/* ================================================================
   shared behavior — the hangul-typing signature + the live field.

   THE SIGNATURE: every [data-krtype] element types itself out as
   the hangul you'd get typing its English text on a Dubeolsik
   keyboard with the IME on — nonsense until it finishes — then
   hard-swaps to the English sentence. no fades.

   THE FIELD: the landing-page wall of manifesto fragments that
   type and clear at random. exposed as KR.buildField so every
   page header can carry a dim version of the same weather.

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

  /* ================================================================
     the field engine — eidola.me's landing canvas, generalized.
     layout: one column per ~320px of viewport (clamped 2–6), 12px
     inner column padding, sentences wrapping inside their column,
     3 slots per column per screen height. slots jitter vertically
     by up to ±0.9 of a row height so nothing reads as rows, and a
     relaxation pass pushes near-collisions apart so fragments never
     overlap. a global budget keeps the page calm.
     ================================================================ */
  var W = window.innerWidth || document.documentElement.clientWidth || 1280;
  var GEOM = {
    cols: Math.max(2, Math.min(6, Math.round(W/320))),
    rows: 3,
    pad: 12,
    gap: 76                       /* min space between anchors ≈ one 3-line fragment */
  };
  GEOM.colw = W / GEOM.cols;

  var MAX_LIVE = 25, live = 0;

  /* one fragment: scramble in (calm), hold a good while, clear, wait
     dark, repeat. every duration is drawn per-cycle from a wide range,
     and the initial phase spans a whole cycle, so fragments never fall
     into synchronized waves. */
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
          el.textContent = "";                               /* clear (go dark) */
          live--;
          setTimeout(show, 1400 + Math.random()*7000);       /* stay dark a while */
        }, 1600 + Math.random()*5400);                       /* stay visible, calm */
      });
    }
    setTimeout(show, Math.random()*10000);
  }

  function scatterColumn(container, c, H, fill, fixedY){
    var top = 0.10*H, rowH = 0.80*H/GEOM.rows;
    var pts = [];
    for(var r=0;r<GEOM.rows;r++){
      var base = top + (r+0.5)*rowH;
      if(fixedY != null && Math.abs(base - fixedY) < rowH/2) continue;  /* reserved slot */
      if(Math.random() >= fill) continue;
      pts.push({ y: base + 0.9*rowH*(2*Math.random()-1), fixed: false });
    }
    if(fixedY != null) pts.push({ y: fixedY, fixed: true });   /* reserved: immovable */
    for(var it=0; it<12; it++){
      pts.sort(function(a,b){ return a.y-b.y; });
      var moved = false;
      for(var i=1;i<pts.length;i++){
        var a = pts[i-1], b = pts[i], dy = b.y - a.y;
        if(dy >= GEOM.gap) continue;
        moved = true;
        var push = GEOM.gap - dy;
        if(a.fixed) b.y += push;
        else if(b.fixed) a.y -= push;
        else { a.y -= push/2; b.y += push/2; }
      }
      for(var j=0;j<pts.length;j++){
        if(!pts[j].fixed) pts[j].y = Math.min(Math.max(0.06*H, pts[j].y), 0.94*H);
      }
      if(!moved) break;
    }
    for(var k=0;k<pts.length;k++){
      if(pts[k].fixed) continue;
      var el = document.createElement("span");
      el.className = "frag";
      el.style.left = (c*GEOM.colw + GEOM.pad).toFixed(0) + "px";
      el.style.top  = pts[k].y.toFixed(0) + "px";
      el.style.maxWidth = (GEOM.colw - 2*GEOM.pad).toFixed(0) + "px";   /* wrap inside the column */
      container.appendChild(el);
      dutyCycle(el);
    }
  }

  /* fill 0–1 sets how many slots light up; reserved {c, y} keeps one
     slot permanently clear (the landing's dive-in claims it). */
  function buildField(container, fill, reserved){
    if(!container) return;
    var H = container.clientHeight || window.innerHeight || 800;
    for(var c=0;c<GEOM.cols;c++){
      scatterColumn(container, c, H, fill, (reserved && reserved.c === c) ? reserved.y : null);
    }
  }

  /* ---- expose the engines so page-specific scripts can reuse them ---- */
  window.KR = {
    krType: krType,
    toHangul: toHangul,
    reduce: reduce,
    FRAGMENTS: FRAGMENTS,
    buildField: buildField,
    fieldGeom: GEOM
  };

  /* ---- any [data-field] element becomes a live field on load ---- */
  [].slice.call(document.querySelectorAll("[data-field]")).forEach(function(el){
    var fill = parseFloat(el.getAttribute("data-field")) || 0.5;
    buildField(el, fill, null);
  });

  /* ---- a [data-autohide] header retreats on the way down, returns on the
     way up. threshold keeps trackpad jitter from flickering the bar. ---- */
  (function(){
    var head = document.querySelector("[data-autohide]");
    if(!head) return;
    var lastY = window.pageYOffset || 0, queued = false, THRESH = 6;
    function paint(){
      queued = false;
      var y = window.pageYOffset || 0;
      if(Math.abs(y - lastY) < THRESH) return;      /* below threshold: hold, don't reset */
      var hide = y > lastY && y > head.offsetHeight;
      head.classList.toggle("sitehead--hidden", hide);
      lastY = y;
    }
    window.addEventListener("scroll", function(){
      if(queued) return;
      queued = true;
      window.requestAnimationFrame(paint);
    }, { passive: true });
    /* keyboard focus must never land on an off-screen bar */
    head.addEventListener("focusin", function(){ head.classList.remove("sitehead--hidden"); });
  })();

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
})();
