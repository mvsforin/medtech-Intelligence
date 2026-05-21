/**
 * /api/search?code=NQR&limit=100&skip=0&type=510k
 *
 * Proxy para openFDA API — resolve CORS do browser.
 * Chamado pelo front toda vez que o usuário seleciona especialidade + produto.
 * Dados sempre atuais (FDA atualiza semanalmente).
 */

const FDA_BASE = 'https://api.fda.gov/device';

// Fabricantes com subsidiária confirmada no Brasil
// (evita falsos positivos — cf. normalize_brand do Radar)
const BR_SUBSIDIARIES = new Set([
  'medtronic','stryker','zimmer','biomet','johnson','depuy','synthes',
  'smith nephew','arthrex','b braun','braun','olympus','abbott','baxter',
  'becton','galderma','allergan','abbvie','coloplast','boston scientific',
  'sanofi','genzyme','ferring','fidia','aesculap','karl storz','integra',
  'codman','conmed','cook medical',
]);

// Sufixos corporativos para normalização de nome
const CORP_SUFFIXES = [
  /\bInc\.?\b/gi, /\bLtd\.?\b/gi, /\bLLC\b/gi, /\bCorp\.?\b/gi,
  /\bGmbH\b/gi, /\bAG\b/gi, /\bBV\b/gi, /\bSA\b/gi, /\bSRL\b/gi,
  /\bSpA\b/gi, /\bKG\b/gi, /\bPLC\b/gi, /\bGroup\b/gi,
  /\bHoldings?\b/gi, /\bInternational\b/gi, /\bMedical\b/gi,
  /\bHealthcare\b/gi, /\bTherapeutics?\b/gi, /\bBiotech\b/gi,
  /\bSurgical\b/gi, /\bOrthopedics?\b/gi, /\bBiosciences?\b/gi,
  /\bUSA\b/gi, /\bBrasil\b/gi, /\bAmerica\b/gi,
];

function normalizeBrand(applicant = '') {
  let brand = applicant.trim();
  for (const re of CORP_SUFFIXES) {
    brand = brand.replace(re, '');
  }
  return brand.replace(/\s+/g, ' ').replace(/[.,;()\-]+$/g, '').trim().toLowerCase();
}

function hasBrSubsidiary(applicant = '') {
  const brand = normalizeBrand(applicant);
  for (const known of BR_SUBSIDIARIES) {
    if (brand.includes(known) || known.includes(brand)) return true;
  }
  return false;
}

function anvisaStatus(applicant = '') {
  if (hasBrSubsidiary(applicant)) {
    return { status: 'check', label: 'Verificar', note: 'Fabricante com presença no Brasil — verificar portfólio exato.' };
  }
  return { status: 'open', label: 'Sem ANVISA', note: 'Sem registro ANVISA identificado — candidato a prospecção.' };
}

function parseDecisionDate(raw = '') {
  if (!raw || raw.length < 8) return { date: null, year: null };
  // FDA retorna YYYYMMDD
  const clean = raw.replace(/-/g, '');
  const year  = clean.substring(0, 4);
  const month = clean.substring(4, 6);
  const day   = clean.substring(6, 8);
  return {
    date: `${year}-${month}-${day}`,
    year,
  };
}

function monthsSince(dateStr = '') {
  if (!dateStr) return null;
  const d    = new Date(dateStr);
  const now  = new Date();
  const diff = (now.getFullYear() - d.getFullYear()) * 12 + (now.getMonth() - d.getMonth());
  return diff;
}

async function fetchFDA(endpoint, params) {
  const url = new URL(`${FDA_BASE}/${endpoint}.json`);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);

  const resp = await fetch(url.toString(), {
    headers: { 'User-Agent': 'MedTech-Intelligence/1.0' },
    signal: AbortSignal.timeout(15000),
  });

  if (resp.status === 404) return { results: [], total: 0 };
  if (!resp.ok) throw new Error(`FDA API ${resp.status}: ${url}`);

  const data = await resp.json();
  return {
    results: data.results || [],
    total:   data.meta?.results?.total || 0,
  };
}

