/* ============================================================
   Settings Panel — slide-out reader settings
   রাষ্ট্রকে দেখা তিন চোখে
   Provides: theme (day/sepia/dark), font family (serif/sans),
             font size slider, line height slider
   Persisted in localStorage. Sits on top of existing ebook.js
   ============================================================ */

(function () {
    const STORAGE_KEY = 'rashtra-reader-settings';
    const DEFAULTS = {
        theme: 'auto',       // 'auto' | 'sepia' | 'dark'
        fontFamily: 'serif', // 'serif' | 'sans'
        fontSize: 18,        // px, range 14-26
        lineHeight: 1.95,    // range 1.4-2.4
    };

    const settings = Object.assign({}, DEFAULTS, loadSettings());

    function loadSettings() {
        try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'); }
        catch (_) { return {}; }
    }
    function saveSettings() {
        try { localStorage.setItem(STORAGE_KEY, JSON.stringify(settings)); }
        catch (_) {}
    }

    function applyTheme(theme) {
        if (theme === 'auto') {
            document.documentElement.removeAttribute('data-theme');
        } else {
            document.documentElement.setAttribute('data-theme', theme);
        }
    }
    function applyFontFamily(family) {
        document.body.classList.remove('font-serif', 'font-sans');
        document.body.classList.add(family === 'sans' ? 'font-sans' : 'font-serif');
    }
    function applyFontSize(px) {
        document.documentElement.style.setProperty('--fs', px + 'px');
        document.documentElement.style.setProperty('font-size', (px / 16) + 'rem');
        // Also update body font-size directly for browsers that don't honor rem on body
        document.body.style.fontSize = px + 'px';
    }
    function applyLineHeight(lh) {
        document.body.style.lineHeight = String(lh);
    }

    function applyAll() {
        applyTheme(settings.theme);
        applyFontFamily(settings.fontFamily);
        applyFontSize(settings.fontSize);
        applyLineHeight(settings.lineHeight);
    }

    /* ── Build the settings panel DOM ───────────────────────── */
    function buildPanel() {
        const p = document.createElement('aside');
        p.className = 'settings-panel';
        p.id = 'settingsPanel';
        p.setAttribute('aria-label', 'পড়ার সেটিংস');
        p.innerHTML = `
<div class="settings-header">
  <h2 class="settings-title">পড়ার সেটিংস</h2>
  <button class="icon-btn settings-close" id="btnCloseSettings" aria-label="বন্ধ করুন">
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
  </button>
</div>

<div class="settings-section">
  <label class="settings-label">পড়ার থিম</label>
  <div class="theme-grid">
    <button class="theme-btn" data-theme="auto">
      <span class="theme-swatch theme-swatch-auto"></span>
      <span>স্বয়ংক্রিয়</span>
    </button>
    <button class="theme-btn" data-theme="sepia">
      <span class="theme-swatch theme-swatch-sepia"></span>
      <span>সেপিয়া</span>
    </button>
    <button class="theme-btn" data-theme="dark">
      <span class="theme-swatch theme-swatch-dark"></span>
      <span>রাত</span>
    </button>
  </div>
</div>

<div class="settings-section">
  <label class="settings-label">ফন্ট পরিবার</label>
  <div class="font-grid">
    <button class="font-btn" data-font="serif">
      <span style="font-family: var(--serif)">সেরিফ — Noto Serif Bengali</span>
    </button>
    <button class="font-btn" data-font="sans">
      <span style="font-family: var(--sans)">স্যান্স — Noto Sans Bengali</span>
    </button>
  </div>
</div>

<div class="settings-section">
  <label class="settings-label">ফন্টের আকার <span class="settings-value" id="fontSizeValue">${settings.fontSize}px</span></label>
  <div class="settings-row">
    <span class="settings-end">অ</span>
    <input type="range" min="14" max="26" value="${settings.fontSize}" id="fontSizeRange" class="settings-range">
    <span class="settings-end" style="font-size:22px">অ</span>
  </div>
</div>

<div class="settings-section">
  <label class="settings-label">লাইনের উচ্চতা <span class="settings-value" id="lineHeightValue">${settings.lineHeight.toFixed(2)}</span></label>
  <div class="settings-row">
    <span class="settings-end" style="line-height:1.4">↕</span>
    <input type="range" min="140" max="240" value="${Math.round(settings.lineHeight * 100)}" id="lineHeightRange" class="settings-range">
    <span class="settings-end" style="line-height:2.4">↕</span>
  </div>
</div>

<div class="settings-section">
  <button class="btn-reset" id="btnResetSettings">ডিফল্টে ফেরত</button>
</div>

<div class="settings-section settings-shortcuts">
  <label class="settings-label">কীবোর্ড শর্টকাট</label>
  <ul class="shortcuts-list">
    <li><kbd>M</kbd> সূচিপত্র</li>
    <li><kbd>S</kbd> সেটিংস</li>
    <li><kbd>T</kbd> শুনুন (TTS)</li>
    <li><kbd>Esc</kbd> বন্ধ</li>
  </ul>
</div>
`;
        document.body.appendChild(p);

        // Build overlay
        const overlay = document.createElement('div');
        overlay.className = 'settings-overlay';
        overlay.id = 'settingsOverlay';
        document.body.appendChild(overlay);

        // Wire close
        p.querySelector('#btnCloseSettings').onclick = () => SETTINGS_PANEL.close();
        overlay.onclick = () => SETTINGS_PANEL.close();

        // Theme buttons
        p.querySelectorAll('.theme-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                settings.theme = btn.dataset.theme;
                applyTheme(settings.theme);
                saveSettings();
                updateActiveButtons();
            });
        });

        // Font buttons
        p.querySelectorAll('.font-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                settings.fontFamily = btn.dataset.font;
                applyFontFamily(settings.fontFamily);
                saveSettings();
                updateActiveButtons();
            });
        });

        // Font size slider
        const fsRange = p.querySelector('#fontSizeRange');
        const fsValue = p.querySelector('#fontSizeValue');
        let fsDebounce;
        fsRange.addEventListener('input', (e) => {
            const v = parseInt(e.target.value, 10);
            settings.fontSize = v;
            applyFontSize(v);
            fsValue.textContent = v + 'px';
            clearTimeout(fsDebounce);
            fsDebounce = setTimeout(saveSettings, 400);
        });

        // Line height slider
        const lhRange = p.querySelector('#lineHeightRange');
        const lhValue = p.querySelector('#lineHeightValue');
        let lhDebounce;
        lhRange.addEventListener('input', (e) => {
            const v = parseInt(e.target.value, 10) / 100;
            settings.lineHeight = v;
            applyLineHeight(v);
            lhValue.textContent = v.toFixed(2);
            clearTimeout(lhDebounce);
            lhDebounce = setTimeout(saveSettings, 400);
        });

        // Reset
        p.querySelector('#btnResetSettings').onclick = () => {
            Object.assign(settings, DEFAULTS);
            applyAll();
            saveSettings();
            updateActiveButtons();
            // Sync slider values
            fsRange.value = settings.fontSize;
            fsValue.textContent = settings.fontSize + 'px';
            lhRange.value = Math.round(settings.lineHeight * 100);
            lhValue.textContent = settings.lineHeight.toFixed(2);
        };

        updateActiveButtons();
        return p;
    }

    function updateActiveButtons() {
        const p = document.getElementById('settingsPanel');
        if (!p) return;
        p.querySelectorAll('.theme-btn').forEach(b => {
            b.classList.toggle('active', b.dataset.theme === settings.theme);
        });
        p.querySelectorAll('.font-btn').forEach(b => {
            b.classList.toggle('active', b.dataset.font === settings.fontFamily);
        });
    }

    const SETTINGS_PANEL = {
        panel: null,
        overlay: null,
        open() {
            if (!this.panel) {
                this.panel = buildPanel();
                this.overlay = document.getElementById('settingsOverlay');
            }
            this.panel.classList.add('open');
            this.overlay.classList.add('visible');
            document.body.style.overflow = 'hidden';
        },
        close() {
            if (this.panel) {
                this.panel.classList.remove('open');
                this.overlay.classList.remove('visible');
                document.body.style.overflow = '';
            }
        },
        toggle() {
            if (this.panel && this.panel.classList.contains('open')) this.close();
            else this.open();
        }
    };

    // Expose
    window.EBOOK_SETTINGS_PANEL = SETTINGS_PANEL;
    window.EBOOK_SETTINGS = settings;

    // Apply settings on load
    applyAll();

    // Close on Escape
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') SETTINGS_PANEL.close();
    });

    // Auto-attach to settings button(s) — replace existing theme button if present
    document.addEventListener('DOMContentLoaded', () => {
        // Add a new dedicated settings button to the header (after #theme button)
        const headerActions = document.querySelector('.bar-actions');
        if (headerActions) {
            // Insert a settings gear button BEFORE the theme button (so theme stays for quick toggle)
            const themeBtn = document.getElementById('theme');
            if (themeBtn && !document.getElementById('settingsBtn')) {
                const settingsBtn = document.createElement('button');
                settingsBtn.className = 'icon-btn';
                settingsBtn.id = 'settingsBtn';
                settingsBtn.setAttribute('aria-label', 'সেটিংস');
                settingsBtn.setAttribute('title', 'পড়ার সেটিংস');
                settingsBtn.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>`;
                settingsBtn.onclick = (e) => { e.preventDefault(); SETTINGS_PANEL.toggle(); };
                themeBtn.parentNode.insertBefore(settingsBtn, themeBtn);
            }
        }

        // Keyboard shortcut: S = settings
        document.addEventListener('keydown', (e) => {
            if (e.target.matches('input, textarea, select')) return;
            if (e.key === 's' || e.key === 'S') {
                e.preventDefault();
                SETTINGS_PANEL.toggle();
            }
        });
    });
})();
