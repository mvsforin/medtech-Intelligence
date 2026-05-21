/**
 * /api/codes
 *
 * Retorna o catálogo de especialidades e códigos FDA mapeados.
 * O front consome isso para montar os dropdowns dinamicamente.
 * Ao adicionar um novo código aqui, ele aparece automaticamente no front.
 */

export const CATALOG = {
  neuro: {
    name: 'Neurocirurgia',
    icon: '🧠',
    groups: {
      'Dural': [
        { code: 'NQR', label: 'Selante Dural', submission: ['PMA'], cls: 'III',
          description: 'Hidrogéis e selantes para fechamento watertight da dura-máter' },
        { code: 'KZE', label: 'Substituto / Membrana Dural', submission: ['510k'], cls: 'II-III',
          description: 'Patches, membranas e matrizes para reparo dural' },
      ],
      'Válvulas / Shunt LCR': [
        { code: 'JXG', label: 'Válvulas e Shunts Hidrocefalia', submission: ['510k'], cls: 'II',
          description: 'Válvulas programáveis, gravitacionais e sistemas de shunt LCR' },
      ],
      'DVE': [
        { code: 'JXG', label: 'Drenagem Ventricular Externa (DVE)', submission: ['510k'], cls: 'II',
          description: 'Sistemas de drenagem externa de LCR e cateteres EVD' },
      ],
      'Cateteres Impreg.': [
        { code: 'OEI', label: 'Cateter Impregnado Antibiótico', submission: ['510k'], cls: 'II',
          description: 'Cateteres ventriculares impregnados com antibiótico ou prata' },
      ],
      'Neuroendoscopia': [
        { code: 'GZA', label: 'Endoscópio Intraventricular', submission: ['510k'], cls: 'II',
          description: 'Sistemas neuroendoscópicos para ventriculoscopia e neuronavegação' },
      ],
    },
  },

  ortho: {
    name: 'Ortopedia',
    icon: '🦴',
    groups: {
      'Viscossuplementação': [
        { code: 'MOZ', label: 'Ácido Hialurônico Intra-articular', submission: ['PMA'], cls: 'III',
          description: 'Viscossuplementação articular — todos os PMAs aprovados FDA' },
      ],
      'Próteses Articulares': [
        { code: 'JWH', label: 'Prótese de Joelho (cimentada)', submission: ['510k'], cls: 'II',
          description: 'Sistemas de artroplastia total de joelho cimentados' },
        { code: 'MBH', label: 'Prótese de Joelho (não-cimentada)', submission: ['510k'], cls: 'II',
          description: 'Sistemas de artroplastia total de joelho com fixação biológica' },
        { code: 'LZO', label: 'Prótese de Quadril', submission: ['510k'], cls: 'II',
          description: 'Sistemas de artroplastia total de quadril' },
        { code: 'PHX', label: 'Prótese de Ombro Reversa', submission: ['510k'], cls: 'II',
          description: 'Sistemas de ombro reverso e anatomico' },
      ],
      'Robótica Ortopédica': [
        { code: 'OLO', label: 'Sistema Robótico Ortopédico', submission: ['510k'], cls: 'II',
          description: 'Robôs cirúrgicos e sistemas de navegação para artroplastia' },
      ],
      'Artroscopia': [
        { code: 'MAI', label: 'Âncora Biodegradável', submission: ['510k'], cls: 'II',
          description: 'Âncoras absorvíveis para reparo de tecidos moles' },
        { code: 'MBI', label: 'Âncora Não-degradável', submission: ['510k'], cls: 'II',
          description: 'Âncoras metálicas e de titânio para artroscopia' },
      ],
      'Coluna Vertebral': [
        { code: 'MAX', label: 'Fusão Lombar Intervertebral', submission: ['510k'], cls: 'II',
          description: 'Cages e implantes de fusão lombar (PLIF/TLIF/LLIF)' },
        { code: 'ODP', label: 'Fusão Cervical Intervertebral', submission: ['510k'], cls: 'II',
          description: 'Cages e placas de fusão cervical (ACDF)' },
      ],
      'Enxertos / Bone Void': [
        { code: 'MQV', label: 'Substituto Ósseo (Cálcio)', submission: ['510k'], cls: 'II',
          description: 'Fillers ósseos de TCP, HA e bifásico' },
      ],
      'Biológicos': [
        { code: 'LGX', label: 'Fat Grafting / MFAT', submission: ['510k'], cls: 'II',
          description: 'Sistemas de processamento de tecido adiposo' },
      ],
    },
  },

  uro: {
    name: 'Urologia',
    icon: '🫀',
    groups: {
      'Incontinência': [
        { code: 'LYT', label: 'Sling Uretral', submission: ['510k', 'PMA'], cls: 'III',
          description: 'Slings masculinos e femininos para incontinência urinária' },
        { code: 'FTO', label: 'Esfíncter Urinário Artificial', submission: ['PMA'], cls: 'III',
          description: 'AUS — artificial urinary sphincter' },
      ],
      'Disfunção Erétil': [
        { code: 'FTR', label: 'Implante Peniano Inflável', submission: ['510k'], cls: 'II',
          description: 'Próteses penianas de 2 e 3 peças' },
      ],
      'Próstata': [
        { code: 'GEI', label: 'Ablação de Próstata', submission: ['510k', 'PMA'], cls: 'III',
          description: 'UroLift, Rezum, Aquablation e similares' },
      ],
      'Stents / Cateteres': [
        { code: 'FRB', label: 'Stent Ureteral', submission: ['510k'], cls: 'II',
          description: 'Stents ureterais simples e revestidos' },
      ],
    },
  },

  derm: {
    name: 'Dermatologia / Estética',
    icon: '✨',
    groups: {
      'Preenchedores': [
        { code: 'LMH', label: 'Preenchedor Dérmico HA', submission: ['PMA'], cls: 'III',
          description: 'Fillers de ácido hialurônico para uso facial' },
      ],
      'Bioestimuladores': [
        { code: 'NWW', label: 'Bioestimulador (PLLA/CaHA)', submission: ['PMA'], cls: 'III',
          description: 'Sculptra (PLLA), Radiesse (CaHA) e similares' },
      ],
      'Laser / Energia': [
        { code: 'GZU', label: 'Laser Fracionado', submission: ['510k'], cls: 'II',
          description: 'Lasers ablativos e não-ablativos fracionados' },
        { code: 'IYO', label: 'Radiofrequência (RF)', submission: ['510k'], cls: 'II',
          description: 'RF monopolar, bipolar e fracionada' },
        { code: 'QIH', label: 'HIFU / Ultrassom Focado', submission: ['510k'], cls: 'II',
          description: 'Ultherapy, Sofwave e similares' },
      ],
      'Fios de Sustentação': [
        { code: 'OYK', label: 'Fios PDO / PLLA', submission: ['510k'], cls: 'II',
          description: 'Thread lift com fios absorvíveis' },
      ],
    },
  },
};

export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 'public, s-maxage=86400'); // cache 24h

  if (req.method === 'OPTIONS') return res.status(200).end();

  // Retorna catálogo completo ou filtrado por especialidade
  const { specialty } = req.query;

  if (specialty) {
    const data = CATALOG[specialty.toLowerCase()];
    if (!data) {
      return res.status(404).json({ error: `Especialidade "${specialty}" não encontrada` });
    }
    return res.status(200).json({ ok: true, specialty: data });
  }

  // Retorna sumário de todas as especialidades
  const summary = Object.entries(CATALOG).map(([key, spec]) => ({
    key,
    name:   spec.name,
    icon:   spec.icon,
    groups: Object.entries(spec.groups).map(([grp, codes]) => ({
      group: grp,
      codes: codes.map(c => ({ code: c.code, label: c.label, cls: c.cls })),
    })),
  }));

  return res.status(200).json({ ok: true, specialties: summary });
}
