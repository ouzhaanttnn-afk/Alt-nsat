import Svg, { Circle, Line, Path, Rect } from 'react-native-svg';

export interface TabIconProps {
  color: string;
  size?: number;
}

// Bölüm 1: emoji yok — sade, ince kontur (1.5px) çizgi ikonlar.
// Her ikon 24x24 birim ızgarada, dolgu yok, sadece stroke.

export function ShopTabIcon({ color, size = 22 }: TabIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M4 9.5 5.5 4h13L20 9.5" stroke={color} strokeWidth={1.6} strokeLinejoin="round" />
      <Path
        d="M4 9.5c0 1.4 1.1 2.5 2.5 2.5S9 10.9 9 9.5c0 1.4 1.1 2.5 2.5 2.5S14 10.9 14 9.5c0 1.4 1.1 2.5 2.5 2.5S19 10.9 19 9.5"
        stroke={color}
        strokeWidth={1.6}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path d="M5 12v7h14v-7" stroke={color} strokeWidth={1.6} strokeLinejoin="round" />
      <Rect x={10} y={14} width={4} height={5} stroke={color} strokeWidth={1.4} />
    </Svg>
  );
}

export function SafeTabIcon({ color, size = 22 }: TabIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x={4} y={4} width={16} height={16} rx={1.5} stroke={color} strokeWidth={1.6} />
      <Circle cx={12} cy={12} r={3.5} stroke={color} strokeWidth={1.4} />
      <Line x1={12} y1={12} x2={12} y2={9.2} stroke={color} strokeWidth={1.4} strokeLinecap="round" />
      <Line x1={7} y1={7} x2={7.01} y2={7} stroke={color} strokeWidth={1.8} strokeLinecap="round" />
    </Svg>
  );
}

export function OffersTabIcon({ color, size = 22 }: TabIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M6 4h9l3 3v13H6z" stroke={color} strokeWidth={1.6} strokeLinejoin="round" />
      <Path d="M15 4v3h3" stroke={color} strokeWidth={1.6} strokeLinejoin="round" />
      <Line x1={9} y1={12} x2={15} y2={12} stroke={color} strokeWidth={1.4} strokeLinecap="round" />
      <Line x1={9} y1={15.5} x2={15} y2={15.5} stroke={color} strokeWidth={1.4} strokeLinecap="round" />
    </Svg>
  );
}

export function SkillTabIcon({ color, size = 22 }: TabIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx={12} cy={9} r={5} stroke={color} strokeWidth={1.6} />
      <Path d="M9 13.2 7.5 20l4.5-2.4 4.5 2.4-1.5-6.8" stroke={color} strokeWidth={1.5} strokeLinejoin="round" />
    </Svg>
  );
}

export function ProfileTabIcon({ color, size = 22 }: TabIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx={12} cy={8.5} r={3.5} stroke={color} strokeWidth={1.6} />
      <Path d="M5 20c0-3.6 3.1-6.5 7-6.5s7 2.9 7 6.5" stroke={color} strokeWidth={1.6} strokeLinecap="round" />
    </Svg>
  );
}
