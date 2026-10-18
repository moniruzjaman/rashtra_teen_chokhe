(function () {
  var R = document.documentElement;
  var $ = function (id) { return document.getElementById(id); };
  function get(k) { try { return localStorage.getItem("rtc-" + k); } catch (e) { return null; } }
  function set(k, v) { try { localStorage.setItem("rtc-" + k, v); } catch (e) {} }
  function toast(m) {
    var t = $("toast");
    if (!t) return;
    t.textContent = m;
    t.classList.add("on");
    setTimeout(function () { t.classList.remove("on"); }, 1800);
  }

  var fs = parseFloat(get("fs")) || 1.18;
  function setFs(v) {
    fs = Math.min(1.7, Math.max(0.95, v));
    R.style.setProperty("--fs", fs + "rem");
    set("fs", String(fs));
  }
  setFs(fs);

  var themes = ["auto", "sepia", "dark"];
  var ti = Math.max(0, themes.indexOf(get("th") || "auto"));
  function applyTheme() {
    if (themes[ti] === "auto") R.removeAttribute("data-theme");
    else R.setAttribute("data-theme", themes[ti]);
    set("th", themes[ti]);
  }
  applyTheme();

  var toc = $("toc");
  var scrim = $("scrim");
  function tog(o) {
    if (!toc) return;
    toc.classList.toggle("open", o);
    if (scrim) scrim.classList.toggle("on", o);
    var btn = $("tocBtn");
    if (btn) btn.setAttribute("aria-expanded", o ? "true" : "false");
  }
  if ($("tocBtn")) $("tocBtn").onclick = function () { tog(!toc.classList.contains("open")); };
  if (scrim) scrim.onclick = function () { tog(false); };
  if (toc) toc.addEventListener("click", function (e) {
    if (e.target.tagName === "A") tog(false);
  });
  if ($("inc")) $("inc").onclick = function () { setFs(fs + 0.08); };
  if ($("dec")) $("dec").onclick = function () { setFs(fs - 0.08); };
  if ($("theme")) $("theme").onclick = function () {
    ti = (ti + 1) % 3;
    applyTheme();
    toast(["স্বয়ংক্রিয় থিম", "সেপিয়া থিম", "ডার্ক থিম"][ti]);
  };
  if ($("share")) {
    // If share-modal.js is loaded, it handles the share button via its own DOMContentLoaded
    // listener (which runs AFTER this IIFE because we attach it inside an event listener).
    // We skip the basic onclick here to avoid double-binding.
    if (!window.EBOOK_SHARE_MODAL) {
      $("share").onclick = function () {
        var u = location.href.split("#")[0];
        var d = { title: "রাষ্ট্রকে দেখা তিন চোখে", text: "একটি রাষ্ট্রের গল্প—তিন চোখে", url: u };
        if (navigator.share) navigator.share(d).catch(function () {});
        else if (navigator.clipboard) navigator.clipboard.writeText(u).then(function () { toast("লিংক কপি হয়েছে"); });
        else toast(u);
      };
    }
  }
  if ($("topBtn")) $("topBtn").onclick = function () { window.scrollTo({ top: 0, behavior: "smooth" }); };

  var search = $("tocSearch");
  if (search) {
    search.addEventListener("input", function () {
      var q = search.value.trim();
      var links = toc.querySelectorAll("a");
      for (var i = 0; i < links.length; i++) {
        var hit = !q || links[i].textContent.indexOf(q) !== -1;
        links[i].parentElement.style.display = hit ? "" : "none";
      }
    });
  }

  var chapters = [].slice.call(document.querySelectorAll(".chapter"));
  var links = {};
  [].forEach.call(document.querySelectorAll("#toc a[data-id]"), function (a) { links[a.dataset.id] = a; });
  var last = null;
  function upd() {
    var h = document.documentElement;
    var p = h.scrollTop / (h.scrollHeight - h.clientHeight || 1);
    if ($("prog")) $("prog").style.width = (p * 100) + "%";
    // Also update the new top reading-progress bar
    if ($("readProgress")) $("readProgress").style.width = (Math.min(1, Math.max(0, p)) * 100) + "%";
    var cur = null;
    for (var i = 0; i < chapters.length; i++) {
      if (chapters[i].getBoundingClientRect().top < 140) cur = chapters[i];
    }
    var id = cur ? cur.id : "top";
    if (id !== last) {
      last = id;
      for (var k in links) links[k].classList.toggle("on", k === id);
      if ($("cur")) $("cur").textContent = cur ? (cur.dataset.title || "") : "রাষ্ট্রকে দেখা তিন চোখে";
      if (cur) set("pos", id);
    }
  }
  var ticking = false;
  addEventListener("scroll", function () {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(function () { upd(); ticking = false; });
    }
  }, { passive: true });
  upd();

  var pos = get("pos");
  if (!location.hash && pos && $(pos) && $("resumeBox")) {
    var b = document.createElement("button");
    b.className = "btn-ghost";
    b.textContent = "যেখানে ছিলেন সেখান থেকে চালিয়ে যান";
    b.onclick = function () { $(pos).scrollIntoView({ behavior: "smooth" }); };
    $("resumeBox").appendChild(b);
  }

  addEventListener("keydown", function (e) {
    if (e.key === "Escape") { tog(false); if (tts && tts.open) tts.close(); }
    if (e.target && (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA" || e.target.tagName === "SELECT")) return;
    if (e.key === "/" && toc) { e.preventDefault(); tog(true); if (search) search.focus(); }
    if ((e.key === " " || e.code === "Space") && tts && tts.open) { e.preventDefault(); tts.toggle(); }
  });

var tts = null;
      if ("speechSynthesis" in window) {
        tts = (function () {
          var synth = window.speechSynthesis;
          var units = [];
          var idx = 0;
          var speaking = false;
          var paused = false;
          var bar = $("ttsBar");
          var nowEl = $("ttsNow");
          var playBtn = $("ttsPlay");
          var open = false;
          var allVoices = [];

          // Wake Lock: keep screen on while reading (prevents TTS stopping on lock)
          var wakeLock = null;
          var keepScreenOn = get("wake") === "1";
          function setWake(v) {
            keepScreenOn = v;
            set("wake", v ? "1" : "0");
            var cb = $("ttsWake");
            if (cb) cb.checked = v;
            if (v && (speaking || paused)) requestWake();
            else if (!v) releaseWake();
          }
          function requestWake() {
            if (!keepScreenOn || wakeLock) return;
            if (!("wakeLock" in navigator)) return;
            try {
              navigator.wakeLock.request("screen").then(function (wl) {
                wakeLock = wl;
                wl.onrelease = function () { wakeLock = null; };
              }).catch(function () { /* denied or unsupported — fail silently */ });
            } catch (e) { /* not supported */ }
          }
          function releaseWake() {
            if (wakeLock) {
              try { wakeLock.release(); } catch (e) {}
              wakeLock = null;
            }
          }
          // Re-acquire wake lock if released by the system (e.g. timeout)
          function refreshWake() {
            if (keepScreenOn && (speaking || paused) && !wakeLock) requestWake();
          }
          setInterval(refreshWake, 5000);

      // Which part of the book each chapter belongs to (drives per-perspective voices)
      function chapterPart(ch) {
        var id = ch.id || "";
        if (/^chapter(0[1-9]|10)$/.test(id) || id === "transition") return "A";   // মানুষের চোখে
        if (/^chapter1[1-7]$/.test(id)) return "B";                                // কর্মকর্তার চোখে
        if (/^chapter(18|19|2[0-6])$/.test(id)) return "C";                        // রাজনীতিবিদের চোখে
        return "N";                                                                // নিরপেক্ষ (শেষ কথা ইত্যাদি)
      }

      function collect() {
        units = [];
        chapters.forEach(function (ch) {
          var part = chapterPart(ch);
          var nodes = ch.querySelectorAll("h3, p, blockquote, .chapter-highlight, li");
          for (var i = 0; i < nodes.length; i++) {
            var el = nodes[i];
            var text = (el.innerText || el.textContent || "").replace(/\s+/g, " ").trim();
            if (text.length > 1) units.push({ el: el, text: text, chapter: ch, part: part });
          }
        });
      }
      collect();

      // ---- Voice catalog & gender heuristics -------------------------------
      var MALE = /(male|pradeep|ravi|hemant|mads|david|mark|george|james|oliver|fred|alex|daniel|liam|aaron|arthur|diego|carlos|juan|pablo|jorge|raul|thomas|william|conrad|richard|eric|ivan|paul|kumar|rajit|madhur|pratap|rohit|abhishek|hemchandra|nasser|salman|fahad|zariab|farhad|asif|rehan|arjun|vijay|veer|karim|younes|magomed|pavel|dmitry|sergey|andrey|jurgen|stefan|ludovic|nicolas|henrique|joao|francisco|emilio|giovan|antonio|javier|raul)/i;
      var FEMALE = /(female|nabanita|sarita|shreya|swara|kalpana|heera|lekha|veena|vasundhira|aditi|neerja|rioswo|ananya|kajal|mimi|samantha|serena|aria|jenny|sonia|natasha|hazel|sonia|tessa|catherine|susan|linda|emma|olivia|amelie|audrey|blanca|camila|elsa|esperanza|ilaria|jaime|laurel|luciana|marisol|mia|monica|paloma|penelope|pietra|sabina|samyra|sofía|constance|charlotte|vivienne|zosia|anna|maria|katarzyna|joana|inês|denise|helena|fatima|maryam|mariam|layla|hoda|amira|sara|nora|irene|silvia|karen|ella|rachel|melina|athena|agios|evangelia|zeynep|merve|filiz|tolga|burak|ceren|selin|elif|dilan|narges|sanjna|puja|rupa|uhabi|salli|tracy|hanh|thuy|ling|yunxi|xiaoxiao|yaoyao|nanjing|shanghai|tianyi|michiko|haruka|saori|hyunsik|sunhi|ji-min|seoyeon|narisa|bin|premkarn|mai|dao|dara|sokha|chan|kim|lynn|mint|jade|ruby|iris|freya|ida|sofia|sigrid|grimr|gunnr|annike|ingrid|freyr|sunniva|vilde|amanda|frida|selma|ninni|alva|saga|lovi|maja|astrid|eilid|cat|carys|bonnie|geraint|rhys|nljs|willem|maaike|fenna|joris|noortje|bart|elliot|clara|lena|milena|katja|peter|klaus|marlene|exaggerated)/i;

      function isFemale(v) {
        var s = (v.name || "") + " " + (v.voiceURI || "");
        if (MALE.test(s) && !FEMALE.test(s)) return false;
        if (FEMALE.test(s) && !MALE.test(s)) return true;
        return null; // unknown
      }
      function isMale(v) {
        var f = isFemale(v);
        return f === null ? null : !f;
      }
      function isNeural(v) {
        return /neural|natural|premium|enhanced|google|microsoft|online/i.test((v.name || "") + " " + (v.voiceURI || ""));
      }
      function isLocal(v) {
        return /local/i.test(v.voiceURI || "") || v.localService;
      }

      function refreshVoices() {
        var vs = [];
        try { vs = synth.getVoices() || []; } catch (e) {}
        if (vs.length) allVoices = [].slice.call(vs);
        populateVoiceSelect();
      }

      function labelFor(v) {
        var g = isFemale(v);
        var tag = g === true ? " (কণ্ঠ — স্ত্রী)" : g === false ? " (কণ্ঠ — পুরুষ)" : "";
        var n = isNeural(v) ? " ✦" : "";
        return v.name + " [" + (v.lang || "?") + "]" + tag + n;
      }

      function populateVoiceSelect() {
        var sel = $("ttsVoice");
        if (!sel) return;
        var cur = get("voice") || "auto";
        sel.innerHTML = "";
        var o = document.createElement("option");
        o.value = "auto";
        o.textContent = "স্বয়ংক্রিয় কণ্ঠ (প্রথমে বাংলা)";
        sel.appendChild(o);
        // Bengali first, then others; neural-preferred ordering within group
        var sorted = allVoices.slice().sort(function (a, b) {
          var ab = /^(bn|ben)/i.test(a.lang) ? 0 : 1, bb = /^(bn|ben)/i.test(b.lang) ? 0 : 1;
          if (ab !== bb) return ab - bb;
          return (isNeural(b) ? 1 : 0) - (isNeural(a) ? 1 : 0);
        });
        for (var i = 0; i < sorted.length; i++) {
          var opt = document.createElement("option");
          opt.value = encodeURIComponent(sorted[i].voiceURI);
          opt.textContent = labelFor(sorted[i]);
          sel.appendChild(opt);
        }
        sel.value = "auto";
        if (cur && cur !== "auto") { try { sel.value = cur; } catch (e) {} }
        if (sel.selectedIndex < 0) sel.value = "auto";
      }

      function findVoiceURI(uri) {
        for (var i = 0; i < allVoices.length; i++) if (encodeURIComponent(allVoices[i].voiceURI) === uri) return allVoices[i];
        return null;
      }

      // Choose a voice for a unit, honoring manual selection, perspective mode, and tone style.
      function perspectiveOn() {
        return !!($("ttsPerspective") && $("ttsPerspective").checked);
      }

      function pickVoice(unit) {
        var manual = $("ttsVoice") ? $("ttsVoice").value : "auto";
        if (manual && manual !== "auto") {
          var mv = findVoiceURI(manual);
          if (mv) {
            // In perspective mode, honor the requested *gender* and vary within that gender
            if (perspectiveOn() && unit && unit.part !== "N") {
              var wantFemale = isFemale(mv);
              var same = allVoices.filter(function (v) {
                return (/^(bn|ben)/i.test(v.lang || "")) && isFemale(v) === wantFemale;
              });
              if (same.length > 1) {
                var offset = unit.part === "A" ? 0 : unit.part === "B" ? (same.length > 1 ? 1 : 0) : (same.length > 2 ? 2 : same.length - 1);
                return same[Math.min(offset, same.length - 1)];
              }
            }
            return mv;
          }
        }
        if (!allVoices.length) return null;
        var bn = allVoices.filter(function (v) { return /^(bn|ben)/i.test(v.lang || ""); });
        var pool = bn.length ? bn : allVoices.filter(function (v) { return /^en/i.test(v.lang || ""); });
        if (!pool.length) pool = allVoices;

        function best(pred) { var m = pool.filter(pred); return m.length ? m[0] : null; }

        var perspOn = perspectiveOn();
        if (perspOn && unit) {
          // Part A (মানুষ): warm female if available, else any. Part B (কর্মকর্তা): measured male.
          // Part C (রাজনীতিবিদ): distinct male (second choice). Neutral: preferred default.
          if (unit.part === "A") return best(function (v) { return isFemale(v) === true; }) || best(function (v) { return isNeural(v); }) || pool[0];
          if (unit.part === "B") return best(function (v) { return isMale(v) === true; }) || pool[0];
          if (unit.part === "C") {
            var males = pool.filter(function (v) { return isMale(v) === true; });
            return males[1] || males[0] || pool[pool.length - 1];
          }
          return best(function (v) { return isNeural(v); }) || pool[0];
        }
        // Single-voice mode: prefer neural Bengali voice
        return best(function (v) { return isNeural(v); }) || pool[0];
      }

      // Tone presets: pitch/rate tuned per selected voice gender for a professional sound.
      function applyTone(u, unit) {
        var style = $("ttsStyle") ? $("ttsStyle").value : "natural";
        var base = parseFloat(($("ttsRate") && $("ttsRate").value) || "1");
        var female = isFemale(u.voice) === true;
        var pitch, rate;
        if (style === "authoritative") {
          pitch = female ? 0.85 : 0.72;   // lower, weightier
          rate = base * 0.92;             // slower = more authority
        } else if (style === "warm") {
          pitch = female ? 1.05 : 0.95;   // gentle, near natural
          rate = base * 0.95;
        } else {
          pitch = 1.0;
          rate = base;
        }
        if (unit) {
          if (unit.part === "C") pitch += 0.08;          // politician: slightly sharper/higher energy
          if (unit.part === "B") pitch -= 0.04;          // officer: flatter, measured
          if (/—\s*[“"]|বলে,|জিজ্ঞেস করে|বলল|ফিসফিস/.test(unit.text)) pitch += 0.05; // dialogue lift
        }
        u.pitch = Math.min(2, Math.max(0, pitch));
        u.rate = Math.min(2, Math.max(0.5, rate));
      }

      // Split long blocks at sentence boundaries so prosody resets naturally per sentence.
      function splitSentences(text) {
        if (text.length <= 220) return [text];
        var parts = text.split(/(?<=[।.!?…])\s+/);
        var out = [], buf = "";
        for (var i = 0; i < parts.length; i++) {
          if ((buf + " " + parts[i]).length > 220 && buf) { out.push(buf.trim()); buf = parts[i]; }
          else buf = (buf + " " + parts[i]).trim();
        }
        if (buf) out.push(buf);
        return out.length ? out : [text];
      }

      var lastMarked = -1;
      function mark(i) {
        if (i === lastMarked) return; // one sentence in a multi-sentence unit shouldn't re-scroll
        lastMarked = i;
        document.querySelectorAll(".speaking").forEach(function (n) { n.classList.remove("speaking"); });
        if (i < 0 || i >= units.length) return;
        units[i].el.classList.add("speaking");
        units[i].el.scrollIntoView({ behavior: "smooth", block: "center" });
        if (nowEl) nowEl.textContent = (units[i].chapter.dataset.title || "") + " · " + units[i].text.slice(0, 72);
      }

      function speakAt(i) {
        if (!units.length) return;
        if (i < 0) i = 0;
        if (i >= units.length) { stop(); toast("পাঠ শেষ"); return; }
        idx = i;
        synth.cancel();
        var unit = units[i];
        var sentences = splitSentences(unit.text);
        var voice = pickVoice(unit);
        var pending = true; // guard against onend firing after cancel()
        sentences.forEach(function (s, si) {
          var u = new SpeechSynthesisUtterance(s);
          u.lang = voice && /^bn/i.test(voice.lang) ? voice.lang : "bn-BD";
          if (voice) u.voice = voice;
          applyTone(u, unit);
          u.onstart = function () {
            if (pending) { pending = false; speaking = true; paused = false; mark(i); if (playBtn) playBtn.textContent = "❚❚"; }
          };
          u.onend = function () {
            if (!speaking) return;              // stopped/cancelled mid-unit
            if (si === sentences.length - 1) speakAt(idx + 1);
          };
          u.onerror = function () { speaking = false; if (playBtn) playBtn.textContent = "▶"; };
          synth.speak(u);
        });
      }

      function currentIndex() {
        var cur = null;
        for (var i = 0; i < chapters.length; i++) {
          if (chapters[i].getBoundingClientRect().top < 180) cur = chapters[i];
        }
        if (!cur) return 0;
        for (var j = 0; j < units.length; j++) if (units[j].chapter === cur) return j;
        return 0;
      }

      function play() {
        if (paused) { synth.resume(); paused = false; speaking = true; if (playBtn) playBtn.textContent = "❚❚"; requestWake(); return; }
        speakAt(speaking ? idx : currentIndex());
        requestWake();
      }
      function pause() { synth.pause(); paused = true; speaking = false; if (playBtn) playBtn.textContent = "▶"; }
      function stop() {
        speaking = false; paused = false; lastMarked = -1;
        synth.cancel();
        document.querySelectorAll(".speaking").forEach(function (n) { n.classList.remove("speaking"); });
        if (playBtn) playBtn.textContent = "▶";
        if (nowEl) nowEl.textContent = "শুনুন";
        releaseWake();
      }
      function toggle() { if (speaking && !paused) pause(); else play(); }
      function preview() {
        try { synth.cancel(); } catch (e) {}
        var fake = { text: "রাষ্ট্রকে দেখা তিন চোখে — এই বইয়ের তিনটি দৃষ্টিকোণ।", part: "N", chapter: { dataset: { title: "নমুনা" } }, el: document.body };
        var u = new SpeechSynthesisUtterance(fake.text);
        var v = pickVoice(fake);
        if (v) { u.voice = v; u.lang = /^bn/i.test(v.lang || "") ? v.lang : "bn-BD"; } else u.lang = "bn-BD";
        applyTone(u, fake);
        try { synth.speak(u); } catch (e) {}
      }
      function show() {
        open = true;
        if (bar) { bar.hidden = false; bar.classList.add("on"); }
        document.body.classList.add("tts-on");
      }
      function close() {
        open = false;
        stop();
        if (bar) bar.classList.remove("on");
        document.body.classList.remove("tts-on");
      }

      // Resume TTS after the page becomes visible again (e.g. after screen-off / lock).
      // Browsers pause SpeechSynthesis when the page is backgrounded or the screen locks;
      // we remember the desired state and resume automatically.
      var resumeOnVisible = false;
      addEventListener("visibilitychange", function () {
        if (!document.hidden) {
          if (resumeOnVisible && paused) {
            resumeOnVisible = false;
            try { synth.resume(); paused = false; speaking = true; if (playBtn) playBtn.textContent = "❚❚"; } catch (e) {}
          }
          refreshWake();
        } else {
          // Page hidden — system may pause synthesis. Mark that we want to resume.
          if (speaking && !paused) { resumeOnVisible = true; }
        }
      });

      if ($("ttsToggle")) $("ttsToggle").onclick = function () {
        if (open) close();
        else {
          show();
          if (!allVoices.length) refreshVoices(); // voices may load lazily on first user gesture
          play();
        }
      };
      if (playBtn) playBtn.onclick = toggle;
      if ($("ttsStop")) $("ttsStop").onclick = stop;
      if ($("ttsPrev")) $("ttsPrev").onclick = function () { speakAt(idx - 1); };
      if ($("ttsNext")) $("ttsNext").onclick = function () { speakAt(idx + 1); };
      if ($("ttsRate")) $("ttsRate").onchange = function () { set("rate", this.value); if (speaking) speakAt(idx); };
      if ($("ttsVoice")) $("ttsVoice").onchange = function () {
        set("voice", this.value);
        if (speaking) speakAt(idx); else preview();
      };
      if ($("ttsStyle")) $("ttsStyle").onchange = function () {
        set("style", this.value);
        if (speaking) speakAt(idx); else preview();
      };
      if ($("ttsPerspective")) $("ttsPerspective").onchange = function () {
        set("persp", this.checked ? "1" : "0");
        if (speaking) speakAt(idx);
      };
      if ($("ttsWake")) $("ttsWake").onchange = function () { setWake(this.checked); };
      // Restore saved settings
      try {
        if ($("ttsRate") && get("rate")) $("ttsRate").value = get("rate");
        if ($("ttsStyle") && get("style")) $("ttsStyle").value = get("style");
        if ($("ttsPerspective")) $("ttsPerspective").checked = get("persp") === "1";
        if ($("ttsWake")) $("ttsWake").checked = get("wake") === "1";
      } catch (e) {}
      synth.onvoiceschanged = refreshVoices;
      refreshVoices();
      addEventListener("beforeunload", stop);
      addEventListener("pagehide", function () { resumeOnVisible = false; });

      return { toggle: toggle, close: close, get open() { return open; } };
    })();
  } else if ($("ttsToggle")) {
    $("ttsToggle").onclick = function () { toast("এই ব্রাউজারে পাঠ্য পড়া সমর্থিত নয়"); };
  }
})();
