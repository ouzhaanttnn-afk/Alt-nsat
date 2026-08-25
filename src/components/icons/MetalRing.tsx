import Svg, { Circle, Defs, LinearGradient, RadialGradient, Stop } from 'react-native-svg';

/**
 * [YENİ] Referans tasarımı (cepkaynak-referans-ekran3.html) — CSS'te
 * `conic-gradient` ile dönen altın metal halka kullanılmış; react-native-svg
 * conic/sweep gradyan desteklemediği için köşegen bir LinearGradient ile
 * (koyu altın → parlak altın → koyu altın) metal parlaklığı taklit ediliyor.
 * Işıltı (glow) ayrıca kullanan bileşenin kendi View'ında shadowColor/
 * shadowRadius ile veriliyor (bkz. DukkanScreen topBar).
 */
export function MetalRing({ size, strokeWidth = 3 }: { size: number; strokeWidth?: number }) {
  const r = (size - strokeWidth) / 2;
  const c = size / 2;
  const gradId = `metalRing-${size}-${strokeWidth}`;
  return (
    <Svg width={size} height={size} style={{ position: 'absolute' }}>
      <Defs>
        <LinearGradient id={gradId} x1="15%" y1="0%" x2="85%" y2="100%">
          <Stop offset="0%" stopColor="#A9761E" />
          <Stop offset="28%" stopColor="#F7DE9B" />
          <Stop offset="52%" stopColor="#E8B44A" />
          <Stop offset="76%" stopColor="#F7DE9B" />
          <Stop offset="100%" stopColor="#A9761E" />
        </LinearGradient>
      </Defs>
      <Circle cx={c} cy={c} r={r} stroke={`url(#${gradId})`} strokeWidth={strokeWidth} fill="none" />
    </Svg>
  );
}

/**
 * [YENİ] Referans tasarımının `radial-gradient(circle at 34% 28%, ...)` iç
 * dolgusu — avatar/zil halkasının içindeki koyu mor "derinlik" hissi.
 */
export function RadialOrb({
  size,
  colorStart,
  colorEnd,
}: {
  size: number;
  colorStart: string;
  colorEnd: string;
}) {
  const c = size / 2;
  // [DÜZELTME] `url(#id)` referansında id içinde ham "#" karakteri (renk
  // hex kodundan) geçersiz/kırılgan bir fragment oluşturuyordu — bazı
  // durumlarda dolgu hiç render olmuyordu. id artık yalnızca alfasayısal.
  const gradId = `radialOrb-${size}-${colorStart.replace('#', '')}`;
  return (
    <Svg width={size} height={size} style={{ position: 'absolute' }}>
      <Defs>
        <RadialGradient id={gradId} cx="34%" cy="28%" r="75%">
          <Stop offset="0%" stopColor={colorStart} />
          <Stop offset="100%" stopColor={colorEnd} />
        </RadialGradient>
      </Defs>
      <Circle cx={c} cy={c} r={c} fill={`url(#${gradId})`} />
    </Svg>
  );
}
