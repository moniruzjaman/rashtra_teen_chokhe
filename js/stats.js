(function () {
  var REPO = "moniruzjaman/rashtra_teen_chokhe";
  var HIT = "https://hits.sh/moniruzjaman.github.io/rashtra_teen_chokhe.json";
  var REL = "https://api.github.com/repos/" + REPO + "/releases/tags/ebook";
  var SNAP = "data/stats.json";
  var BN = "০১২৩৪৫৬৭৮৯";

  function $(id) { return document.getElementById(id); }
  function bn(n) {
    if (n == null || isNaN(n)) return "—";
    return String(Math.round(n)).replace(/\d/g, function (d) { return BN[d]; });
  }
  function setText(id, n) {
    var el = $(id);
    if (el) el.textContent = bn(n);
  }
  function getJson(url) {
    return fetch(url, { cache: "no-store" }).then(function (r) {
      return r.ok ? r.json() : null;
    }).catch(function () { return null; });
  }

  getJson(HIT).then(function (d) {
    if (d && typeof d.hits === "number") setText("statViews", d.hits);
  });

  getJson(REL).then(function (d) {
    if (!d || !d.assets) return;
    var n = 0;
    var map = {};
    d.assets.forEach(function (a) {
      n += a.download_count || 0;
      map[a.name] = a.browser_download_url;
    });
    setText("statDownloads", n);
    [].forEach.call(document.querySelectorAll("[data-asset]"), function (a) {
      var url = map[a.getAttribute("data-asset")];
      if (url) a.setAttribute("href", url);
    });
  });

  getJson(SNAP).then(function (d) {
    if (!d) return;
    if (typeof d.uniques_14d === "number") setText("statReaders", d.uniques_14d);
    var when = $("statUpdated");
    if (when && d.updated) {
      when.textContent = "GitHub Insights · শেষ হালনাগাদ " + d.updated.slice(0, 10);
    }
  });
})();
