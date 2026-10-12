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
  if ($("share")) $("share").onclick = function () {
    var u = location.href.split("#")[0];
    var d = { title: "রাষ্ট্রকে দেখা তিন চোখে", text: "একটি রাষ্ট্রের গল্প—তিন চোখে", url: u };
    if (navigator.share) navigator.share(d).catch(function () {});
    else if (navigator.clipboard) navigator.clipboard.writeText(u).then(function () { toast("লিংক কপি হয়েছে"); });
    else toast(u);
  };
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
    if (e.key === "Escape") tog(false);
    if (e.target && (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA")) return;
    if (e.key === "/" && toc) { e.preventDefault(); tog(true); if (search) search.focus(); }
  });
})();
