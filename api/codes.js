/**
 * /api/codes
 * Catálogo de especialidades e códigos FDA verificados.
 * Códigos confirmados diretamente na openFDA API por produto referência.
 *
 * GXQ = Dura, Substitute/Regeneration Matrix (DuraGen, Integra) ✓ VERIFICADO
 * NQR = Sealant, Dural (DuraSeal, CraniSeal) ✓ VERIFICADO
 * KZE = Injector, Jet, Hypodermic — ERRADO para dural, removido
 */

export const CATALOG = {
  neuro: {
    name: 'Neurocirurgia',
    icon: '🧠',
    groups: {
      'Dural': [
        { code: 'NQR', label: 'Selante Dural', submission: ['PMA'], cls: 'III',
          description: 'Hidrogéis e selantes para fechamento watertight da dura-máter' },
        { code: 'GXQ', label: 'Substituto / Membrana Dural', submission: ['510k'], cls: 'II',
          description: 'Matrizes de regeneração dural — DuraGen (Integra), colágeno e similares' },
      ],
      'Válvulas / Shunt LCR': [
        { code: 'JXG', label: 'Válvulas e Shunts Hidrocefalia', submission: ['510k'], cls: 'II',
          description: 'Válvulas programáveis, gravitacionais e sistemas de shunt LCR' },
      ],
      'DVE': [
        { code: 'JXG', label: 'Drenagem Ventricular Externa (DVE)', submission: ['510k'], cls: 'II',
          description: 'Sistemas de drenagem externa de LCR e cateteres EVD' },
      ],
      'Cateteres': [
        { code: 'OEI', label: 'Cateter Impregnado Antibiótico', submission: ['510k'], cls: 'II',
          description: 'Cateteres ventriculares impregnados com antibiótico ou prata' },
      ],
      'Neuroendoscopia': [
        { code: 'GZA', label: 'Endoscópio Intraventricular', submission: ['510k'], cls: 'II',
          description: 'Sistemas neuroendoscópicos e neuronavegação' },
      ],
    },
  },

  ortho: {
    name: 'Ortopedia',
    icon: '🦴',
    groups: {
      'Viscossuplementação': [
        { code: 'MOZ', label: 'HA Intra-articular', submission: ['PMA'], cls: 'III',
          description: 'Todos os PMAs de viscossuplementação aprovados FDA' },
      ],
      'Próteses Articulares': [
        { code: 'JWH', label: 'Prótese Joelho (cimentada)', submission: ['510k'], cls: 'II',
          description: 'TKA — artroplastia total de joelho cimentada' },
        { code: 'MBH', label: 'Prótese Joelho (não-cimentada)', submission: ['510k'], cls: 'II',
          description: 'TKA — fixação biológica' },
        { code: 'LZO', label: 'Prótese Quadril', submission: ['510k'], cls: 'II',
          description: 'THA — artroplastia total de quadril' },
        { code: 'PHX', label: 'Prótese Ombro Reversa', submission: ['510k'], cls: 'II',
          description: 'Reverse shoulder arthroplasty' },
      ],
      'Robótica Ortopédica': [
        { code: 'OLO', label: 'Sistema Robótico Ortopédico', submission: ['510k'], cls: 'II',
          description: 'Robôs cirúrgicos para joelho, quadril e coluna' },
      ],
      'Artroscopia': [
        { code: 'MAI', label: 'Âncora Biodegradável', submission: ['510k'], cls: 'II',
          description: 'Âncoras absorvíveis para tecidos moles' },
        { code: 'MBI', label: 'Âncora Não-degradável', submission: ['510k'], cls: 'II',
          description: 'Âncoras metálicas para artroscopia' },
      ],
      'Coluna Vertebral': [
        { code: 'MAX', label: 'Fusão Lombar (PLIF/TLIF/LLIF)', submission: ['510k'], cls: 'II',
          description: 'Cages e implantes de fusão lombar' },
        { code: 'ODP', label: 'Fusão Cervical (ACDF)', submission: ['510k'], cls: 'II',
          description: 'Cages e placas de fusão cervical' },
      ],
      'Enxertos / Bone Void': [
        { code: 'MQV', label: 'Substituto Ósseo (TCP/HA)', submission: ['510k'], cls: 'II',
          description: 'Fillers ósseos de cálcio e bifásicos' },
      ],
    }
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
        { code: 'GEI', label: 'Ablação de Próstata (UroLift/Rezum)', submission: ['510k', 'PMA'], cls: 'III',
          description: 'Sistemas minimamente invasivos para HPB' },
      ],
      'Stents': [
        { code: 'FRB', label: 'Stent Ureteral', submission: ['510k'], cls: 'II',
          description: 'Stents ureterais simples e revestidos' },
      ],
    }
  },

  derm: {
    name: 'Derm / Estética',
    icon: '✨',
    groups: {
      'Preenchedores': [
        { code: 'LMH', label: 'Preenchedor Dérmico HA', submission: ['PMA'], cls: 'III',
          description: 'Fillers de ácido hialurônico (PMA Classe III)' },
      ],
      'Bioestimuladores': [
        { code: 'NWW', label: 'Bioestimulador PLLA / CaHA', submission: ['PMA'], cls: 'III',
          description: 'Sculptra, Radiesse e similares' },
      ],
      'Laser / Energia': [
        { code: 'GZU', label: 'Laser Fracionado', submission: ['510k'], cls: 'II',
          description: 'Lasers ablativos e não-ablativos' },
        { code: 'IYO', label: 'Radiofrequência (RF)', submission: ['510k'], cls: 'II',
          description: 'RF monopolar, bipolar e fracionada' },
        { code: 'QIH', label: 'HIFU / Ultrassom Focado', submission: ['510k'], cls: 'II',
          description: 'Ultherapy, Sofwave e similares' },
      ],
      'Fios': [
        { code: 'OYK', label: 'Fios de Sustentação PDO/PLLA', submission: ['510k'], cls: 'II',
          description: 'Thread lift com fios absorvíveis' },
      ],
    }
  }
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
      codes: codes.map(c => ({ code: c.code, label: c.label, cls: c.cls })),
    })),
  }));

  return res.status(200).json({ ok: true, specialties: summary });
}
