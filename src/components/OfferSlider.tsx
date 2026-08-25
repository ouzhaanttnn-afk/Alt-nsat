import { useMemo, useRef } from 'react';
import { PanResponder, StyleSheet, View } from 'react-native';
import { glass } from '../theme/glass';

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

// Bölüm 4.3: kaydırmalı teklif çubuğu. Native <Slider> yerine özel
// PanResponder tabanlı bileşen — platform varsayılan stiline bağlı kalmadan
// tasarım diline (bordo dolgu, düz uç) birebir uyum sağlar.
export function OfferSlider({
  value,
  min,
  max,
  onChange,
  disabled,
}: {
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
  disabled?: boolean;
}) {
  const trackRef = useRef<View>(null);
  const trackX = useRef(0);
  const trackWidth = useRef(0);

  const measure = () => {
    trackRef.current?.measure((_x, _y, width, _height, pageX) => {
      trackX.current = pageX;
      trackWidth.current = width;
    });
  };

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => !disabled,
        onMoveShouldSetPanResponder: () => !disabled,
        onPanResponderGrant: (evt) => {
          measure();
          const ratio = clamp(evt.nativeEvent.locationX / (trackWidth.current || 1), 0, 1);
          onChange(min + ratio * (max - min));
        },
        onPanResponderMove: (evt, gesture) => {
          const width = trackWidth.current;
          if (!width) return;
          const relativeX = gesture.moveX - trackX.current;
          const ratio = clamp(relativeX / width, 0, 1);
          onChange(min + ratio * (max - min));
        },
      }),
    [disabled, min, max, onChange],
  );

  const ratio = clamp((value - min) / (max - min), 0, 1);

  return (
    <View
      ref={trackRef}
      onLayout={measure}
      style={[styles.track, disabled && styles.trackDisabled]}
      {...panResponder.panHandlers}
    >
      <View style={[styles.fill, { width: `${ratio * 100}%` }]} />
      <View style={[styles.thumb, { left: `${ratio * 100}%` }]} />
    </View>
  );
}

const THUMB_SIZE = 20;

const styles = StyleSheet.create({
  track: {
    height: 8,
    borderRadius: 4,
    backgroundColor: glass.sunken,
    justifyContent: 'center',
  },
  trackDisabled: {
    opacity: 0.4,
  },
  fill: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    borderRadius: 4,
    backgroundColor: glass.gold,
  },
  thumb: {
    position: 'absolute',
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: THUMB_SIZE / 2,
    marginLeft: -THUMB_SIZE / 2,
    backgroundColor: glass.purpleBright,
    borderWidth: 2,
    borderColor: glass.gold,
  },
});
