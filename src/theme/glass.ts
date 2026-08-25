// [YENİ] Premium mor+altın referans tasarımı — sadece Dükkân/pazarlık
// akışındaki bileşenlerin (GlassCard + içindeki metin/rozet/buton renkleri)
// ortak paleti. Uygulamanın geri kalanının (Stok/Yetenekler/Profil/
// Müşteriler) mevcut krem/altın `theme/colors.ts` kimliği DEĞİŞMEDİ.
export const glass = {
  ink: '#F1E6FF',
  inkMuted: '#B7A6D9',
  inkFaint: '#8B7AAE',
  gold: '#D4AF37',
  goldBright: '#F3D77A',
  goldDeep: '#9C7A1E',
  purple: '#7B4FC9',
  purpleBright: '#A97EE8',
  purpleSoft: 'rgba(123, 79, 201, 0.22)',
  border: 'rgba(212, 175, 55, 0.5)',
  borderSoft: 'rgba(212, 175, 55, 0.28)',
  chipBg: 'rgba(255, 255, 255, 0.05)',
  sunken: 'rgba(0, 0, 0, 0.22)',
  positive: '#3FCB82',
  negative: '#E8697A',
  warning: '#E0A94A',
} as const;
