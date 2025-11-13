import React, { useEffect, useRef, useState } from 'react';
import { Animated, Dimensions, Platform } from 'react-native';

interface Vector2D {
  x: number;
  y: number;
}

interface PhysicsBody {
  id: string;
  position: Vector2D;
  velocity: Vector2D;
  acceleration: Vector2D;
  mass: number;
  radius: number;
  restitution: number; // bounciness (0-1)
  friction: number; // friction coefficient
  isStatic: boolean;
  userData?: any;
}

interface Particle {
  id: string;
  position: Vector2D;
  velocity: Vector2D;
  life: number; // 0-1
  maxLife: number;
  size: number;
  color: string;
  type: 'explosion' | 'trail' | 'spark' | 'confetti' | 'star';
  rotation: number;
  rotationSpeed: number;
  opacity: number;
  scale: number;
  gravityScale: number;
}

interface Spring {
  bodyA: string;
  bodyB: string;
  restLength: number;
  stiffness: number;
  damping: number;
}

interface ForceField {
  position: Vector2D;
  radius: number;
  strength: number;
  type: 'attraction' | 'repulsion' | 'vortex';
}

interface PhysicsWorldConfig {
  gravity: Vector2D;
  bounds: { width: number; height: number };
  iterations: number;
  enableCollisions: boolean;
  enableParticles: true;
  enableForceFields: boolean;
}

class PhysicsEngine {
  private bodies: Map<string, PhysicsBody> = new Map();
  private particles: Particle[] = [];
  private springs: Spring[] = [];
  private forceFields: ForceField[] = [];
  private config: PhysicsWorldConfig;
  private animationFrame: number | null = null;
  private lastTime: number = 0;
  private subscribers: Set<(world: PhysicsWorld) => void> = new Set();

  constructor(config: Partial<PhysicsWorldConfig> = {}) {
    const { width, height } = Dimensions.get('window');

    this.config = {
      gravity: { x: 0, y: 981 }, // Earth gravity (pixels/s^2)
      bounds: { width, height },
      iterations: 8,
      enableCollisions: true,
      enableParticles: true,
      enableForceFields: false,
      ...config,
    };

    this.start();
  }

  // Core physics methods
  public addBody(body: Omit<PhysicsBody, 'velocity' | 'acceleration'>): string {
    const id = body.id || this.generateId();
    this.bodies.set(id, {
      ...body,
      velocity: { x: 0, y: 0 },
      acceleration: { x: 0, y: 0 },
    });
    return id;
  }

  public removeBody(id: string): void {
    this.bodies.delete(id);
  }

  public getBody(id: string): PhysicsBody | undefined {
    return this.bodies.get(id);
  }

  public applyForce(bodyId: string, force: Vector2D): void {
    const body = this.bodies.get(bodyId);
    if (body && !body.isStatic) {
      body.acceleration.x += force.x / body.mass;
      body.acceleration.y += force.y / body.mass;
    }
  }

  public applyImpulse(bodyId: string, impulse: Vector2D): void {
    const body = this.bodies.get(bodyId);
    if (body && !body.isStatic) {
      body.velocity.x += impulse.x / body.mass;
      body.velocity.y += impulse.y / body.mass;
    }
  }

  public setVelocity(bodyId: string, velocity: Vector2D): void {
    const body = this.bodies.get(bodyId);
    if (body && !body.isStatic) {
      body.velocity = { ...velocity };
    }
  }

  // Particle system
  public createParticle(
    position: Vector2D,
    velocity: Vector2D,
    config: Partial<Particle> = {}
  ): string {
    const particle: Particle = {
      id: this.generateId(),
      position: { ...position },
      velocity: { ...velocity },
      life: 1,
      maxLife: 1000, // ms
      size: 4,
      color: '#FFD700',
      type: 'spark',
      rotation: 0,
      rotationSpeed: 0,
      opacity: 1,
      scale: 1,
      gravityScale: 1,
      ...config,
    };

    this.particles.push(particle);
    return particle.id;
  }

