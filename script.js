// НЯШК — пил і зірочки, анімації від курсора і скролу, меню, промокоди, лайтбокс.
// Один файл на всі сторінки: кожен блок сам перевіряє, чи є на сторінці його елементи.

const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
const mouse = { x: -9999, y: -9999 };

// --- Пил у тумані та рідкісні срібні зірочки, що мерехтять ---
(function particles() {
    if (reduced) return;
    const canvas = document.getElementById('particles');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let w = 0, h = 0, dpr = 1, parts = [], raf = null;

    function spawn(anywhere) {
        const star = Math.random() < 0.1;
        return {
            x: Math.random() * w,
            y: anywhere ? Math.random() * h : h + 12,
            r: star ? 3 + Math.random() * 4 : 0.5 + Math.random() * 1.4,
            vy: star ? 0.05 + Math.random() * 0.1 : (0.08 + Math.random() * 0.3),
            drift: (Math.random() - 0.5) * 0.35,
            phase: Math.random() * Math.PI * 2,
            sway: 0.2 + Math.random() * 0.8,
            alpha: (star ? 0.4 : 0.08) + Math.random() * 0.3,
            star: star
        };
    }

    function resize() {
        dpr = Math.min(window.devicePixelRatio || 1, 2);
        w = canvas.clientWidth;
        h = canvas.clientHeight;
        canvas.width = w * dpr;
        canvas.height = h * dpr;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        const target = Math.round(Math.min(90, (w * h) / 22000));
        parts = [];
        for (let i = 0; i < target; i++) parts.push(spawn(true));
    }

    function tick() {
        ctx.clearRect(0, 0, w, h);
        for (const p of parts) {
            p.phase += 0.01;
            p.y += p.vy;
            p.x += p.drift + Math.sin(p.phase) * p.sway * 0.15;
            // попіл розлітається від курсора
            const dx = p.x - mouse.x, dy = p.y - mouse.y, d2 = dx * dx + dy * dy;
            if (d2 < 14400 && d2 > 1) {
                const f = (1 - d2 / 14400) * 2.2, d = Math.sqrt(d2);
                p.x += dx / d * f;
                p.y += dy / d * f;
            }
            if (p.y > h + 14 || p.y < -14 || p.x < -14 || p.x > w + 14) Object.assign(p, spawn(false));
            if (p.star) {
                // чотирипроменева зірочка, що пульсує
                const a = p.alpha * (0.35 + 0.65 * Math.abs(Math.sin(p.phase * 2.2))), r = p.r, q = r * 0.16;
                ctx.shadowBlur = 10;
                ctx.shadowColor = 'rgba(255,255,255,0.9)';
                ctx.fillStyle = 'rgba(255,255,255,' + a + ')';
                ctx.beginPath();
                ctx.moveTo(p.x, p.y - r);
                ctx.quadraticCurveTo(p.x + q, p.y - q, p.x + r, p.y);
                ctx.quadraticCurveTo(p.x + q, p.y + q, p.x, p.y + r);
                ctx.quadraticCurveTo(p.x - q, p.y + q, p.x - r, p.y);
                ctx.quadraticCurveTo(p.x - q, p.y - q, p.x, p.y - r);
                ctx.fill();
            } else {
                ctx.shadowBlur = 0;
                ctx.fillStyle = 'rgba(220,220,220,' + p.alpha + ')';
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
                ctx.fill();
            }
        }
        ctx.shadowBlur = 0;
        raf = requestAnimationFrame(tick);
    }

    function start() { if (!raf) raf = requestAnimationFrame(tick); }
    function stop() { if (raf) { cancelAnimationFrame(raf); raf = null; } }

    let rt;
    window.addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(resize, 150); });
    document.addEventListener('visibilitychange', () => { document.hidden ? stop() : start(); });
    resize();
    start();
})();

