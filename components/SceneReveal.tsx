import React, { useEffect } from 'react';
import { View, Image, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSequence,
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

const DISPLAY_DURATION = 2800;
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
  const opacity = useSharedValue(0);
  const scale = useSharedValue(1.15);
  const labelOpacity = useSharedValue(0);
  const scanlineOffset = useSharedValue(0);

  useEffect(() => {
    if (!nodeType) return;

    opacity.value = withTiming(1, { duration: 400, easing: Easing.out(Easing.cubic) });
    scale.value = withTiming(1, { duration: 2000, easing: Easing.out(Easing.cubic) });
    labelOpacity.value = withDelay(300, withTiming(1, { duration: 400 }));
    scanlineOffset.value = withTiming(1, { duration: 2000 });

    const dismissTimer = setTimeout(() => {
      opacity.value = withTiming(0, { duration: 500, easing: Easing.in(Easing.cubic) });
      labelOpacity.value = withTiming(0, { duration: 300 });
      scale.value = withTiming(0.95, { duration: 500 });
      setTimeout(() => {
        runOnJS(onDismiss)();
      }, 550);
    }, DISPLAY_DURATION);

    return () => clearTimeout(dismissTimer);
  }, [nodeType]);

  const containerStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
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
    <Animated.View style={[styles.overlay, containerStyle]}>
      <Animated.View style={[styles.imageContainer, imageStyle]}>
        <Image source={imageSource} style={styles.image} resizeMode="cover" />
      </Animated.View>

      <LinearGradient
        colors={['transparent', 'rgba(5,5,10,0.6)', 'rgba(5,5,10,0.95)']}
        locations={[0.3, 0.6, 1]}
        style={styles.gradient}
      />

      <View style={styles.scanlines} pointerEvents="none" />

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
    </Animated.View>
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
  scanlines: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.06,
    backgroundColor: 'transparent',
    backgroundImage: undefined,
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
