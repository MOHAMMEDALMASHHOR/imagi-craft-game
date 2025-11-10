import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { Platform } from 'react-native';

interface PerformanceMetrics {
  fps: number;
  memoryUsage: number;
  renderTime: number;
  networkLatency: number;
  batteryLevel?: number;
  thermalState?: string;
  appSize: number;
}

interface PerformanceContextType {
  metrics: PerformanceMetrics;
  isLowEndDevice: boolean;
  isHighEndDevice: boolean;
  shouldReduceQuality: boolean;
  currentQualityLevel: 'low' | 'medium' | 'high' | 'auto';
  setQualityLevel: (level: 'low' | 'medium' | 'high' | 'auto') => void;
  optimizePerformance: () => void;
}

const PerformanceContext = createContext<PerformanceContextType | null>(null);

export const usePerformance = () => {
  const context = useContext(PerformanceContext);
  if (!context) {
    throw new Error('usePerformance must be used within PerformanceProvider');
  }
  return context;
};

interface PerformanceProviderProps {
  children: React.ReactNode;
}

export const PerformanceProvider: React.FC<PerformanceProviderProps> = ({ children }) => {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    fps: 60,
    memoryUsage: 0,
    renderTime: 0,
    networkLatency: 0,
    appSize: 0,
  });

  const [qualityLevel, setQualityLevel] = useState<'low' | 'medium' | 'high' | 'auto'>('auto');
  const [isLowEndDevice, setIsLowEndDevice] = useState(false);
  const [isHighEndDevice, setIsHighEndDevice] = useState(false);

  const frameCount = useRef(0);
  const lastFrameTime = useRef(Date.now());
  const performanceTimer = useRef<NodeJS.Timeout>();

  useEffect(() => {
    detectDeviceCapabilities();
    startPerformanceMonitoring();
    return () => {
      if (performanceTimer.current) {
        clearInterval(performanceTimer.current);
      }
    };
  }, []);

  const detectDeviceCapabilities = () => {
    // Detect device performance characteristics
    const memory = (performance as any).memory;
    const hardwareConcurrency = navigator.hardwareConcurrency || 4;

    // Simple heuristics for device classification
    const lowMemory = memory && memory.totalJSHeapSize < 100 * 1024 * 1024; // 100MB
    const lowCores = hardwareConcurrency < 4;
    const lowFPS = detectAverageFPS() < 30;

    const isLowEnd = lowMemory || lowCores || lowFPS;
    const isHighEnd = !lowMemory && hardwareConcurrency >= 8 && !lowFPS;

    setIsLowEndDevice(isLowEnd);
    setIsHighEndDevice(isHighEnd);

    // Auto-adjust quality based on device
    if (isLowEnd) {
      setQualityLevel('low');
    } else if (isHighEnd) {
      setQualityLevel('high');
    } else {
      setQualityLevel('medium');
    }
  };

  const detectAverageFPS = (): number => {
    // Simple FPS detection
    let fps = 60;
    const startTime = performance.now();
    let frames = 0;

    const countFPS = () => {
      frames++;
      if (performance.now() - startTime < 1000) {
        requestAnimationFrame(countFPS);
      } else {
        fps = frames;
      }
    };

    requestAnimationFrame(countFPS);
    return fps;
  };

  const startPerformanceMonitoring = () => {
    // Monitor FPS
    const measureFPS = () => {
      const now = Date.now();
      frameCount.current++;

      if (now - lastFrameTime.current >= 1000) {
        const fps = Math.round((frameCount.current * 1000) / (now - lastFrameTime.current));

        setMetrics(prev => ({
          ...prev,
          fps,
        }));

        frameCount.current = 0;
        lastFrameTime.current = now;
      }

      requestAnimationFrame(measureFPS);
    };

    requestAnimationFrame(measureFPS);

    // Monitor memory usage
    performanceTimer.current = setInterval(() => {
      updatePerformanceMetrics();
    }, 5000); // Update every 5 seconds
  };

  const updatePerformanceMetrics = () => {
    try {
      const memory = (performance as any).memory;
      const memoryUsage = memory ? memory.usedJSHeapSize / 1024 / 1024 : 0; // MB

      // Measure render time (simplified)
      const startTime = performance.now();
      requestAnimationFrame(() => {
        const renderTime = performance.now() - startTime;

        setMetrics(prev => ({
          ...prev,
          memoryUsage,
          renderTime: Math.round(renderTime * 100) / 100,
        }));
      });

      // Get battery info if available
      if ('getBattery' in navigator) {
        (navigator as any).getBattery().then((battery: any) => {
          setMetrics(prev => ({
            ...prev,
            batteryLevel: Math.round(battery.level * 100),
            thermalState: battery.thermalState,
          }));
        });
      }

    } catch (error) {
      console.error('Error updating performance metrics:', error);
    }
  };

  const shouldReduceQuality = (): boolean => {
    return (
      metrics.fps < 45 ||
      metrics.memoryUsage > 150 ||
      metrics.renderTime > 16 ||
      isLowEndDevice ||
      qualityLevel === 'low'
    );
  };

  const optimizePerformance = () => {
    // Dynamic quality adjustment based on performance
    if (shouldReduceQuality() && qualityLevel !== 'low') {
      setQualityLevel('low');
    } else if (metrics.fps > 55 && !isLowEndDevice && qualityLevel === 'low') {
      setQualityLevel('medium');
    } else if (metrics.fps > 58 && isHighEndDevice && qualityLevel === 'medium') {
      setQualityLevel('high');
    }
  };

  const value: PerformanceContextType = {
    metrics,
    isLowEndDevice,
    isHighEndDevice,
    shouldReduceQuality,
    currentQualityLevel: qualityLevel,
    setQualityLevel,
    optimizePerformance,
  };

  return (
    <PerformanceContext.Provider value={value}>
      {children}
    </PerformanceContext.Provider>
  );
};

