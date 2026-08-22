// Bölüm 7: Yetenek Ağacı — Tüccar / Usta / Esnaf.
// effectStatus 'active' olanlar gerçekten oyunu etkiliyor (bkz. ilgili
// ekranlardaki kod yorumları). 'pending' olanlar tam olarak modellendi
// ve puan harcanabilir ama karşılık geldikleri sistem (tamirat atölyesi,
// VIP müşteri, reklam, piyasa yenileme vb.) henüz kurulmadığı için
// etkileri o sistemler eklenince devreye girecek — sessizce yok
// sayılmıyorlar, PendingNote'ta hangi sistemi bekledikleri yazıyor.
export type SkillBranch = 'tuccar' | 'usta' | 'esnaf';
export type SkillEffectStatus = 'active' | 'pending';

export interface SkillDefinition {
  id: string;
  branch: SkillBranch;
  name: string;
  description: string;
  maxLevel: number;
  effectStatus: SkillEffectStatus;
  pendingNote?: string;
}

export const BRANCH_LABELS: Record<SkillBranch, string> = {
  tuccar: 'Tüccar',
  usta: 'Usta',
  esnaf: 'Esnaf',
};

export const skillTree: SkillDefinition[] = [
  // Tüccar
  {
    id: 'uzman-gorusu',
    branch: 'tuccar',
    name: 'Uzman Görüşü',
    description: "İşçilikli ürünlerde gerçek piyasa değerini gösterir (Sv.1 ±%15 hata → Sv.5 gizli kusurları da açığa çıkarır).",
    maxLevel: 5,
    effectStatus: 'pending',
    pendingNote: 'Ekspertiz/gizli kusur sistemi (Bölüm 5) kurulunca devreye girecek.',
  },
  {
    id: 'siki-pazarlikci',
    branch: 'tuccar',
    name: 'Sıkı Pazarlıkçı',
    description: 'Teklif kabul olma ihtimalini artırır (Sv.1 +%5 → Sv.5 +%25); aşırı kullanım itibarı hafif düşürür.',
    maxLevel: 5,
    effectStatus: 'active',
  },
  {
    id: 'olucu',
    branch: 'tuccar',
    name: 'Ölücü',
    description: 'İşçilikli ürünleri piyasa değerinin ciddi altında alma şansını artırır; agresif kullanım itibar riski taşır.',
    maxLevel: 5,
    effectStatus: 'active',
  },
  {
    id: 'piyasa-sezgisi',
    branch: 'tuccar',
    name: 'Piyasa Sezgisi',
    description: 'Fırsat Skorunu Piyasa listesinde erken (pazarlığa girmeden) gösterir.',
    maxLevel: 1,
    effectStatus: 'active',
  },
  {
    id: 'kelepir-avcisi',
    branch: 'tuccar',
    name: 'Kelepir Avcısı',
    description: 'Toptancıda nadir ürün çıkma ihtimalini artırır.',
    maxLevel: 3,
    effectStatus: 'pending',
    pendingNote: 'Piyasa\'nın günlük yenilenme/restock sistemi kurulunca devreye girecek.',
  },
  {
    id: 'sogukkanli',
    branch: 'tuccar',
    name: 'Soğukkanlı',
    description: 'Pazarlık geri sayımını uzatır.',
    maxLevel: 3,
    effectStatus: 'active',
  },

  // Usta
  {
    id: 'yeniden-dogus',
    branch: 'usta',
    name: 'Yeniden Doğuş',
    description: 'Eritip yeniden tasarım maliyetini/süresini düşürür.',
    maxLevel: 3,
    effectStatus: 'pending',
    pendingNote: 'Eritme/yeniden tasarım sistemi (Bölüm 5) kurulunca devreye girecek.',
  },
  {
    id: 'el-hassasiyeti',
    branch: 'usta',
    name: 'El Hassasiyeti',
    description: 'Tamirat başarısızlık riskini azaltır.',
    maxLevel: 3,
    effectStatus: 'pending',
    pendingNote: 'Tamir Atölyesi (Bölüm 5) kurulunca devreye girecek.',
  },
  {
    id: 'tas-ustasi',
    branch: 'usta',
    name: 'Taş Ustası',
    description: 'Pırlanta/taşlı ürünlerle çalışmayı açar.',
    maxLevel: 1,
    effectStatus: 'pending',
    pendingNote: 'Taşlı ürün işleme/üretim sistemi kurulunca devreye girecek.',
  },
  {
    id: 'hizli-cila',
    branch: 'usta',
    name: 'Hızlı Cila',
    description: 'Temizlik/parlatma süresini düşürür.',
    maxLevel: 3,
    effectStatus: 'pending',
    pendingNote: 'Temizlik/hazırlama süre sistemi (Bölüm 4.4) kurulunca devreye girecek.',
  },

  // Esnaf
  {
    id: 'guler-yuz',
    branch: 'esnaf',
    name: 'Güler Yüz',
    description: 'Müşteri sabrını uzatır (Pazarlık geri sayımına Soğukkanlı ile birlikte katkı sağlar).',
    maxLevel: 3,
    effectStatus: 'active',
  },
  {
    id: 'vip-agirlama',
    branch: 'esnaf',
    name: 'VIP Ağırlama',
    description: 'VIP müşteri sıklığını artırır.',
    maxLevel: 3,
    effectStatus: 'pending',
    pendingNote: 'VIP müşteri sistemi (Bölüm 6) kurulunca devreye girecek.',
  },
  {
    id: 'sadik-musteri-agi',
    branch: 'esnaf',
    name: 'Sadık Müşteri Ağı',
    description: 'Tekrar gelen müşteride güven daha hızlı kurulur.',
    maxLevel: 3,
    effectStatus: 'pending',
    pendingNote: 'Tekrar eden müşteri/güven takibi sistemi kurulunca devreye girecek.',
  },
  {
    id: 'sosyal-cevre',
    branch: 'esnaf',
    name: 'Sosyal Çevre',
    description: 'Reklam maliyetini düşürür.',
    maxLevel: 3,
    effectStatus: 'pending',
    pendingNote: 'Reklam sistemi kurulunca devreye girecek.',
  },
];
