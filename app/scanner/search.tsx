import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  Pressable,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Colors } from '@/constants/colors';
import { fetchPubChem } from '@/services/drug/pubchem';

interface SearchHit {
  inn: string;
  brandNames: string[];
}

export default function SearchScreen() {
  const { prefill } = useLocalSearchParams<{ prefill?: string }>();
  const router = useRouter();
  const [query, setQuery] = useState(prefill ?? '');
  const [results, setResults] = useState<SearchHit[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = useCallback(async () => {
    if (!query.trim()) return;
    setLoading(true);
    setSearched(true);
    try {
      const data = await fetchPubChem(query.trim().toLowerCase());
      if (data?.inn) {
        setResults([{ inn: data.inn, brandNames: data.brandNames ?? [] }]);
      } else {
        setResults([]);
      }
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, [query]);

  return (
    <View style={styles.container}>
      <View style={styles.searchRow}>
        <TextInput
          style={styles.input}
          value={query}
          onChangeText={setQuery}
          placeholder="Enter medicine or INN name"
          placeholderTextColor={Colors.textSecondary}
          returnKeyType="search"
          onSubmitEditing={handleSearch}
          autoFocus
        />
        <Pressable style={styles.searchBtn} onPress={handleSearch}>
          <Text style={styles.searchBtnText}>Search</Text>
        </Pressable>
      </View>

      {loading && <ActivityIndicator color={Colors.clinicalBlue} style={{ marginTop: 32 }} />}

      {!loading && searched && results.length === 0 && (
        <Text style={styles.empty}>No results found. Try a different spelling.</Text>
      )}

      <FlatList
        data={results}
        keyExtractor={(item) => item.inn}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <Pressable
            style={styles.resultCard}
            onPress={() =>
              router.push({ pathname: '/drug/[name]', params: { name: item.inn } })
            }
          >
            <Text style={styles.resultInn}>{item.inn}</Text>
            {item.brandNames.length > 0 && (
              <Text style={styles.resultBrands}>
                {item.brandNames.slice(0, 3).join(', ')}
              </Text>
            )}
          </Pressable>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  searchRow: {
    flexDirection: 'row',
    margin: 16,
    gap: 8,
  },
  input: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 16,
    color: Colors.textPrimary,
  },
  searchBtn: {
    backgroundColor: Colors.clinicalBlue,
    borderRadius: 10,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchBtnText: { color: Colors.white, fontWeight: '600', fontSize: 15 },
  empty: {
    textAlign: 'center',
    color: Colors.textSecondary,
    marginTop: 48,
    fontSize: 15,
  },
  list: { paddingHorizontal: 16 },
  resultCard: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  resultInn: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
    textTransform: 'capitalize',
  },
  resultBrands: { marginTop: 4, color: Colors.textSecondary, fontSize: 13 },
});
