import { Ionicons } from '@expo/vector-icons';
import { useRef, type ReactNode } from 'react';
import { Animated, PanResponder, StyleSheet, Text, View } from 'react-native';

interface Props {
  children: ReactNode;
  onSwipeRight: () => void;
  onSwipeLeft: () => void;
  enabled?: boolean;
}

const THRESHOLD = 80;

export function SwipeableRow({ children, onSwipeRight, onSwipeLeft, enabled = true }: Props) {
  const translateX = useRef(new Animated.Value(0)).current;
  const enabledRef = useRef(enabled);
  enabledRef.current = enabled;

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) =>
        enabledRef.current && Math.abs(g.dx) > 15 && Math.abs(g.dx) > Math.abs(g.dy) * 1.5,
      onPanResponderMove: (_, g) => {
        translateX.setValue(Math.max(-150, Math.min(150, g.dx)));
      },
      onPanResponderRelease: (_, g) => {
        if (g.dx > THRESHOLD) {
          Animated.timing(translateX, { toValue: 400, duration: 200, useNativeDriver: true }).start(() => {
            onSwipeRight();
            translateX.setValue(0);
          });
        } else if (g.dx < -THRESHOLD) {
          Animated.timing(translateX, { toValue: -400, duration: 200, useNativeDriver: true }).start(() => {
            onSwipeLeft();
            translateX.setValue(0);
          });
        } else {
          Animated.spring(translateX, { toValue: 0, useNativeDriver: true, bounciness: 8 }).start();
        }
      },
      onPanResponderTerminate: () => {
        Animated.spring(translateX, { toValue: 0, useNativeDriver: true }).start();
      },
    }),
  ).current;

  return (
    <View style={styles.container}>
      <View style={[styles.bg, styles.bgRight]}>
        <Ionicons name="checkmark-circle" size={26} color="#fff" />
        <Text style={styles.bgText}>Tamamla</Text>
      </View>
      <View style={[styles.bg, styles.bgLeft]}>
        <Text style={styles.bgText}>Sil</Text>
        <Ionicons name="trash" size={26} color="#fff" />
      </View>
      <Animated.View style={{ transform: [{ translateX }] }} {...panResponder.panHandlers}>
        {children}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { position: 'relative' },
  bg: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    borderRadius: 12,
    marginBottom: 8,
  },
  bgRight: { backgroundColor: '#30a46c', justifyContent: 'flex-start', gap: 8 },
  bgLeft: { backgroundColor: '#e5484d', justifyContent: 'flex-end', gap: 8 },
  bgText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
