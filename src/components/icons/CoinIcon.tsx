import Svg, { Circle } from 'react-native-svg';
import { colors } from '../../theme';

// Bölüm 3: Ürün Mini İllüstrasyonları — yatırım altını (gram/çeyrek/
// yarım/tam/karışık hurda) için sikke formunda, dolgulu sade SVG.
// RingIcon'dan (ince halka) ayırt edilsin diye dolgulu iç disk + kenar.
export function CoinIcon({ size = 32 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 32 32">
      <Circle cx={16} cy={16} r={13} fill={colors.brass} opacity={0.18} />
      <Circle cx={16} cy={16} r={13} fill="none" stroke={colors.brass} strokeWidth={2.5} />
      <Circle cx={16} cy={16} r={7.5} fill="none" stroke={colors.brass} strokeWidth={1.4} opacity={0.7} />
    </Svg>
  );
}
