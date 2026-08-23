import type { ScaleReading } from '../components/ScalePanel';
import type { NegotiationCustomer, NegotiationProduct } from '../types/negotiation';

// Adım 3: Pazarlık Ekranı modal olarak ana sekmelerin üzerine açılıyor.
// Parametre verilmezse Ana Ekran'daki varsayılan bozdurma senaryosu
// kullanılır (bkz. PazarlikScreen); Piyasa'daki farklı senaryolar bu
// parametrelerle aynı ekranı yeniden kullanır.
// mode 'alis' (varsayılan): oyuncu satın alıyor, terazi/kredi mantığı devrede.
// mode 'satis': dükkâna gelen bir müşteriye satış — terazi yok, anında sonuçlanır.
export interface PazarlikParams {
  customer: NegotiationCustomer;
  product: NegotiationProduct;
  scaleReading?: ScaleReading;
  mode?: 'alis' | 'satis';
  /**
   * Bölüm 6: bu pazarlık, dükkâna gelen bir bozdurma müşterisinden
   * (incomingCustomer) başladıysa onun id'si — pazarlık sonuçlandığında
   * (kabul/red/gönderildi/süre doldu) store'daki incomingCustomer'ı
   * temizlemek için kullanılır.
   */
  incomingCustomerId?: string;
}

export type RootStackParamList = {
  MainTabs: undefined;
  Pazarlik: PazarlikParams | undefined;
};

// Bölüm 4: Ana sekmeler — Dükkân'dan Teklifler sekmesine geçiş gibi
// sekmeler-arası gezinme için (bkz. DukkanScreen'in tip birleşimi).
export type MainTabsParamList = {
  Dükkân: undefined;
  Piyasa: undefined;
  Kasam: undefined;
  Teklifler: undefined;
  Profil: undefined;
};
