# Cepkaynak

Türkçe, tek oyunculu, kuyumculuk temalı işletme simülasyonu / tycoon mobil oyunu.

## Teknik Yığın

- React Native (Expo) — iOS/Android tek kod tabanı
- Zustand — state yönetimi
- AsyncStorage — yerel veri
- React Native Reanimated — animasyon

## Geliştirme

```
npm install
npx expo start
```

## Klasör Yapısı

```
src/
  theme/       renk, font, spacing tokenları
  store/       zustand store'ları
  screens/     sekme ekranları (Dükkân, Piyasa, Kasam, Yatırımlar, Teklifler, Profil)
  components/  paylaşılan UI bileşenleri
  navigation/  alt sekme navigasyonu
  types/       paylaşılan tip tanımları
  data/        statik/oyun içi veri
```
