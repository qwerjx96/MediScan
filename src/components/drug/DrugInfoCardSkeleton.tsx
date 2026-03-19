import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { Colors } from '../../constants/colors';

function SkeletonLine({ width = '100%', height = 14 }: { width?: string | number; height?: number }) {
  const opacity = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.4, duration: 700, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  return (
    <Animated.View
      style={[styles.line, { width: width as any, height, opacity }]}
    />
  );
}

export function DrugInfoCardSkeleton() {
  return (
    <View style={styles.container}>
      <SkeletonLine width="60%" height={22} />
      <View style={{ height: 8 }} />
      <SkeletonLine width="40%" height={14} />
      <View style={{ height: 24 }} />
      <SkeletonLine width="30%" height={16} />
      <View style={{ height: 8 }} />
      {[1, 2, 3].map((i) => (
        <View key={i} style={{ marginBottom: 6 }}>
          <SkeletonLine width={`${70 + i * 5}%`} />
        </View>
      ))}
      <View style={{ height: 24 }} />
      <SkeletonLine width="35%" height={16} />
      <View style={{ height: 8 }} />
      {[1, 2].map((i) => (
        <View key={i} style={{ marginBottom: 6 }}>
          <SkeletonLine width={`${60 + i * 10}%`} />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16 },
  line: {
    backgroundColor: Colors.border,
    borderRadius: 4,
  },
});