  public createExplosion(
    position: Vector2D,
    particleCount: number = 20,
    force: number = 500
  ): void {
    for (let i = 0; i < particleCount; i++) {
      const angle = (Math.PI * 2 * i) / particleCount;
      const speed = force + Math.random() * force * 0.5;

      const velocity: Vector2D = {
        x: Math.cos(angle) * speed,
        y: Math.sin(angle) * speed,
      };

      this.createParticle(position, velocity, {
        type: 'explosion',
        size: 3 + Math.random() * 4,
        color: this.getExplosionColor(),
        maxLife: 500 + Math.random() * 500,
        rotationSpeed: (Math.random() - 0.5) * 10,
      });
    }

    // Apply explosion force to nearby bodies
    this.bodies.forEach((body, id) => {
      if (!body.isStatic) {
        const distance = this.getDistance(position, body.position);
        if (distance < 150) {
          const forceMagnitude = force * (1 - distance / 150);
          const direction = this.getDirection(position, body.position);
          this.applyImpulse(id, {
            x: direction.x * forceMagnitude,
            y: direction.y * forceMagnitude,
          });
        }
      }
    });
  }

  public createTrail(
    position: Vector2D,
    color: string = '#4ECDC4',
    count: number = 5
  ): void {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 50;

      this.createParticle(position, {
        x: Math.cos(angle) * speed,
        y: Math.sin(angle) * speed,
      }, {
        type: 'trail',
        color,
        size: 2 + Math.random() * 2,
        maxLife: 300 + Math.random() * 200,
        opacity: 0.7,
        gravityScale: 0.1,
      });
    }
  }

  public createConfetti(position: Vector2D): void {
    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#FFD700'];

    for (let i = 0; i < 15; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 100 + Math.random() * 200;

      this.createParticle(position, {
        x: Math.cos(angle) * speed,
        y: Math.sin(angle) * speed - 100, // Start with upward velocity
      }, {
        type: 'confetti',
        color: colors[Math.floor(Math.random() * colors.length)],
        size: 4 + Math.random() * 6,
        maxLife: 2000 + Math.random() * 1000,
        rotationSpeed: (Math.random() - 0.5) * 15,
        gravityScale: 0.3,
      });
    }
  }

  public createStarBurst(position: Vector2D): void {
    for (let i = 0; i < 12; i++) {
      const angle = (Math.PI * 2 * i) / 12;
      const speed = 200 + Math.random() * 100;

      this.createParticle(position, {
        x: Math.cos(angle) * speed,
        y: Math.sin(angle) * speed,
      }, {
        type: 'star',
        color: '#FFD700',
        size: 6,
        maxLife: 800,
        rotationSpeed: 5,
        gravityScale: 0.2,
      });
    }
  }

  // Springs and constraints
  public addSpring(spring: Spring): void {
    this.springs.push(spring);
  }

  public removeSpring(bodyA: string, bodyB: string): void {
    this.springs = this.springs.filter(
      s => !(s.bodyA === bodyA && s.bodyB === bodyB) ||
           !(s.bodyA === bodyB && s.bodyB === bodyA)
    );
  }

  // Force fields
  public addForceField(field: ForceField): void {
    this.forceFields.push(field);
  }

  public removeForceField(position: Vector2D): void {
    this.forceFields = this.forceFields.filter(
      f => f.position.x !== position.x && f.position.y !== position.y
    );
  }

  // Simulation control
  public start(): void {
    if (this.animationFrame) return;

    this.lastTime = performance.now();
    this.animate();
  }

  public pause(): void {
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = null;
    }
  }

  public reset(): void {
    this.bodies.clear();
    this.particles = [];
    this.springs = [];
    this.forceFields = [];
  }

  public subscribe(callback: (world: PhysicsWorld) => void): () => void {
    this.subscribers.add(callback);
    return () => this.subscribers.delete(callback);
  }

  // Private methods
  private animate = (): void => {
    const currentTime = performance.now();
    const deltaTime = Math.min((currentTime - this.lastTime) / 1000, 0.016); // Cap at 60 FPS
    this.lastTime = currentTime;

    this.update(deltaTime);

    // Notify subscribers
    const world: PhysicsWorld = {
      bodies: Array.from(this.bodies.values()),
      particles: [...this.particles],
      timestamp: currentTime,
    };
    this.subscribers.forEach(callback => callback(world));

    this.animationFrame = requestAnimationFrame(this.animate);
  };

  private update(deltaTime: number): void {
    const dt = deltaTime;
    const subSteps = this.config.iterations;
    const subDt = dt / subSteps;

    // Update physics bodies
    for (let step = 0; step < subSteps; step++) {
      this.applyForces(subDt);
      this.integrate(subDt);

      if (this.config.enableCollisions) {
        this.resolveCollisions();
      }

      this.applyConstraints(subDt);
    }

    // Update particles
    this.updateParticles(dt);

    // Clean up dead particles
    this.particles = this.particles.filter(p => p.life > 0);

    // Apply force fields
    if (this.config.enableForceFields) {
      this.applyForceFields(dt);
    }
  }

  private applyForces(dt: number): void {
    this.bodies.forEach(body => {
      if (!body.isStatic) {
        // Apply gravity
        body.acceleration.x += this.config.gravity.x;
        body.acceleration.y += this.config.gravity.y;
      }
    });
  }

  private integrate(dt: number): void {
    this.bodies.forEach(body => {
      if (!body.isStatic) {
        // Verlet integration
        body.velocity.x += body.acceleration.x * dt;
        body.velocity.y += body.acceleration.y * dt;

        // Apply damping
        const damping = 0.999;
        body.velocity.x *= damping;
        body.velocity.y *= damping;

        body.position.x += body.velocity.x * dt;
        body.position.y += body.velocity.y * dt;

        // Reset acceleration for next frame
        body.acceleration.x = 0;
        body.acceleration.y = 0;

        // Boundary collision
        this.resolveBoundaryCollision(body);
      }
    });
  }

  private resolveCollisions(): void {
    const bodies = Array.from(this.bodies.values());

    for (let i = 0; i < bodies.length; i++) {
      for (let j = i + 1; j < bodies.length; j++) {
        this.resolveBodyCollision(bodies[i], bodies[j]);
      }
    }
  }

  private resolveBodyCollision(bodyA: PhysicsBody, bodyB: PhysicsBody): void {
    if (bodyA.isStatic && bodyB.isStatic) return;

    const distance = this.getDistance(bodyA.position, bodyB.position);
    const minDistance = bodyA.radius + bodyB.radius;

    if (distance < minDistance) {
      // Collision detected
      const normal = this.getDirection(bodyA.position, bodyB.position);
      const penetration = minDistance - distance;

      // Separate bodies
      const totalMass = bodyA.mass + bodyB.mass;
      const ratioA = bodyB.mass / totalMass;
      const ratioB = bodyA.mass / totalMass;

      if (!bodyA.isStatic) {
        bodyA.position.x -= normal.x * penetration * ratioA;
        bodyA.position.y -= normal.y * penetration * ratioA;
      }

      if (!bodyB.isStatic) {
        bodyB.position.x += normal.x * penetration * ratioB;
        bodyB.position.y += normal.y * penetration * ratioB;
      }

      // Resolve velocities
      const relativeVelocity = {
        x: bodyB.velocity.x - bodyA.velocity.x,
        y: bodyB.velocity.y - bodyA.velocity.y,
      };

      const velocityAlongNormal = relativeVelocity.x * normal.x + relativeVelocity.y * normal.y;

      if (velocityAlongNormal > 0) return; // Bodies moving apart

      const restitution = Math.min(bodyA.restitution, bodyB.restitution);
      const impulse = (1 + restitution) * velocityAlongNormal;

      if (!bodyA.isStatic) {
        bodyA.velocity.x += impulse * normal.x * ratioA;
        bodyA.velocity.y += impulse * normal.y * ratioA;
      }

      if (!bodyB.isStatic) {
        bodyB.velocity.x -= impulse * normal.x * ratioB;
        bodyB.velocity.y -= impulse * normal.y * ratioB;
      }
    }
  }

  private resolveBoundaryCollision(body: PhysicsBody): void {
    const { bounds } = this.config;

    // Left and right boundaries
    if (body.position.x - body.radius < 0) {
      body.position.x = body.radius;
      body.velocity.x = Math.abs(body.velocity.x) * body.restitution;
    } else if (body.position.x + body.radius > bounds.width) {
      body.position.x = bounds.width - body.radius;
      body.velocity.x = -Math.abs(body.velocity.x) * body.restitution;
    }

    // Top and bottom boundaries
    if (body.position.y - body.radius < 0) {
      body.position.y = body.radius;
      body.velocity.y = Math.abs(body.velocity.y) * body.restitution;
    } else if (body.position.y + body.radius > bounds.height) {
      body.position.y = bounds.height - body.radius;
      body.velocity.y = -Math.abs(body.velocity.y) * body.restitution;

      // Apply friction when touching ground
      body.velocity.x *= (1 - body.friction);
    }
  }

  private applyConstraints(dt: number): void {
    // Apply spring forces
    this.springs.forEach(spring => {
      const bodyA = this.bodies.get(spring.bodyA);
      const bodyB = this.bodies.get(spring.bodyB);

      if (bodyA && bodyB) {
        const distance = this.getDistance(bodyA.position, bodyB.position);
        const displacement = distance - spring.restLength;
        const force = spring.stiffness * displacement;

        const direction = this.getDirection(bodyA.position, bodyB.position);
        const springForce = {
          x: direction.x * force,
          y: direction.y * force,
        };

        if (!bodyA.isStatic) {
          bodyA.velocity.x += springForce.x * dt / bodyA.mass;
          bodyA.velocity.y += springForce.y * dt / bodyA.mass;
        }

        if (!bodyB.isStatic) {
          bodyB.velocity.x -= springForce.x * dt / bodyB.mass;
          bodyB.velocity.y -= springForce.y * dt / bodyB.mass;
        }

        // Apply damping
        const relativeVelocity = {
          x: bodyB.velocity.x - bodyA.velocity.x,
          y: bodyB.velocity.y - bodyA.velocity.y,
        };

        const dampingForce = {
          x: relativeVelocity.x * spring.damping,
          y: relativeVelocity.y * spring.damping,
        };

        if (!bodyA.isStatic) {
          bodyA.velocity.x += dampingForce.x * dt / bodyA.mass;
          bodyA.velocity.y += dampingForce.y * dt / bodyA.mass;
        }

        if (!bodyB.isStatic) {
          bodyB.velocity.x -= dampingForce.x * dt / bodyB.mass;
          bodyB.velocity.y -= dampingForce.y * dt / bodyB.mass;
        }
      }
    });
  }

  private applyForceFields(dt: number): void {
    this.bodies.forEach((body, id) => {
      if (!body.isStatic) {
        this.forceFields.forEach(field => {
          const distance = this.getDistance(field.position, body.position);

          if (distance < field.radius && distance > 0) {
            const direction = this.getDirection(body.position, field.position);
            const forceMagnitude = field.strength * (1 - distance / field.radius);

            let force: Vector2D;

            switch (field.type) {
              case 'attraction':
                force = {
                  x: -direction.x * forceMagnitude,
                  y: -direction.y * forceMagnitude,
                };
                break;
              case 'repulsion':
                force = {
                  x: direction.x * forceMagnitude,
                  y: direction.y * forceMagnitude,
                };
                break;
              case 'vortex':
                const perpendicular = {
                  x: -direction.y,
                  y: direction.x,
                };
                force = {
                  x: perpendicular.x * forceMagnitude,
                  y: perpendicular.y * forceMagnitude,
                };
                break;
              default:
                return;
            }

            this.applyForce(id, force);
          }
        });
      }
    });
  }

  private updateParticles(dt: number): void {
    this.particles.forEach(particle => {
      // Update position
      particle.position.x += particle.velocity.x * dt;
      particle.position.y += particle.velocity.y * dt;

      // Apply gravity
      particle.velocity.y += this.config.gravity.y * particle.gravityScale * dt;

      // Update rotation
      particle.rotation += particle.rotationSpeed * dt;

      // Update life
      particle.life -= dt / particle.maxLife;
      particle.opacity = Math.max(0, particle.life);
      particle.scale = 0.5 + particle.life * 0.5;

      // Apply damping
      particle.velocity.x *= 0.99;
      particle.velocity.y *= 0.99;

      // Simple boundary collision for particles
      if (particle.position.y > this.config.bounds.height) {
        particle.velocity.y *= -0.5;
        particle.position.y = this.config.bounds.height;
      }
    });
  }

  private getDistance(a: Vector2D, b: Vector2D): number {
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  private getDirection(from: Vector2D, to: Vector2D): Vector2D {
    const distance = this.getDistance(from, to);
    if (distance === 0) return { x: 0, y: 0 };

    return {
      x: (to.x - from.x) / distance,
      y: (to.y - from.y) / distance,
    };
  }

  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }

  private getExplosionColor(): string {
    const colors = ['#FF6B6B', '#FFA500', '#FFD700', '#FF4500'];
    return colors[Math.floor(Math.random() * colors.length)];
  }

  // Utility methods for puzzle games
  public createPuzzlePiecePhysics(
    position: Vector2D,
    size: { width: number; height: number },
    isStatic: boolean = false
  ): string {
    const radius = Math.max(size.width, size.height) / 2;

    return this.addBody({
      id: this.generateId(),
      position,
      mass: isStatic ? Infinity : 1,
      radius,
      restitution: 0.6,
      friction: 0.3,
      isStatic,
      userData: { type: 'puzzle-piece' },
    });
  }

  public simulatePieceDrop(
    bodyId: string,
    targetPosition: Vector2D,
    snapDistance: number = 50
  ): boolean {
    const body = this.getBody(bodyId);
    if (!body) return false;

    const distance = this.getDistance(body.position, targetPosition);

    if (distance < snapDistance) {
      // Snap to position
      body.position = { ...targetPosition };
      body.velocity = { x: 0, y: 0 };
      body.isStatic = true;
      return true;
    }

    // Apply gentle force towards target
    const direction = this.getDirection(body.position, targetPosition);
    const force = {
      x: direction.x * 100,
      y: direction.y * 100 - 50, // Slight upward force
    };

    this.applyForce(bodyId, force);
    return false;
  }
}

