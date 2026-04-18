/**
 * HapticManager - Centralized haptic feedback system with distinct patterns
 * Provides layered haptic experiences for premium interactions
 */
import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

const isHapticSupported = Platform.OS === 'ios' || Platform.OS === 'android';

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Heartbeat pattern - double pulse for success moments
 * Used for: level ups, mastery unlocks, victories
 */
async function heartbeat(): Promise<void> {
  if (!isHapticSupported) return;
  try {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    await delay(120);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    await delay(400);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await delay(120);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  } catch {
    // Silently fail on unsupported devices
  }
}

/**
 * Dull thud pattern - heavy single impact for errors
 * Used for: wrong answers, timeouts, failures
 */
async function dullThud(): Promise<void> {
  if (!isHapticSupported) return;
  try {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    await delay(80);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  } catch {
    // Silently fail
  }
}

/**
 * Mechanical click pattern - crisp typing feedback
 * Used for: Forge typing, character input, selections
 */
async function mechanicalClick(): Promise<void> {
  if (!isHapticSupported) return;
  try {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  } catch {
    // Silently fail
  }
}

/**
 * Wing flutter pattern - rapid light pulses simulating feather vibrations
 * Used for: Polly animations, bird mascot interactions
 */
async function wingFlutter(): Promise<void> {
  if (!isHapticSupported) return;
  try {
    await Haptics.selectionAsync();
    await delay(40);
    await Haptics.selectionAsync();
    await delay(40);
    await Haptics.selectionAsync();
    await delay(40);
    await Haptics.selectionAsync();
  } catch {
    // Silently fail
  }
}

/**
 * Impact frame - heavy slam for arena combat
 * Used for: Poly-Strikes, screen shake moments
 */
async function impactFrame(): Promise<void> {
  if (!isHapticSupported) return;
  try {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    await delay(50);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    await delay(50);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  } catch {
    // Silently fail
  }
}

/**
 * Crystal chime - ascending light taps
 * Used for: Garden crystal interactions, memory crystallization
 */
async function crystalChime(): Promise<void> {
  if (!isHapticSupported) return;
  try {
    await Haptics.selectionAsync();
    await delay(60);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await delay(80);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  } catch {
    // Silently fail
  }
}

/**
 * Squawk ripple - sharp burst for Polly speaking
 * Used for: PollySquawkBox speech delivery
 */
async function squawkRipple(): Promise<void> {
  if (!isHapticSupported) return;
  try {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await delay(100);
    await Haptics.selectionAsync();
    await delay(60);
    await Haptics.selectionAsync();
  } catch {
    // Silently fail
  }
}

/**
 * Victory cascade - celebratory ascending pattern
 * Used for: Arena wins, achievements
 */
async function victoryCascade(): Promise<void> {
  if (!isHapticSupported) return;
  try {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await delay(100);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await delay(100);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    await delay(200);
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  } catch {
    // Silently fail
  }
}

/**
 * Gentle tap - single light touch
 * Used for: UI navigation, button presses
 */
async function gentleTap(): Promise<void> {
  if (!isHapticSupported) return;
  try {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  } catch {
    // Silently fail
  }
}

/**
 * Selection tick - minimal feedback for scrolling/picking
 */
async function selectionTick(): Promise<void> {
  if (!isHapticSupported) return;
  try {
    await Haptics.selectionAsync();
  } catch {
    // Silently fail
  }
}

export const HapticManager = {
  heartbeat,
  dullThud,
  mechanicalClick,
  wingFlutter,
  impactFrame,
  crystalChime,
  squawkRipple,
  victoryCascade,
  gentleTap,
  selectionTick,
};

export default HapticManager;
