import type { InventoryCategory } from '../../types/game';
import { BraceletIcon } from './BraceletIcon';
import { CoinIcon } from './CoinIcon';
import { RingIcon } from './RingIcon';

// Bölüm 3: "Ürünlerin küçük illüstrasyonları olsun, tek tip generic ikon
// tüm ürünlerde tekrar etmesin." Ürün tipine göre ayırt edici bir ikon
// seçer: sarrafiye/yatırım altını sikke, bilezik açık bant, geri kalanı
// (pırlanta, ileride yüzük/kolye/küpe) mevcut halka ikonu.
export function ProductIcon({
  category,
  name,
  size = 28,
}: {
  category: InventoryCategory;
  name: string;
  size?: number;
}) {
  if (/bilezik/i.test(name)) return <BraceletIcon size={size} />;
  if (category === 'yatirim') return <CoinIcon size={size} />;
  return <RingIcon size={size} />;
}
