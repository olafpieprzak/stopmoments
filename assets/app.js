// ── pasek nawigacji ──────────────────────────────────────────────
const nav = document.getElementById('nav');
const navZawszeJasny = nav && nav.dataset.stale === '1';
if (nav && !navZawszeJasny) addEventListener('scroll', () => nav.classList.toggle('solid', scrollY > 60));

const burger = document.querySelector('.burger');
if (burger) burger.addEventListener('click', () => {
  const l = document.querySelector('.nav-links');
  const otwarte = l.classList.toggle('otwarte');
  burger.classList.toggle('x', otwarte);
  document.body.style.overflow = otwarte ? 'hidden' : '';
});
// kliknięcie w pozycję menu zamyka je
document.querySelectorAll('.nav-links a').forEach(a => a.addEventListener('click', e => {
  if (a.getAttribute('href') === '#') { e.preventDefault(); return; }
  document.querySelector('.nav-links').classList.remove('otwarte');
  if (burger) burger.classList.remove('x');
  document.body.style.overflow = '';
}));

// ── animacja pojawiania ──────────────────────────────────────────
const io = new IntersectionObserver(
  e => e.forEach(x => x.isIntersecting && x.target.classList.add('in')),
  { threshold: .08 }
);
document.querySelectorAll('.rv').forEach(el => io.observe(el));

// ── powiększanie zdjęć ───────────────────────────────────────────
let imgs = [], idx = 0;
const lb = document.getElementById('lb');
const lbImg = document.getElementById('lbImg');

if (lb) {
  document.querySelectorAll('.gal picture img').forEach(img => {
    img.addEventListener('click', () => {
      imgs = [...document.querySelectorAll('.gal picture img')];
      idx = imgs.indexOf(img);
      show();
      lb.classList.add('on');
      document.body.style.overflow = 'hidden';
    });
  });
  lb.addEventListener('click', e => { if (e.target === lb) closeLb(); });
  addEventListener('keydown', e => {
    if (!lb.classList.contains('on')) return;
    if (e.key === 'Escape') closeLb();
    if (e.key === 'ArrowRight') navLb(1);
    if (e.key === 'ArrowLeft') navLb(-1);
  });
}
function show(){ lbImg.src = imgs[idx].src; lbImg.alt = imgs[idx].alt; }
function navLb(d){ idx = (idx + d + imgs.length) % imgs.length; show(); }
function closeLb(){ lb.classList.remove('on'); document.body.style.overflow = ''; }

// ── INSTAGRAM (Behold.so JSON feed) ──────────────────────────────
// Wklej tutaj adres swojego feedu z panelu Behold, np.:
// const BEHOLD_FEED = 'https://feeds.behold.so/aB3xY9kLm2';
const BEHOLD_FEED = 'https://feeds.behold.so/TWOJ_ID_FEEDU';
const IG_COUNT = 10;

(async function loadInstagram(){
  if (BEHOLD_FEED.includes('TWOJ_ID_FEEDU')) return;
  const strip = document.getElementById('igStrip');
  if (!strip) return;
  try {
    const res = await fetch(BEHOLD_FEED);
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const data = await res.json();
    const posts = (data.posts || []).slice(0, IG_COUNT);
    if (!posts.length) return;
    strip.innerHTML = posts.map(p => {
      const src = (p.sizes && p.sizes.medium && p.sizes.medium.mediaUrl) || p.mediaUrl;
      const alt = (p.altText || p.caption || 'Post na Instagramie StopMoments')
                    .replace(/"/g, '&quot;').slice(0, 120);
      const film = p.mediaType === 'VIDEO'
        ? '<span class="ig-film" aria-hidden="true">▶</span>' : '';
      return `<a href="${p.permalink}" target="_blank" rel="noopener">
                <img src="${src}" alt="${alt}" loading="lazy">${film}
              </a>`;
    }).join('');
  } catch (e) {
    console.warn('Feed Instagrama niedostępny — pokazuję zdjęcia zapasowe.', e);
  }
})();


// ── OPINIE: karuzela ze strzałkami i samoprzewijaniem ────────────
(function karuzelaOpinii(){
  const pas = document.getElementById('opPas');
  if (!pas) return;
  const tor = pas.querySelector('.op-tor');
  const wstecz = document.querySelector('.op-strzalka.wstecz');
  const dalej  = document.querySelector('.op-strzalka.dalej');
  const wolnyRuch = matchMedia('(prefers-reduced-motion: reduce)').matches;

  const krok = () => {
    const k = tor.querySelector('.op');
    return k ? k.offsetWidth + 20 : 320;
  };
  const polowa = () => tor.scrollWidth / 2;

  // zapętlenie — lista jest zdublowana, więc wystarczy przeskoczyć o połowę
  function zapetl(){
    if (pas.scrollLeft >= polowa())      pas.scrollLeft -= polowa();
    else if (pas.scrollLeft <= 0)        pas.scrollLeft += polowa();
  }

  function przesun(kier){
    pas.scrollBy({left: kier * krok(), behavior: 'smooth'});
    setTimeout(zapetl, 420);
  }
  wstecz && wstecz.addEventListener('click', () => przesun(-1));
  dalej  && dalej.addEventListener('click',  () => przesun(1));

  // powolne samoprzewijanie, zatrzymywane przy najechaniu i dotknięciu
  let stop = false, id = null;
  ['mouseenter','touchstart','focusin'].forEach(e => pas.addEventListener(e, () => stop = true, {passive:true}));
  ['mouseleave','focusout'].forEach(e => pas.addEventListener(e, () => stop = false));
  document.querySelectorAll('.op-strzalka').forEach(b => {
    b.addEventListener('mouseenter', () => stop = true);
    b.addEventListener('mouseleave', () => stop = false);
  });

  if (!wolnyRuch) {
    id = setInterval(() => {
      if (stop) return;
      pas.scrollLeft += 0.6;
      zapetl();
    }, 16);
  }
})();