// Performance-optimized components
export const OptimizedImage: React.FC<{
  source: any;
  style?: any;
  placeholder?: string;
  quality?: 'low' | 'medium' | 'high';
  lazy?: boolean;
}> = ({ source, style, placeholder, quality, lazy = false }) => {
  const { shouldReduceQuality, currentQualityLevel } = usePerformance();

  const effectiveQuality = quality || (shouldReduceQuality() ? 'low' : currentQualityLevel);

  const getOptimizedSource = (originalSource: any, imgQuality: string) => {
    // In a real implementation, you would modify the image source based on quality
    if (imgQuality === 'low') {
      return {
        ...originalSource,
        // Add quality parameters
        uri: originalSource.uri + '?quality=30&width=200',
      };
    } else if (imgQuality === 'medium') {
      return {
        ...originalSource,
        uri: originalSource.uri + '?quality=60&width=400',
      };
    }
    return originalSource;
  };

  if (lazy) {
    return (
      <LazyImage
        source={getOptimizedSource(source, effectiveQuality)}
        style={style}
        placeholder={placeholder}
      />
    );
  }

  return (
    <Image
      source={getOptimizedSource(source, effectiveQuality)}
      style={style}
      defaultSource={placeholder ? { uri: placeholder } : undefined}
    />
  );
};

const LazyImage: React.FC<{
  source: any;
  style?: any;
  placeholder?: string;
}> = ({ source, style, placeholder }) => {
  const [loaded, setLoaded] = useState(false);
  const [inViewport, setInViewport] = useState(false);
  const imageRef = useRef<any>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInViewport(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    if (imageRef.current) {
      observer.observe(imageRef.current);
    }

    return () => observer.disconnect();
  }, []);

  if (!inViewport) {
    return (
      <View
        ref={imageRef}
        style={[
          style,
          { backgroundColor: '#F3F4F6' },
        ]}
      />
    );
  }

  return (
    <Image
      ref={imageRef}
      source={source}
      style={style}
      onLoad={() => setLoaded(true)}
      defaultSource={placeholder ? { uri: placeholder } : undefined}
    />
  );
};

export const OptimizedAnimation: React.FC<{
  children: React.ReactNode;
  duration?: number;
  disabled?: boolean;
  style?: any;
}> = ({ children, duration = 300, disabled = false, style }) => {
  const { shouldReduceQuality } = usePerformance();

  if (disabled || shouldReduceQuality()) {
    return <View style={style}>{children}</View>;
  }

  return (
    <Animated.View
      style={[
        {
          animation: `fadeIn ${duration}ms ease-in-out`,
        },
        style,
      ]}
    >
      {children}
    </Animated.View>
  );
};

