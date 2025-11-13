import React, { memo, useMemo } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { Particle, PhysicsWorld } from '@/services/PhysicsEngine';

interface ParticleRendererProps {
  particles: Particle[];
  enableGlow?: boolean;
  enableTrails?: boolean;
  maxParticles?: number;
}

interface ParticleInstance {
  id: string;
  x: number;
  y: number;
  size: number;
  color: string;
  opacity: number;
  rotation: number;
  scale: number;
  type: string;
}

const ParticleRenderer: React.FC<ParticleRendererProps> = memo(({
  particles,
  enableGlow = true,
  enableTrails = false,
  maxParticles = 100,
}) => {
  const visibleParticles = useMemo(() => {
    return particles
      .filter(p => p.life > 0 && p.opacity > 0.1)
      .slice(0, maxParticles)
      .map(p => ({
        id: p.id,
        x: p.position.x,
        y: p.position.y,
        size: p.size * p.scale,
        color: p.color,
        opacity: p.opacity,
        rotation: p.rotation,
        scale: p.scale,
        type: p.type,
      }));
  }, [particles, maxParticles]);

  const renderParticle = (particle: ParticleInstance) => {
    const baseStyle = {
      position: 'absolute' as const,
      left: particle.x - particle.size / 2,
      top: particle.y - particle.size / 2,
      width: particle.size,
      height: particle.size,
      opacity: particle.opacity,
      transform: [
        { rotate: `${particle.rotation}deg` },
        { scale: particle.scale },
      ],
    };

    switch (particle.type) {
      case 'explosion':
      case 'spark':
        return (
          <View
            key={particle.id}
            style={[
              baseStyle,
              styles.spark,
              {
                backgroundColor: particle.color,
                shadowColor: enableGlow ? particle.color : undefined,
                shadowOpacity: enableGlow ? particle.opacity * 0.8 : 0,
                shadowRadius: particle.size * 2,
                shadowOffset: { width: 0, height: 0 },
              },
            ]}
          />
        );

      case 'trail':
        return (
          <View
            key={particle.id}
            style={[
              baseStyle,
              styles.trail,
              {
                backgroundColor: particle.color,
                borderRadius: particle.size / 2,
              },
            ]}
          />
        );

      case 'confetti':
        return (
          <View
            key={particle.id}
            style={[
              baseStyle,
              styles.confetti,
              {
                backgroundColor: particle.color,
                transform: [
                  { rotate: `${particle.rotation}deg` },
                  { scale: particle.scale },
                ],
              },
            ]}
          />
        );

      case 'star':
        return (
          <View
            key={particle.id}
            style={[
              baseStyle,
              styles.starContainer,
            ]}
          >
            <Star
              size={particle.size}
              color={particle.color}
              opacity={particle.opacity}
              glow={enableGlow}
            />
          </View>
        );

      default:
        return (
          <View
            key={particle.id}
            style={[
              baseStyle,
              styles.default,
              {
                backgroundColor: particle.color,
                borderRadius: particle.size / 2,
              },
            ]}
          />
        );
    }
  };

  if (visibleParticles.length === 0) return null;

  return (
    <View style={styles.container} pointerEvents="none">
      {enableTrails && <TrailEffect particles={visibleParticles} />}
      {visibleParticles.map(renderParticle)}
    </View>
  );
});

// Star component for star-shaped particles
const Star: React.FC<{
  size: number;
  color: string;
  opacity: number;
  glow?: boolean;
}> = ({ size, color, opacity, glow = false }) => {
  const starPath = useMemo(() => {
    const outerRadius = size / 2;
    const innerRadius = outerRadius * 0.4;
    const points = [];

    for (let i = 0; i < 10; i++) {
      const radius = i % 2 === 0 ? outerRadius : innerRadius;
      const angle = (Math.PI * i) / 5 - Math.PI / 2;
      points.push(`${radius * Math.cos(angle)},${radius * Math.sin(angle)}`);
    }

    return `M${points.join(' L')}Z`;
  }, [size]);

  return (
    <View
      style={[
        styles.star,
        {
          width: size,
          height: size,
          opacity,
          shadowColor: glow ? color : undefined,
          shadowOpacity: glow ? opacity * 0.8 : 0,
          shadowRadius: size,
          shadowOffset: { width: 0, height: 0 },
        },
      ]}
    >
      {/* This would be implemented with an SVG library in a real app */}
      <View
        style={[
          styles.starShape,
          {
            backgroundColor: color,
            width: size * 0.6,
            height: size * 0.6,
            borderRadius: size * 0.3,
          },
        ]}
      />
    </View>
  );
};