// --- Курсор: світло, паралакс зірочок, «магнітні» кнопки ---
(function pointer() {
    const root = document.documentElement;
    const floats = document.querySelectorAll('.float');
    let queued = false, px = 0, py = 0;

    window.addEventListener('pointermove', e => {
        px = e.clientX; py = e.clientY;
        mouse.x = px; mouse.y = py;
        if (queued || reduced) return;
        queued = true;
        requestAnimationFrame(() => {
            queued = false;
            root.style.setProperty('--mx', px + 'px');
            root.style.setProperty('--my', py + 'px');
            const nx = px / window.innerWidth - 0.5, ny = py / window.innerHeight - 0.5;
            floats.forEach(f => {
                const d = +f.dataset.depth;
                f.style.setProperty('--px', (-nx * d).toFixed(1) + 'px');
                f.style.setProperty('--py', (-ny * d).toFixed(1) + 'px');
            });
        });
    }, { passive: true });
    document.addEventListener('pointerleave', () => { mouse.x = mouse.y = -9999; });

    if (!finePointer || reduced) return;

    document.querySelectorAll('.magnet').forEach(el => {
        el.addEventListener('pointermove', e => {
            const r = el.getBoundingClientRect();
            el.style.setProperty('--bx', ((e.clientX - r.left - r.width / 2) * 0.22).toFixed(1) + 'px');
            el.style.setProperty('--by', ((e.clientY - r.top - r.height / 2) * 0.3).toFixed(1) + 'px');
        });
        el.addEventListener('pointerleave', () => {
            el.style.setProperty('--bx', '0px');
            el.style.setProperty('--by', '0px');
        });
    });

    // Картки нахиляються за курсором, по них ковзає відблиск
    document.querySelectorAll('.tilt').forEach(card => {
        card.addEventListener('pointermove', e => {
            const r = card.getBoundingClientRect();
            const x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
            card.style.setProperty('--ry', ((x - 0.5) * 12).toFixed(2) + 'deg');
            card.style.setProperty('--rx', ((0.5 - y) * 10).toFixed(2) + 'deg');
            card.style.setProperty('--gx', (x * 100).toFixed(1) + '%');
            card.style.setProperty('--gy', (y * 100).toFixed(1) + '%');
        });
        card.addEventListener('pointerleave', () => {
            card.style.setProperty('--rx', '0deg');
            card.style.setProperty('--ry', '0deg');
        });
    });
})();

// --- Меню: бургер на телефоні, суцільний фон після прокрутки ---
const nav = document.querySelector('.nav');
(function menu() {
    const burger = document.getElementById('navBurger');
    if (!nav || !burger) return;
    const set = open => {
        nav.classList.toggle('open', open);
        burger.setAttribute('aria-expanded', open);
    };
    burger.addEventListener('click', () => set(!nav.classList.contains('open')));
    nav.querySelectorAll('.nav-links a').forEach(a => a.addEventListener('click', () => set(false)));
    document.addEventListener('keydown', e => { if (e.key === 'Escape') set(false); });
    document.addEventListener('click', e => { if (!nav.contains(e.target)) set(false); });
})();

// --- Скрол: смужка прогресу, фон меню, поява блоків ---
(function scrolling() {
    const bar = document.getElementById('progress');
    const root = document.documentElement;
    let queued = false;
    function update() {
        queued = false;
        const max = root.scrollHeight - window.innerHeight;
        bar.style.transform = 'scaleX(' + (max > 0 ? window.scrollY / max : 0) + ')';
        if (nav) nav.classList.toggle('solid', window.scrollY > 24);
        if (!reduced) root.style.setProperty('--scroll', window.scrollY.toFixed(0));
    }
    window.addEventListener('scroll', () => { if (!queued) { queued = true; requestAnimationFrame(update); } }, { passive: true });
    update();

    const items = document.querySelectorAll('[data-reveal]');
    if (!('IntersectionObserver' in window) || reduced) {
        items.forEach(el => el.classList.add('in'));
        return;
    }
    const io = new IntersectionObserver(entries => {
        entries.forEach(en => {
            if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
        });
    }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });
    items.forEach(el => io.observe(el));
})();

// --- Слово в заголовку, що передруковується ---
(function rotor() {
    const el = document.getElementById('rotor');
    if (!el || reduced) return;
    const words = el.dataset.words.split('|');
    let i = 0;
    const sleep = ms => new Promise(r => setTimeout(r, ms));
    (async function loop() {
        for (;;) {
            await sleep(2200);
            for (let t = el.textContent; t.length; t = t.slice(0, -1)) { el.textContent = t.slice(0, -1); await sleep(32); }
            i = (i + 1) % words.length;
            for (let n = 1; n <= words[i].length; n++) { el.textContent = words[i].slice(0, n); await sleep(62); }
        }
    })();
})();

