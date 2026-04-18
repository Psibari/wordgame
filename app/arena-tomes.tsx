import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withDelay,
  Easing,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';

import { Fonts, Radii } from '@/constants/theme';
import {
  ArenaColors,
  COMMUNITY_TOMES,
  CommunityTome,
} from '@/constants/arena';

const DIFFICULTY_COLORS: Record<string, string> = {
  Beginner: '#06D6A0',
  Intermediate: '#F0B429',
  Advanced: '#FF6B6B',
  Expert: '#A855F7',
};

function TomeCard({ tome, index }: { tome: CommunityTome; index: number }) {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(30);
  const scale = useSharedValue(0.95);

  useEffect(() => {
    const delay = 100 + index * 80;
    opacity.value = withDelay(delay, withTiming(1, { duration: 500, easing: Easing.out(Easing.cubic) }));
    translateY.value = withDelay(delay, withSpring(0, { damping: 14, stiffness: 120 }));
    scale.value = withDelay(delay, withSpring(1, { damping: 12 }));
  }, [opacity, translateY, scale, index]);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }, { scale: scale.value }],
  }));

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Alert.alert(
      tome.title,
      `${tome.description}\n\n📦 ${tome.wordCount} words\n⬇️ ${tome.downloads.toLocaleString()} downloads\n⭐ ${tome.rating}/5.0\n\nThis pack will be available in a future update.`,
      [{ text: 'OK', style: 'default' }],
    );
  };

  const diffColor = DIFFICULTY_COLORS[tome.difficulty] || ArenaColors.textSub;

  return (
    <Animated.View style={style}>
      <TouchableOpacity
        style={[styles.tomeCard, { borderColor: tome.accentColor + '30' }]}
        onPress={handlePress}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={[tome.accentColor + '08', ArenaColors.bgCard]}
          style={StyleSheet.absoluteFillObject}
        />

        {/* Featured badge */}
        {tome.featured && (
          <View style={[styles.featuredBadge, { backgroundColor: ArenaColors.gold + '20', borderColor: ArenaColors.gold + '50' }]}>
            <Text style={styles.featuredText}>⭐ FEATURED</Text>
          </View>
        )}

        <View style={styles.tomeTop}>
          <View style={[styles.tomeIcon, { backgroundColor: tome.accentColor + '15' }]}>
            <Text style={styles.tomeIconText}>{tome.icon}</Text>
          </View>
          <View style={styles.tomeInfo}>
            <Text style={[styles.tomeTitle, { color: tome.accentColor }]}>{tome.title}</Text>
            <View style={styles.tomeAuthorRow}>
              <Text style={styles.tomeAuthorAvatar}>{tome.authorAvatar}</Text>
              <Text style={styles.tomeAuthor}>{tome.author}</Text>
            </View>
          </View>
          <View style={[styles.diffBadge, { backgroundColor: diffColor + '15', borderColor: diffColor + '40' }]}>
            <Text style={[styles.diffText, { color: diffColor }]}>{tome.difficulty}</Text>
          </View>
        </View>

        <Text style={styles.tomeDescription} numberOfLines={2}>{tome.description}</Text>

        <View style={styles.tomeStats}>
          <View style={styles.tomeStat}>
            <Text style={styles.tomeStatIcon}>📦</Text>
            <Text style={styles.tomeStatText}>{tome.wordCount} words</Text>
          </View>
          <View style={styles.tomeStat}>
            <Text style={styles.tomeStatIcon}>⬇️</Text>
            <Text style={styles.tomeStatText}>{tome.downloads.toLocaleString()}</Text>
          </View>
          <View style={styles.tomeStat}>
            <Text style={styles.tomeStatIcon}>⭐</Text>
            <Text style={[styles.tomeStatText, { color: ArenaColors.gold }]}>{tome.rating}</Text>
          </View>
        </View>

        {/* Tags */}
        <View style={styles.tagsRow}>
          {tome.tags.map((tag) => (
            <View key={tag} style={styles.tagPill}>
              <Text style={styles.tagText}>{tag}</Text>
            </View>
          ))}
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

export default function ArenaTomesScreen() {
  const insets = useSafeAreaInsets();
  const [filter, setFilter] = useState<'all' | 'featured'>('all');

  const headerOpacity = useSharedValue(0);

  useEffect(() => {
    headerOpacity.value = withTiming(1, { duration: 500 });
  }, [headerOpacity]);

  const headerStyle = useAnimatedStyle(() => ({ opacity: headerOpacity.value }));

  const filteredTomes = filter === 'featured'
    ? COMMUNITY_TOMES.filter((t) => t.featured)
    : COMMUNITY_TOMES;

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <LinearGradient
        colors={[ArenaColors.violetDim, ArenaColors.bg, ArenaColors.bgDeep]}
        style={StyleSheet.absoluteFillObject}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 0.4 }}
      />

      {/* Header */}
      <Animated.View style={[styles.header, headerStyle]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} hitSlop={10}>
          <Text style={styles.backText}>← Arena</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>📚 COMMUNITY TOMES</Text>
          <Text style={styles.headerSub}>Specialized Word Packs</Text>
        </View>
        <View style={{ width: 60 }} />
      </Animated.View>

      {/* Filter Pills */}
      <View style={styles.filterRow}>
        <TouchableOpacity
          style={[styles.filterPill, filter === 'all' && styles.filterPillActive]}
          onPress={() => setFilter('all')}
        >
          <Text style={[styles.filterPillText, filter === 'all' && styles.filterPillTextActive]}>
            All Tomes
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterPill, filter === 'featured' && styles.filterPillActive]}
          onPress={() => setFilter('featured')}
        >
          <Text
            style={[
              styles.filterPillText,
              filter === 'featured' && styles.filterPillTextActive,
            ]}
          >
            ⭐ Featured
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 40 }]}
      >
        {filteredTomes.map((tome, index) => (
          <TomeCard key={tome.id} tome={tome} index={index} />
        ))}

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            🌐 More community tomes coming soon!
          </Text>
          <Text style={styles.footerSub}>
            Curated word packs from learners worldwide
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: ArenaColors.bg,
  },
  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: ArenaColors.border,
  },
  backBtn: {
    width: 60,
  },
  backText: {
    color: ArenaColors.violet,
    fontSize: Fonts.sizes.base,
    fontWeight: '600',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    color: ArenaColors.text,
    fontSize: Fonts.sizes.md,
    fontWeight: '900',
    letterSpacing: 1,
  },
  headerSub: {
    color: ArenaColors.textMuted,
    fontSize: Fonts.sizes.xs,
    fontWeight: '500',
    marginTop: 1,
  },
  // Filters
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 8,
  },
  filterPill: {
    borderRadius: Radii.full,
    borderWidth: 1,
    borderColor: ArenaColors.border,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: ArenaColors.bgCard,
  },
  filterPillActive: {
    backgroundColor: ArenaColors.violet + '20',
    borderColor: ArenaColors.violet + '60',
  },
  filterPillText: {
    color: ArenaColors.textMuted,
    fontSize: Fonts.sizes.sm,
    fontWeight: '600',
  },
  filterPillTextActive: {
    color: ArenaColors.violet,
  },
  scrollContent: {
    paddingHorizontal: 20,
    gap: 12,
  },
  // Tome Card
  tomeCard: {
    borderRadius: Radii.xl,
    borderWidth: 1,
    overflow: 'hidden',
    padding: 16,
    gap: 10,
  },
  featuredBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    borderRadius: Radii.full,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  featuredText: {
    color: ArenaColors.gold,
    fontSize: 9,
    fontWeight: '800',
  },
  tomeTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  tomeIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tomeIconText: {
    fontSize: 24,
  },
  tomeInfo: {
    flex: 1,
    gap: 2,
  },
  tomeTitle: {
    fontSize: Fonts.sizes.md,
    fontWeight: '800',
  },
  tomeAuthorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  tomeAuthorAvatar: {
    fontSize: 12,
  },
  tomeAuthor: {
    color: ArenaColors.textMuted,
    fontSize: Fonts.sizes.xs,
    fontWeight: '500',
  },
  diffBadge: {
    borderRadius: Radii.full,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  diffText: {
    fontSize: 10,
    fontWeight: '700',
  },
  tomeDescription: {
    color: ArenaColors.textSub,
    fontSize: Fonts.sizes.sm,
    lineHeight: 20,
  },
  tomeStats: {
    flexDirection: 'row',
    gap: 16,
  },
  tomeStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  tomeStatIcon: {
    fontSize: 12,
  },
  tomeStatText: {
    color: ArenaColors.textSub,
    fontSize: Fonts.sizes.xs,
    fontWeight: '600',
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  tagPill: {
    backgroundColor: ArenaColors.bgCardAlt,
    borderRadius: Radii.full,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: ArenaColors.border,
  },
  tagText: {
    color: ArenaColors.textSub,
    fontSize: 10,
    fontWeight: '600',
  },
  // Footer
  footer: {
    alignItems: 'center',
    paddingVertical: 24,
    gap: 4,
  },
  footerText: {
    color: ArenaColors.textSub,
    fontSize: Fonts.sizes.sm,
    fontWeight: '600',
  },
  footerSub: {
    color: ArenaColors.textMuted,
    fontSize: Fonts.sizes.xs,
    fontWeight: '500',
    fontStyle: 'italic',
  },
});
