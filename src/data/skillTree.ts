import {
  GULER_YUZ_PATIENCE_MINUTES_PER_LEVEL,
  OLUCU_REPUTATION_PENALTY_PER_LEVEL,
  SIKI_PAZARLIKCI_THRESHOLD_REDUCTION_PER_LEVEL,
  SOGUKKANLI_PATIENCE_MINUTES_PER_LEVEL,
  UZMAN_GORUSU_BASE_ERROR_PERCENT,
  UZMAN_GORUSU_ERROR_REDUCTION_PER_LEVEL,
  YENIDEN_DOGUS_TIME_REDUCTION_PER_LEVEL,
} from '../config/economyConfig';

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
    description: "İşçilikli ürünlerde gerçek ayarı gösterir (Sv.1 ±%15 hata → Sv.5 gizli kusurları da açığa çıkarır); yatırılmadıkça sadece müşterinin beyanı görünür.",
    maxLevel: 5,
    effectStatus: 'active',
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
    description: 'Eritme süresini kısaltır (Sv.1 %15 → Sv.3 %45 daha hızlı).',
    maxLevel: 3,
    effectStatus: 'active',
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
    description: 'Taşlı/pırlanta işçilikli ürünleri eritirken taşın ayrı değerini kurtarır — yoksa taş eritmede kaybolur.',
    maxLevel: 1,
    effectStatus: 'active',
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

/**
 * v2 UX iyileştirmesi (Bölüm 9): "sadece Yükselt butonu değil, oyuncu tam
 * olarak ne değiştiğini bilmeli" — bir yeteneğin GÜNCEL seviyesindeki somut
 * etkisini tek satırlık, gerçek formüllerden türetilmiş bir metne çevirir.
 * effectStatus 'pending' olan ya da level 0'daki yetenekler için null döner
 * (henüz gösterilecek somut bir etki yok).
 */
export function formatSkillEffect(skillId: string, level: number): string | null {
  if (level <= 0) return null;
  switch (skillId) {
    case 'uzman-gorusu': {
      const errorPercent = Math.max(0, UZMAN_GORUSU_BASE_ERROR_PERCENT - (level - 1) * UZMAN_GORUSU_ERROR_REDUCTION_PER_LEVEL);
      return level >= 5
        ? `Şu an: gerçek ayarı ±%${errorPercent} hata payıyla tahmin ediyor, gizli kusurları da gösteriyor.`
        : `Şu an: gerçek ayarı ±%${errorPercent} hata payıyla tahmin ediyor.`;
    }
    case 'siki-pazarlikci': {
      const percent = Math.round(level * SIKI_PAZARLIKCI_THRESHOLD_REDUCTION_PER_LEVEL * 100);
      return `Şu an: müşterinin kabul eşiği %${percent} daha düşük.`;
    }
    case 'olucu': {
      const penalty = level * OLUCU_REPUTATION_PENALTY_PER_LEVEL;
      return `Şu an: agresif düşük teklif kabul edilirse -${penalty} karizma riski (daha ucuza alma şansı için).`;
    }
    case 'piyasa-sezgisi':
      return 'Şu an: Fırsat Skoru, pazarlığa girmeden Piyasa listesinde görünüyor.';
    case 'sogukkanli': {
      const minutes = level * SOGUKKANLI_PATIENCE_MINUTES_PER_LEVEL;
      return `Şu an: müşteri sabrı +${minutes} dk.`;
    }
    case 'guler-yuz': {
      const minutes = level * GULER_YUZ_PATIENCE_MINUTES_PER_LEVEL;
      return `Şu an: müşteri sabrı +${minutes} dk.`;
    }
    case 'yeniden-dogus': {
      const percent = Math.round(Math.min(0.75, level * YENIDEN_DOGUS_TIME_REDUCTION_PER_LEVEL) * 100);
      return `Şu an: eritme süresi %${percent} daha hızlı.`;
    }
    case 'tas-ustasi':
      return 'Şu an: taşlı ürünlerde taşın ayrı değeri eritmede korunuyor.';
    default:
      return null;
  }
}
