import { Loading } from '@/components/loading';
import { ProductCard } from '@/components/product-card';
import { Colors, FontFamily } from '@/constants/theme';
import { useRegion } from '@/context/region-context';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { sdk } from '@/lib/sdk';
import type { HttpTypes } from '@medusajs/types';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  FlatList,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

// Produsul afișat în cardul „Cafeaua săptămânii” (handle-ul din seed-boaba.ts)
const FEATURED_PRODUCT_HANDLE = 'etiopia-yirgacheffe';

export default function HomeScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { selectedRegion } = useRegion();
  const router = useRouter();

  const [products, setProducts] = useState<HttpTypes.StoreProduct[]>([]);
  const [categories, setCategories] = useState<HttpTypes.StoreProductCategory[]>([]);
  // null înseamnă „Toate” (fără filtru)
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [featuredProduct, setFeaturedProduct] = useState<HttpTypes.StoreProduct | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { products: fetchedProducts } = await sdk.store.product.list({
        region_id: selectedRegion?.id,
        fields: '*variants.calculated_price,+variants.inventory_quantity',
        // Trimitem filtrul doar dacă e aleasă o categorie
        ...(selectedCategoryId ? { category_id: selectedCategoryId } : {}),
      });

      setProducts(fetchedProducts);
    } catch (err) {
      console.error('Failed to fetch products:', err);
      setError('Produsele nu au putut fi încărcate. Încearcă din nou.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedRegion, selectedCategoryId]);

  // Categoriile și produsul recomandat se încarcă o singură dată
  useEffect(() => {
    sdk.store.category
      .list({ fields: 'id,name,handle' })
      .then(({ product_categories }) => setCategories(product_categories))
      .catch((err) => console.error('Failed to fetch categories:', err));
  }, []);

  useEffect(() => {
    if (!selectedRegion) return;
    sdk.store.product
      .list({
        handle: FEATURED_PRODUCT_HANDLE,
        region_id: selectedRegion.id,
        fields: '+metadata', // metadata nu vine implicit, trebuie cerut
      })
      .then(({ products }) => setFeaturedProduct(products[0] ?? null))
      .catch((err) => console.error('Failed to fetch featured product:', err));
  }, [selectedRegion]);

  // Produsele se reîncarcă la schimbarea regiunii sau a categoriei
  useEffect(() => {
    if (selectedRegion) {
      fetchProducts();
    }
  }, [selectedRegion, fetchProducts]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchProducts();
  };

  const openProduct = (product: HttpTypes.StoreProduct) => {
    router.push({
      pathname: `/(home)/product/${product.id}` as any,
      params: { title: product.title },
    });
  };

  // Ecranul de încărcare complet apare doar prima dată; la schimbarea
  // categoriei păstrăm chips-urile pe ecran, ca să nu „clipească”.
  if (loading && products.length === 0 && !error) {
    return <Loading message="Se încarcă produsele..." />;
  }

  if (error) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: colors.background }]}>
        <Text style={[styles.errorText, { color: colors.text }]}>{error}</Text>
      </View>
    );
  }

  const selectedCategory = categories.find((c) => c.id === selectedCategoryId);
  const categoryChips = [{ id: null, name: 'Toate' }, ...categories];

  const header = (
    <View style={styles.header}>
      {featuredProduct && (
        <TouchableOpacity
          style={styles.hero}
          activeOpacity={0.85}
          onPress={() => openProduct(featuredProduct)}
        >
          <Image
            source={{ uri: featuredProduct.thumbnail ?? undefined }}
            style={[styles.heroImage, { backgroundColor: colors.imagePlaceholder }]}
            contentFit="cover"
          />
          {/* strat închis peste imagine, ca textul alb să se citească */}
          <View style={styles.heroOverlay} />
          <View style={styles.heroContent}>
            <Text style={styles.heroLabel}>CAFEAUA SĂPTĂMÂNII</Text>
            <Text style={styles.heroTitle}>{featuredProduct.title}</Text>
            {typeof featuredProduct.metadata?.note === 'string' && (
              <Text style={styles.heroNotes}>{featuredProduct.metadata.note}</Text>
            )}
            <View style={[styles.heroButton, { backgroundColor: colors.tint }]}>
              <Text style={[styles.heroButtonText, { color: colors.onTint }]}>Descoperă</Text>
            </View>
          </View>
        </TouchableOpacity>
      )}

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chips}
      >
        {categoryChips.map((category) => {
          const isActive = category.id === selectedCategoryId;
          return (
            <TouchableOpacity
              key={category.id ?? 'toate'}
              onPress={() => setSelectedCategoryId(category.id)}
              style={[
                styles.chip,
                {
                  backgroundColor: isActive ? colors.tint : colors.cardBackground,
                  borderColor: isActive ? colors.tint : colors.border,
                },
              ]}
            >
              <Text
                style={[
                  styles.chipText,
                  { color: isActive ? colors.onTint : colors.text },
                ]}
              >
                {category.name}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <Text style={[styles.sectionTitle, { color: colors.text }]}>
        {selectedCategory ? selectedCategory.name : 'Toate produsele'}
      </Text>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList
        data={products}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={styles.row}
        initialNumToRender={6}
        maxToRenderPerBatch={6}
        windowSize={5}
        removeClippedSubviews={true}
        ListHeaderComponent={header}
        renderItem={({ item }) => <ProductCard product={item} />}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.tint}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, { color: colors.text }]}>
              {loading ? 'Se încarcă...' : 'Nu există produse în această categorie'}
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  header: {
    width: '100%',
  },
  hero: {
    margin: 16,
    marginBottom: 8,
    height: 220,
    borderRadius: 16,
    overflow: 'hidden',
  },
  heroImage: {
    ...StyleSheet.absoluteFill,
  },
  heroOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(26, 20, 17, 0.45)',
  },
  heroContent: {
    flex: 1,
    justifyContent: 'flex-end',
    padding: 20,
  },
  heroLabel: {
    color: '#F7F1E8',
    fontSize: 12,
    letterSpacing: 1.5,
    fontFamily: FontFamily.semiBold,
  },
  heroTitle: {
    color: '#FFFFFF',
    fontSize: 26,
    marginTop: 4,
    fontFamily: FontFamily.title,
  },
  heroNotes: {
    color: '#F7F1E8',
    fontSize: 14,
    marginTop: 4,
    fontFamily: FontFamily.regular,
  },
  heroButton: {
    alignSelf: 'flex-start',
    marginTop: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  heroButtonText: {
    fontSize: 14,
    fontFamily: FontFamily.semiBold,
  },
  chips: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  chipText: {
    fontSize: 14,
    fontFamily: FontFamily.semiBold,
  },
  sectionTitle: {
    fontSize: 24,
    marginTop: 8,
    marginBottom: 16,
    paddingHorizontal: 16,
    fontFamily: FontFamily.title,
  },
  listContent: {
    paddingBottom: 20,
  },
  row: {
    justifyContent: 'space-between',
    paddingHorizontal: 8,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    fontFamily: FontFamily.regular,
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    fontFamily: FontFamily.regular,
  },
});
