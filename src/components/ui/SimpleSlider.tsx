import { useCallback, useRef, useState } from 'react';
import {
  LayoutChangeEvent,
  StyleSheet,
  View,
  type GestureResponderEvent,
} from 'react-native';

import { Radius } from '@/constants/layout';
import { useThemeColors } from '@/hooks/useColorScheme';

const THUMB_SIZE = 22;

interface SimpleSliderProps {
  value: number;
  minimumValue?: number;
  maximumValue?: number;
  step?: number;
  disabled?: boolean;
  onValueChange: (value: number) => void;
  onSlidingComplete?: (value: number) => void;
}

function clampValue(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function snapToStep(value: number, min: number, step: number): number {
  if (step <= 0) {
    return value;
  }
  const stepped = Math.round((value - min) / step) * step + min;
  return Number(stepped.toFixed(4));
}

export function SimpleSlider({
  value,
  minimumValue = 0,
  maximumValue = 1,
  step = 0.05,
  disabled = false,
  onValueChange,
  onSlidingComplete,
}: SimpleSliderProps) {
  const colors = useThemeColors();
  const trackWidthRef = useRef(0);
  const [trackWidth, setTrackWidth] = useState(0);

  const valueFromLocation = useCallback(
    (locationX: number) => {
      const width = trackWidthRef.current;
      if (width <= 0) {
        return value;
      }
      const ratio = clampValue(locationX / width, 0, 1);
      const raw = minimumValue + ratio * (maximumValue - minimumValue);
      return clampValue(snapToStep(raw, minimumValue, step), minimumValue, maximumValue);
    },
    [maximumValue, minimumValue, step, value],
  );

  const handleLayout = (event: LayoutChangeEvent) => {
    const width = event.nativeEvent.layout.width;
    trackWidthRef.current = width;
    setTrackWidth(width);
  };

  const handlePress = (event: GestureResponderEvent, complete: boolean) => {
    if (disabled) {
      return;
    }
    const next = valueFromLocation(event.nativeEvent.locationX);
    onValueChange(next);
    if (complete) {
      onSlidingComplete?.(next);
    }
  };

  const ratio =
    maximumValue === minimumValue
      ? 0
      : (clampValue(value, minimumValue, maximumValue) - minimumValue) /
        (maximumValue - minimumValue);
  const thumbLeft = Math.max(0, Math.min(trackWidth - THUMB_SIZE, ratio * trackWidth - THUMB_SIZE / 2));

  return (
    <View
      accessibilityRole="adjustable"
      accessibilityState={{ disabled }}
      onLayout={handleLayout}
      onStartShouldSetResponder={() => !disabled}
      onMoveShouldSetResponder={() => !disabled}
      onResponderGrant={(event) => handlePress(event, false)}
      onResponderMove={(event) => handlePress(event, false)}
      onResponderRelease={(event) => handlePress(event, true)}
      style={[styles.track, { backgroundColor: colors.border, opacity: disabled ? 0.5 : 1 }]}
    >
      <View
        pointerEvents="none"
        style={[
          styles.fill,
          {
            backgroundColor: colors.tint,
            width: `${ratio * 100}%`,
          },
        ]}
      />
      <View
        pointerEvents="none"
        style={[
          styles.thumb,
          {
            backgroundColor: colors.tint,
            borderColor: colors.surface,
            left: thumbLeft,
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    height: 36,
    borderRadius: Radius.pill,
    justifyContent: 'center',
    overflow: 'hidden',
  },
  fill: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    borderRadius: Radius.pill,
  },
  thumb: {
    position: 'absolute',
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: THUMB_SIZE / 2,
    borderWidth: 2,
    top: (36 - THUMB_SIZE) / 2,
  },
});
