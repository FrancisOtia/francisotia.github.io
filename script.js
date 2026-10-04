/* Francis Otia | Portfolio scripts */

document.addEventListener('DOMContentLoaded', () => {
    // Footer year
    const year = document.getElementById('year');
    if (year) year.textContent = new Date().getFullYear();

    // Mobile navigation
    const toggle = document.querySelector('.nav-toggle');
    const nav = document.getElementById('site-nav');

    if (toggle && nav) {
        const setOpen = (open) => {
            nav.classList.toggle('is-open', open);
            toggle.setAttribute('aria-expanded', String(open));
            toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
        };

        toggle.addEventListener('click', () => setOpen(!nav.classList.contains('is-open')));
        nav.querySelectorAll('a').forEach((a) => a.addEventListener('click', () => setOpen(false)));
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') setOpen(false);
        });
    }

    initContours();
});

/* ----------------------------------------------------------
   Hero: live topographic contour map (marching squares).
   Terrain drifts slowly and rises under the cursor.
   Respects reduced motion (draws a single static frame).
   ---------------------------------------------------------- */
function initContours() {
    const canvas = document.getElementById('contours');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const hero = canvas.parentElement;
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const CELL = 16;
    const LEVELS = 14;
    const STEP = 0.08;

    const peaks = [
        { x: 0.78, y: 0.35, r: 0.22, a: 1.0 },
        { x: 0.55, y: 0.85, r: 0.28, a: 0.8 },
        { x: 0.15, y: 0.25, r: 0.20, a: 0.7 },
        { x: 0.95, y: 0.95, r: 0.25, a: 0.6 },
        { x: 0.35, y: 0.55, r: 0.18, a: 0.5 }
    ];
    const pointer = { x: 0.7, y: 0.5, tx: 0.7, ty: 0.5 };

    let w = 0, h = 0, cols = 0, rows = 0, field = null;
    let running = false;

    function resize() {
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        w = hero.clientWidth;
        h = hero.clientHeight;
        canvas.width = w * dpr;
        canvas.height = h * dpr;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        cols = Math.ceil(w / CELL) + 1;
        rows = Math.ceil(h / CELL) + 1;
        field = new Float32Array(cols * rows);
        draw(performance.now());
    }

    function computeField(t) {
        const aspect = w / h;
        const moving = peaks.map((p, i) => ({
            x: p.x + Math.sin(t * 0.00012 + i * 1.7) * 0.05,
            y: p.y + Math.cos(t * 0.0001 + i * 2.3) * 0.05,
            r: p.r,
            a: p.a
        }));
        moving.push({ x: pointer.x, y: pointer.y, r: 0.14, a: 0.9 });

        for (let j = 0; j < rows; j++) {
            const ny = (j * CELL) / h;
            for (let i = 0; i < cols; i++) {
                const nx = (i * CELL) / w;
                let v = 0;
                for (let k = 0; k < moving.length; k++) {
                    const p = moving[k];
                    const dx = (nx - p.x) * aspect;
                    const dy = ny - p.y;
                    v += p.a * Math.exp(-(dx * dx + dy * dy) / (p.r * p.r));
                }
                field[j * cols + i] = v;
            }
        }
    }

    function draw(t) {
        pointer.x += (pointer.tx - pointer.x) * 0.06;
        pointer.y += (pointer.ty - pointer.y) * 0.06;
        computeField(t);
        ctx.clearRect(0, 0, w, h);

        for (let li = 1; li <= LEVELS; li++) {
            const level = li * STEP;
            const isIndex = li % 4 === 0;
            ctx.beginPath();
            ctx.lineWidth = isIndex ? 1.6 : 0.9;
            ctx.strokeStyle = isIndex ? 'rgba(242, 194, 48, 0.55)' : 'rgba(169, 189, 180, 0.28)';

            for (let j = 0; j < rows - 1; j++) {
                for (let i = 0; i < cols - 1; i++) {
                    const a = field[j * cols + i];
                    const b = field[j * cols + i + 1];
                    const c = field[(j + 1) * cols + i + 1];
                    const d = field[(j + 1) * cols + i];

                    const idx = (a > level ? 8 : 0) | (b > level ? 4 : 0) | (c > level ? 2 : 0) | (d > level ? 1 : 0);
                    if (idx === 0 || idx === 15) continue;

                    const x = i * CELL;
                    const y = j * CELL;

                    // Edge crossing points (linear interpolation)
                    const top = () => [x + CELL * ((level - a) / (b - a)), y];
                    const right = () => [x + CELL, y + CELL * ((level - b) / (c - b))];
                    const bottom = () => [x + CELL * ((level - d) / (c - d)), y + CELL];
                    const left = () => [x, y + CELL * ((level - a) / (d - a))];

                    let segs;
                    switch (idx) {
                        case 1: case 14: segs = [[left, bottom]]; break;
                        case 2: case 13: segs = [[bottom, right]]; break;
                        case 3: case 12: segs = [[left, right]]; break;
                        case 4: case 11: segs = [[top, right]]; break;
                        case 5: segs = [[top, left], [bottom, right]]; break;
                        case 6: case 9: segs = [[top, bottom]]; break;
                        case 7: case 8: segs = [[top, left]]; break;
                        case 10: segs = [[top, right], [left, bottom]]; break;
                        default: segs = [];
                    }

                    for (const [p, q] of segs) {
                        const [x1, y1] = p();
                        const [x2, y2] = q();
                        ctx.moveTo(x1, y1);
                        ctx.lineTo(x2, y2);
                    }
                }
            }
            ctx.stroke();
        }
    }

    function loop(t) {
        if (!running) return;
        draw(t);
        requestAnimationFrame(loop);
    }

    function start() {
        if (running || reduceMotion) return;
        running = true;
        requestAnimationFrame(loop);
    }

    function stop() {
        running = false;
    }

    hero.addEventListener('pointermove', (e) => {
        const rect = hero.getBoundingClientRect();
        pointer.tx = (e.clientX - rect.left) / rect.width;
        pointer.ty = (e.clientY - rect.top) / rect.height;
    });

    window.addEventListener('resize', resize);
    resize();

    // Only animate while the hero is on screen
    if ('IntersectionObserver' in window) {
        new IntersectionObserver((entries) => {
            entries[0].isIntersecting ? start() : stop();
        }).observe(hero);
    } else {
        start();
    }
}
