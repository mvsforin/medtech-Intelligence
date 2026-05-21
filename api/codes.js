/**
 * /api/codes
 * Catálogo de especialidades e códigos FDA — todos verificados na openFDA.
 *
 * NEUROCIRURGIA — Códigos verificados:
 *   JXG = CNS Fluid Shunt & Components (válvulas, shunts, DVE, reservatórios) — 258 registros
 *   GWM = Pressure, Intracranial, Monitoring (monitor PIC) — 105 registros
 *   GWG = Endoscope, Neuro (neuroendoscópios) — verificado
 *   NQR = Sealant, Dural (PMA Classe III) — 104 PMAs
 *   GXQ = Dura, Substitute (membrana dural) — 43 registros
 *
 * NOTA IMPORTANTE sobre JXG:
 *   O FDA classifica no mesmo código: válvulas programáveis, gravitacionais,
 *   shunts VP/VA/LP, DVE com e sem antibiótico, reservatórios Ommaya/Rickham.
 *   A separação por subgrupo é feita pelo sistema via filtro de nome do dispositivo.
 */

export const CATALOG = {
  neuro: {
    name: 'Neurocirurgia',
    icon: '🧠',
    groups: {

      // ── GRUPO 1: TRATAMENTO DA HIDROCEFALIA ──────────────────────────────
      // JXG = CNS Fluid Shunt & Components
      // Inclui: válvulas programáveis, gravitacionais, shunts VP/VA/LP
      'Hidrocefalia — Válvulas': [
        {
          code: 'JXG',
          label: 'Válvulas Programáveis',
          desc:  'Válvulas com pressão ajustável por imã externo — Miethke, Sophysa, Medtronic Strata',
          filter: 'programmable',
        },
        {
          code: 'JXG',
          label: 'Válvulas de Pressão Fixa',
          desc:  'Válvulas com pressão diferencial fixada na fabricação',
          filter: 'fixed',
        },
        {
          code: 'JXG',
          label: 'Shunts VP / VA Completos',
          desc:  'Sistemas completos de shunt ventriculoperitoneal e ventriculoatrial',
          filter: 'shunt',
        },
        {
          code: 'JXG',
          label: 'Shunts Lomboperitoneal (LP)',
          desc:  'Shunts lomboperitoneal para hidrocefalia comunicante e hipertensão intracraniana idiopática',
          filter: 'lumboperitoneal',
        },
      ],

      // ── GRUPO 2: DVE — DRENAGEM VENTRICULAR EXTERNA ──────────────────────
      // JXG = mesmo código, diferenciado por nome/características do produto
      'DVE — Drenagem Ventricular Externa': [
        {
          code: 'JXG',
          label: 'DVE Padrão (sem antibiótico)',
          desc:  'Sistemas de drenagem ventricular externa — silicone e polissulfona',
          filter: 'EVD',
        },
        {
          code: 'JXG',
          label: 'DVE com Antibiótico Impregnado',
          desc:  'Cateteres EVD impregnados com rifampicina/clindamicina — Bactiseal e similares',
          filter: 'bactiseal antibiotic',
        },
        {
          code: 'JXG',
          label: 'DVE com Prata (antimicrobiano)',
          desc:  'Cateteres impregnados com nanopartículas de prata — Spiegelberg Silverline',
          filter: 'silver antimicrobial',
        },
      ],

      // ── GRUPO 3: RESERVATÓRIOS ────────────────────────────────────────────
      // JXG = reservatórios burr-hole para acesso ventricular
      'Reservatórios': [
        {
          code: 'JXG',
          label: 'Reservatórios Ommaya / Rickham',
          desc:  'Reservatórios burr-hole para quimioterapia intratecal e acesso ventricular',
          filter: 'reservoir',
        },
      ],

      // ── GRUPO 4: DURAL ────────────────────────────────────────────────────
      'Dural': [
        {
          code: 'NQR',
          label: 'Selante Dural',
          desc:  'Hidrogéis e selantes para fechamento watertight da dura-máter (PMA Classe III)',
          filter: null,
        },
        {
          code: 'GXQ',
          label: 'Substituto / Membrana Dural',
          desc:  'Matrizes de regeneração dural — DuraGen (Integra), colágeno e derivados',
          filter: null,
        },
      ],

      // ── GRUPO 5: MONITORIZAÇÃO DE PIC ─────────────────────────────────────
      // GWM = Pressure, Intracranial, Monitoring — código próprio, 105 registros
      'Monitorização de PIC': [
        {
          code: 'GWM',
          label: 'Monitor de Pressão Intracraniana',
          desc:  'Sensores e sistemas de monitorização de PIC — Codman, Camino, Pressio, Neurovent, Spiegelberg',
          filter: null,
        },
      ],

      // ── GRUPO 6: NEUROENDOSCOPIA ──────────────────────────────────────────
      // GWG = Endoscope, Neuro
      'Neuroendoscopia': [
        {
          code: 'GWG',
          label: 'Neuroendoscópio / Ventriculoscópio',
          desc:  'Endoscópios intraventriculares para ETV, cistos e tumores — Aesculap, Karl Storz, KSEA',
          filter: null,
        },
      ],

    },
  },

  ortho: {
    name: 'Ortopedia',
    icon: '🦴',
    groups: {
      'Viscossuplementação': [
        { code: 'MOZ', label: 'HA Intra-articular', filter: null,
          desc: 'Todos os PMAs de viscossuplementação aprovados FDA' },
      ],
      'Próteses Articulares': [
        { code: 'JWH', label: 'Prótese Joelho (cimentada)', filter: null,
          desc: 'TKA — artroplastia total de joelho cimentada' },
        { code: 'MBH', label: 'Prótese Joelho (não-cimentada)', filter: null,
          desc: 'TKA — fixação biológica' },
        { code: 'LZO', label: 'Prótese Quadril', filter: null,
          desc: 'THA — artroplastia total de quadril' },
        { code: 'PHX', label: 'Prótese Ombro Reversa', filter: null,
          desc: 'Reverse shoulder arthroplasty' },
      ],
      'Robótica Ortopédica': [
        { code: 'OLO', label: 'Sistema Robótico Ortopédico', filter: null,
          desc: 'Robôs cirúrgicos para joelho, quadril e coluna' },
      ],
      'Artroscopia': [
        { code: 'MAI', label: 'Âncora Biodegradável', filter: null,
          desc: 'Âncoras absorvíveis para tecidos moles' },
        { code: 'MBI', label: 'Âncora Não-degradável', filter: null,
          desc: 'Âncoras metálicas para artroscopia' },
      ],
      'Coluna Vertebral': [
        { code: 'MAX', label: 'Fusão Lombar (PLIF/TLIF/LLIF)', filter: null,
          desc: 'Cages e implantes de fusão lombar' },
        { code: 'ODP', label: 'Fusão Cervical (ACDF)', filter: null,
          desc: 'Cages e placas de fusão cervical' },
      ],
      'Enxertos / Bone Void': [
        { code: 'MQV', label: 'Substituto Ósseo (TCP/HA)', filter: null,
          desc: 'Fillers ósseos de cálcio e bifásicos' },
      ],
    },
  },

  uro: {
    name: 'Urologia',
    icon: '🫀',
    groups: {
      'Incontinência': [
        { code: 'LYT', label: 'Sling Uretral', filter: null,
          desc: 'Slings masculinos e femininos para incontinência urinária' },
        { code: 'FTO', label: 'Esfíncter Urinário Artificial', filter: null,
          desc: 'AUS — artificial urinary sphincter' },
      ],
      'Disfunção Erétil': [
        { code: 'FTR', label: 'Implante Peniano Inflável', filter: null,
          desc: 'Próteses penianas de 2 e 3 peças' },
      ],
      'Próstata': [
        { code: 'GEI', label: 'Ablação de Próstata', filter: null,
          desc: 'UroLift, Rezum, Aquablation e similares' },
      ],
      'Stents': [
        { code: 'FRB', label: 'Stent Ureteral', filter: null,
          desc: 'Stents ureterais simples e revestidos' },
      ],
    },
  },

  derm: {
    name: 'Derm / Estética',
    icon: '✨',
    groups: {
      'Preenchedores': [
        { code: 'LMH', label: 'Preenchedor Dérmico HA', filter: null,
          desc: 'Fillers de ácido hialurônico (PMA Classe III)' },
      ],
      'Bioestimuladores': [
        { code: 'NWW', label: 'Bioestimulador PLLA / CaHA', filter: null,
          desc: 'Sculptra, Radiesse e similares' },
      ],
      'Laser / Energia': [
        { code: 'GZU', label: 'Laser Fracionado', filter: null,
          desc: 'Lasers ablativos e não-ablativos' },
        { code: 'IYO', label: 'Radiofrequência (RF)', filter: null,
          desc: 'RF monopolar, bipolar e fracionada' },
        { code: 'QIH', label: 'HIFU / Ultrassom Focado', filter: null,
          desc: 'Ultherapy, Sofwave e similares' },
      ],
      'Fios': [
        { code: 'OYK', label: 'Fios de Sustentação PDO/PLLA', filter: null,
          desc: 'Thread lift com fios absorvíveis' },
      ],
    },
  },
};

export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 'public, s-maxage=86400');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { specialty } = req.query;

  if (specialty) {
    const data = CATALOG[specialty.toLowerCase()];
    if (!data) return res.status(404).json({ error: `Especialidade "${specialty}" não encontrada` });
    return res.status(200).json({ ok: true, specialty: data });
  }

  const summary = Object.entries(CATALOG).map(([key, spec]) => ({
    key,
    name:   spec.name,
    icon:   spec.icon,
    groups: Object.entries(spec.groups).map(([grp, codes]) => ({
      group: grp,
      codes: codes.map(c => ({ code: c.code, label: c.label })),
    })),
  }));

  return res.status(200).json({ ok: true, specialties: summary });
}
