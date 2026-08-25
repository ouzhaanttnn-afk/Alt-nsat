// Kuyumcu vitrini kimliği: koyu lacivert zemin + krem/fildişi kartlar +
// antika altın vurgu. Neon/glassmorphism/emoji hâlâ YOK — düz renk, hafif
// gölge, ince kontur; sadece palet ışıktan koyuya, bordodan altına taşındı.
export const colors = {
  // Zemin — koyu mistik mor-lacivert (premium kuyumcu/mistik finans hissi)
  background: '#160F26',
  // Kart yüzeyi — sıcak fildişi/krem (ekranın çoğu içerik burada yaşıyor)
  surface: '#F6EEDD',
  // Kart İÇİNDE çukur/ikincil panel (rozet, stepper, ilerleme çubuğu zemini) —
  // arka plan lacivertinden bağımsız, surface'in biraz koyusu.
  surfaceSunken: '#E9DDC0',

  // Vurgu — antika altın (marka rengi)
  accent: '#7A5C0F',
  accentDark: '#5C4509',
  accentSoft: '#F1E6C8',

  // Metal — parlak altın (ikon/pırıltı, bölüm etiketleri)
  brass: '#D4AF37',
  brassDark: '#A8841F',

  // Dijital ekran (terazi/LCD panelleri) — imza bileşen, artık altın/siyah
  lcdBg: '#0B1220',
  lcdText: '#D4AF37',

  // Metin ve kontur — krem kartların üzerinde (uygulamanın çoğu metni)
  ink: '#2A2113',
  inkMuted: '#7A6F58',
  border: '#DCCFA8',

  // Metin — koyu lacivert zeminin ÜZERİNDE doğrudan duran metin (kart
  // içine sarılmamış başlık/alt başlık/ipucu) için ayrı, açık tonlar.
  inkOnDark: '#F3EAD3',
  inkMutedOnDark: '#B4A67D',

  // Durum renkleri (rozet/uyarı için, mat tonlarda) — krem kartlarda okunaklı
  positive: '#1F8A55',
  warning: '#B4791C',
  negative: '#C23B3B',

  white: '#FFFFFF',
} as const;

export type ColorToken = keyof typeof colors;