// Performance monitoring component
export const PerformanceMonitor: React.FC<{
  visible?: boolean;
}> = ({ visible = false }) => {
  const { metrics, currentQualityLevel, optimizePerformance } = usePerformance();

  if (!visible) return null;

  return (
    <View style={styles.monitorContainer}>
      <Text style={styles.monitorTitle}>Performance Monitor</Text>

      <View style={styles.metricRow}>
        <Text style={styles.metricLabel}>FPS:</Text>
        <Text style={[
          styles.metricValue,
          { color: metrics.fps > 50 ? '#10B981' : metrics.fps > 30 ? '#F59E0B' : '#EF4444' }
        ]}>
          {metrics.fps}
        </Text>
      </View>

      <View style={styles.metricRow}>
        <Text style={styles.metricLabel}>Memory:</Text>
        <Text style={styles.metricValue}>{metrics.memoryUsage.toFixed(1)} MB</Text>
      </View>

      <View style={styles.metricRow}>
        <Text style={styles.metricLabel}>Render Time:</Text>
        <Text style={styles.metricValue}>{metrics.renderTime} ms</Text>
      </View>

      <View style={styles.metricRow}>
        <Text style={styles.metricLabel}>Quality:</Text>
        <Text style={styles.metricValue}>{currentQualityLevel}</Text>
      </View>

      {metrics.batteryLevel !== undefined && (
        <View style={styles.metricRow}>
          <Text style={styles.metricLabel}>Battery:</Text>
          <Text style={styles.metricValue}>{metrics.batteryLevel}%</Text>
        </View>
      )}

      <TouchableOpacity style={styles.optimizeButton} onPress={optimizePerformance}>
        <Text style={styles.optimizeButtonText}>Optimize</Text>
      </TouchableOpacity>
    </View>
  );
};

// Memory management utilities
export class MemoryManager {
  private static cache = new Map<string, any>();
  private static maxCacheSize = 50 * 1024 * 1024; // 50MB
  private static currentCacheSize = 0;

  static set(key: string, value: any): void {
    try {
      const size = JSON.stringify(value).length;

      // Clear cache if it gets too large
      if (this.currentCacheSize + size > this.maxCacheSize) {
        this.clearOldestEntries();
      }

      this.cache.set(key, value);
      this.currentCacheSize += size;
    } catch (error) {
      console.error('Cache set error:', error);
      // Clear cache on error
      this.clearAll();
    }
  }

  static get(key: string): any {
    const value = this.cache.get(key);
    if (value) {
      // Move to end (LRU)
      this.cache.delete(key);
      this.cache.set(key, value);
    }
    return value;
  }

  static clearAll(): void {
    this.cache.clear();
    this.currentCacheSize = 0;
  }

  static clearOldestEntries(): void {
    const entries = Array.from(this.cache.entries());
    const entriesToRemove = Math.floor(entries.length * 0.3); // Remove 30%

    for (let i = 0; i < entriesToRemove; i++) {
      const [key] = entries[i];
      const size = JSON.stringify(this.cache.get(key)).length;
      this.cache.delete(key);
      this.currentCacheSize -= size;
    }
  }

  static getCacheInfo(): { size: number; count: number; maxSize: number } {
    return {
      size: this.currentCacheSize,
      count: this.cache.size,
      maxSize: this.maxCacheSize,
    };
  }
}

// Asset preloading utility
export class AssetPreloader {
  private static preloadedImages = new Set<string>();
  private static preloadingQueue: string[] = [];

  static async preloadImages(urls: string[]): Promise<void> {
    this.preloadingQueue.push(...urls);
    this.processQueue();
  }

  private static async processQueue(): Promise<void> {
    if (this.preloadingQueue.length === 0) return;

    const url = this.preloadingQueue.shift()!;

    try {
      await Image.prefetch(url);
      this.preloadedImages.add(url);
    } catch (error) {
      console.error('Failed to preload image:', url, error);
    }

    // Process next in queue
    this.processQueue();
  }

  static isPreloaded(url: string): boolean {
    return this.preloadedImages.has(url);
  }
}

const styles = StyleSheet.create({
  monitorContainer: {
    position: 'absolute',
    top: 50,
    left: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    color: '#FFFFFF',
    padding: 10,
    borderRadius: 8,
    zIndex: 1000,
    minWidth: 200,
  },
  monitorTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  metricLabel: {
    fontSize: 12,
    color: '#FFFFFF',
  },
  metricValue: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  optimizeButton: {
    backgroundColor: '#6366F1',
    padding: 8,
    borderRadius: 4,
    alignItems: 'center',
    marginTop: 8,
  },
  optimizeButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
});