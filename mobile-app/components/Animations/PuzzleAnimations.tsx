import React, { useEffect, useRef, useSharedValue, withSpring, withTiming, withRepeat, withSequence } from 'react';
import { Animated, View } from 'react-native';

export const useBounceAnimation = (trigger: boolean) => {
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (trigger) {
      Animated.sequence([
        Animated.spring(scale, {
          toValue: 1.2,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.spring(scale, {
          toValue: 0.9,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.spring(scale, {
          toValue: 1,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [trigger, scale]);

  return scale;
};

export const useSlideInAnimation = (delay: number = 0) => {
  const translateX = useRef(new Animated.Value(300)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const timer = setTimeout(() => {
      Animated.parallel([
        Animated.spring(translateX, {
          toValue: 0,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    }, delay);

    return () => clearTimeout(timer);
  }, [translateX, opacity, delay]);

  return { translateX, opacity };
};

export const usePulseAnimation = (continuous: boolean = false) => {
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (continuous) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(scale, {
            toValue: 1.1,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(scale, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
  }, [scale, continuous]);

  return scale;
};

export const useShakeAnimation = (trigger: boolean) => {
  const translateX = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (trigger) {
      Animated.sequence([
        Animated.timing(translateX, {
          toValue: -10,
          duration: 50,
          useNativeDriver: true,
        }),
        Animated.timing(translateX, {
          toValue: 10,
          duration: 50,
          useNativeDriver: true,
        }),
        Animated.timing(translateX, {
          toValue: -10,
          duration: 50,
          useNativeDriver: true,
        }),
        Animated.timing(translateX, {
          toValue: 10,
          duration: 50,
          useNativeDriver: true,
        }),
        Animated.timing(translateX, {
          toValue: 0,
          duration: 50,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [trigger, translateX]);

  return translateX;
};

export const useRotateAnimation = (trigger: boolean) => {
  const rotate = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (trigger) {
      Animated.timing(rotate, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(rotate, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }).start();
    }
  }, [trigger, rotate]);

  return rotate;
};

export const useConfettiAnimation = (trigger: boolean) => {
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (trigger) {
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 0,
          useNativeDriver: true,
        }),
        Animated.delay(100),
        Animated.timing(animatedValue, {
          toValue: 0,
          duration: 3000,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [trigger, animatedValue]);

  return animatedValue;
};

interface AnimatedParticleProps {
  size: number;
  color: string;
  delay: number;
}

export const AnimatedParticle: React.FC<AnimatedParticleProps> = ({ size, color, delay }) => {
  const translateY = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(1)).current;
  const scale = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const timer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(scale, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.sequence([
          Animated.delay(100),
          Animated.parallel([
            Animated.timing(translateY, {
              toValue: -100,
              duration: 2000,
              useNativeDriver: true,
            }),
            Animated.sequence([
              Animated.delay(500),
              Animated.timing(opacity, {
                toValue: 0,
                duration: 1500,
                useNativeDriver: true,
              }),
            ]),
          ]),
        ]),
      ]).start();
    }, delay);

    return () => clearTimeout(timer);
  }, [translateY, opacity, scale, delay]);

  return (
    <Animated.View
      style={{
        width: size,
        height: size,
        backgroundColor: color,
        borderRadius: size / 2,
        position: 'absolute',
        opacity,
        transform: [
          { translateY },
          { scale },
        ],
      }}
    />
  );
};

interface ConfettiBurstProps {
  trigger: boolean;
  position: { x: number; y: number };
}

export const ConfettiBurst: React.FC<ConfettiBurstProps> = ({ trigger, position }) => {
  const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD'];
  const particles = Array.from({ length: 12 }, (_, i) => ({
    id: i,
    size: Math.random() * 6 + 4,
    color: colors[Math.floor(Math.random() * colors.length)],
    delay: Math.random() * 200,
    angle: (Math.PI * 2 * i) / 12 + (Math.random() - 0.5) * 0.5,
  }));

  if (!trigger) return null;

  return (
    <View
      style={{
        position: 'absolute',
        left: position.x,
        top: position.y,
        width: 1,
        height: 1,
      }}
    >
      {particles.map((particle) => (
        <AnimatedParticle
          key={particle.id}
          size={particle.size}
          color={particle.color}
          delay={particle.delay}
        />
      ))}
    </View>
  );
};

interface SuccessCelebrationProps {
  trigger: boolean;
  children: React.ReactNode;
}

export const SuccessCelebration: React.FC<SuccessCelebrationProps> = ({ trigger, children }) => {
  const scale = useRef(new Animated.Value(1)).current;
  const backgroundColor = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (trigger) {
      Animated.sequence([
        Animated.parallel([
          Animated.timing(scale, {
            toValue: 1.05,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.timing(backgroundColor, {
            toValue: 1,
            duration: 200,
            useNativeDriver: false,
          }),
        ]),
        Animated.parallel([
          Animated.timing(scale, {
            toValue: 1,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.timing(backgroundColor, {
            toValue: 0,
            duration: 800,
            useNativeDriver: false,
          }),
        ]),
      ]).start();
    }
  }, [trigger, scale, backgroundColor]);

  return (
    <Animated.View
      style={{
        transform: [{ scale }],
        backgroundColor: backgroundColor.interpolate({
          inputRange: [0, 1],
          outputRange: ['rgba(16, 185, 129, 0)', 'rgba(16, 185, 129, 0.2)'],
        }),
      }}
    >
      {children}
    </Animated.View>
  );
};

interface LoadingAnimationProps {
  size?: number;
  color?: string;
}

export const LoadingAnimation: React.FC<LoadingAnimationProps> = ({
  size = 40,
  color = '#6366F1'
}) => {
  const rotation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(rotation, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      })
    ).start();
  }, [rotation]);

  return (
    <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
      <Animated.View
        style={[
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            borderTopWidth: 3,
            borderRightWidth: 3,
            borderBottomWidth: 3,
            borderLeftWidth: 3,
            borderTopColor: color,
            borderRightColor: 'transparent',
            borderBottomColor: 'transparent',
            borderLeftColor: color,
          },
          {
            transform: [
              {
                rotate: rotation.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0deg', '360deg'],
                }),
              },
            ],
          },
        ]}
      />
    </View>
  );
};

interface ProgressRingProps {
  size: number;
  progress: number;
  color?: string;
  backgroundColor?: string;
  strokeWidth?: number;
}

export const ProgressRing: React.FC<ProgressRingProps> = ({
  size,
  progress,
  color = '#10B981',
  backgroundColor = '#E5E7EB',
  strokeWidth = 4,
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (progress * circumference);

  return (
    <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
      <View
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          borderWidth: strokeWidth,
          borderColor: backgroundColor,
        }}
      />
      <View
        style={{
          position: 'absolute',
          width: size,
          height: size,
          borderRadius: size / 2,
          borderWidth: strokeWidth,
          borderColor: 'transparent',
          borderTopColor: color,
          borderRightColor: color,
          borderBottomColor: color,
          borderLeftColor: color,
          transform: [{ rotate: '-90deg' }],
        }}
      />
    </View>
  );
};

export const FloatingAnimation = ({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) => {
  const translateY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const timer = setTimeout(() => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(translateY, {
            toValue: -10,
            duration: 1500,
            useNativeDriver: true,
          }),
          Animated.timing(translateY, {
            toValue: 0,
            duration: 1500,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }, delay);

    return () => clearTimeout(timer);
  }, [translateY, delay]);

  return (
    <Animated.View style={{ transform: [{ translateY }] }}>
      {children}
    </Animated.View>
  );
};

export const StaggeredAnimation = ({
  children,
  staggerDelay = 100
}: {
  children: React.ReactNode[];
  staggerDelay?: number;
}) => {
  return (
    <>
      {React.Children.map(children, (child, index) => (
        <Animated.View
          key={index}
          style={{
            opacity: 0,
            transform: [{ translateY: 20 }],
          }}
        >
          {React.cloneElement(child as React.ReactElement, {
            style: {
              animation: `slideInUp 0.5s ease-out ${index * staggerDelay}ms both`,
            },
          })}
        </Animated.View>
      ))}
    </>
  );
};