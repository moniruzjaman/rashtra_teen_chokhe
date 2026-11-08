/* ============================================================
   Reader's Journal — পাঠকের নোটবুক ও বুকমার্কিং
   রাষ্ট্রকে দেখা তিন চোখে — Bengali Ebook
   - প্রতিটি অধ্যায়ে ব্যক্তিগত ভাবনা ও পর্যালোচনা (localStorage)
   - অধ্যায় বুকমার্ক (সূচিপত্রে 🔖 চিহ্নসহ)
   - নোটবুক ড্রয়ার: তালিকা, এক ক্লিকে এক্সপোর্ট (TXT) বা কপি
   ============================================================ */

(function () {
    const JKEY = 'rtc-journal';     // { chapterId: { t: text, u: updatedISO } }
    const BKEY = 'rtc-bookmarks';   // [chapterId, ...]

    function load(key, fallback) {
        try {
            const v = localStorage.getItem(key);
            return v ? JSON.parse(v) : fallback;
        } catch (e) { return fallback; }
    }
    function save(key, val) {
        try {
            localStorage.setItem(key, JSON.stringify(val));
            return true;
        } catch (e) {
            toast('সংরক্ষণ ব্যর্থ — ব্রাউজার স্টোরেজ উপলব্ধ নয়');
            return false;
        }
    }
    let journal = load(JKEY, {});
    let bookmarks = load(BKEY, []);

    function toast(m) {
        const t = document.getElementById('toast');
        if (!t) return;
        t.textContent = m;
        t.classList.add('on');
        setTimeout(() => t.classList.remove('on'), 1800);
    }
    function track(name, params) {
        try {
            if (window.EBOOK_ANALYTICS && typeof window.EBOOK_ANALYTICS.event === 'function') {
                window.EBOOK_ANALYTICS.event(name, params || {});
            }
        } catch (e) { /* analytics must never break the journal */ }
    }
    function chapterTitle(ch) {
        return ch ? (ch.dataset.title || ch.id) : '';
    }
    function chapterLabel(ch) {
        const lab = ch ? ch.querySelector('.ch-label') : null;
        return lab ? lab.textContent.trim() : '';
    }
    function fmtDate(iso) {
        if (!iso) return '';
        try {
            return new Date(iso).toLocaleString('bn-BD', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });
        } catch (e) { return iso; }
    }

    /* ── Per-chapter journal UI ─────────────────────────────── */
    let saveTimers = {};

    function injectJournal(ch) {
        const id = ch.id;
        const box = document.createElement('div');
        box.className = 'rj-journal';
        const has = journal[id] && journal[id].t;
        box.innerHTML = `
  <div class="rj-journal-head">
    <span class="rj-journal-title">✎ আপনার ভাবনা ও পর্যালোচনা</span>
    <button class="rj-bmk-btn${bookmarks.indexOf(id) !== -1 ? ' on' : ''}" type="button" data-bmk="${id}" aria-pressed="${bookmarks.indexOf(id) !== -1 ? 'true' : 'false'}" title="এই অধ্যায় বুকমার্ক করুন">🔖 বুকমার্ক</button>
  </div>
  <textarea class="rj-note" data-note="${id}" rows="4" placeholder="এই অধ্যায় পড়ে আপনার অনুভূতি, প্রশ্ন বা পর্যালোচনা লিখুন… (শুধু আপনার ডিভাইসে সংরক্ষিত থাকবে)">${has ? journal[id].t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;') : ''}</textarea>
  <div class="rj-journal-foot">
    <button class="rj-save-btn" type="button" data-save="${id}">সংরক্ষণ করুন</button>
    <button class="rj-copy-one" type="button" data-copyone="${id}">এই নোট কপি</button>
    <span class="rj-state" data-state="${id}">${has ? '✓ সংরক্ষিত · ' + fmtDate(journal[id].u) : ''}</span>
  </div>`;

        const nav = ch.querySelector('.ch-nav');
        if (nav) ch.insertBefore(box, nav);
        else ch.appendChild(box);

        const ta = box.querySelector('.rj-note');
        ta.addEventListener('input', () => {
            const st = box.querySelector('.rj-state');
            st.textContent = 'লেখা হচ্ছে…';
            clearTimeout(saveTimers[id]);
            saveTimers[id] = setTimeout(() => saveNote(id, ta.value, st), 900);
        });
        ta.addEventListener('blur', () => {
            clearTimeout(saveTimers[id]);
            saveNote(id, ta.value, box.querySelector('.rj-state'), true);
        });
    }

    function saveNote(id, text, stEl, silent) {
        const val = (text || '').trim();
        if (!val) {
            if (journal[id]) { delete journal[id]; save(JKEY, journal); }
            if (stEl) stEl.textContent = val ? '' : '';
            refreshTOCMarkers();
            return;
        }
        journal[id] = { t: val, u: new Date().toISOString() };
        const ok = save(JKEY, journal);
        if (stEl) stEl.textContent = ok ? '✓ সংরক্ষিত · ' + fmtDate(journal[id].u) : '✗ সংরক্ষণ ব্যর্থ';
        if (!silent) toast(ok ? 'নোট সংরক্ষিত হয়েছে ✓' : 'সংরক্ষণ ব্যর্থ');
        track('journal_note_save', { chapter_id: id, chars: val.length });
    }

    /* ── Bookmarks ──────────────────────────────────────────── */
    function toggleBookmark(id, btn) {
        const i = bookmarks.indexOf(id);
        if (i === -1) bookmarks.push(id);
        else bookmarks.splice(i, 1);
        const ok = save(BKEY, bookmarks);
        document.querySelectorAll(`[data-bmk="${id}"]`).forEach(b => {
            b.classList.toggle('on', i === -1);
            b.setAttribute('aria-pressed', i === -1 ? 'true' : 'false');
        });
        if (ok) toast(i === -1 ? 'অধ্যায়টি বুকমার্ক হয়েছে 🔖' : 'বুকমার্ক সরানো হয়েছে');
        track('journal_bookmark', { chapter_id: id, action: i === -1 ? 'add' : 'remove' });
        refreshTOCMarkers();
        if (drawer && drawer.classList.contains('visible')) renderDrawerList();
    }

    function refreshTOCMarkers() {
        document.querySelectorAll('#toc li.rj-bmk').forEach(li => li.classList.remove('rj-bmk'));
        bookmarks.forEach(id => {
            const a = document.querySelector(`#toc a[data-id="${id}"]`);
            if (a) a.parentElement.classList.add('rj-bmk');
        });
    }

    /* ── Export / copy ──────────────────────────────────────── */
    function buildExportText() {
        const ids = [];
        Object.keys(journal).forEach(id => { if (ids.indexOf(id) === -1) ids.push(id); });
        bookmarks.forEach(id => { if (ids.indexOf(id) === -1) ids.push(id); });
        // sort by document order of chapters
        const order = [].map.call(document.querySelectorAll('article.chapter'), c => c.id);
        ids.sort((a, b) => order.indexOf(a) - order.indexOf(b));

        const lines = [];
        lines.push('রাষ্ট্রকে দেখা তিন চোখে — পাঠকের নোটবুক');
        lines.push('এক্সপোর্ট: ' + new Date().toLocaleString('bn-BD'));
        lines.push('────────────────────────────');
        let count = 0;
        ids.forEach(id => {
            const ch = document.getElementById(id);
            const head = (chapterLabel(ch) ? chapterLabel(ch) + ' — ' : '') + chapterTitle(ch) + (ch ? '' : id);
            lines.push('');
            lines.push('◆ ' + head);
            const note = journal[id] && journal[id].t;
            if (note) {
                lines.push('ভাবনা: ' + note);
                lines.push('(সর্বশেষ সম্পাদনা: ' + fmtDate(journal[id].u) + ')');
                count++;
            }
            if (bookmarks.indexOf(id) !== -1) lines.push('🔖 বুকমার্ক করা অধ্যায়');
        });
        if (!ids.length) return '';
        lines.push('');
        lines.push('────────────────────────────');
        lines.push('পড়ুন: https://moniruzjaman.github.io/rashtra_teen_chokhe/');
        return lines.join('\n');
    }

    function exportTXT() {
        const txt = buildExportText();
        if (!txt) { toast('এক্সপোর্ট করার মতো কিছু নেই'); return; }
        const blob = new Blob(['\ufeff' + txt], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'rtc-reader-journal-' + new Date().toISOString().slice(0, 10) + '.txt';
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 4000);
        toast('নোটবুক এক্সপোর্ট হচ্ছে…');
        track('journal_export', { notes: Object.keys(journal).length, bookmarks: bookmarks.length });
    }

    async function copyAll() {
        const txt = buildExportText();
        if (!txt) { toast('কপি করার মতো কিছু নেই'); return; }
        let ok = false;
        try {
            await navigator.clipboard.writeText(txt);
            ok = true;
        } catch (e) {
            const ta = document.createElement('textarea');
            ta.value = txt;
            ta.style.position = 'fixed';
            ta.style.opacity = '0';
            document.body.appendChild(ta);
            ta.select();
            try { ok = document.execCommand('copy'); } catch (_) {}
            ta.remove();
        }
        toast(ok ? 'সব নোট কপি হয়েছে ✓' : 'কপি করা যায়নি');
        if (ok) track('journal_copy', { notes: Object.keys(journal).length });
    }

    /* ── Drawer (নোটবুক প্যানেল) ─────────────────────────────── */
    let drawer = null;

    function buildDrawer() {
        const d = document.createElement('div');
        d.className = 'rj-drawer-overlay';
        d.id = 'rjDrawer';
        d.innerHTML = `
<aside class="rj-drawer" role="dialog" aria-modal="true" aria-label="পাঠকের নোটবুক">
  <div class="rj-drawer-head">
    <h2>📓 পাঠকের নোটবুক</h2>
    <button class="icon-btn rj-close" id="rjClose" aria-label="বন্ধ করুন">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
    </button>
  </div>
  <div class="rj-drawer-stats" id="rjStats"></div>
  <div class="rj-drawer-list" id="rjList"></div>
  <div class="rj-drawer-actions">
    <button class="rj-btn rj-primary" id="rjExport">
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
      এক্সপোর্ট (TXT)
    </button>
    <button class="rj-btn" id="rjCopyAll">
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
      সব কপি
    </button>
    <button class="rj-btn rj-danger" id="rjClear">সব মুছুন</button>
  </div>
  <p class="rj-drawer-foot">নোট ও বুকমার্ক শুধু আপনার ডিভাইসের localStorage-এ সংরক্ষিত থাকে — কোথাও পাঠানো হয় না।</p>
</aside>`;
        document.body.appendChild(d);

        d.querySelector('#rjClose').addEventListener('click', closeDrawer);
        d.addEventListener('click', (e) => { if (e.target === d) closeDrawer(); });
        d.querySelector('#rjExport').addEventListener('click', exportTXT);
        d.querySelector('#rjCopyAll').addEventListener('click', copyAll);
        d.querySelector('#rjClear').addEventListener('click', () => {
            if (!Object.keys(journal).length && !bookmarks.length) { toast('মুছার কিছু নেই'); return; }
            if (confirm('আপনার সব নোট ও বুকমার্ক মুছে ফেলা হবে। নিশ্চিত?')) {
                journal = {};
                bookmarks = [];
                save(JKEY, journal);
                save(BKEY, bookmarks);
                // clear textareas + buttons
                document.querySelectorAll('.rj-note').forEach(t => { t.value = ''; });
                document.querySelectorAll('.rj-bmk-btn.on').forEach(b => { b.classList.remove('on'); b.setAttribute('aria-pressed', 'false'); });
                document.querySelectorAll('.rj-state').forEach(s => { s.textContent = ''; });
                renderDrawerList();
                refreshTOCMarkers();
                toast('সব নোট ও বুকমার্ক মুছে ফেলা হয়েছে');
                track('journal_clear', {});
            }
        });
        return d;
    }

    function renderDrawerList() {
        const stats = drawer.querySelector('#rjStats');
        const list = drawer.querySelector('#rjList');
        const nNotes = Object.keys(journal).length;
        const nBmk = bookmarks.length;
        stats.textContent = `${nNotes}টি নোট · ${nBmk}টি বুকমার্ক`;

        const ids = [];
        Object.keys(journal).forEach(id => { if (ids.indexOf(id) === -1) ids.push(id); });
        bookmarks.forEach(id => { if (ids.indexOf(id) === -1) ids.push(id); });
        const order = [].map.call(document.querySelectorAll('article.chapter'), c => c.id);
        ids.sort((a, b) => order.indexOf(a) - order.indexOf(b));

        if (!ids.length) {
            list.innerHTML = `<div class="rj-empty">এখনো কোনো নোট বা বুকমার্ক নেই।<br>অধ্যায়ের নিচে “আপনার ভাবনা” লিখে সংরক্ষণ করুন, অথবা প্রিয় অধ্যায়টি 🔖 বুকমার্ক করুন।</div>`;
            return;
        }
        list.innerHTML = '';
        ids.forEach(id => {
            const ch = document.getElementById(id);
            const note = journal[id] && journal[id].t;
            const item = document.createElement('div');
            item.className = 'rj-item';
            item.innerHTML = `
  <div class="rj-item-main">
    <a href="#${id}" class="rj-item-title">${(chapterLabel(ch) ? chapterLabel(ch) + ' · ' : '') + chapterTitle(ch) || id}</a>
    ${note ? `<div class="rj-item-note">${note.slice(0, 120).replace(/&/g, '&amp;').replace(/</g, '&lt;')}${note.length > 120 ? '…' : ''}</div><div class="rj-item-date">${fmtDate(journal[id].u)}</div>` : ''}
    ${bookmarks.indexOf(id) !== -1 ? '<div class="rj-item-bmk">🔖 বুকমার্ক করা</div>' : ''}
  </div>
  <div class="rj-item-ops">
    ${note ? `<button type="button" data-copyone="${id}" title="এই নোট কপি">কপি</button>` : ''}
    <button type="button" data-del="${id}" title="মুছুন">✕</button>
  </div>`;
            list.appendChild(item);
        });

        list.querySelectorAll('a.rj-item-title').forEach(a => {
            a.addEventListener('click', () => closeDrawer());
        });
        list.querySelectorAll('[data-copyone]').forEach(b => {
            b.addEventListener('click', () => copyOne(b.dataset.copyone));
        });
        list.querySelectorAll('[data-del]').forEach(b => {
            b.addEventListener('click', () => {
                const id = b.dataset.del;
                delete journal[id];
                bookmarks = bookmarks.filter(x => x !== id);
                save(JKEY, journal);
                save(BKEY, bookmarks);
                const ta = document.querySelector(`.rj-note[data-note="${id}"]`);
                if (ta) { ta.value = ''; }
                const st = document.querySelector(`.rj-state[data-state="${id}"]`);
                if (st) st.textContent = '';
                const bb = document.querySelector(`.rj-bmk-btn[data-bmk="${id}"]`);
                if (bb) { bb.classList.remove('on'); bb.setAttribute('aria-pressed', 'false'); }
                renderDrawerList();
                refreshTOCMarkers();
                toast('মুছে ফেলা হয়েছে');
            });
        });
    }

    async function copyOne(id) {
        const note = journal[id] && journal[id].t;
        if (!note) return;
        const ch = document.getElementById(id);
        const txt = `【${(chapterLabel(ch) ? chapterLabel(ch) + ' — ' : '') + chapterTitle(ch)}】\n${note}\n— রাষ্ট্রকে দেখা তিন চোখে`;
        let ok = false;
        try {
            await navigator.clipboard.writeText(txt);
            ok = true;
        } catch (e) {
            const ta = document.createElement('textarea');
            ta.value = txt;
            ta.style.position = 'fixed';
            ta.style.opacity = '0';
            document.body.appendChild(ta);
            ta.select();
            try { ok = document.execCommand('copy'); } catch (_) {}
            ta.remove();
        }
        toast(ok ? 'নোট কপি হয়েছে ✓' : 'কপি করা যায়নি');
        if (ok) track('journal_note_copy', { chapter_id: id });
    }

    function openDrawer() {
        if (!drawer) drawer = buildDrawer();
        renderDrawerList();
        drawer.classList.add('visible');
        document.body.style.overflow = 'hidden';
        track('journal_drawer_open', { notes: Object.keys(journal).length, bookmarks: bookmarks.length });
    }
    function closeDrawer() {
        if (drawer) {
            drawer.classList.remove('visible');
            document.body.style.overflow = '';
        }
    }

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && drawer && drawer.classList.contains('visible')) closeDrawer();
    });

    // Global clicks (bookmark / save / copy-one)
    document.addEventListener('click', (e) => {
        const bmk = e.target.closest('[data-bmk]');
        if (bmk) { toggleBookmark(bmk.dataset.bmk, bmk); return; }
        const sv = e.target.closest('[data-save]');
        if (sv) {
            const id = sv.dataset.save;
            const ta = document.querySelector(`.rj-note[data-note="${id}"]`);
            if (ta) saveNote(id, ta.value, document.querySelector(`.rj-state[data-state="${id}"]`), false);
            return;
        }
        const cp = e.target.closest('.rj-copy-one');
        if (cp && cp.dataset.copyone) { copyOne(cp.dataset.copyone); return; }
    });

    /* ── Init ───────────────────────────────────────────────── */
    function init() {
        document.querySelectorAll('article.chapter').forEach(injectJournal);
        refreshTOCMarkers();
        const btn = document.getElementById('journalBtn');
        if (btn) btn.addEventListener('click', openDrawer);
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
    else init();

    window.EBOOK_JOURNAL = { openDrawer, exportTXT, copyAll };
})();
