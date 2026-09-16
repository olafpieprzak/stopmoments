/**
 * Cloudflare Pages Function — /api/instagram
 * ------------------------------------------------------------------
 * Oddaje do 6 postów z konta @monika_adamczyk_fotografia dla sekcji
 * Instagram na /biznes, korzystając z oficjalnego Instagram Graph API
 * (Instagram API with Instagram Login). Token nigdy nie trafia do
 * przeglądarki.
 *
 * Wymagane w Cloudflare Pages → Settings:
 *   Variables and Secrets:
 *     IG_TOKEN_SEED   (secret)  — długożyciowy token startowy z Meta
 *   Bindings → KV namespace:
 *     IG_KV                     — cache postów + rotacja tokenu
 *
 * Token długożyciowy żyje 60 dni i jest tu odnawiany automatycznie,
 * gdy ma więcej niż 30 dni. Odnowiony token ląduje w KV — IG_TOKEN_SEED
 * służy tylko jako wartość startowa.
 *
 * KURACJA TREŚCI (sekcja biznesowa) ─────────────────────────────────
 * Instagram Graph API nie pozwala filtrować `/me/media` po temacie
 * posta, więc "najnowsze publikacje" mogłyby wymieszać sesje biznesowe
 * z prywatnymi kadrami. Rozwiązanie: podaj tu ID konkretnych postów,
 * które mają się pokazywać na /biznes (sesje wizerunkowe, zespoły,
 * eventy, branding, edukacja). Dane (zdjęcie, opis, link) i tak są
 * pobierane na żywo z Instagrama dla każdego z tych ID — to nie są
 * statyczne zrzuty, tylko wybór KTÓRE posty pokazać.
 *
 * Jak znaleźć ID posta: w Meta Business Suite otwórz post → "..." →
 * "Wyświetl informacje o poście" (numer przy "ID posta"), albo chwilowo
 * dodaj do URL-a tego endpointu `?debug=1`, żeby zobaczyć ID najnowszych
 * publikacji w odpowiedzi JSON.
 *
 * Pusta tablica poniżej = tryb zapasowy: pokazujemy po prostu najnowsze
 * publikacje (zachowanie sprzed tej zmiany), żeby sekcja nigdy nie
 * została pusta, zanim ktoś uzupełni listę.
 */
const CURATED_IDS = [
  // '17912345678901234',
  // '17923456789012345',
];

const GRAPH = 'https://graph.instagram.com';
const FIELDS = 'id,caption,media_type,media_url,thumbnail_url,permalink,timestamp';
const LIMIT = 30;                    // tryb "najnowsze": spory zapas, front bierze 6
const CACHE_SECONDS = 30 * 60;       // 30 min — feed nie zmienia się częściej
const REFRESH_AFTER_MS = 30 * 24 * 60 * 60 * 1000; // odnów token po 30 dniach

const TOKEN_KEY = 'ig:token';
const FEED_KEY = CURATED_IDS.length ? 'ig:feed:curated' : 'ig:feed:recent';

const JSON_HEADERS = {
  'Content-Type': 'application/json; charset=utf-8',
  'Cache-Control': `public, max-age=300, s-maxage=${CACHE_SECONDS}`,
  'Access-Control-Allow-Origin': '*',
};

function json(body, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...JSON_HEADERS, ...extraHeaders },
  });
}

