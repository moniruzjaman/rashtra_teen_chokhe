/* ============================================================
   Analytics — Google Analytics 4 event tracking
   ID: G-1G0066NJN4
   Book: রাষ্ট্রকে দেখা তিন চোখে
   Tracks: page_view, chapter_read, reading_progress,
           tts_play, tts_pause, tts_complete,
           share_click, share_complete, share_modal_open,
           toc_open, toc_navigate,
           settings_open, theme_change, font_change,
           font_size_change, line_height_change,
           external_link, download_click
   ============================================================ */

(function () {
    const GA_ID = 'G-1G0066NJN4';

    // ── Load GA4 script ────────────────────────────────────────
    function loadGA() {
        const s = document.createElement('script');
        s.async = true;
        s.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA_ID;
        document.head.appendChild(s);

        window.dataLayer = window.dataLayer || [];
        window.gtag = function () {
            window.dataLayer.push(arguments);
        };
        window.gtag('js', new Date());

        window.gtag('config', GA_ID, {
            'page_title': document.title,
            'language': 'bn-BD',
            'anonymize_ip': true,
            'allow_google_signals': true,
            'send_page_view': true
        });

        console.log('%c📊 GA4 analytics loaded', 'color:#1b4d3e;font-weight:bold', GA_ID);
    }

    // ── Event tracking helpers ─────────────────────────────────
    const EBOOK_ANALYTICS = {
        GA_ID: GA_ID,
        loaded: false,
        lastProgress: {},

        init() {
            if (this.loaded) return;
            loadGA();
            this.loaded = true;
        },

        event(name, params = {}) {
            if (typeof window.gtag !== 'function') {
                console.warn('gtag not loaded yet, event queued:', name);
                return;
            }
            const clean = {};
            for (const [k, v] of Object.entries(params)) {
                if (v == null) continue;
                if (typeof v === 'object') v = JSON.stringify(v);
                clean[k] = v;
            }
            window.gtag('event', name, clean);
        },

        // ── Reader events ──────────────────────────────────────
        chapterRead(chapterId, chapterTitle) {
            this.event('chapter_read', {
                chapter_id: chapterId,
                chapter_title: chapterTitle,
                engagement_time_msec: 100
            });
        },

        readingProgress(chapterId, percent) {
            const milestones = [25, 50, 75, 100];
            const last = this.lastProgress[chapterId] || 0;
            for (const m of milestones) {
                if (percent >= m && last < m) {
                    this.event('reading_progress', {
                        chapter_id: chapterId,
                        progress_percent: m
                    });
                    this.lastProgress[chapterId] = m;
                    break;
                }
            }
        },

        // ── TTS events ─────────────────────────────────────────
        ttsPlay(chapterId, chapterTitle) {
            this.event('tts_play', {
                chapter_id: chapterId,
                chapter_title: chapterTitle
            });
        },

        ttsPause(chapterId) {
            this.event('tts_pause', { chapter_id: chapterId });
        },

        ttsComplete(chapterId) {
            this.event('tts_complete', { chapter_id: chapterId });
        },

        // ── Share events ───────────────────────────────────────
        shareModalOpen(chapterId) {
            this.event('share_modal_open', {
                chapter_id: chapterId || 'none'
            });
        },

        shareClick(platform, chapterId) {
            this.event('share_click', {
                platform: platform,
                chapter_id: chapterId || 'none'
            });
        },

        shareComplete(platform) {
            this.event('share_complete', { platform: platform });
        },

        // ── Navigation events ──────────────────────────────────
        tocOpen() {
            this.event('toc_open', {});
        },

        tocNavigate(chapterId) {
            this.event('toc_navigate', { chapter_id: chapterId });
        },

        // ── Settings events ────────────────────────────────────
        settingsOpen() {
            this.event('settings_open', {});
        },

        themeChange(theme) {
            this.event('theme_change', { theme: theme });
        },

        fontChange(font) {
            this.event('font_change', { font: font });
        },

        fontSizeChange(size) {
            this.event('font_size_change', { font_size: size });
        },

        lineHeightChange(height) {
            this.event('line_height_change', { line_height: height });
        },

        // ── Engagement events ──────────────────────────────────
        downloadClick(format) {
            this.event('download_click', { format: format });
        },

        externalLink(url) {
            this.event('external_link', { link_url: url });
        },

        readStart() {
            this.event('read_start', {});
        }
    };

    window.EBOOK_ANALYTICS = EBOOK_ANALYTICS;

    // Auto-init on DOMContentLoaded
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => EBOOK_ANALYTICS.init());
    } else {
        EBOOK_ANALYTICS.init();
    }
})();