// Trail effect for particle motion
const TrailEffect: React.FC<{ particles: ParticleInstance[] }> = ({ particles }) => {
  const trailParticles = useMemo(() => {
    return particles
      .filter(p => p.type === 'trail' || p.type === 'confetti')
      .slice(0, 20); // Limit trail particles for performance
  }, [particles]);

  if (trailParticles.length === 0) return null;

  return (
    <>
      {trailParticles.map(particle => (
        <View
          key={`trail-${particle.id}`}
          style={[
            styles.trailEffect,
            {
              position: 'absolute',
              left: particle.x - particle.size / 2,
              top: particle.y - particle.size / 2,
              width: particle.size * 2,
              height: particle.size * 2,
              opacity: particle.opacity * 0.3,
              backgroundColor: particle.color,
              borderRadius: particle.size,
              transform: [{ scale: particle.scale * 0.5 }],
            },
          ]}
        />
      ))}
    </>
  );
};

// Performance-optimized particle system component
export const ParticleSystem: React.FC<{
  world: PhysicsWorld | null;
  maxParticles?: number;
  enableGlow?: boolean;
  enableTrails?: boolean;
}> = memo(({ world, maxParticles = 100, enableGlow = true, enableTrails = false }) => {
  if (!world) return null;

  return (
    <ParticleRenderer
      particles={world.particles}
      maxParticles={maxParticles}
      enableGlow={enableGlow}
      enableTrails={enableTrails}
    />
  );
});

