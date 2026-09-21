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
// wybiera najlepszą dostępną wersję zdjęcia (duży .webp z <source>, a nie mały fallback .jpg)
function bestSrc(img){
  const picture = img.closest('picture');
  const source = picture && picture.querySelector('source[type="image/webp"]');
  if (!source || !source.srcset) return img.src;
  let best = null, bestW = -1;
  source.srcset.split(',').forEach(entry => {
    const parts = entry.trim().split(/\s+/);
    if (parts.length < 2) return;
    const w = parseInt(parts[1], 10);
    if (w > bestW) { bestW = w; best = parts[0]; }
  });
  return best || img.src;
}
function show(){ lbImg.src = bestSrc(imgs[idx]); lbImg.alt = imgs[idx].alt; }
function navLb(d){ idx = (idx + d + imgs.length) % imgs.length; show(); }
function closeLb(){ lb.classList.remove('on'); document.body.style.overflow = ''; }

// ── GALERIE: na mobile ogranicz bardzo długie galerie „Zobacz więcej” ────
// Dotyczy tylko galerii, które i tak są długie (>10 rzędów) — reszta
// (krótsze kategorie) renderuje się bez zmian, w całości.
(function(){
  if (!window.matchMedia('(max-width:640px)').matches) return;
  const ROW_LIMIT = 8;
  document.querySelectorAll('.gal').forEach(gal => {
    const rows = Array.from(gal.children).filter(el => el.classList.contains('jrow'));
    if (rows.length <= 10) return;
    rows.slice(ROW_LIMIT).forEach(row => row.classList.add('gal-hidden'));
    const ukryte = rows.length - ROW_LIMIT;
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'gal-more';
    btn.textContent = `Zobacz więcej zdjęć (+${ukryte})`;
    btn.addEventListener('click', () => {
      rows.forEach(row => row.classList.remove('gal-hidden'));
      btn.remove();
    });
    gal.insertAdjacentElement('afterend', btn);
  });
})();

// ── INSTAGRAM (Behold.so JSON feed) ──────────────────────────────
// Wklej tutaj adres swojego feedu z panelu Behold, np.:
// const BEHOLD_FEED = 'https://feeds.behold.so/aB3xY9kLm2';
const BEHOLD_FEED = 'https://feeds.behold.so/TWOJ_ID_FEEDU';
const IG_COUNT = 6; // zajawka jest zwarta — max 6 na desktopie, 4 na mobile (CSS)

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


// ── OPINIE: karuzela ze strzałkami, przewijanie tylko ręczne ─────
(function karuzelaOpinii(){
  const pas = document.getElementById('opPas');
  if (!pas) return;
  const tor = pas.querySelector('.op-tor');
  const wstecz = document.querySelector('.op-strzalka.wstecz');
  const dalej  = document.querySelector('.op-strzalka.dalej');

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
})();


// ── FAQ: akordeon ────────────────────────────────────────────────
(function akordeonFaq(){
  const przyciski = document.querySelectorAll('.faq-q');
  if (!przyciski.length) return;
  przyciski.forEach(btn => btn.addEventListener('click', () => {
    const panel = document.getElementById(btn.getAttribute('aria-controls'));
    const otwarty = btn.getAttribute('aria-expanded') === 'true';

    // zamknij pozostałe pytania
    document.querySelectorAll('.faq-q[aria-expanded="true"]').forEach(inny => {
      if (inny !== btn) {
        inny.setAttribute('aria-expanded', 'false');
        document.getElementById(inny.getAttribute('aria-controls')).style.height = '0px';
      }
    });

    btn.setAttribute('aria-expanded', String(!otwarty));
    panel.style.height = otwarty ? '0px' : panel.scrollHeight + 'px';
  }));
  addEventListener('resize', () => {
    document.querySelectorAll('.faq-q[aria-expanded="true"]').forEach(btn => {
      const panel = document.getElementById(btn.getAttribute('aria-controls'));
      panel.style.height = panel.scrollHeight + 'px';
    });
  });
})();


// ── E-BOOK (lead magnet) — MOCK submit, tak jak na /biznes ──────────
// Docelowo podłączyć wysyłkę do systemu mailowego (MailerLite / Brevo /
// GetResponse) zamiast poniższego toggle'a formularz→podziękowanie.
(function(){
  const lmForm = document.getElementById('lmForm');
  const lmThanks = document.getElementById('lmThanks');
  if (!lmForm || !lmThanks) return;
  lmForm.addEventListener('submit', e => {
    e.preventDefault();
    // TODO: wyslijDoSystemuMailowego(lmForm.elements['lm-email'].value, lmForm.elements['lm-name'].value)
    lmForm.hidden = true;
    lmThanks.hidden = false;
  });
})();
