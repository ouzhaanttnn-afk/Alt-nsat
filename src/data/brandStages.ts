// Bölüm 28-29: Kurumsal Marka — v1 için bilinçli olarak sınırlı tutulan
// (GDD'nin kendi ifadesiyle "capped scope") uç oyun (end-game) merdiveni.
// Şubeleşme → Marka Yönetimi → Kurumsallaşma sırayla, her biri bir önceki
// sahiplenilmeden alınamaz; seviye kapısı GDD'nin "asla ilerlemeyi parayla
// tamamen atlatma" ilkesini korur (para tek başına yetmez, seviye de gerekir).
// Sahip olunan her kademe kalıcı, kümülatif bir günlük nakit geliri katar.
export interface BrandStage {
  id: string;
  name: string;
  description: string;
  requiredLevel: number;
  costTl: number;
  dailyIncomeTl: number;
}

export const BRAND_STAGES: BrandStage[] = [
  {
    id: 'subelesme',
    name: 'Şubeleşme',
    description: 'İkinci bir şube açarsın — sabit bir ek günlük gelir kazandırır.',
    requiredLevel: 20,
    costTl: 2000000,
    dailyIncomeTl: 5000,
  },
  {
    id: 'marka-yonetimi',
    name: 'Marka Yönetimi',
    description: 'Markanı profesyonelce yönetmeye başlarsın — daha büyük bir günlük gelir.',
    requiredLevel: 35,
    costTl: 8000000,
    dailyIncomeTl: 20000,
  },
  {
    id: 'kurumsallasma',
    name: 'Kurumsallaşma',
    description: 'Kuyumcun artık kurumsal bir marka — en yüksek pasif gelir seviyesi.',
    requiredLevel: 50,
    costTl: 30000000,
    dailyIncomeTl: 75000,
  },
];
