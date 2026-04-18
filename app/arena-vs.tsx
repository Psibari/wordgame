import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withDelay,
  withRepeat,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useTextGeneration } from '@fastshot/ai';

import { Fonts, Radii } from '@/constants/theme';
import {
  ArenaColors,
  ARENA_RIVALS,
  LEAGUE_TIERS,
} from '@/constants/arena';
import { useArena } from '@/hooks/useArena';
import { LeagueBadge } from '@/components/arena/LeagueBadge';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function ArenaVsScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ rivalId: string }>();
  const { elo, league } = useArena();
  const { generateText, data: trashTalk, isLoading: talkLoading } = useTextGeneration();

  const rival = ARENA_RIVALS.find((r) => r.id === params.rivalId) ?? ARENA_RIVALS[0];
  const rivalTierConfig = LEAGUE_TIERS[rival.league];

  // Animations
  const overlayOpacity = useSharedValue(0);
  const userSlide = useSharedValue(-SCREEN_WIDTH);
  const rivalSlide = useSharedValue(SCREEN_WIDTH);
  const vsScale = useSharedValue(0);
  const vsRotation = useSharedValue(-20);
  const vsPulse = useSharedValue(1);
  const detailsOpacity = useSharedValue(0);
  const buttonOpacity = useSharedValue(0);
  const flashOpacity = useSharedValue(0);
  const trashTalkOpacity = useSharedValue(0);

  const [aiTrashTalk, setAiTrashTalk] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Phase 1: Background + flash
    overlayOpacity.value = withTiming(1, { duration: 400 });
    flashOpacity.value = withSequence(
      withTiming(0.6, { duration: 200 }),
      withTiming(0, { duration: 400 }),
    );

    // Phase 2: Players slam in from sides (impact animation)
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

    userSlide.value = withDelay(300, withSpring(0, { damping: 10, stiffness: 200 }));
    rivalSlide.value = withDelay(300, withSpring(0, { damping: 10, stiffness: 200 }));

    // Phase 3: VS emblem (big impact)
    setTimeout(() => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    }, 800);

    vsScale.value = withDelay(700, withSpring(1, { damping: 6, stiffness: 250 }));
    vsRotation.value = withDelay(700, withSpring(0, { damping: 8, stiffness: 200 }));

    // VS pulse
    vsPulse.value = withDelay(1200, withRepeat(
      withSequence(
        withTiming(1.1, { duration: 800, easing: Easing.inOut(Easing.sin) }),
        withTiming(1, { duration: 800, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
      true,
    ));

    // Phase 4: Details + button
    detailsOpacity.value = withDelay(1000, withTiming(1, { duration: 500 }));
    buttonOpacity.value = withDelay(1400, withTiming(1, { duration: 400 }));
    trashTalkOpacity.value = withDelay(1800, withTiming(1, { duration: 500 }));

    setTimeout(() => setIsReady(true), 1500);
  }, [overlayOpacity, userSlide, rivalSlide, vsScale, vsRotation, vsPulse, detailsOpacity, buttonOpacity, flashOpacity, trashTalkOpacity]);

  // Generate AI trash talk for the rival
  useEffect(() => {
    generateText(
      `You are ${rival.name}, a competitive word game rival with the personality: "${rival.personality}". Generate a single short trash talk line (max 15 words) before a 1v1 vocabulary duel. Be intimidating but playful. Your speciality is "${rival.speciality}". Don't use quotes.`
    );
  }, [rival.name, rival.personality, rival.speciality]);

  useEffect(() => {
    if (trashTalk) {
      setAiTrashTalk(trashTalk);
    }
  }, [trashTalk]);

  const overlayStyle = useAnimatedStyle(() => ({ opacity: overlayOpacity.value }));
  const userStyle = useAnimatedStyle(() => ({ transform: [{ translateX: userSlide.value }] }));
  const rivalStyle = useAnimatedStyle(() => ({ transform: [{ translateX: rivalSlide.value }] }));
  const vsStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: vsScale.value * vsPulse.value },
      { rotate: `${vsRotation.value}deg` },
    ],
  }));
  const detailsStyle = useAnimatedStyle(() => ({ opacity: detailsOpacity.value }));
  const buttonStyle = useAnimatedStyle(() => ({ opacity: buttonOpacity.value }));
  const flashStyle = useAnimatedStyle(() => ({ opacity: flashOpacity.value }));
  const talkStyle = useAnimatedStyle(() => ({ opacity: trashTalkOpacity.value }));

  const handleStartDuel = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    router.replace({
      pathname: '/arena-duel',
      params: { rivalId: rival.id },
    } as any);
  }, [rival.id]);

  const handleBack = useCallback(() => {
    router.back();
  }, []);

  return (
    <View style={[styles.root, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <Animated.View style={[StyleSheet.absoluteFillObject, overlayStyle]}>
        <LinearGradient
          colors={[ArenaColors.bgDeep, ArenaColors.bg, ArenaColors.bgDeep]}
          style={StyleSheet.absoluteFillObject}
        />
      </Animated.View>

      {/* Flash effect */}
      <Animated.View style={[styles.flash, flashStyle]} />

      {/* Split screen background */}
      <View style={styles.splitBg}>
        <LinearGradient
          colors={[ArenaColors.neonCyanDim + '40', 'transparent']}
          style={styles.splitLeft}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
        <LinearGradient
          colors={[ArenaColors.rivalRedDim + '40', 'transparent']}
          style={styles.splitRight}
          start={{ x: 1, y: 0 }}
          end={{ x: 0, y: 1 }}
        />
      </View>

      {/* Diagonal split line */}
      <View style={styles.diagonalLine} />

      {/* Back button */}
      <TouchableOpacity style={styles.backBtn} onPress={handleBack} hitSlop={12}>
        <Text style={styles.backText}>← Exit</Text>
      </TouchableOpacity>

      {/* User profile (left side) */}
      <View style={styles.vsContainer}>
        <View style={styles.playersRow}>
          <Animated.View style={[styles.playerSide, userStyle]}>
            <View style={[styles.playerAvatar, { borderColor: ArenaColors.neonCyan }]}>
              <LinearGradient
                colors={[ArenaColors.neonCyanDim, ArenaColors.bgCard]}
                style={StyleSheet.absoluteFillObject}
              />
              <Text style={styles.playerAvatarText}>⭐</Text>
            </View>
            <Animated.View style={detailsStyle}>
              <Text style={styles.playerName}>You</Text>
              <LeagueBadge league={league} size="sm" />
              <Text style={[styles.playerElo, { color: ArenaColors.neonCyan }]}>ELO {elo}</Text>
            </Animated.View>
          </Animated.View>

          {/* VS Emblem */}
          <Animated.View style={[styles.vsEmblem, vsStyle]}>
            <LinearGradient
              colors={[ArenaColors.gold, ArenaColors.rivalRed]}
              style={styles.vsEmblemBg}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Text style={styles.vsText}>VS</Text>
            </LinearGradient>
          </Animated.View>

          {/* Rival profile (right side) */}
          <Animated.View style={[styles.playerSide, rivalStyle]}>
            <View style={[styles.playerAvatar, { borderColor: ArenaColors.rivalRed }]}>
              <LinearGradient
                colors={[ArenaColors.rivalRedDim, ArenaColors.bgCard]}
                style={StyleSheet.absoluteFillObject}
              />
              <Text style={styles.playerAvatarText}>{rival.avatar}</Text>
            </View>
            <Animated.View style={detailsStyle}>
              <Text style={styles.playerName}>{rival.name}</Text>
              <LeagueBadge league={rival.league} size="sm" />
              <Text style={[styles.playerElo, { color: ArenaColors.rivalRed }]}>ELO {rival.elo}</Text>
            </Animated.View>
          </Animated.View>
        </View>

        {/* Rival info */}
        <Animated.View style={[styles.rivalInfo, detailsStyle]}>
          <View style={styles.rivalInfoRow}>
            <View style={styles.rivalStat}>
              <Text style={styles.rivalStatValue}>{Math.round(rival.winRate * 100)}%</Text>
              <Text style={styles.rivalStatLabel}>Win Rate</Text>
            </View>
            <View style={[styles.rivalStatDivider, { backgroundColor: ArenaColors.border }]} />
            <View style={styles.rivalStat}>
              <Text style={styles.rivalStatValue}>{rival.totalDuels}</Text>
              <Text style={styles.rivalStatLabel}>Duels</Text>
            </View>
            <View style={[styles.rivalStatDivider, { backgroundColor: ArenaColors.border }]} />
            <View style={styles.rivalStat}>
              <Text style={[styles.rivalStatValue, { color: rivalTierConfig.color }]}>
                {rival.speciality}
              </Text>
              <Text style={styles.rivalStatLabel}>Title</Text>
            </View>
          </View>
        </Animated.View>

        {/* AI Trash Talk */}
        <Animated.View style={[styles.trashTalkContainer, talkStyle]}>
          <View style={[styles.trashTalkBubble, { borderColor: ArenaColors.rivalRed + '40' }]}>
            <Text style={styles.trashTalkAvatar}>{rival.avatar}</Text>
            <Text style={styles.trashTalkText}>
              {aiTrashTalk || (talkLoading ? '...' : rival.trashTalk[Math.floor(Math.random() * rival.trashTalk.length)])}
            </Text>
          </View>
        </Animated.View>
      </View>

      {/* Start button */}
      <Animated.View style={[styles.bottomContainer, buttonStyle]}>
        <TouchableOpacity
          style={styles.startBtn}
          onPress={handleStartDuel}
          activeOpacity={0.85}
          disabled={!isReady}
        >
          <LinearGradient
            colors={[ArenaColors.rivalRed, '#FF2020', ArenaColors.gold]}
            style={styles.startBtnGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Text style={styles.startBtnText}>⚔️ BEGIN DUEL</Text>
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: ArenaColors.bgDeep,
  },
  flash: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#fff',
    zIndex: 10,
  },
  splitBg: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: 'row',
  },
  splitLeft: {
    flex: 1,
  },
  splitRight: {
    flex: 1,
  },
  diagonalLine: {
    position: 'absolute',
    width: 2,
    height: SCREEN_HEIGHT * 1.5,
    backgroundColor: ArenaColors.gold + '30',
    left: SCREEN_WIDTH / 2 - 1,
    top: -SCREEN_HEIGHT * 0.2,
    transform: [{ rotate: '15deg' }],
  },
  backBtn: {
    position: 'absolute',
    top: 60,
    left: 20,
    zIndex: 20,
  },
  backText: {
    color: ArenaColors.textSub,
    fontSize: Fonts.sizes.md,
    fontWeight: '600',
  },
  vsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 24,
  },
  playersRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 0,
    width: '100%',
    justifyContent: 'center',
  },
  playerSide: {
    alignItems: 'center',
    gap: 10,
    width: SCREEN_WIDTH * 0.35,
  },
  playerAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  playerAvatarText: {
    fontSize: 36,
  },
  playerName: {
    color: ArenaColors.text,
    fontSize: Fonts.sizes.md,
    fontWeight: '900',
    textAlign: 'center',
  },
  playerElo: {
    fontSize: Fonts.sizes.sm,
    fontWeight: '800',
    marginTop: 2,
  },
  // VS Emblem
  vsEmblem: {
    width: 70,
    height: 70,
    borderRadius: 35,
    overflow: 'hidden',
    zIndex: 5,
    marginHorizontal: -10,
    shadowColor: ArenaColors.gold,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 20,
    elevation: 16,
  },
  vsEmblemBg: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  vsText: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: 2,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  // Rival Info
  rivalInfo: {
    width: '100%',
    paddingHorizontal: 24,
  },
  rivalInfoRow: {
    flexDirection: 'row',
    backgroundColor: ArenaColors.bgCard,
    borderRadius: Radii.lg,
    borderWidth: 1,
    borderColor: ArenaColors.border,
    padding: 12,
    alignItems: 'center',
  },
  rivalStat: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  rivalStatValue: {
    color: ArenaColors.text,
    fontSize: Fonts.sizes.sm,
    fontWeight: '800',
  },
  rivalStatLabel: {
    color: ArenaColors.textMuted,
    fontSize: 9,
    fontWeight: '600',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  rivalStatDivider: {
    width: 1,
    height: 28,
    marginHorizontal: 4,
  },
  // Trash Talk
  trashTalkContainer: {
    paddingHorizontal: 30,
    width: '100%',
  },
  trashTalkBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: ArenaColors.rivalRedDim + '40',
    borderRadius: Radii.lg,
    borderWidth: 1,
    padding: 12,
    gap: 10,
  },
  trashTalkAvatar: {
    fontSize: 20,
  },
  trashTalkText: {
    color: ArenaColors.rivalRedLight,
    fontSize: Fonts.sizes.sm,
    fontWeight: '600',
    fontStyle: 'italic',
    flex: 1,
    lineHeight: 20,
  },
  // Bottom
  bottomContainer: {
    paddingHorizontal: 24,
    paddingBottom: 20,
  },
  startBtn: {
    borderRadius: Radii.xl,
    overflow: 'hidden',
  },
  startBtnGradient: {
    paddingVertical: 18,
    alignItems: 'center',
  },
  startBtnText: {
    color: '#fff',
    fontSize: Fonts.sizes.lg,
    fontWeight: '900',
    letterSpacing: 3,
  },
});