/** Zwraca aktualny token, odnawiając go, jeśli zbliża się do wygaśnięcia. */
async function getToken(env) {
  const kv = env.IG_KV;
  let record = null;

  if (kv) {
    try {
      record = await kv.get(TOKEN_KEY, { type: 'json' });
    } catch (_) {
      record = null;
    }
  }

  // Pierwszy start (albo pusty KV) — bierzemy token z sekretu.
  if (!record || !record.token) {
    if (!env.IG_TOKEN_SEED) return null;
    record = { token: env.IG_TOKEN_SEED, obtainedAt: Date.now() };
    if (kv) await kv.put(TOKEN_KEY, JSON.stringify(record));
  }

  // Odnowienie w połowie okresu życia — z dużym zapasem przed 60. dniem.
  if (kv && Date.now() - (record.obtainedAt || 0) > REFRESH_AFTER_MS) {
    try {
      const url = `${GRAPH}/refresh_access_token?grant_type=ig_refresh_token&access_token=${encodeURIComponent(record.token)}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        if (data.access_token) {
          record = { token: data.access_token, obtainedAt: Date.now() };
          await kv.put(TOKEN_KEY, JSON.stringify(record));
        }
      }
    } catch (_) {
      // Nieudane odnowienie nie może wywrócić feedu — stary token jest wciąż ważny.
    }
  }

  return record.token;
}

/** Pobiera z góry wybrane posty (po ID) — kolejność z CURATED_IDS jest zachowana. */
async function fetchCurated(ids, token) {
  const results = await Promise.all(
    ids.map(async (id) => {
      try {
        const url = `${GRAPH}/${id}?fields=${FIELDS}&access_token=${encodeURIComponent(token)}`;
        const res = await fetch(url);
        if (!res.ok) return null;
        const post = await res.json();
        return post && !post.error ? post : null;
      } catch (_) {
        return null;
      }
    })
  );
  return results.filter(Boolean);
}

/** Pobiera najnowsze publikacje z konta (tryb zapasowy, sprzed kuracji). */
async function fetchRecent(token) {
  const url = `${GRAPH}/me/media?fields=${FIELDS}&limit=${LIMIT}&access_token=${encodeURIComponent(token)}`;
  const res = await fetch(url, { cf: { cacheTtl: 300 } });
  if (!res.ok) {
    const err = new Error('api_error');
    err.status = res.status;
    throw err;
  }
  const payload = await res.json();
  return payload.data || [];
}

/** Dla karuzeli bierzemy pierwsze zdjęcie z albumu, jeśli rodzic go nie zwrócił. */
async function fillCarousels(posts, token) {
  const gaps = posts.filter(
    (p) => p.media_type === 'CAROUSEL_ALBUM' && !p.media_url && !p.thumbnail_url
  );
  if (!gaps.length) return posts;

  await Promise.all(
    gaps.map(async (p) => {
      try {
        const url = `${GRAPH}/${p.id}/children?fields=media_url,thumbnail_url,media_type&access_token=${encodeURIComponent(token)}`;
        const res = await fetch(url);
        if (!res.ok) return;
        const data = await res.json();
        const first = (data.data || [])[0];
        if (first) p.media_url = first.media_url || first.thumbnail_url;
      } catch (_) {
        /* pomijamy — front i tak odrzuca posty bez obrazka */
      }
    })
  );
  return posts;
}

export async function onRequestGet({ env, waitUntil, request }) {
  const kv = env.IG_KV;
  const debug = new URL(request.url).searchParams.get('debug') === '1';

  // 1. Świeży cache — oddajemy natychmiast, bez ruszania API Meta (pomijane w trybie debug).
  if (kv && !debug) {
    try {
      const cached = await kv.get(FEED_KEY, { type: 'json' });
      if (cached && Date.now() - cached.at < CACHE_SECONDS * 1000) {
        return json({ data: cached.data, cached: true });
      }
    } catch (_) {
      /* brak cache to nie błąd */
    }
  }

  const token = await getToken(env);
  if (!token) {
    return json({ data: [], error: 'no_token' }, 200);
  }

  try {
    let posts;
    if (CURATED_IDS.length) {
      // Tryb kuratorski: dokładnie te posty, w tej kolejności.
      posts = await fetchCurated(CURATED_IDS, token);
    } else {
      const raw = await fetchRecent(token);
      posts = raw.filter((p) => p.media_type !== 'STORY');
    }

    posts = await fillCarousels(posts, token);
    posts = posts.filter((p) => p.media_url || p.thumbnail_url).slice(0, 6);

    if (debug) {
      // Podgląd ID/opisów do skopiowania do CURATED_IDS — bez tokenu, bez cache.
      return json({
        data: posts.map((p) => ({
          id: p.id,
          caption: (p.caption || '').slice(0, 90),
          permalink: p.permalink,
          timestamp: p.timestamp,
        })),
      });
    }

    posts = posts.map((p) => ({
      id: p.id,
      caption: p.caption || '',
      media_type: p.media_type,
      media_url: p.media_url,
      thumbnail_url: p.thumbnail_url,
      permalink: p.permalink,
      timestamp: p.timestamp,
    }));

    if (kv) {
      waitUntil(kv.put(FEED_KEY, JSON.stringify({ at: Date.now(), data: posts })));
    }

    return json({ data: posts });
  } catch (err) {
    if (kv) {
      const stale = await kv.get(FEED_KEY, { type: 'json' });
      if (stale) return json({ data: stale.data, stale: true });
    }
    return json({ data: [], error: 'fetch_failed' }, 200);
  }
}
