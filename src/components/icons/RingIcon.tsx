import Svg, { Circle } from 'react-native-svg';
import { colors } from '../../theme';

// Bölüm 1: İkonografi — emoji yok, halka/bilezik formunda sade SVG.
// Ürün fotoğrafı yerine jenerik ürün simgesi olarak kullanılır.
export function RingIcon({ size = 32 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 32 32">
      <Circle
        cx={16}
        cy={16}
        r={12}
        fill="none"
        stroke={colors.brass}
        strokeWidth={3}
      />
      <Circle cx={16} cy={5} r={2} fill={colors.brass} />
    </Svg>
  );
}
