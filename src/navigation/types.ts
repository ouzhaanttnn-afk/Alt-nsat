// Mockup birleşimi: Dükkân artık gelen müşteriyle pazarlığı (hem alış/
// bozdurma hem satış) doğrudan kendi içinde, ayrı bir modal ekrana
// gitmeden gösteriyor (bkz. NegotiationPanel). Bu yüzden ayrı bir
// Pazarlık rota/modalı ve Stack.Navigator artık gerekmiyor — tek
// seviyeli sekme navigasyonu yeterli.
export type MainTabsParamList = {
  Dükkân: undefined;
  Müşteriler: undefined;
  Stok: undefined;
  Yetenekler: undefined;
  Profil: undefined;
};
