// Bölüm 1: Başlık = Zilla Slab, gövde = IBM Plex Sans, sayı/ölçüm = IBM Plex Mono.
export const fonts = {
  heading: 'ZillaSlab_600SemiBold',
  headingBold: 'ZillaSlab_700Bold',
  body: 'IBMPlexSans_400Regular',
  bodyMedium: 'IBMPlexSans_500Medium',
  bodyBold: 'IBMPlexSans_600SemiBold',
  mono: 'IBMPlexMono_500Medium',
  monoBold: 'IBMPlexMono_600SemiBold',
  // [YENİ] Referans tasarım (cepkaynak-referans-ekran3.html) — başlık
  // vurgusu Cinzel, sayı/ölçüm alanları JetBrains Mono. Şimdilik yalnızca
  // Dükkân üst profil çubuğunda kullanılıyor.
  display: 'Cinzel_600SemiBold',
  displayBold: 'Cinzel_700Bold',
  numeric: 'JetBrainsMono_500Medium',
  numericBold: 'JetBrainsMono_700Bold',
} as const;

export const fontSizes = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 20,
  xl: 26,
  xxl: 34,
} as const;
