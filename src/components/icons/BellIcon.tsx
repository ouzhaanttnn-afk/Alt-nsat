import Svg, { Path } from 'react-native-svg';

// Aynı ince kontur (1.6px) çizgi ikon dili — header'daki Müşteriler zili.
export function BellIcon({ color, size = 22 }: { color: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M6 10.5c0-3.3 2.7-6 6-6s6 2.7 6 6v3.2l1.6 3.1H4.4L6 13.7z"
        stroke={color}
        strokeWidth={1.6}
        strokeLinejoin="round"
      />
      <Path d="M9.5 19a2.5 2.5 0 0 0 5 0" stroke={color} strokeWidth={1.6} strokeLinecap="round" />
    </Svg>
  );
}