export interface PhysicsWorld {
  bodies: PhysicsBody[];
  particles: Particle[];
  timestamp: number;
}

// React Hook for using the physics engine
export const usePhysicsEngine = (config?: Partial<PhysicsWorldConfig>) => {
  const engineRef = useRef<PhysicsEngine>();
  const [world, setWorld] = useState<PhysicsWorld | null>(null);

  useEffect(() => {
    engineRef.current = new PhysicsEngine(config);

    const unsubscribe = engineRef.current.subscribe(setWorld);

    return () => {
      unsubscribe();
      engineRef.current?.pause();
      engineRef.current = undefined;
    };
  }, []);

  return {
    engine: engineRef.current,
    world,
    addBody: (...args: Parameters<PhysicsEngine['addBody']>) =>
      engineRef.current?.addBody(...args),
    removeBody: (...args: Parameters<PhysicsEngine['removeBody']>) =>
      engineRef.current?.removeBody(...args),
    applyForce: (...args: Parameters<PhysicsEngine['applyForce']>) =>
      engineRef.current?.applyForce(...args),
    createExplosion: (...args: Parameters<PhysicsEngine['createExplosion']>) =>
      engineRef.current?.createExplosion(...args),
    createTrail: (...args: Parameters<PhysicsEngine['createTrail']>) =>
      engineRef.current?.createTrail(...args),
    createConfetti: (...args: Parameters<PhysicsEngine['createConfetti']>) =>
      engineRef.current?.createConfetti(...args),
    createStarBurst: (...args: Parameters<PhysicsEngine['createStarBurst']>) =>
      engineRef.current?.createStarBurst(...args),
    simulatePieceDrop: (...args: Parameters<PhysicsEngine['simulatePieceDrop']>) =>
      engineRef.current?.simulatePieceDrop(...args),
  };
};

export default PhysicsEngine;