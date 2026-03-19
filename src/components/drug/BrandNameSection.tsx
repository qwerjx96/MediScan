import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Colors } from '../../constants/colors';

interface BrandNameSectionProps {
  brandNames: string[];
}

export function BrandNameSection({ brandNames }: BrandNameSectionProps) {
  if (brandNames.length === 0) {
    return (
      <Text style={styles.empty}>No brand names found for this region.</Text>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.chips}>
        {brandNames.map((name) => (
          <View key={name} style={styles.chip}>
            <Text style={styles.chipText}>{name}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginTop: 4 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    backgroundColor: Colors.clinicalBlueLight,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  chipText: {
    color: Colors.clinicalBlue,
    fontSize: 13,
    fontWeight: '500',
  },
  empty: { color: Colors.textSecondary, fontSize: 14, fontStyle: 'italic' },
});
