/**
 * /api/search?code=NQR
 *
 * Proxy openFDA API com PAGINAÇÃO COMPLETA.
 * Busca TODOS os registros do código — não apenas os primeiros 100.
 * Padrão fixo para qualquer especialidade ou código implementado.
 *
 * Lógica:
 * 1. Primeira chamada com limit=1 para saber o total real
 * 2. Calcula quantas páginas são necessárias (máx 100 por chamada)
 * 3. Executa todas as páginas em paralelo
 * 4. Deduplica por número de submissão (mantém aprovação original)
 * 5. Retorna lista completa ordenada
 */

const FDA_BASE = 'https://api.fda.gov/device';
const PAGE_SIZE = 100;        // máximo permitido pela openFDA por chamada
const MAX_PARALLEL = 5;       // chamadas paralelas simultâneas (respeita rate limit)
const TIMEOUT_MS = 20000;

// ─── ANVISA — fabricantes com subsidiária BR confirmada ─────────────────────
const BR_SUBSIDIARIES = new Set([
  'medtronic','stryker','zimmer','biomet','johnson','depuy','synthes',
  'smith nephew','arthrex','b braun','braun','olympus','abbott','baxter',
  'becton','galderma','allergan','abbvie','coloplast','boston scientific',
  'sanofi','genzyme','ferring','fidia','aesculap','karl storz','integra',
  'codman','conmed','cook medical','bd ','becton dickinson',
]);

const CORP_SUFFIXES = [
  /\bInc\.?\b/gi,/\bLtd\.?\b/gi,/\bLLC\b/gi,/\bCorp\.?\b/gi,
  /\bGmbH\b/gi,/\bAG\b/gi,/\bBV\b/gi,/\bSA\b/gi,/\bSRL\b/gi,
  /\bSpA\b/gi,/\bKG\b/gi,/\bPLC\b/gi,/\bGroup\b/gi,
  /\bHoldings?\b/gi,/\bInternational\b/gi,/\bMedical\b/gi,
  /\bHealthcare\b/gi,/\bTherapeutics?\b/gi,/\bBiotech\b/gi,
  /\bSurgical\b/gi,/\bOrthopedics?\b/gi,/\bBiosciences?\b/gi,
  /\bUSA\b/gi,/\bBrasil\b/gi,/\bAmerica\b/gi,/\bCorporation\b/gi,
];

function normalizeBrand(applicant = '') {
  let b = applicant.trim();
  for (const re of CORP_SUFFIXES) b = b.replace(re, '');
  return b.replace(/\s+/g, ' ').replace(/[.,;()\-]+$/g, '').trim().toLowerCase();
}

function hasBrSubsidiary(applicant = '') {
  const b = normalizeBrand(applicant);
  for (const known of BR_SUBSIDIARIES) {
    if (b.includes(known) || known.includes(b)) return true;
  }
  return false;
}

function anvisaStatus(applicant = '') {
  if (hasBrSubsidiary(applicant)) {
    return {
      status: 'check',
      label:  'Verificar',
      note:   'Fabricante com presença no Brasil — verificar portfólio exato.',
    };
  }
  return {
    status: 'open',
    label:  'Sem ANVISA',
    note:   'Sem registro ANVISA identificado — candidato a prospecção.',
  };
}

function parseDate(raw = '') {
  if (!raw || raw.length < 8) return { date: null, year: null };
  const c = raw.replace(/-/g, '');
  return {
    date: `${c.slice(0,4)}-${c.slice(4,6)}-${c.slice(6,8)}`,
    year:  c.slice(0, 4),
  };
}

function monthsSince(dateStr = '') {
  if (!dateStr) return null;
  const d = new Date(dateStr), n = new Date();
  return (n.getFullYear() - d.getFullYear()) * 12 + (n.getMonth() - d.getMonth());
}

// ─── Fetch com timeout ───────────────────────────────────────────────────────
async function fdaFetch(endpoint, params) {
  const url = new URL(`${FDA_BASE}/${endpoint}.json`);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, String(v));
  const resp = await fetch(url.toString(), {
    headers: { 'User-Agent': 'MedTech-Intelligence/1.0' },
    signal:  AbortSignal.timeout(TIMEOUT_MS),
  });
  if (resp.status === 404) return { results: [], total: 0 };
  if (!resp.ok) throw new Error(`FDA API ${resp.status} — ${url}`);
  const data = await resp.json();
  return {
    results: data.results || [],
    total:   data.meta?.results?.total || 0,
  };
}

// ─── Paginação completa ──────────────────────────────────────────────────────
// Busca TODOS os registros de um endpoint/código, independente do total.
// Executa páginas em lotes paralelos para não ultrapassar rate limit.
async function fetchAllPages(endpoint, productCode, sortOrder = 'decision_date:asc') {
  // 1. Descobrir o total real
  const first = await fdaFetch(endpoint, {
    search: `product_code:${productCode}`,
    limit:  1,
    skip:   0,
  });

  const total = first.total;
  if (total === 0) return [];

  // 2. Calcular páginas necessárias
  // openFDA tem limite de skip=25000 — acima disso retorna erro
  // Para bases muito grandes (JWH=911, MAX=887), buscamos até esse limite
  const maxSkip    = 25000;
  const effectiveTotal = Math.min(total, maxSkip + PAGE_SIZE);
  const pages      = Math.ceil(effectiveTotal / PAGE_SIZE);
  const skips      = Array.from({ length: pages }, (_, i) => i * PAGE_SIZE);

  console.log(`[fetchAllPages] ${endpoint}/${productCode}: ${total} total → ${pages} páginas`);

  // 3. Executar em lotes paralelos (MAX_PARALLEL por vez)
  const allResults = [];
  for (let i = 0; i < skips.length; i += MAX_PARALLEL) {
    const batch = skips.slice(i, i + MAX_PARALLEL);
    const responses = await Promise.all(
      batch.map(skip =>
        fdaFetch(endpoint, {
          search: `product_code:${productCode}`,
          limit:  PAGE_SIZE,
          skip,
          sort:   sortOrder,
        }).catch(err => {
          console.warn(`[fetchAllPages] skip=${skip} falhou: ${err.message}`);
          return { results: [] };
        })
      )
    );
    for (const r of responses) allResults.push(...r.results);
  }

  return allResults;
}

