import React, { useEffect, useState, useRef } from 'react';
import { View, Image, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  runOnJS,
  Easing,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import Colors from '@/constants/colors';

type NodeType = 'recycle' | 'firewall' | 'neon' | 'source' | 'terminal' | 'trap';

const SCENE_IMAGES: Record<NodeType, any> = {
  recycle: require('../assets/images/scenes/scene_recycle.png'),
  firewall: require('../assets/images/scenes/scene_firewall.png'),
  trap: require('../assets/images/scenes/scene_trap.png'),
  neon: require('../assets/images/scenes/scene_neon.png'),
  source: require('../assets/images/scenes/scene_source.png'),
  terminal: require('../assets/images/scenes/scene_terminal.png'),
};

const DISPLAY_DURATION = 3200;
const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface SceneRevealProps {
  nodeType: NodeType | null;
  locationName: string;
  onDismiss: () => void;
}

export function getNodeType(x: number, y: number): NodeType {
  if (x === 0 && y === 0) return 'terminal';
  const dist = Math.abs(x) + Math.abs(y);
  const act = dist >= 5 ? 1 : dist >= 2 ? 2 : 3;
  const seed = Math.abs(x * 7919 + y * 6271 + x * y * 31) % 100;
  if (act === 1) {
    if (seed < 20) return 'firewall';
    if (seed < 35) return 'trap';
    return 'recycle';
  }
  if (act === 2) {
    if (seed < 25) return 'firewall';
    if (seed < 40) return 'trap';
    return 'neon';
  }
  if (seed < 30) return 'trap';
  return 'source';
}

export default function SceneReveal({ nodeType, locationName, onDismiss }: SceneRevealProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const dismissTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fadeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const imageOpacity = useSharedValue(0);
  const scale = useSharedValue(1.15);
  const labelOpacity = useSharedValue(0);

  useEffect(() => {
    setImageLoaded(false);
    imageOpacity.value = 0;
    scale.value = 1.15;
    labelOpacity.value = 0;

    return () => {
      if (dismissTimerRef.current) clearTimeout(dismissTimerRef.current);
      if (fadeTimerRef.current) clearTimeout(fadeTimerRef.current);
    };
  }, [nodeType]);

  const handleImageLoad = () => {
    setImageLoaded(true);

    imageOpacity.value = withTiming(1, { duration: 500, easing: Easing.out(Easing.cubic) });
    scale.value = withTiming(1, { duration: 2500, easing: Easing.out(Easing.cubic) });
    labelOpacity.value = withDelay(400, withTiming(1, { duration: 500 }));

    dismissTimerRef.current = setTimeout(() => {
      imageOpacity.value = withTiming(0, { duration: 600, easing: Easing.in(Easing.cubic) });
      labelOpacity.value = withTiming(0, { duration: 400 });
      scale.value = withTiming(0.95, { duration: 600 });
      fadeTimerRef.current = setTimeout(() => {
        runOnJS(onDismiss)();
      }, 650);
    }, DISPLAY_DURATION);
  };

  const containerStyle = useAnimatedStyle(() => ({
    opacity: imageOpacity.value,
  }));

  const imageStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const labelStyle = useAnimatedStyle(() => ({
    opacity: labelOpacity.value,
  }));

  if (!nodeType) return null;

  const imageSource = SCENE_IMAGES[nodeType];

  return (
    <View style={styles.overlay}>
      <Animated.View style={[styles.imageWrap, containerStyle]}>
        <Animated.View style={[styles.imageContainer, imageStyle]}>
          <Image
            source={imageSource}
            style={styles.image}
            resizeMode="cover"
            onLoad={handleImageLoad}
          />
        </Animated.View>

        <LinearGradient
          colors={['transparent', 'rgba(5,5,10,0.6)', 'rgba(5,5,10,0.95)']}
          locations={[0.3, 0.6, 1]}
          style={styles.gradient}
        />
      </Animated.View>

      {!imageLoaded && (
        <View style={styles.loadingContainer}>
          <Animated.Text style={styles.loadingText}>LOADING SECTOR...</Animated.Text>
        </View>
      )}

      <Animated.View style={[styles.labelContainer, labelStyle]}>
        <View style={styles.labelLine} />
        <View style={styles.labelContent}>
          <View style={styles.bracketLeft} />
          <View style={styles.labelTextWrap}>
            <Animated.Text style={styles.labelPrefix}>LOCATION://</Animated.Text>
            <Animated.Text style={styles.labelName} numberOfLines={1}>
              {locationName.toUpperCase()}
            </Animated.Text>
          </View>
          <View style={styles.bracketRight} />
        </View>
        <View style={styles.labelLine} />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 100,
    backgroundColor: '#05050A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageWrap: {
    ...StyleSheet.absoluteFillObject,
  },
  imageContainer: {
    ...StyleSheet.absoluteFillObject,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  gradient: {
    ...StyleSheet.absoluteFillObject,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontFamily: 'monospace',
    fontSize: 11,
    color: Colors.accent.cyan,
    letterSpacing: 3,
    opacity: 0.5,
  },
  labelContainer: {
    position: 'absolute',
    bottom: '18%',
    left: 20,
    right: 20,
    alignItems: 'center',
    gap: 8,
  },
  labelLine: {
    width: SCREEN_WIDTH * 0.5,
    height: 1,
    backgroundColor: Colors.accent.cyan,
    opacity: 0.4,
  },
  labelContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  bracketLeft: {
    width: 8,
    height: 24,
    borderLeftWidth: 2,
    borderTopWidth: 2,
    borderBottomWidth: 2,
    borderColor: Colors.accent.cyan,
    opacity: 0.6,
  },
  labelTextWrap: {
    alignItems: 'center',
  },
  labelPrefix: {
    fontFamily: 'monospace',
    fontSize: 9,
    color: Colors.accent.cyan,
    letterSpacing: 3,
    opacity: 0.6,
  },
  labelName: {
    fontFamily: 'monospace',
    fontSize: 16,
    fontWeight: 'bold' as const,
    color: '#FFFFFF',
    letterSpacing: 2,
    marginTop: 2,
    textShadowColor: Colors.accent.cyan,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  bracketRight: {
    width: 8,
    height: 24,
    borderRightWidth: 2,
    borderTopWidth: 2,
    borderBottomWidth: 2,
    borderColor: Colors.accent.cyan,
    opacity: 0.6,
  },
});
