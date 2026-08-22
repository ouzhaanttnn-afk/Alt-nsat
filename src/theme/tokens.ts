// Fintech-tarzı modernizasyon: daha yumuşak köşe, ince kontur yerine hafif
// gölge ile derinlik. Neon/cam efekti yok — gölge çok düşük opasitede.
export const radius = {
  sm: 8,
  md: 12,
} as const;

export const border = {
  width: 1,
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

export const shadow = {
  shadowColor: '#0F172A',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.06,
  shadowRadius: 10,
  elevation: 2,
} as const;
