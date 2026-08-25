import { StyleSheet, Text, View } from 'react-native';
import Svg, { Defs, LinearGradient, Polygon, Stop } from 'react-native-svg';
import { fonts } from '../../theme';

/**
 * [YENİ] Referans tasarımı (cepkaynak-referans-ekran3.html) — `.shield`:
 * `clip-path:polygon(50% 0,100% 16%,100% 62%,50% 100%,0 62%,0 16%)` ile
 * çizilen kalkan rozeti. React Native'de clip-path yok; aynı köşe
 * noktaları bir SVG <Polygon> ile birebir çiziliyor.
 */
export function ShieldBadge({
  level,
  width = 30,
  height = 36,
}: {
  level: number;
  width?: number;
  height?: number;
}) {
  const gradId = `shieldGrad-${width}-${height}`;
  const points = [
    [width * 0.5, 0],
    [width, height * 0.16],
    [width, height * 0.62],
    [width * 0.5, height],
    [0, height * 0.62],
    [0, height * 0.16],
  ]
    .map(([x, y]) => `${x},${y}`)
    .join(' ');

  return (
    <View style={[styles.wrap, { width, height }]}>
      <Svg width={width} height={height} style={StyleSheet.absoluteFill}>
        <Defs>
          <LinearGradient id={gradId} x1="0%" y1="0%" x2="0%" y2="100%">
            <Stop offset="0%" stopColor="#5B2E8C" />
            <Stop offset="100%" stopColor="#33174F" />
          </LinearGradient>
        </Defs>
        <Polygon points={points} fill={`url(#${gradId})`} stroke="#E8B44A" strokeWidth={1.5} />
      </Svg>
      <Text style={styles.label}>{level}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#E8B44A',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 4,
  },
  label: {
    fontFamily: fonts.bodyBold,
    fontSize: 12,
    fontWeight: '800',
    color: '#F7DE9B',
  },
});
