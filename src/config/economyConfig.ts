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
// Bölüm 7: Soğukkanlı ve Güler Yüz müşteri sabrını (oyun-dakikası
// cinsinden) uzatır — Pazarlık ekranındaki gerçek-zamanlı sayaçtan (bkz.
// NegotiationPanel'in kendi sabitleri) bağımsız, oyun saatine bağlı ayrı bir etki.
export const SOGUKKANLI_PATIENCE_MINUTES_PER_LEVEL = 15;
export const GULER_YUZ_PATIENCE_MINUTES_PER_LEVEL = 10;
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
// daha da aşağı çekebilir, bkz. NegotiationPanel). Üç hızlı ön ayar butonu
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

// ---- Satış Modu Fiyat Aralığı + Ret Hakkı (mega-ekran birleşimi sonrası) --
// Dükkândan müşteriye satış modunda: teklif çubuğu piyasa değerinin en
// fazla %10 altına inebilir (aşırı düşük/anlamsız iskontoları önlemek
// için), tavanı ise pazarlık payı bırakır. Müşteri fiyatı çok yüksek
// bulup reddederse oyuncuya hemen kaybettirmek yerine SALE_REJECTION_ATTEMPTS
// kadar deneme hakkı tanınır — son denemede de reddederse müşteri ayrılır.
export const SALE_OFFER_MIN_RATIO = 0.9;
export const SALE_OFFER_MAX_RATIO = 1.3;
export const SALE_REJECTION_ATTEMPTS = 2;

// ---- XP / Seviye + Yetenek Sıfırlama (Bölüm 23-24/30) --------------------
// Seviye tamamen paradan bağımsız — sadece aktif alım-satımdan (toptancıdan
// restok, müşteriyle pazarlık, envanterden satış, Toptancı Bağlantısı)
// kazanılan XP ile ilerler; pasif gelirden (pırlanta vb.) asla XP gelmez.
// Hedef 50 seviye; her seviyede 1 yetenek puanı + kilometre taşlarında
// (Sv.10/20/30/40/50) ekstra puan. Sayılar Bölüm 37'nin dediği gibi
// dengeleme amaçlı başlangıç placeholder'ları.
export const LEVEL_MAX = 50;
export const XP_PER_EQUIVALENT_GRAM_TRADED = 1;
// Seviye n'e ulaşmak için gereken toplam XP: (n-1)*BASE + INCREMENT*artan basamak.
export const LEVEL_XP_BASE = 50;
export const LEVEL_XP_INCREMENT = 15;
export const SKILL_POINTS_PER_LEVEL = 1;
export const LEVEL_MILESTONES = [10, 20, 30, 40, 50];
export const MILESTONE_BONUS_SKILL_POINTS = 1;

