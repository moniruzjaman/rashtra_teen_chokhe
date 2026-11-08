/* ============================================================
   Quote Card — তাৎক্ষণিক টাইপোগ্রাফিক উক্তি কার্ড (1200×675 PNG)
   রাষ্ট্রকে দেখা তিন চোখে — Bengali Ebook
   - যেকোনো উক্তি/অনুচ্ছেদ সিলেক্ট করে কার্ড তৈরি
   - ৫টি থিম: গাঢ় সবুজ, সোনালি নথি, রক্তিম সংস্কার, ক্রিম কাগজ, অমাবস্যার রাত
   - PNG ডাউনলোড, টেক্সট কপি, WhatsApp / Facebook / X / Telegram শেয়ার
   ============================================================ */

(function () {
    const W = 1200, H = 675;
    const SITE = 'moniruzjaman.github.io/rashtra_teen_chokhe';
    const BOOK = 'রাষ্ট্রকে দেখা তিন চোখে';
    const AUTHOR = 'মনিরুজ্জামান';
    const MAX_CHARS = 480;
    const SITE_URL = 'https://' + SITE + '/read.html';

    const THEMES = [
        { id: 'dark-green', name: 'গাঢ় সবুজ', bg: ['#112f25', '#1e5a47'], ink: '#f3efe3', accent: '#d4b06a', mute: 'rgba(243,239,227,0.72)', frame: 'rgba(212,176,106,0.6)', quoteGlyph: 'rgba(212,176,106,0.28)' },
        { id: 'golden-doc', name: 'সোনালি নথি', bg: ['#f4e6c4', '#e7cf9d'], ink: '#3a2c16', accent: '#8a5a1e', mute: 'rgba(58,44,22,0.66)', frame: 'rgba(138,90,30,0.55)', quoteGlyph: 'rgba(138,90,30,0.25)' },
        { id: 'crimson', name: 'রক্তিম সংস্কার', bg: ['#380d0d', '#7c1a1a'], ink: '#f9efe6', accent: '#e9c39a', mute: 'rgba(249,239,230,0.72)', frame: 'rgba(233,195,154,0.55)', quoteGlyph: 'rgba(233,195,154,0.26)' },
        { id: 'cream-paper', name: 'ক্রিম কাগজ', bg: ['#faf5ea', '#ece2cc'], ink: '#221e17', accent: '#8b1e1e', mute: 'rgba(34,30,23,0.62)', frame: 'rgba(27,77,62,0.5)', quoteGlyph: 'rgba(139,30,30,0.16)' },
        { id: 'moonless', name: 'অমাবস্যার রাত', bg: ['#0a0c11', '#191d29'], ink: '#e8e6df', accent: '#a8b8d8', mute: 'rgba(232,230,223,0.68)', frame: 'rgba(168,184,216,0.45)', quoteGlyph: 'rgba(168,184,216,0.22)' }
    ];

    let state = { text: '', chapter: null, theme: THEMES[0] };
    let modal = null, canvas = null, lastFile = null;

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
        } catch (e) { /* analytics must never break the card */ }
    }

    /* ── Selection popup ("কার্ড বানান") ─────────────────────── */
    let popup = null, popupTimer = null;

    function selectionInfo() {
        const sel = window.getSelection();
        if (!sel || sel.isCollapsed || !sel.rangeCount) return null;
        const text = (sel.toString() || '').replace(/\s+/g, ' ').trim();
        if (text.length < 2) return null;
        const node = sel.getRangeAt(0).commonAncestorContainer;
        const el = node.nodeType === 3 ? node.parentElement : node;
        if (!el || !el.closest) return null;
        if (el.closest('textarea, input, select, #toast')) return null;
        if (!el.closest('main.reader')) return null;
        const ch = el.closest('article.chapter');
        return {
            text: text.length > MAX_CHARS ? text.slice(0, MAX_CHARS).replace(/\s+\S*$/, '') + '…' : text,
            chapter: ch ? { id: ch.id, title: ch.dataset.title || '' } : null
        };
    }

    function hidePopup() {
        if (popup) popup.classList.remove('on');
    }

    function showPopup(rect) {
        if (!popup) {
            popup = document.createElement('div');
            popup.id = 'qcPopup';
            popup.setAttribute('role', 'button');
            popup.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg> কার্ড বানান';
            popup.addEventListener('mousedown', (e) => e.preventDefault()); // keep selection intact
            popup.addEventListener('click', () => {
                const info = selectionInfo();
                hidePopup();
                if (info) open(info.text, info.chapter);
            });
            document.body.appendChild(popup);
        }
        const top = Math.max(60, rect.top - 44 + window.scrollY);
        const left = Math.min(Math.max(8, rect.left + rect.width / 2 - 62), window.innerWidth - 132);
        popup.style.top = top + 'px';
        popup.style.left = left + 'px';
        popup.classList.add('on');
    }

    document.addEventListener('pointerup', (e) => {
        clearTimeout(popupTimer);
        popupTimer = setTimeout(() => {
            if (e.target.closest && e.target.closest('#qcPopup, .qc-modal')) return;
            const info = selectionInfo();
            if (!info) { hidePopup(); return; }
            const sel = window.getSelection();
            showPopup(sel.getRangeAt(0).getBoundingClientRect());
        }, 60);
    });
    document.addEventListener('scroll', hidePopup, { passive: true });

    /* ── Canvas rendering ───────────────────────────────────── */
    async function ensureFonts() {
        if (!document.fonts || !document.fonts.load) return;
        try {
            await Promise.all([
                document.fonts.load('600 48px "Noto Serif Bengali"'),
                document.fonts.load('700 24px "Noto Sans Bengali"'),
                document.fonts.load('400 20px "Noto Sans Bengali"')
            ]);
            await document.fonts.ready;
        } catch (e) { /* fall back to whatever is available */ }
    }

    function wrapLines(ctx, text, maxWidth) {
        const words = text.split(' ');
        const lines = [];
        let line = '';
        for (let i = 0; i < words.length; i++) {
            const test = line ? line + ' ' + words[i] : words[i];
            if (ctx.measureText(test).width <= maxWidth || !line) {
                line = test;
            } else {
                lines.push(line);
                line = words[i];
            }
        }
        if (line) lines.push(line);
        // Very long single words (rare) — hard break
        for (let i = 0; i < lines.length; i++) {
            while (ctx.measureText(lines[i]).width > maxWidth && lines[i].length > 4) {
                let cut = lines[i].length - 1;
                while (cut > 1 && ctx.measureText(lines[i].slice(0, cut)).width > maxWidth) cut--;
                lines.splice(i, 1, lines[i].slice(0, cut), lines[i].slice(cut));
            }
        }
        return lines;
    }

    function layoutQuote(ctx, text, theme) {
        const maxW = 960;
        let size = 56;
        const minSize = 26, lineHeight = 1.62;
        while (size >= minSize) {
            ctx.font = `600 ${size}px "Noto Serif Bengali", serif`;
            const lines = wrapLines(ctx, text, maxW);
            const blockH = lines.length * size * lineHeight;
            if (blockH <= 340) return { size, lines, lineH: size * lineHeight };
            size -= 2;
        }
        ctx.font = `600 ${minSize}px "Noto Serif Bengali", serif`;
        const lineH = minSize * lineHeight;
        const maxLines = Math.floor(340 / lineH);
        const lines = wrapLines(ctx, text, maxW).slice(0, maxLines);
        lines[lines.length - 1] = lines[lines.length - 1].replace(/\s*\S*$/, '') + '…';
        return { size: minSize, lines, lineH };
    }

    function diamond(ctx, x, y, r) {
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(Math.PI / 4);
        ctx.fillRect(-r, -r, r * 2, r * 2);
        ctx.restore();
    }

    function draw() {
        if (!canvas) return;
        const t = state.theme;
        const ctx = canvas.getContext('2d');

        // Background
        const g = ctx.createLinearGradient(0, 0, 0, H);
        g.addColorStop(0, t.bg[0]);
        g.addColorStop(1, t.bg[1]);
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, W, H);

        // Double frame
        ctx.strokeStyle = t.frame;
        ctx.lineWidth = 2;
        ctx.strokeRect(30, 30, W - 60, H - 60);
        ctx.lineWidth = 1;
        ctx.strokeRect(42, 42, W - 84, H - 84);
        ctx.fillStyle = t.accent;
        [[30, 30], [W - 30, 30], [30, H - 30], [W - 30, H - 30]].forEach(([x, y]) => diamond(ctx, x, y, 4.5));

        // Kicker — book title with side rules
        ctx.fillStyle = t.accent;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.font = `700 23px "Noto Sans Bengali", sans-serif`;
        ctx.fillText(BOOK, W / 2, 106);
        ctx.strokeStyle = t.frame;
        ctx.beginPath();
        ctx.moveTo(W / 2 - 330, 106); ctx.lineTo(W / 2 - 190, 106);
        ctx.moveTo(W / 2 + 190, 106); ctx.lineTo(W / 2 + 330, 106);
        ctx.stroke();

        // Large decorative quote glyph
        ctx.fillStyle = t.quoteGlyph;
        ctx.font = `700 150px "Noto Serif Bengali", serif`;
        ctx.fillText('“', W / 2, 205);

        // Quote text
        const lay = layoutQuote(ctx, state.text, t);
        ctx.font = `600 ${lay.size}px "Noto Serif Bengali", serif`;
        ctx.fillStyle = t.ink;
        const startY = 300 - (lay.lines.length - 1) * lay.lineH / 2;
        lay.lines.forEach((ln, i) => ctx.fillText(ln, W / 2, startY + i * lay.lineH));

        // Attribution
        ctx.font = `700 26px "Noto Sans Bengali", sans-serif`;
        ctx.fillStyle = t.accent;
        const who = state.chapter && state.chapter.title
            ? `— ${state.chapter.title}`
            : `— ${BOOK}`;
        ctx.fillText(who, W / 2, H - 118);

        ctx.font = `400 19px "Noto Sans Bengali", sans-serif`;
        ctx.fillStyle = t.mute;
        ctx.fillText(`${AUTHOR} · ${SITE}`, W / 2, H - 76);
    }

    async function render() {
        await ensureFonts();
        draw();
    }

    /* ── Modal ──────────────────────────────────────────────── */
    function buildModal() {
        const m = document.createElement('div');
        m.className = 'qc-modal';
        m.id = 'qcModal';
        m.innerHTML = `
<div class="qc-box" role="dialog" aria-modal="true" aria-label="উক্তি কার্ড তৈরি">
  <div class="qc-head">
    <h2>উক্তি কার্ড <span class="qc-dim">· 1200×675</span></h2>
    <button class="icon-btn qc-close" id="qcClose" aria-label="বন্ধ করুন">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
    </button>
  </div>
  <div class="qc-canvas-wrap"><canvas id="qcCanvas" width="${W}" height="${H}"></canvas></div>
  <div class="qc-themes" id="qcThemes" role="tablist" aria-label="কার্ডের থিম"></div>
  <div class="qc-actions">
    <button class="qc-btn qc-primary" id="qcDownload">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
      PNG ডাউনলোড
    </button>
    <button class="qc-btn" id="qcCopy">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
      টেক্সট কপি
    </button>
    <button class="qc-btn" id="qcNative" hidden>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg>
      ইমেজসহ শেয়ার
    </button>
  </div>
  <div class="qc-share-row" aria-label="সোশ্যাল শেয়ার">
    <button class="qc-share qc-wa" data-p="whatsapp" aria-label="WhatsApp-এ শেয়ার করুন" title="WhatsApp">
      <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/></svg>
      <span>WhatsApp</span>
    </button>
    <button class="qc-share qc-fb" data-p="facebook" aria-label="Facebook-এ শেয়ার করুন" title="Facebook">
      <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
      <span>Facebook</span>
    </button>
    <button class="qc-share qc-x" data-p="x" aria-label="X-এ শেয়ার করুন" title="X / Twitter">
      <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
      <span>X</span>
    </button>
    <button class="qc-share qc-tg" data-p="telegram" aria-label="Telegram-এ শেয়ার করুন" title="Telegram">
      <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>
      <span>Telegram</span>
    </button>
  </div>
  <p class="qc-hint">কার্ডের ছবি ডাউনলোড করে যেকোনো অ্যাপে পোস্ট করতে পারেন; শেয়ার বাটনে উক্তি ও বইয়ের লিংক যুক্ত হবে।</p>
</div>`;
        document.body.appendChild(m);

        // Theme chips
        const wrap = m.querySelector('#qcThemes');
        THEMES.forEach(th => {
            const b = document.createElement('button');
            b.className = 'qc-chip';
            b.dataset.id = th.id;
            b.setAttribute('role', 'tab');
            b.innerHTML = `<span class="qc-dot" style="background:linear-gradient(135deg, ${th.bg[0]}, ${th.bg[1]})"></span>${th.name}`;
            b.addEventListener('click', () => {
                state.theme = THEMES.find(x => x.id === th.id);
                wrap.querySelectorAll('.qc-chip').forEach(c => c.classList.toggle('on', c.dataset.id === th.id));
                render();
                track('quote_card_theme', { theme: th.id });
            });
            wrap.appendChild(b);
        });

        m.querySelector('#qcClose').addEventListener('click', close);
        m.addEventListener('click', (e) => { if (e.target === m) close(); });

        m.querySelector('#qcDownload').addEventListener('click', downloadPNG);
        m.querySelector('#qcCopy').addEventListener('click', copyText);
        m.querySelector('#qcNative').addEventListener('click', nativeShare);
        m.querySelectorAll('.qc-share').forEach(btn => {
            btn.addEventListener('click', () => shareTo(btn.dataset.p));
        });

        return m;
    }

    /* ── Actions ────────────────────────────────────────────── */
    function fileName() {
        const d = new Date().toISOString().slice(0, 10);
        return `rtc-quote-card-${state.theme ? state.theme.id : 'card'}-${d}.png`;
    }

    function shareMessage() {
        const ch = state.chapter && state.chapter.title ? ` (${state.chapter.title})` : '';
        return `“${state.text}”\n— ${BOOK}${ch}\n\n${SITE_URL}`;
    }

    function downloadPNG() {
        if (!canvas) return;
        canvas.toBlob((blob) => {
            if (!blob) { toast('কার্ড তৈরি ব্যর্থ হয়েছে'); return; }
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = fileName();
            document.body.appendChild(a);
            a.click();
            a.remove();
            setTimeout(() => URL.revokeObjectURL(url), 4000);
            toast('PNG ডাউনলোড হচ্ছে…');
            track('quote_card_download', { theme: state.theme.id, chapter_id: state.chapter ? state.chapter.id : null });
        }, 'image/png');
    }

    async function copyText() {
        const msg = shareMessage();
        let ok = false;
        try {
            await navigator.clipboard.writeText(msg);
            ok = true;
        } catch (e) {
            const ta = document.createElement('textarea');
            ta.value = msg;
            ta.style.position = 'fixed';
            ta.style.opacity = '0';
            document.body.appendChild(ta);
            ta.select();
            try { ok = document.execCommand('copy'); } catch (_) {}
            ta.remove();
        }
        toast(ok ? 'উক্তি কপি হয়েছে' : 'কপি করা যায়নি');
        if (ok) track('quote_card_copy', { chapter_id: state.chapter ? state.chapter.id : null });
    }

    function shareTo(platform) {
        const q = encodeURIComponent(`“${state.text}”\n— ${BOOK}`);
        const full = encodeURIComponent(shareMessage());
        const u = encodeURIComponent(SITE_URL);
        const map = {
            whatsapp: `https://wa.me/?text=${full}`,
            facebook: `https://www.facebook.com/sharer/sharer.php?u=${u}&quote=${encodeURIComponent(state.text + '\n— ' + BOOK)}`,
            x: `https://twitter.com/intent/tweet?text=${q}&url=${u}`,
            telegram: `https://t.me/share/url?url=${u}&text=${q}`
        };
        const link = map[platform];
        if (!link) return;
        window.open(link, '_blank', 'noopener,width=640,height=560');
        track('quote_card_share', { platform, chapter_id: state.chapter ? state.chapter.id : null });
    }

    async function nativeShare() {
        if (!lastFile || !navigator.share) return;
        try {
            await navigator.share({
                title: BOOK,
                text: `“${state.text}”\n— ${BOOK}`,
                files: [lastFile]
            });
            track('quote_card_share', { platform: 'native', chapter_id: state.chapter ? state.chapter.id : null });
        } catch (e) { /* user cancelled */ }
    }

    /* ── Open / close ───────────────────────────────────────── */
    async function open(text, chapter) {
        if (!modal) modal = buildModal();
        canvas = modal.querySelector('#qcCanvas');
        state = { text: text, chapter: chapter, theme: state.theme || THEMES[0] };
        modal.querySelectorAll('.qc-chip').forEach(c => c.classList.toggle('on', c.dataset.id === state.theme.id));
        modal.classList.add('visible');
        document.body.style.overflow = 'hidden';
        await render();

        // "ইমেজসহ শেয়ার" — only when the browser can share files
        const nativeBtn = modal.querySelector('#qcNative');
        lastFile = null;
        try {
            const blob = await new Promise(r => canvas.toBlob(r, 'image/png'));
            if (blob) {
                lastFile = new File([blob], fileName(), { type: 'image/png' });
                nativeBtn.hidden = !(navigator.canShare && navigator.canShare({ files: [lastFile] }));
            }
        } catch (e) { nativeBtn.hidden = true; }

        track('quote_card_open', { chapter_id: chapter ? chapter.id : null });
    }

    function close() {
        if (modal) {
            modal.classList.remove('visible');
            document.body.style.overflow = '';
        }
        hidePopup();
    }

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal && modal.classList.contains('visible')) close();
    });

    // One-time discovery hint
    try {
        if (!localStorage.getItem('rtc-qhint')) {
            localStorage.setItem('rtc-qhint', '1');
            setTimeout(() => toast('ঝলমলে উক্তি পেলে সিলেক্ট করুন — “কার্ড বানান”-এ ক্লিক করলেই ছবি ✨'), 4000);
        }
    } catch (e) {}

    window.EBOOK_QUOTE_CARD = { open, close };
})();
