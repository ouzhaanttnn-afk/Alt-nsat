// Bölüm 1 kimliği (bordo/pirinç/mühür) korunuyor, zemin "esnaf defteri"
// kağıt dokusundan modern/fintech açık gri yüzeye taşındı.
// Neon/glassmorphism/emoji hâlâ YOK — düz renk, hafif gölge, ince kontur.
export const colors = {
  // Zemin — açık, nötr gri (fintech dashboard hissi)
  background: '#F2F3F5',
  surface: '#FFFFFF',

  // Vurgu — bordo (marka rengi, korunuyor)
  accent: '#7A2331',
  accentDark: '#5E1B26',
  accentSoft: '#F7E9EB',

  // Metal — pirinç/eski altın (mat, parlak sarı DEĞİL)
  brass: '#8C6A21',
  brassDark: '#6E5119',

  // Dijital ekran (terazi/LCD panelleri) — imza bileşen, korunuyor
  lcdBg: '#AEBB92',
  lcdText: '#20280F',

  // Metin ve kontur — nötr gri skala
  ink: '#1C1E21',
  inkMuted: '#6B7280',
  border: '#E3E5EA',

  // Durum renkleri (rozet/uyarı için, mat tonlarda)
  positive: '#1F8A55',
  warning: '#B4791C',
  negative: '#C23B3B',

  white: '#FFFFFF',
} as const;

export type ColorToken = keyof typeof colors;
