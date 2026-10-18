/* ============================================================
   Share Modal — cross-platform sharing with rich previews
   রাষ্ট্রকে দেখা তিন চোখে — Bengali Ebook
   Platforms: WhatsApp, Messenger, Facebook, LinkedIn, X/Twitter,
              Email, Telegram, Copy link, Native Web Share API
   ============================================================ */

(function () {
    const SHARE = {
        url:   'https://moniruzjaman.github.io/rashtra_teen_chokhe/',
        title: 'রাষ্ট্রকে দেখা তিন চোখে — বাংলা ই-বুক',
        text:  'একটি রাষ্ট্রের গল্প—ভিতর থেকে, মাঝখান থেকে, আর উপরে থেকে। পড়ুন, শুনুন, শেয়ার করুন।',
        hashtags: ['রাষ্ট্র', 'বাংলাদেশ', 'রাজনীতি', 'সংস্কার', 'Bangladesh', 'Politics'],

        buildUrl(platform) {
            const u = encodeURIComponent(this.url);
            const t = encodeURIComponent(this.title);
            const tx = encodeURIComponent(this.text);
            const ht = this.hashtags.join(',');
            switch (platform) {
                case 'whatsapp':
                    return `https://wa.me/?text=${encodeURIComponent(this.title + '\n' + this.text + '\n' + this.url)}`;
                case 'messenger':
                    return `https://www.facebook.com/dialog/send?app_id=145634995501895&display=popup&link=${u}&redirect_uri=${u}`;
                case 'facebook':
                    return `https://www.facebook.com/sharer/sharer.php?u=${u}&quote=${t}`;
                case 'linkedin':
                    return `https://www.linkedin.com/sharing/share-offsite/?url=${u}`;
                case 'twitter':
                    return `https://twitter.com/intent/tweet?url=${u}&text=${encodeURIComponent(this.title + ' — ' + this.text)}&hashtags=${ht}`;
                case 'telegram':
                    return `https://t.me/share/url?url=${u}&text=${encodeURIComponent(this.title)}`;
                case 'email':
                    return `mailto:?subject=${t}&body=${encodeURIComponent(this.text + '\n\n' + this.url)}`;
                default:
                    return this.url;
            }
        },

        openPopup(url, w = 600, h = 600) {
            const left = (screen.width / 2) - (w / 2);
            const top  = (screen.height / 2) - (h / 2) - 50;
            return window.open(url, '_blank',
                `width=${w},height=${h},left=${left},top=${top},menubar=no,toolbar=no,resizable=yes,scrollbars=yes`);
        },

        async copyLink() {
            try {
                await navigator.clipboard.writeText(this.url);
                return true;
            } catch (e) {
                const ta = document.createElement('textarea');
                ta.value = this.url;
                ta.style.position = 'fixed';
                ta.style.opacity = '0';
                document.body.appendChild(ta);
                ta.select();
                let ok = false;
                try { ok = document.execCommand('copy'); } catch (_) {}
                document.body.removeChild(ta);
                return ok;
            }
        },

        async nativeShare() {
            if (!navigator.share) return false;
            try {
                await navigator.share({ title: this.title, text: this.text, url: this.url });
                return true;
            } catch (e) {
                if (e.name === 'AbortError') return true;
                return false;
            }
        },

        isNativeSupported() { return !!navigator.share; }
    };

    /* ── Modal HTML builder ──────────────────────────────────── */
    function buildModal() {
        const m = document.createElement('div');
        m.className = 'share-modal';
        m.id = 'shareModal';
        m.innerHTML = `
<div class="share-modal-content">
  <div class="share-modal-header">
    <h2 class="share-modal-title">শেয়ার করুন</h2>
    <button class="icon-btn share-close" id="btnCloseShare" aria-label="বন্ধ করুন">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
    </button>
  </div>
  <div class="share-preview">
    <img src="og-image.jpg" alt="প্রিভিউ" class="share-preview-img">
    <div class="share-preview-text">
      <div class="share-preview-title">রাষ্ট্রকে দেখা তিন চোখে</div>
      <div class="share-preview-desc">একটি রাষ্ট্রের গল্প—তিন চোখে। পড়ুন, শুনুন, শেয়ার করুন।</div>
      <div class="share-preview-url">moniruzjaman.github.io</div>
    </div>
  </div>
  <div class="share-grid">
    <button class="share-btn share-whatsapp" data-share="whatsapp">
      <svg viewBox="0 0 24 24" width="28" height="28" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/></svg>
      <span>WhatsApp</span>
    </button>
    <button class="share-btn share-messenger" data-share="messenger">
      <svg viewBox="0 0 24 24" width="28" height="28" fill="currentColor"><path d="M12 0C5.373 0 0 4.974 0 11.111c0 3.498 1.744 6.614 4.469 8.652V24l4.088-2.242c1.092.301 2.246.464 3.443.464 6.627 0 12-4.975 12-11.111S18.627 0 12 0zm1.191 14.963l-3.055-3.26-5.963 3.26L10.733 8l3.131 3.259L19.752 8l-6.561 6.963z"/></svg>
      <span>Messenger</span>
    </button>
    <button class="share-btn share-facebook" data-share="facebook">
      <svg viewBox="0 0 24 24" width="28" height="28" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
      <span>Facebook</span>
    </button>
    <button class="share-btn share-linkedin" data-share="linkedin">
      <svg viewBox="0 0 24 24" width="28" height="28" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
      <span>LinkedIn</span>
    </button>
    <button class="share-btn share-twitter" data-share="twitter">
      <svg viewBox="0 0 24 24" width="28" height="28" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
      <span>X / Twitter</span>
    </button>
    <button class="share-btn share-email" data-share="email">
      <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
      <span>ইমেইল</span>
    </button>
    <button class="share-btn share-telegram" data-share="telegram">
      <svg viewBox="0 0 24 24" width="28" height="28" fill="currentColor"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>
      <span>Telegram</span>
    </button>
    <button class="share-btn share-copy" data-share="copy">
      <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
      <span>লিঙ্ক কপি</span>
    </button>
    <button class="share-btn share-native" data-share="native" id="btnNativeShare">
      <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg>
      <span>আরও...</span>
    </button>
  </div>
  <div class="share-link-box">
    <input type="text" id="shareLinkInput" readonly>
    <button class="share-copy-btn" id="btnCopyLink">কপি</button>
  </div>
  <div class="share-foot-note">প্রতিটি প্ল্যাটফর্মে একই প্রিভিউ ইমেজ ও বইয়ের তথ্য দেখাবে।</div>
</div>`;
        document.body.appendChild(m);

        // Wire close + overlay click + escape
        m.querySelector('#btnCloseShare').onclick = () => SHARE_MODAL.close();
        m.addEventListener('click', (e) => {
            if (e.target.id === 'shareModal') SHARE_MODAL.close();
        });

        // Hide native share button if unsupported
        if (!SHARE.isNativeSupported()) {
            m.querySelector('#btnNativeShare').style.display = 'none';
        }

        // Wire share buttons
        m.querySelectorAll('.share-btn[data-share]').forEach(btn => {
            btn.addEventListener('click', async () => {
                const platform = btn.dataset.share;
                if (platform === 'copy') {
                    const ok = await SHARE.copyLink();
                    const span = btn.querySelector('span');
                    const old = span.textContent;
                    span.textContent = ok ? 'কপি হয়েছে!' : 'ব্যর্থ';
                    setTimeout(() => span.textContent = old, 1500);
                } else if (platform === 'native') {
                    await SHARE.nativeShare();
                } else {
                    SHARE.openPopup(SHARE.buildUrl(platform));
                }
            });
        });

        // Copy link button
        m.querySelector('#btnCopyLink').addEventListener('click', async () => {
            const ok = await SHARE.copyLink();
            const btn = m.querySelector('#btnCopyLink');
            const old = btn.textContent;
            btn.textContent = ok ? '✓ কপি হয়েছে' : '✗ ব্যর্থ';
            setTimeout(() => btn.textContent = old, 1500);
        });

        return m;
    }

    const SHARE_MODAL = {
        modal: null,
        open(chapterId) {
            if (!this.modal) this.modal = buildModal();
            // Update link with chapter hash if provided
            const url = chapterId
                ? `https://moniruzjaman.github.io/rashtra_teen_chokhe/read.html#${chapterId}`
                : 'https://moniruzjaman.github.io/rashtra_teen_chokhe/';
            const linkInput = this.modal.querySelector('#shareLinkInput');
            if (linkInput) linkInput.value = url;
            this.modal.classList.add('visible');
            document.body.style.overflow = 'hidden';
        },
        close() {
            if (this.modal) {
                this.modal.classList.remove('visible');
                document.body.style.overflow = '';
            }
        },
        toggle(chapterId) {
            if (this.modal && this.modal.classList.contains('visible')) this.close();
            else this.open(chapterId);
        }
    };

    // Expose globally
    window.EBOOK_SHARE = SHARE;
    window.EBOOK_SHARE_MODAL = SHARE_MODAL;

    // Close on Escape
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') SHARE_MODAL.close();
    });

    // Auto-attach to existing share button(s) — replaces the basic onclick
    document.addEventListener('DOMContentLoaded', () => {
        const shareBtns = document.querySelectorAll('#share, [data-share-trigger], #mobileShareBtn');
        shareBtns.forEach(btn => {
            // Replace existing onclick with our modal
            btn.onclick = (e) => {
                e.preventDefault();
                // Detect current chapter if on read.html
                const chapter = document.querySelector('article.chapter[id]:target')?.id
                    || location.hash.replace('#', '') || null;
                SHARE_MODAL.open(chapter && chapter !== 'top' ? chapter : null);
            };
        });
    });
})();