// Special effect components for different game events
export const PuzzleCompleteEffect: React.FC<{
  visible: boolean;
  onComplete?: () => void;
}> = ({ visible, onComplete }) => {
  if (!visible) return null;

  React.useEffect(() => {
    if (visible) {
      const timer = setTimeout(() => {
        onComplete?.();
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [visible, onComplete]);

  return (
    <View style={styles.completeEffectContainer}>
      <Animated.View style={styles.completeEffect}>
        <ParticleRenderer
          particles={Array.from({ length: 30 }, (_, i) => ({
            id: `complete-${i}`,
            position: {
              x: 200 + Math.cos((Math.PI * 2 * i) / 30) * 100,
              y: 300 + Math.sin((Math.PI * 2 * i) / 30) * 100,
            },
            velocity: {
              x: Math.cos((Math.PI * 2 * i) / 30) * 200,
              y: Math.sin((Math.PI * 2 * i) / 30) * 200 - 100,
            },
            life: 1,
            maxLife: 2000,
            size: 4 + Math.random() * 4,
            color: ['#FFD700', '#FFA500', '#FF6347', '#32CD32'][i % 4],
            type: 'confetti',
            rotation: Math.random() * 360,
            rotationSpeed: (Math.random() - 0.5) * 10,
            opacity: 1,
            scale: 1,
            gravityScale: 0.3,
          }))}
          enableGlow={true}
          enableTrails={true}
        />
      </Animated.View>
    </View>
  );
};

export const PieceSnapEffect: React.FC<{
  position: { x: number; y: number };
  visible: boolean;
}> = ({ position, visible }) => {
  if (!visible) return null;

  return (
    <View style={styles.snapEffectContainer}>
      <ParticleRenderer
        particles={Array.from({ length: 8 }, (_, i) => ({
          id: `snap-${i}`,
          position,
          velocity: {
            x: Math.cos((Math.PI * 2 * i) / 8) * 50,
            y: Math.sin((Math.PI * 2 * i) / 8) * 50,
          },
          life: 1,
          maxLife: 500,
          size: 2 + Math.random() * 2,
          color: '#00FF00',
          type: 'spark',
          rotation: 0,
          rotationSpeed: 0,
          opacity: 1,
          scale: 1,
          gravityScale: 0.1,
        }))}
        enableGlow={true}
      />
    </View>
  );
};

export const ComboEffect: React.FC<{
  position: { x: number; y: number };
  comboLevel: number;
  visible: boolean;
}> = ({ position, comboLevel, visible }) => {
  if (!visible) return null;

  const particleCount = Math.min(5 + comboLevel * 2, 20);
  const colors = ['#FFD700', '#FFA500', '#FF6347', '#9370DB', '#00CED1'];

  return (
    <ParticleRenderer
      particles={Array.from({ length: particleCount }, (_, i) => ({
        id: `combo-${i}`,
        position,
        velocity: {
          x: Math.cos((Math.PI * 2 * i) / particleCount) * (100 + comboLevel * 20),
          y: Math.sin((Math.PI * 2 * i) / particleCount) * (100 + comboLevel * 20),
        },
        life: 1,
        maxLife: 800 + comboLevel * 100,
        size: 3 + comboLevel * 0.5,
        color: colors[i % colors.length],
        type: comboLevel > 3 ? 'star' : 'spark',
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * (5 + comboLevel),
        opacity: 1,
        scale: 1,
        gravityScale: 0.2,
      }))}
      enableGlow={comboLevel > 2}
      enableTrails={comboLevel > 4}
    />
  );
};

// Physics debug renderer (development only)
export const PhysicsDebugRenderer: React.FC<{
  world: PhysicsWorld | null;
  showBodies?: boolean;
  showParticles?: boolean;
  showVelocity?: boolean;
}> = memo(({ world, showBodies = true, showParticles = true, showVelocity = false }) => {
  if (!world || !__DEV__) return null;

  return (
    <View style={styles.debugContainer} pointerEvents="none">
      {showBodies && world.bodies.map(body => (
        <View
          key={body.id}
          style={[
            styles.debugBody,
            {
              position: 'absolute',
              left: body.position.x - body.radius,
              top: body.position.y - body.radius,
              width: body.radius * 2,
              height: body.radius * 2,
              borderRadius: body.radius,
              backgroundColor: body.isStatic ? '#FF6B6B' : '#4ECDC4',
              opacity: 0.5,
            },
          ]}
        >
          {showVelocity && !body.isStatic && (
            <View
              style={[
                styles.debugVelocity,
                {
                  position: 'absolute',
                  left: body.radius,
                  top: body.radius,
                  width: Math.abs(body.velocity.x) * 0.1,
                  height: 2,
                  backgroundColor: '#FFD700',
                  transform: [
                    { translateX: body.velocity.x * 0.05 },
                    { translateY: body.velocity.y * 0.05 },
                  ],
                },
              ]}
            />
          )}
        </View>
      ))}

      {showParticles && world.particles.map(particle => (
        <View
          key={`debug-${particle.id}`}
          style={[
            styles.debugParticle,
            {
              position: 'absolute',
              left: particle.position.x - 2,
              top: particle.position.y - 2,
              width: 4,
              height: 4,
              borderRadius: 2,
              backgroundColor: particle.color,
              opacity: particle.opacity,
            },
          ]}
        />
      ))}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    pointerEvents: 'none',
  },
  spark: {
    borderRadius: 2,
    backgroundColor: '#FFD700',
  },
  trail: {
    borderRadius: 50,
    backgroundColor: '#4ECDC4',
  },
  confetti: {
    backgroundColor: '#FF6B6B',
  },
  starContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  star: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  starShape: {
    // Simplified star representation
  },
  default: {
    borderRadius: 50,
  },
  trailEffect: {
    blurRadius: 2,
  },
  completeEffectContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  completeEffect: {
    width: 200,
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  snapEffectContainer: {
    position: 'absolute',
    width: 100,
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  debugContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  debugBody: {
    borderWidth: 1,
    borderColor: '#000000',
  },
  debugVelocity: {
    transformOrigin: 'left center',
  },
  debugParticle: {
    borderWidth: 1,
    borderColor: '#000000',
  },
});

export default ParticleRenderer;