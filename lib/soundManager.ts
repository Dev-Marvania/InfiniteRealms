import { Audio } from 'expo-av';
import { Platform } from 'react-native';

type SoundName = 'move' | 'attack' | 'hack' | 'search' | 'rest' | 'item' | 'ambient' | 'error';

const SOUND_FILES: Record<SoundName, any> = {
  move: require('../assets/audio/move.wav'),
  attack: require('../assets/audio/attack.wav'),
  hack: require('../assets/audio/hack.wav'),
  search: require('../assets/audio/search.wav'),
  rest: require('../assets/audio/rest.wav'),
  item: require('../assets/audio/item.wav'),
  ambient: require('../assets/audio/ambient.wav'),
  error: require('../assets/audio/error.wav'),
};

const SFX_VOLUME = 0.25;
const AMBIENT_VOLUME = 0.12;

let audioInitialized = false;
let ambientSound: Audio.Sound | null = null;
let ambientFadeTimer: ReturnType<typeof setInterval> | null = null;

async function ensureAudioMode() {
  if (audioInitialized) return;
  try {
    await Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      staysActiveInBackground: false,
      shouldDuckAndroid: true,
    });
    audioInitialized = true;
  } catch {}
}

export async function playSfx(name: SoundName) {
  if (name === 'ambient') return;
  try {
    await ensureAudioMode();
    const { sound } = await Audio.Sound.createAsync(SOUND_FILES[name], {
      volume: SFX_VOLUME,
      shouldPlay: true,
    });
    sound.setOnPlaybackStatusUpdate((status) => {
      if (status.isLoaded && status.didJustFinish) {
        sound.unloadAsync().catch(() => {});
      }
    });
  } catch {}
}

export async function startAmbient() {
  try {
    await ensureAudioMode();

    if (ambientFadeTimer) {
      clearInterval(ambientFadeTimer);
      ambientFadeTimer = null;
    }

    if (ambientSound) {
      const status = await ambientSound.getStatusAsync();
      if (status.isLoaded) {
        await fadeVolume(ambientSound, AMBIENT_VOLUME, 600);
        return;
      }
      ambientSound = null;
    }

    const { sound } = await Audio.Sound.createAsync(SOUND_FILES.ambient, {
      volume: 0,
      shouldPlay: true,
      isLooping: true,
    });
    ambientSound = sound;
    await fadeVolume(sound, AMBIENT_VOLUME, 800);
  } catch {}
}

export async function stopAmbient() {
  try {
    if (ambientFadeTimer) {
      clearInterval(ambientFadeTimer);
      ambientFadeTimer = null;
    }

    if (ambientSound) {
      const sound = ambientSound;
      await fadeVolume(sound, 0, 1200);
      setTimeout(async () => {
        try {
          await sound.stopAsync();
          await sound.unloadAsync();
        } catch {}
        if (ambientSound === sound) {
          ambientSound = null;
        }
      }, 1300);
    }
  } catch {}
}

async function fadeVolume(sound: Audio.Sound, targetVolume: number, durationMs: number) {
  return new Promise<void>((resolve) => {
    const steps = 15;
    const stepTime = durationMs / steps;
    let currentStep = 0;

    sound.getStatusAsync().then((status) => {
      if (!status.isLoaded) {
        resolve();
        return;
      }
      const startVolume = status.volume ?? 0;
      const delta = targetVolume - startVolume;

      if (ambientFadeTimer) clearInterval(ambientFadeTimer);

      ambientFadeTimer = setInterval(async () => {
        currentStep++;
        const progress = currentStep / steps;
        const eased = progress * progress * (3 - 2 * progress);
        const newVol = startVolume + delta * eased;

        try {
          await sound.setVolumeAsync(Math.max(0, Math.min(1, newVol)));
        } catch {}

        if (currentStep >= steps) {
          if (ambientFadeTimer) {
            clearInterval(ambientFadeTimer);
            ambientFadeTimer = null;
          }
          resolve();
        }
      }, stepTime);
    }).catch(() => resolve());
  });
}

export function getActionSound(intent: string): SoundName | null {
  switch (intent) {
    case 'move': return 'move';
    case 'attack': return 'attack';
    case 'hack': return 'hack';
    case 'search': return 'search';
    case 'rest': return 'rest';
    case 'magic': return 'hack';
    default: return null;
  }
}
