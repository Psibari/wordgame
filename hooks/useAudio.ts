import { useCallback, useEffect, useRef, useState } from 'react';
import { Audio } from 'expo-av';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState, AppStateStatus } from 'react-native';

// ── Storage keys ──────────────────────────────────────────────────────────────
const MUSIC_KEY = 'polyplex_music_enabled';
const SFX_KEY = 'polyplex_sfx_enabled';

// ── Sound assets ──────────────────────────────────────────────────────────────
const SOUND_ASSETS = {
  correct: require('@/assets/sounds/correct.wav'),
  wrong: require('@/assets/sounds/wrong.wav'),
  combo_3: require('@/assets/sounds/combo_3.wav'),
  combo_5: require('@/assets/sounds/combo_5.wav'),
  level_up: require('@/assets/sounds/level_up.wav'),
  daily_win: require('@/assets/sounds/daily_win.wav'),
  timer_tick: require('@/assets/sounds/timer_tick.wav'),
} as const;

const BG_MUSIC_ASSET = require('@/assets/sounds/bg_music.wav');

export type SoundName = keyof typeof SOUND_ASSETS;

// ── Singleton audio manager ───────────────────────────────────────────────────
// Ensures only one instance of audio management exists across the app

let _musicEnabled = true;
let _sfxEnabled = true;
let _preloadedSounds: Partial<Record<SoundName, Audio.Sound>> = {};
let _bgMusic: Audio.Sound | null = null;
let _bgMusicPlaying = false;
let _initialized = false;
let _listeners: Set<() => void> = new Set();

function notifyListeners() {
  _listeners.forEach((fn) => fn());
}

async function initAudioMode() {
  try {
    await Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      staysActiveInBackground: false,
      shouldDuckAndroid: true,
    });
  } catch {
    // Ignore errors in environments where audio isn't supported
  }
}

async function preloadSounds() {
  const entries = Object.entries(SOUND_ASSETS) as [SoundName, any][];
  const promises = entries.map(async ([name, asset]) => {
    try {
      const { sound } = await Audio.Sound.createAsync(asset, {
        shouldPlay: false,
        volume: 1.0,
      });
      _preloadedSounds[name] = sound;
    } catch {
      // Sound failed to load — skip
    }
  });
  await Promise.all(promises);
}

async function loadBgMusic() {
  try {
    const { sound } = await Audio.Sound.createAsync(BG_MUSIC_ASSET, {
      shouldPlay: false,
      isLooping: true,
      volume: 0.0, // Start at 0 for fade-in
    });
    _bgMusic = sound;
  } catch {
    // BG music failed to load
  }
}

async function loadPreferences() {
  try {
    const [musicVal, sfxVal] = await Promise.all([
      AsyncStorage.getItem(MUSIC_KEY),
      AsyncStorage.getItem(SFX_KEY),
    ]);
    _musicEnabled = musicVal !== 'false';
    _sfxEnabled = sfxVal !== 'false';
  } catch {
    // Default to enabled
  }
}

async function initialize() {
  if (_initialized) return;
  _initialized = true;
  await loadPreferences();
  await initAudioMode();
  await Promise.all([preloadSounds(), loadBgMusic()]);
}

// Fade bg music in smoothly over ~1s
async function fadeInBgMusic() {
  if (!_bgMusic || !_musicEnabled) return;
  try {
    const status = (await _bgMusic.getStatusAsync()) as any;
    if (!status.isLoaded) return;

    await _bgMusic.setVolumeAsync(0);
    await _bgMusic.playAsync();
    _bgMusicPlaying = true;

    // Gradual volume increase
    const steps = 10;
    const targetVolume = 0.25;
    for (let i = 1; i <= steps; i++) {
      await new Promise((r) => setTimeout(r, 100));
      if (!_bgMusicPlaying || !_musicEnabled) {
        await _bgMusic.setVolumeAsync(0);
        return;
      }
      await _bgMusic.setVolumeAsync((i / steps) * targetVolume);
    }
  } catch {
    // Ignore fade errors
  }
}

async function fadeOutBgMusic() {
  if (!_bgMusic) return;
  try {
    const status = (await _bgMusic.getStatusAsync()) as any;
    if (!status.isLoaded || !status.isPlaying) {
      _bgMusicPlaying = false;
      return;
    }

    const currentVol = status.volume ?? 0.25;
    const steps = 8;
    for (let i = steps - 1; i >= 0; i--) {
      await new Promise((r) => setTimeout(r, 60));
      await _bgMusic.setVolumeAsync((i / steps) * currentVol);
    }
    await _bgMusic.pauseAsync();
    _bgMusicPlaying = false;
  } catch {
    _bgMusicPlaying = false;
  }
}

