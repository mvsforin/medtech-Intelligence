/**
 * /api/search?code=NQR&limit=100&type=all
 *
 * Proxy openFDA API — resolve CORS.
 * Deduplicação por número de submissão (pma_number / k_number),
 * mantendo apenas o registro mais recente de cada produto.
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

function parseDecisionDate(raw = '') {
  if (!raw || raw.length < 8) return { date: null, year: null };
  const clean = raw.replace(/-/g, '');
  return {
    date: `${clean.substring(0,4)}-${clean.substring(4,6)}-${clean.substring(6,8)}`,
    year: clean.substring(0, 4),
  };
}

function monthsSince(dateStr = '') {
  if (!dateStr) return null;
  const d   = new Date(dateStr);
  const now = new Date();
  return (now.getFullYear() - d.getFullYear()) * 12 + (now.getMonth() - d.getMonth());
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
 * DEDUPLICAÇÃO INTELIGENTE:
 * PMA: cada produto tem um número base (P220014).
 *   A FDA registra suplementos (updates, changes) como linhas separadas
 *   com o mesmo número mas datas diferentes.
 *   → Deduplicamos por pma_number, mantendo apenas o registro mais recente.
 *
 * 510(k): cada produto tem um número único (K231234).
 *   Não há suplementos no banco 510k — duplicatas são raras mas podem
 *   ocorrer por erro de indexação.
 *   → Deduplicamos por k_number.
 */
function deduplicatePMA(rows) {
  const map = new Map();
  for (const r of rows) {
    const key = r.pma_number;
    if (!map.has(key)) {
      map.set(key, r);
    } else {
      // Manter o registro com decision_date mais recente
      const existing = map.get(key);
      if ((r.decision_date || '') > (existing.decision_date || '')) {
        map.set(key, r);
      }
    }
  }
  return Array.from(map.values());
}

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

  const { code, limit = '100', skip = '0', type = 'all', sort = 'decision_date:desc' } = req.query;

  if (!code) return res.status(400).json({ error: 'Parâmetro "code" obrigatório. Ex: ?code=NQR' });

  const productCode = code.toUpperCase().trim();
  const lim = Math.min(parseInt(limit, 10) || 100, 100);
  const sk  = parseInt(skip, 10) || 0;

  try {
    const results = [];

    // ── 510(k) ──────────────────────────────────────────────────────────────
    if (type === 'all' || type === '510k') {
      const { results: raw510 } = await fetchFDA('510k', {
        search: `product_code:${productCode}`,
        limit: lim, skip: sk, sort,
      });

      // Deduplicar por k_number
      const deduped = deduplicate510k(raw510);

      for (const r of deduped) {
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
          anvisa_status: anvisa.status,
          anvisa_label:  anvisa.label,
          anvisa_note:   anvisa.note,
          is_opportunity: anvisa.status === 'open' && months !== null && months <= 24,
        });
      }
    }

    // ── PMA ─────────────────────────────────────────────────────────────────
    if (type === 'all' || type === 'pma') {
      // Buscar com limit maior para garantir que pegamos todos os suplementos
      // antes de deduplicar (assim temos a versão mais recente de cada produto)
      const { results: rawPMA } = await fetchFDA('pma', {
        search: `product_code:${productCode}`,
        limit: 100, sort,
      });

      // Deduplicar por pma_number — mantém só o mais recente de cada produto
      const deduped = deduplicatePMA(rawPMA);

      for (const r of deduped) {
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

    // Ordenar: sem ANVISA primeiro, depois mais recente
    results.sort((a, b) => {
      const stOrder = { open: 0, check: 1, taken: 2 };
      const diff = (stOrder[a.anvisa_status] || 0) - (stOrder[b.anvisa_status] || 0);
      if (diff !== 0) return diff;
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
    return res.status(500).json({ ok: false, error: err.message, product_code: productCode });
  }
}
