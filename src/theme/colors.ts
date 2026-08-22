// Bölüm 1 - Kimlik ve Ton: "esnaf defteri" görsel dili.
// Neon/glassmorphism/emoji YOK — mat, düz renk, ince kontur.
export const colors = {
  // Zemin — eskimiş kâğıt/esnaf defteri tonu
  paper: '#E7DBBE',
  paperDark: '#DCCBA0',

  // Vurgu — bordo
  accent: '#7A2331',
  accentDark: '#5E1B26',

  // Metal — pirinç/eski altın (mat, parlak sarı DEĞİL)
  brass: '#8C6A21',
  brassDark: '#6E5119',

  // Dijital ekran (terazi/LCD panelleri)
  lcdBg: '#AEBB92',
  lcdText: '#20280F',

  // Metin ve kontur
  ink: '#20180F',
  inkMuted: '#5A4E3C',
  border: '#20180F',

  // Durum renkleri (rozet/uyarı için, mat tonlarda)
  positive: '#3B6B3E',
  warning: '#A57A1F',
  negative: '#8C2A2A',

  white: '#FBF6E8',
} as const;

export type ColorToken = keyof typeof colors;