async function playSound(name: SoundName) {
  if (!_sfxEnabled) return;
  const sound = _preloadedSounds[name];
  if (!sound) return;
  try {
    // Reset position and play
    await sound.setPositionAsync(0);
    await sound.playAsync();
  } catch {
    // Sound play failed — try reloading
    try {
      const asset = SOUND_ASSETS[name];
      const { sound: newSound } = await Audio.Sound.createAsync(asset, {
        shouldPlay: true,
        volume: 1.0,
      });
      // Unload old, replace with new
      await sound.unloadAsync().catch(() => {});
      _preloadedSounds[name] = newSound;
    } catch {
      // Give up
    }
  }
}

async function setMusicEnabled(enabled: boolean) {
  _musicEnabled = enabled;
  await AsyncStorage.setItem(MUSIC_KEY, String(enabled));
  if (enabled) {
    fadeInBgMusic();
  } else {
    fadeOutBgMusic();
  }
  notifyListeners();
}

async function setSfxEnabled(enabled: boolean) {
  _sfxEnabled = enabled;
  await AsyncStorage.setItem(SFX_KEY, String(enabled));
  notifyListeners();
}

// ── React Hook ────────────────────────────────────────────────────────────────

export function useAudio() {
  const [musicEnabled, setMusicEnabledState] = useState(_musicEnabled);
  const [sfxEnabled, setSfxEnabledState] = useState(_sfxEnabled);
  const [isReady, setIsReady] = useState(_initialized);
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);

  // Subscribe to state changes
  useEffect(() => {
    const listener = () => {
      setMusicEnabledState(_musicEnabled);
      setSfxEnabledState(_sfxEnabled);
    };
    _listeners.add(listener);
    return () => {
      _listeners.delete(listener);
    };
  }, []);

  // Initialize audio system
  useEffect(() => {
    initialize().then(() => {
      setIsReady(true);
      setMusicEnabledState(_musicEnabled);
      setSfxEnabledState(_sfxEnabled);
    });
  }, []);

  // Handle app state changes (pause music when backgrounded)
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState) => {
      if (
        appStateRef.current.match(/active/) &&
        nextState.match(/inactive|background/)
      ) {
        // Going to background — pause music
        if (_bgMusicPlaying && _bgMusic) {
          _bgMusic.pauseAsync().catch(() => {});
        }
      } else if (
        appStateRef.current.match(/inactive|background/) &&
        nextState === 'active'
      ) {
        // Coming to foreground — resume music if enabled
        if (_musicEnabled && _bgMusic && _bgMusicPlaying) {
          _bgMusic.playAsync().catch(() => {});
        }
      }
      appStateRef.current = nextState;
    });
    return () => subscription.remove();
  }, []);

  const play = useCallback((name: SoundName) => {
    playSound(name);
  }, []);

  const startMusic = useCallback(() => {
    if (!_bgMusicPlaying && _musicEnabled) {
      fadeInBgMusic();
    }
  }, []);

  const stopMusic = useCallback(() => {
    fadeOutBgMusic();
  }, []);

  const toggleMusic = useCallback(async () => {
    const newVal = !_musicEnabled;
    await setMusicEnabled(newVal);
  }, []);

  const toggleSfx = useCallback(async () => {
    const newVal = !_sfxEnabled;
    await setSfxEnabled(newVal);
  }, []);

  return {
    isReady,
    musicEnabled,
    sfxEnabled,
    play,
    startMusic,
    stopMusic,
    toggleMusic,
    toggleSfx,
    setMusicEnabled: async (val: boolean) => {
      await setMusicEnabled(val);
    },
    setSfxEnabled: async (val: boolean) => {
      await setSfxEnabled(val);
    },
  };
}

// ── Cleanup (call on app unmount if needed) ───────────────────────────────────
export async function cleanupAudio() {
  for (const sound of Object.values(_preloadedSounds)) {
    if (sound) await sound.unloadAsync().catch(() => {});
  }
  if (_bgMusic) await _bgMusic.unloadAsync().catch(() => {});
  _preloadedSounds = {};
  _bgMusic = null;
  _bgMusicPlaying = false;
  _initialized = false;
}
