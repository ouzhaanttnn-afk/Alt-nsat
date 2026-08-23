import Svg, { Circle, Path } from 'react-native-svg';
import { colors } from '../../theme';

// Bölüm 3: Ürün Mini İllüstrasyonları — bilezik için açık uçlu, kalın
// bantlı oval SVG. RingIcon (ince tam halka) ve CoinIcon'dan (dolgulu
// disk) görsel olarak ayırt edilir.
export function BraceletIcon({ size = 32 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 32 32">
      <Path
        d="M16 4 C23 4 28 9.5 28 16 C28 22.5 23 28 16 28 C9 28 4 22.5 4 16 C4 12.7 5.3 9.7 7.5 7.5"
        fill="none"
        stroke={colors.brass}
        strokeWidth={3}
        strokeLinecap="round"
      />
      <Circle cx={7.5} cy={7.5} r={1.8} fill={colors.brass} />
    </Svg>
  );
}
