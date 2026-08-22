// Vitrin Alıcısı: pasif gelir akışının yanında, ara sıra vitrindeki bir
// takı için gerçek bir müşteri çıkıp vade beklemeden anında satın almak
// ister. Aynı anda en fazla bir aktif teklif olur; süresi dolarsa (ya da
// hedef ürün vadesi dolup vitrinden kalkarsa) fırsat kaybolur.
export interface VitrinSaleInquiry {
  id: string;
  itemId: string;
  itemName: string;
  customerName: string;
  offerAmountTl: number;
  expiresAtTotalMinutes: number;
}
