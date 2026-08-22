import type { ScaleReading } from '../components/ScalePanel';
import type { NegotiationCustomer, NegotiationProduct } from '../types/negotiation';

// Adım 3: Pazarlık Ekranı modal olarak ana sekmelerin üzerine açılıyor.
// Parametre verilmezse Ana Ekran'daki varsayılan bozdurma senaryosu
// kullanılır (bkz. PazarlikScreen); Piyasa'daki büyük parti gibi farklı
// senaryolar bu parametrelerle aynı ekranı yeniden kullanır.
export interface PazarlikParams {
  customer: NegotiationCustomer;
  product: NegotiationProduct;
  scaleReading: ScaleReading;
}

export type RootStackParamList = {
  MainTabs: undefined;
  Pazarlik: PazarlikParams | undefined;
};
