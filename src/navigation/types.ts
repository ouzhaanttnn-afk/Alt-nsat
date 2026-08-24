// Mockup birleşimi: Dükkân artık gelen müşteriyle pazarlığı (hem alış/
// bozdurma hem satış) doğrudan kendi içinde, ayrı bir modal ekrana
// gitmeden gösteriyor (bkz. NegotiationPanel). Bu yüzden ayrı bir
// Pazarlık rota/modalı ve Stack.Navigator artık gerekmiyor — tek
// seviyeli sekme navigasyonu yeterli.
export type StokScrollTarget = 'iscilikli' | 'atolye' | 'yatirimlar';

export type MainTabsParamList = {
  Dükkân: undefined;
  Müşteriler: undefined;
  // Hızlı Erişim: Dükkân'dan doğrudan Stok'un ilgili bölümüne kaydırmalı
  // geçiş için opsiyonel hedef (bkz. KasamScreen'deki scroll-to efekti).
  Stok: { scrollTo?: StokScrollTarget } | undefined;
  Yetenekler: undefined;
  Profil: undefined;
};
