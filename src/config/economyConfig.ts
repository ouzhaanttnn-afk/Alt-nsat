// GDD Bölüm 32 — "Ekonomi değerlerini merkezi config/data yapısında tut."
// Bu dosya, useGameStore.ts'teki oyun motorunun okuduğu TÜM ekonomi
// sabitlerini tek yerde toplar. Dengeleme (balancing) için buradaki
// sayılar değiştirilebilir; oyun mantığının kendisi (store) bu dosyaya
// bakarak çalışır, sayıları kod içine gömmez.

// ---- Zaman / Saat (Bölüm 22 temeli) ----------------------------------
export const MINUTES_PER_DAY = 1440;
// Oyun saatinin gerçek zamana oranı: 1x hızda 1 gün ≈ 8 gerçek dakika.
export const GAME_MINUTES_PER_REAL_SECOND_AT_1X = 3;
// Uygulama arka planda uzun süre kaldıysa tek tick'te aşırı sıçramayı önler.
export const MAX_REAL_SECONDS_PER_TICK = 5;

// ---- Sermaye (Bölüm 2) --------------------------------------------------
// Oyuncu 1 kg has altınla başlar — ayrı bir "rezerv" yok, tamamı gün 1
// fiyatından doğrudan kullanılabilir nakde çevrilir.
export const STARTING_CAPITAL_GRAMS = 1000;
export const STARTING_REFERENCE_PRICE = 6845; // TL, gram altın referans (orta) fiyatı
// Bölüm 2: Sermaye Kademeleri — her yeni kademe bir Yetenek Ağacı puanı kazandırır.
export const CAPITAL_TIERS = [100000, 500000, 2000000, 10000000, 50000000, 250000000];

// ---- Piyasa / Dinamik Fiyat + Makas (Bölüm 4.4) -------------------------
// Referans (orta) fiyat her 30 oyun-dakikasında bir kez ±%3-5 rastgele
// hareket eder. Aynı anda birden fazla 30-dakikalık eşik geçilirse
// (yüksek hız / uzun tick), o kadar bağımsız adım art arda uygulanır.
export const MARKET_STEP_MINUTES = 30;
export const MARKET_STEP_MIN_PERCENT = 3;
export const MARKET_STEP_MAX_PERCENT = 5;
// Uygulama kapatılıp yeniden açıldığında (rehydration) referans fiyata
// bir kez daha ekstra ±%3-5 dalgalanma uygulanır.
export const RESTART_FLUCTUATION_MIN_PERCENT = 3;
export const RESTART_FLUCTUATION_MAX_PERCENT = 5;
// ALIŞ/SATIŞ makası artık sabit bir oran değil, piyasa koşuluna göre
// (her 30 dakikalık adımda yeniden belirlenen) TL/gram bandı: dar/sakin
// piyasada ~150 TL, oynak piyasada ~400 TL'ye kadar açılabilir.
export const MARKET_SPREAD_MIN_TL_PER_GRAM = 150;
export const MARKET_SPREAD_MAX_TL_PER_GRAM = 400;

// ---- Toptancı (Bölüm 5) --------------------------------------------------
// Toptancı, genel piyasa SATIŞ fiyatının şu kadar TL/gram ALTINDAN
// oyuncuya satar (oyuncunun kâr marjı buradan gelir) ve genel piyasa
// ALIŞ/bozdurma fiyatının şu kadar TL/gram ÜSTÜNDEN oyuncudan alır —
// iki bağımsız marj, aynı 30 dakikalık adımda yeniden belirlenir.
export const WHOLESALER_MARGIN_MIN_TL_PER_GRAM = 20;
export const WHOLESALER_MARGIN_MAX_TL_PER_GRAM = 40;

// Toptancı Güveni: borç aldığında bir vade başlar, vadeyi geç ödersen
// güven düşer. Güven eşiğin altındaysa toptancı artık kredi vermez.
export const STARTING_WHOLESALER_TRUST = 65;
export const LOAN_TERM_DAYS = 5;
export const LATE_PAYMENT_TRUST_PENALTY = 15;
export const MIN_TRUST_FOR_CREDIT = 30;

// ---- Gelen Müşteri Akışı (Bölüm 6) --------------------------------------
// Dükkâna sürekli akan müşteri: hem "satın almak" hem "bozdurmak"
// isteyen müşteriler oyunun ilk dakikasından itibaren aynı havuzdan gelir.
export const INCOMING_CUSTOMER_CHECKS_PER_DAY = 20;
export const INCOMING_CUSTOMER_TRIGGER_PROBABILITY = 1;
export const INCOMING_CUSTOMER_EXPIRY_MINUTES = 90;
// Yeni bir müşteri geldiğinde alım (satış) mı yoksa bozdurma mı istediği
// yarı yarıya rastgele belirlenir.
export const BOZDURMA_DIRECTION_PROBABILITY = 0.5;
// Bozdurma müşterilerinin nadiren getirdiği büyük, karışık ayarlı hurda
// parti (200g-2kg) — "büyük işlem" çeşitliliği (Bölüm 10).
export const BOZDURMA_BULK_LOT_PROBABILITY = 0.12;
export const BOZDURMA_BULK_LOT_MIN_GRAMS = 200;
export const BOZDURMA_BULK_LOT_MAX_GRAMS = 2000;

// ---- Teklifler (Bölüm 4.6) -----------------------------------------------
// Kaydırma çubuğuyla gönderilen bir teklif anında sonuçlanmaz, müşterinin
// düşünmesi için bir süre "bekleyen" kalır.
export const OFFER_RESOLUTION_DELAY_MINUTES = 30;

// ---- Pazarlık Teklif Aralığı + Hızlı Ön Ayarlar (Bölüm 7/8) --------------
// Sadece müşteriden alım/bozdurma modunda (dükkân müşteriden alıyor):
// teklif çubuğu piyasa değerinin %80-105'i aralığında (Ölücü skili tabanı
// daha da aşağı çekebilir, bkz. PazarlikScreen). Üç hızlı ön ayar butonu
// çubuğu doğrudan bu oranlara götürür.
export const OFFER_RANGE_MIN_RATIO = 0.8;
export const OFFER_RANGE_MAX_RATIO = 1.05;
export const OFFER_PRESET_OLUCU_RATIO = 0.85;
export const OFFER_PRESET_MAKUL_RATIO = 0.95;
export const OFFER_PRESET_COMERT_RATIO = 1.02;
// Bölüm 8: Karizma — düşük bir teklif kabul edilirse hafif itibar riski,
// cömert bir teklif kabul edilirse hafif itibar kazancı. Skill'lerden
// (Sıkı Pazarlıkçı/Ölücü) bağımsız, çubuğun kendi temel davranışı.
export const LOW_OFFER_REPUTATION_PENALTY = 1;
export const GENEROUS_OFFER_REPUTATION_BONUS = 1;