// ---- İşçilikli Ürün + Eritme (Bölüm 11-16) -------------------------------
// Kolye/yüzük/küpe/işlemeli bilezik/taşlı gibi işçilikli ürünler müşteriden
// bozdurma yoluyla alınır ve GDD'nin açık kararı gereği ASLA başka bir
// müşteriye işçilikli ürün olarak satılmaz — her zaman eritilip has altın
// karşılığı sarrafiye stoğuna (Gram Altın) geri kazandırılır.
// Bozdurma müşterisi geldiğinde, bunun standart sarrafiye yerine işçilikli
// bir ürün getirme ihtimali:
export const CRAFTED_GOOD_CUSTOMER_PROBABILITY = 0.3;
// Uzman Görüşü yatırılmamışsa (Sv.0) müşterinin beyan ettiği ayardan farklı
// çıkma (yanlış ayar/sahtecilik) ihtimali en yüksek; skil arttıkça iddialı
// müşteriler daha az denk gelir (deneyimli kuyumcu şüpheli malı daha baştan
// eler) — Bölüm 37: "sahtecilik riski %10-20 → skil ile %2-5".
export const CRAFTED_GOOD_BASE_COUNTERFEIT_RISK = 0.2;
export const CRAFTED_GOOD_MIN_COUNTERFEIT_RISK = 0.03;
// Beyan edilenle gerçek ayar arasındaki fark, sahtecilik durumunda kaç ayar.
export const CRAFTED_GOOD_KARAT_MISMATCH = 4;
// Uzman Görüşü: Sv.1'de gerçek değeri ±%15 hata payıyla tahmin eder, her
// seviyede hata payı daralır; Sv.5'te gizli kusur/taş durumu da açığa çıkar.
export const UZMAN_GORUSU_BASE_ERROR_PERCENT = 15;
export const UZMAN_GORUSU_ERROR_REDUCTION_PER_LEVEL = 3;
// Eritme verimi (Bölüm 37 placeholder): geri kazanılan has altının oranı.
export const MELTING_EFFICIENCY_MIN = 0.92;
export const MELTING_EFFICIENCY_MAX = 0.98;
// Eritme süresi: küçük parçalar (≤50g) 1-2 dk, büyük parçalar 5-10 dk (oyun-içi).
export const MELTING_SMALL_LARGE_THRESHOLD_GRAMS = 50;
export const MELTING_TIME_SMALL_MIN_MINUTES = 1;
export const MELTING_TIME_SMALL_MAX_MINUTES = 2;
export const MELTING_TIME_LARGE_MIN_MINUTES = 5;
export const MELTING_TIME_LARGE_MAX_MINUTES = 10;
// Yeniden Doğuş: eritme süresini seviye başına kısaltır.
export const YENIDEN_DOGUS_TIME_REDUCTION_PER_LEVEL = 0.15;

// ---- 4x Hız Tekelleştirmesi (Bölüm 22) -------------------------------------
// 1x/2x/duraklat her zaman serbest; sadece 4x parayla (reklam ya da IAP)
// açılıyor. Bu, GERÇEK DÜNYA (wall-clock) süresi — Bölüm 9'un Toptancı
// Bağlantısı'ndaki 10 OYUN-dakikalık pencereyle karıştırılmamalı.
export const FOUR_X_AD_UNLOCK_MINUTES = 15;

// ---- Atölye (Bölüm 17) ----------------------------------------------------
// Oyun hızından bağımsız, sürekli çalışan pasif has altın üretimi — para
// yatırımı gerektirir (anlamlı bir fırsat maliyeti kararı), ama bir kere
// kurulduktan sonra günlük yönetim istemez. XP üretmez (Bölüm 23-24: XP
// sadece aktif alım-satımdan).
export const ATOLYE_MAX_LEVEL = 3;
export const ATOLYE_GRAMS_PER_DAY_PER_LEVEL = 0.5;
export const ATOLYE_UPGRADE_BASE_COST_TL = 150000;
export const ATOLYE_UPGRADE_COST_MULTIPLIER_PER_LEVEL = 2.2;

// ---- Takı Yatırım Paketleri (Bölüm 18-20) ---------------------------------
// 30 gün kilitli, sabit günlük getiri + vade sonunda anapara iadesi.
// Dört ayar kademesinin (8/14/18/22) TÜMÜ aynı anda aktifse (bir "koleksiyon")
// toplam günlük getiriye set bonusu uygulanır.
export const TAKI_PACKAGE_TERM_DAYS = 30;
export const TAKI_PACKAGE_SET_BONUS_MULTIPLIER = 1.1;

// ---- Büyük Bozdurmalar + Toptancı Bağlantısı (Bölüm 9) -------------------
// Müşteriden nakit yetmeyen bir alım yapılıp borca yazıldığında, oyuncu
// az önce aldığı malı hemen toptancıya (kâr marjıyla) satıp borcu
// doğuran işlemi anında kapatabilir. Bu "bağlantı" sınırlı bir oyun-içi
// süre için açık kalır; süresi dolarsa toptancı güveni düşer.
export const BROKER_DEAL_WINDOW_MINUTES = 10;
export const BROKER_DEAL_TIMEOUT_TRUST_PENALTY = 10;
