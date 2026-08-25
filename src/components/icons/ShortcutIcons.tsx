import Svg, { Line, Path, Rect } from 'react-native-svg';

export interface ShortcutIconProps {
  color: string;
  size?: number;
}

// [DÜZELTME] Emoji (💎 ⚒️ 🏦) klip-art gibi duruyordu — TabIcons.tsx'teki
// sade, ince kontur (1.6px, dolgu yok) çizgi ikon diliyle birebir aynı
// üslupta çizilmiş SVG ikonlarla değiştirildi.

export function GemShortcutIcon({ color, size = 22 }: ShortcutIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M7 4h10l4 6-9 11L3 10z"
        stroke={color}
        strokeWidth={1.6}
        strokeLinejoin="round"
      />
      <Path d="M3 10h18M7 4l5 17M17 4l-5 17" stroke={color} strokeWidth={1.2} strokeLinejoin="round" />
    </Svg>
  );
}

export function HammerShortcutIcon({ color, size = 22 }: ShortcutIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x={13} y={3} width={7} height={5} rx={1} stroke={color} strokeWidth={1.6} transform="rotate(45 16.5 5.5)" />
      <Path d="M13.7 8.3 5.5 16.5" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
      <Path d="M4 20l3.5-3.5" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
    </Svg>
  );
}

export function BankShortcutIcon({ color, size = 22 }: ShortcutIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M4 9.5 12 4l8 5.5" stroke={color} strokeWidth={1.6} strokeLinejoin="round" />
      <Line x1={4} y1={9.5} x2={20} y2={9.5} stroke={color} strokeWidth={1.6} strokeLinecap="round" />
      <Line x1={6.5} y1={12} x2={6.5} y2={18} stroke={color} strokeWidth={1.5} strokeLinecap="round" />
      <Line x1={11} y1={12} x2={11} y2={18} stroke={color} strokeWidth={1.5} strokeLinecap="round" />
      <Line x1={15.5} y1={12} x2={15.5} y2={18} stroke={color} strokeWidth={1.5} strokeLinecap="round" />
      <Line x1={4} y1={20.5} x2={20} y2={20.5} stroke={color} strokeWidth={1.8} strokeLinecap="round" />
    </Svg>
  );
}