// --- Скільки людей онлайн у Discord (публічний віджет сервера) ---
(function online() {
    const big = document.getElementById('onlineBig');
    if (!big) return;
    fetch('https://discord.com/api/guilds/826538211429187634/widget.json')
        .then(r => r.ok ? r.json() : Promise.reject())
        .then(d => {
            const n = d.presence_count;
            if (!n) return;
            if (reduced) { big.textContent = n; return; }
            // лічильник добігає до числа, коли блок з'являється на екрані
            const run = () => {
                const t0 = performance.now();
                (function step(t) {
                    const k = Math.min(1, (t - t0) / 1200);
                    big.textContent = Math.round(n * (1 - Math.pow(1 - k, 3)));
                    if (k < 1) requestAnimationFrame(step);
                })(t0);
            };
            if (!('IntersectionObserver' in window)) return run();
            const io = new IntersectionObserver(es => { if (es[0].isIntersecting) { io.disconnect(); run(); } });
            io.observe(big);
        })
        .catch(() => {});   // віджет недоступний — лишається текст за замовчуванням
})();

// --- Срібні зірочки при копіюванні промокоду ---
function burst(el) {
    if (reduced) return;
    const r = el.getBoundingClientRect();
    const shapes = ['#i-sparkle', '#i-cross'];
    for (let i = 0; i < 16; i++) {
        const s = document.createElement('span');
        const a = Math.PI * 2 * i / 16 + Math.random() * 0.5, d = 40 + Math.random() * 80;
        s.className = 'spark';
        s.innerHTML = '<svg><use href="' + shapes[i % 2] + '"/></svg>';
        s.style.left = r.left + r.width / 2 + 'px';
        s.style.top = r.top + r.height / 2 + 'px';
        s.style.setProperty('--dx', Math.cos(a) * d + 'px');
        s.style.setProperty('--dy', Math.sin(a) * d + 'px');
        s.style.setProperty('--dr', (Math.random() * 240 - 120) + 'deg');
        document.body.appendChild(s);
        s.addEventListener('animationend', () => s.remove());
    }
}

// --- Промокоди ---
const copiedText = (document.querySelector('[data-copied]') || {}).dataset?.copied || 'copied';
document.querySelectorAll('.promo-code').forEach(btn => {
    const code = btn.dataset.code;
    let timer = null;

    const flash = () => {
        clearTimeout(timer);
        btn.textContent = copiedText;
        btn.classList.add('copied');
        burst(btn);
        timer = setTimeout(() => {
            btn.textContent = code;          // завжди повертаємо саме промокод
            btn.classList.remove('copied');
        }, 1500);
    };

    btn.addEventListener('click', () => {
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(code).then(flash).catch(fallbackCopy);
        } else {
            fallbackCopy();
        }
    });

    function fallbackCopy() {
        const ta = document.createElement('textarea');
        ta.value = code;
        ta.setAttribute('readonly', '');
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        try { document.execCommand('copy'); } catch (e) {}
        document.body.removeChild(ta);
        flash();
    }
});

// --- Лаунчер: кнопку твоєї ОС ставимо першою й підсвічуємо ---
(function launcherOs() {
    const box = document.querySelector('.launcher-get');
    if (!box) return;
    const ua = navigator.userAgent;
    const os = /Windows/i.test(ua) ? 'windows' : /Mac/i.test(ua) && !/iPhone|iPad/i.test(ua) ? 'mac' : /Linux|X11/i.test(ua) && !/Android/i.test(ua) ? 'linux' : '';
    const mine = os && box.querySelector(`[data-os="${os}"]`);
    if (!mine) return;
    mine.classList.add('is-mine');
    box.prepend(mine);
})();

// --- Лайтбокс (галерея, скриншоти плагінів) ---
(function lightboxSetup() {
    const lightbox = document.getElementById('lightbox');
    const lightboxImg = document.getElementById('lightboxImg');
    const lightboxCap = document.getElementById('lightboxCap');
    const lightboxClose = document.getElementById('lightboxClose');

    function openLightbox(src, cap) {
        lightboxImg.src = src;
        lightboxImg.alt = cap;
        lightboxCap.textContent = cap;
        lightbox.hidden = false;
        document.body.style.overflow = 'hidden';
    }

    function closeLightbox() {
        lightbox.hidden = true;
        lightboxImg.src = '';
        document.body.style.overflow = '';
    }

    if (!lightbox) return;

    document.querySelectorAll('.shot-zoom').forEach(shot => {
        shot.addEventListener('click', () => openLightbox(shot.dataset.src, shot.dataset.cap));
    });

    lightboxClose.addEventListener('click', closeLightbox);
    lightbox.addEventListener('click', e => {
        if (e.target === lightbox) closeLightbox();
    });
    document.addEventListener('keydown', e => {
        if (e.key === 'Escape' && !lightbox.hidden) closeLightbox();
    });
})();
