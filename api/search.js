/**
 * /api/search?code=NQR&limit=100&type=all
 *
 * Proxy openFDA API — resolve CORS.
 *
 * LÓGICA DE DEDUPLICAÇÃO:
 * PMAs da FDA registram cada suplemento (update, label change, etc.)
 * como linha separada com o mesmo número P mas data diferente.
 * → Deduplicamos por pma_number mantendo a data MAIS ANTIGA = aprovação original.
 * → O ano exibido é o ano real de aprovação do produto no mercado.
 *
 * Para calcular "oportunidade <24m" usamos a data ORIGINAL,
 * não a data de suplementos recentes.
 */

const FDA_BASE = 'https://api.fda.gov/device';

const BR_SUBSIDIARIES = new Set([
  'medtronic','stryker','zimmer','biomet','johnson','depuy','synthes',
  'smith nephew','arthrex','b braun','braun','olympus','abbott','baxter',
  'becton','galderma','allergan','abbvie','coloplast','boston scientific',
  'sanofi','genzyme','ferring','fidia','aesculap','karl storz','integra',
  'codman','conmed','cook medical',
]);

const CORP_SUFFIXES = [
  /\bInc\.?\b/gi,/\bLtd\.?\b/gi,/\bLLC\b/gi,/\bCorp\.?\b/gi,
  /\bGmbH\b/gi,/\bAG\b/gi,/\bBV\b/gi,/\bSA\b/gi,/\bSRL\b/gi,
  /\bSpA\b/gi,/\bKG\b/gi,/\bPLC\b/gi,/\bGroup\b/gi,
  /\bHoldings?\b/gi,/\bInternational\b/gi,/\bMedical\b/gi,
  /\bHealthcare\b/gi,/\bTherapeutics?\b/gi,/\bBiotech\b/gi,
  /\bSurgical\b/gi,/\bOrthopedics?\b/gi,/\bBiosciences?\b/gi,
  /\bUSA\b/gi,/\bBrasil\b/gi,/\bAmerica\b/gi,
];

function normalizeBrand(applicant = '') {
  let brand = applicant.trim();
  for (const re of CORP_SUFFIXES) brand = brand.replace(re, '');
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

function parseDate(raw = '') {
  if (!raw || raw.length < 8) return { date: null, year: null };
  const c = raw.replace(/-/g, '');
  return {
    date: `${c.slice(0,4)}-${c.slice(4,6)}-${c.slice(6,8)}`,
    year: c.slice(0, 4),
  };
}

function monthsSince(dateStr = '') {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  const n = new Date();
  return (n.getFullYear() - d.getFullYear()) * 12 + (n.getMonth() - d.getMonth());
}

async function fetchFDA(endpoint, params) {
  const url = new URL(`${FDA_BASE}/${endpoint}.json`);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  const resp = await fetch(url.toString(), {
    headers: { 'User-Agent': 'MedTech-Intelligence/1.0' },
    signal: AbortSignal.timeout(15000),
  });
  if (resp.status === 404) return { results: [] };
  if (!resp.ok) throw new Error(`FDA API ${resp.status}`);
  const data = await resp.json();
  return { results: data.results || [] };
}

/**
 * Deduplicação PMA:
 * - Agrupa por pma_number
 * - Mantém a data MAIS ANTIGA (aprovação original)
 * - Mantém o nome e applicant do registro original
 */
function deduplicatePMA(rows) {
  const map = new Map();
  for (const r of rows) {
    const key = r.pma_number;
    if (!map.has(key)) {
      map.set(key, r);
    } else {
      // Manter o registro com decision_date MAIS ANTIGA = aprovação original
      const existing = map.get(key);
      if ((r.decision_date || '99999999') < (existing.decision_date || '99999999')) {
        map.set(key, r);
      }
    }
  }
  return Array.from(map.values());
}

/**
 * Deduplicação 510(k):
 * - Cada k_number é único por design — sem suplementos
 * - Deduplicamos apenas por segurança contra indexação dupla
 */
function deduplicate510k(rows) {
  const seen = new Set();
  return rows.filter(r => {
    if (seen.has(r.k_number)) return false;
    seen.add(r.k_number);
    return true;
  });
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Cache-Control', 'public, s-maxage=3600');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const { code, limit = '100', skip = '0', type = 'all' } = req.query;
  if (!code) return res.status(400).json({ error: 'Parâmetro "code" obrigatório. Ex: ?code=NQR' });

  const productCode = code.toUpperCase().trim();
  const lim = Math.min(parseInt(limit, 10) || 100, 100);
  const sk  = parseInt(skip, 10) || 0;

  try {
    const results = [];

    // ── 510(k) ──────────────────────────────────────────────────────────────
    if (type === 'all' || type === '510k') {
      const { results: raw } = await fetchFDA('510k', {
        search: `product_code:${productCode}`,
        limit: lim, skip: sk,
        sort: 'decision_date:desc',
      });

      for (const r of deduplicate510k(raw)) {
        const { date, year } = parseDate(r.decision_date);
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
          anvisa_status: anvisa.status,
          anvisa_label:  anvisa.label,
          anvisa_note:   anvisa.note,
          // Oportunidade: aprovado há <24 meses e sem ANVISA
          is_opportunity: anvisa.status === 'open' && months !== null && months <= 24,
        });
      }
    }

    // ── PMA ─────────────────────────────────────────────────────────────────
    if (type === 'all' || type === 'pma') {
      // Buscar com sort ASC para que o registro mais antigo (original) venha primeiro
      // Isso facilita a deduplicação — o primeiro registro de cada P-number é o original
      const { results: raw } = await fetchFDA('pma', {
        search: `product_code:${productCode}`,
        limit: 100,
        sort: 'decision_date:asc',  // ASC = mais antigo primeiro = aprovação original
      });

      // Deduplicar mantendo o mais antigo = aprovação original
      for (const r of deduplicatePMA(raw)) {
        const { date, year } = parseDate(r.decision_date);
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

    // Ordenar: oportunidades primeiro, depois mais recente
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
    return res.status(500).json({ ok: false, error: err.message, product_code: productCode });
  }
}