export default async function handler(req, res) {
  // CORS — permite chamadas do GitHub Pages e localhost
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Cache-Control', 'public, s-maxage=3600'); // cache 1h na Vercel

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const {
    code,
    limit = '100',
    skip  = '0',
    type  = 'all',  // all | 510k | pma
    sort  = 'decision_date:desc',
  } = req.query;

  if (!code) {
    return res.status(400).json({ error: 'Parâmetro "code" obrigatório. Ex: ?code=NQR' });
  }

  const productCode = code.toUpperCase().trim();
  const lim  = Math.min(parseInt(limit, 10) || 100, 100);
  const sk   = parseInt(skip, 10) || 0;

  try {
    const results = [];

    // ── 510(k) ────────────────────────────────────────────────────────────
    if (type === 'all' || type === '510k') {
      const { results: rows510, total } = await fetchFDA('510k', {
        search: `product_code:${productCode}`,
        limit:  lim,
        skip:   sk,
        sort,
      });

      for (const r of rows510) {
        const { date, year } = parseDecisionDate(r.decision_date);
        const anvisa = anvisaStatus(r.applicant);
        const months = monthsSince(date);

        results.push({
          fda_number:    r.k_number,
          submission:    '510(k)',
          device_name:   r.device_name || '',
          applicant:     r.applicant   || '',
          country_code:  r.country_code || 'US',
          decision_date: date,
          year,
          months_since:  months,
          product_code:  r.product_code || productCode,
          device_class:  r.device_class || 'II',
          // ANVISA
          anvisa_status: anvisa.status,
          anvisa_label:  anvisa.label,
          anvisa_note:   anvisa.note,
          // Flag de oportunidade: FDA aprovado <24 meses e sem ANVISA identificado
          is_opportunity: anvisa.status === 'open' && months !== null && months <= 24,
        });
      }
    }

    // ── PMA ───────────────────────────────────────────────────────────────
    if (type === 'all' || type === 'pma') {
      const { results: rowsPMA } = await fetchFDA('pma', {
        search: `product_code:${productCode}`,
        limit:  Math.min(lim, 50),
        sort,
      });

      for (const r of rowsPMA) {
        const { date, year } = parseDecisionDate(r.decision_date);
        const anvisa = anvisaStatus(r.applicant);
        const months = monthsSince(date);

        results.push({
          fda_number:    r.pma_number,
          submission:    'PMA',
          device_name:   r.trade_name || r.generic_name || '',
          applicant:     r.applicant  || '',
          country_code:  'US',
          decision_date: date,
          year,
          months_since:  months,
          product_code:  r.product_code || productCode,
          device_class:  'III',
          anvisa_status: anvisa.status,
          anvisa_label:  anvisa.label,
          anvisa_note:   anvisa.note,
          is_opportunity: anvisa.status === 'open' && months !== null && months <= 24,
        });
      }
    }

    // Ordena: sem ANVISA primeiro, depois por data decrescente
    results.sort((a, b) => {
      const stOrder = { open: 0, check: 1, taken: 2 };
      const stDiff  = (stOrder[a.anvisa_status] || 0) - (stOrder[b.anvisa_status] || 0);
      if (stDiff !== 0) return stDiff;
      return (b.decision_date || '').localeCompare(a.decision_date || '');
    });

    return res.status(200).json({
      ok:           true,
      product_code: productCode,
      total:        results.length,
      opportunities: results.filter(r => r.is_opportunity).length,
      results,
      fetched_at:   new Date().toISOString(),
    });

  } catch (err) {
    console.error('[search]', err.message);
    return res.status(500).json({
      ok:    false,
      error: err.message,
      product_code: productCode,
    });
  }
}
