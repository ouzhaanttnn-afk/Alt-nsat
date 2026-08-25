// [YENİ] Premium mor+altın referans tasarımı — sadece Dükkân/pazarlık
// akışındaki bileşenlerin (GlassCard + içindeki metin/rozet/buton renkleri)
// ortak paleti. Uygulamanın geri kalanının (Stok/Yetenekler/Profil/
// Müşteriler) mevcut krem/altın `theme/colors.ts` kimliği DEĞİŞMEDİ.
// [DÜZELTME] Paneller belirgin şekilde zengin mor olacak şekilde daha
// opak/doygun tonlara çekildi — önceki düşük opaklıklı overlay, koyu zemin
// üzerinde "neredeyse siyaha kaçan mor" gibi okunuyordu.
export const glass = {
  ink: '#F4ECFF',
  inkMuted: '#C8B8D9',
  inkFaint: '#9A87B8',
  gold: '#E3B83F',
  goldBright: '#F0C95A',
  goldDeep: '#A9761E',
  purple: '#812ED0',
  purpleBright: '#9A45E8',
  purpleDeep: '#6E24B8',
  purpleSoft: 'rgba(154, 69, 232, 0.24)',
  // Zengin, belirgin mor cam panel — düşük opaklıklı overlay yerine
  // koyu zeminden net ayrışan, doygun bir mor zemin.
  panelBg: 'rgba(58, 32, 91, 0.92)',
  panelBgAlt: 'rgba(50, 27, 82, 0.92)',
  border: 'rgba(227, 184, 63, 0.55)',
  borderSoft: 'rgba(227, 184, 63, 0.32)',
  chipBg: 'rgba(129, 46, 208, 0.16)',
  sunken: 'rgba(20, 8, 34, 0.55)',
  positive: '#3FCB82',
  negative: '#E8697A',
  warning: '#E0A94A',
} as const;
