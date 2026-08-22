import Svg, { Circle, Path } from 'react-native-svg';
import { colors } from '../../theme';

// Bölüm 1: İmza bileşen — dairesel "ayar onaylı" mühür. Ürün kartlarının
// üzerine hafif taşan konumda kullanılır (bkz. OpportunityCard).
export function SealIcon({ size = 40 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 40 40">
      <Circle
        cx={20}
        cy={20}
        r={18}
        fill={colors.surface}
        stroke={colors.accent}
        strokeWidth={1.5}
      />
      <Circle
        cx={20}
        cy={20}
        r={13}
        fill="none"
        stroke={colors.accent}
        strokeWidth={1}
        strokeDasharray="2 2"
      />
      <Path
        d="M13 20.5 L18 25.5 L27.5 14.5"
        fill="none"
        stroke={colors.accent}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