// ─── Deduplicação ────────────────────────────────────────────────────────────
// PMA: mantém a aprovação ORIGINAL (data mais antiga) de cada pma_number.
// 510k: cada k_number é único por design — deduplica por segurança.
function deduplicatePMA(rows) {
  const map = new Map();
  for (const r of rows) {
    const key = r.pma_number;
    if (!key) continue;
    if (!map.has(key)) {
      map.set(key, r);
    } else {
      // Manter o mais antigo = aprovação original
      const ex = map.get(key);
      if ((r.decision_date || '99999999') < (ex.decision_date || '99999999')) {
        map.set(key, r);
      }
    }
  }
  return Array.from(map.values());
}

function deduplicate510k(rows) {
  const seen = new Set();
  return rows.filter(r => {
    if (!r.k_number || seen.has(r.k_number)) return false;
    seen.add(r.k_number);
    return true;
  });
}

// ─── Normalização de registro ────────────────────────────────────────────────
function normalize510k(r, productCode) {
  const { date, year } = parseDate(r.decision_date);
  const anvisa = anvisaStatus(r.applicant);
  const months = monthsSince(date);
  return {
    fda_number:     r.k_number,
    submission:     '510(k)',
    device_name:    r.device_name    || '',
    applicant:      r.applicant      || '',
    country_code:   r.country_code   || 'US',
    decision_date:  date,
    year,
    months_since:   months,
    product_code:   r.product_code   || productCode,
    device_class:   r.device_class   || 'II',
    anvisa_status:  anvisa.status,
    anvisa_label:   anvisa.label,
    anvisa_note:    anvisa.note,
    is_opportunity: anvisa.status === 'open' && months !== null && months <= 24,
  };
}

function normalizePMA(r, productCode) {
  const { date, year } = parseDate(r.decision_date);
  const anvisa = anvisaStatus(r.applicant);
  const months = monthsSince(date);
  return {
    fda_number:     r.pma_number,
    submission:     'PMA',
    device_name:    r.trade_name || r.generic_name || '',
    applicant:      r.applicant  || '',
    country_code:   'US',
    decision_date:  date,
    year,
    months_since:   months,
    product_code:   r.product_code || productCode,
    device_class:   'III',
    anvisa_status:  anvisa.status,
    anvisa_label:   anvisa.label,
    anvisa_note:    anvisa.note,
    is_opportunity: anvisa.status === 'open' && months !== null && months <= 24,
  };
}

// ─── Handler principal ───────────────────────────────────────────────────────
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin',  '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  // Cache 6h na Vercel CDN — reduz chamadas repetidas, dados FDA mudam semanalmente
  res.setHeader('Cache-Control', 'public, s-maxage=21600, stale-while-revalidate=86400');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET')    return res.status(405).json({ error: 'Method not allowed' });

  const { code, type = 'all' } = req.query;

  if (!code) {
    return res.status(400).json({ error: 'Parâmetro "code" obrigatório. Ex: ?code=NQR' });
  }

  const productCode = code.toUpperCase().trim();

  try {
    const results = [];

    // ── 510(k) — busca paginada completa ────────────────────────────────────
    if (type === 'all' || type === '510k') {
      // sort ASC para deduplicação pegar o mais antigo de cada produto
      const raw = await fetchAllPages('510k', productCode, 'decision_date:asc');
      const deduped = deduplicate510k(raw);
      for (const r of deduped) results.push(normalize510k(r, productCode));
    }

    // ── PMA — busca paginada completa ────────────────────────────────────────
    if (type === 'all' || type === 'pma') {
      // sort ASC para deduplicar mantendo aprovação original
      const raw = await fetchAllPages('pma', productCode, 'decision_date:asc');
      const deduped = deduplicatePMA(raw);
      for (const r of deduped) results.push(normalizePMA(r, productCode));
    }

    // Ordenar: sem ANVISA primeiro → mais recente
    results.sort((a, b) => {
      const stO = { open: 0, check: 1, taken: 2 };
      const d = (stO[a.anvisa_status] || 0) - (stO[b.anvisa_status] || 0);
      if (d !== 0) return d;
      return (b.decision_date || '').localeCompare(a.decision_date || '');
    });

    return res.status(200).json({
      ok:            true,
      product_code:  productCode,
      total:         results.length,
      opportunities: results.filter(r => r.is_opportunity).length,
      results,
      fetched_at:    new Date().toISOString(),
    });

  } catch (err) {
    console.error('[search]', err.message);
    return res.status(500).json({
      ok:           false,
      error:        err.message,
      product_code: productCode,
    });
  }
}
