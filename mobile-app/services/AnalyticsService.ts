import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { GameType, Difficulty } from '@/types';

interface AnalyticsEvent {
  eventName: string;
  parameters: Record<string, any>;
  timestamp: number;
  sessionId: string;
  userId?: string;
}

interface GameSession {
  id: string;
  startTime: number;
  endTime?: number;
  gameType: GameType;
  difficulty: Difficulty;
  moves?: number;
  score?: number;
  completed?: boolean;
  powerUpsUsed?: number;
  duration?: number;
}

interface UserMetrics {
  totalSessions: number;
  totalPlayTime: number;
  favoriteGameType?: GameType;
  averageSessionLength: number;
  retentionDay1: boolean;
  retentionDay7: boolean;
  retentionDay30: boolean;
  firstLaunchDate: number;
  lastActiveDate: number;
  achievementsUnlocked: number;
  powerUpsPurchased: number;
  adsWatched: number;
  premiumStatus: 'free' | 'premium';
}

class AnalyticsService {
  private static instance: AnalyticsService;
  private sessionId: string;
  private userId: string | null = null;
  private events: AnalyticsEvent[] = [];
  private currentSession: GameSession | null = null;
  private apiKey: string;
  private endpoint: string;
  private batch_size = 50;
  private last_flush = 0;

  private constructor() {
    this.sessionId = this.generateSessionId();
    this.userId = null;
    this.apiKey = 'your-analytics-api-key'; // Replace with actual API key
    this.endpoint = 'https://analytics.imagicraft.com/events'; // Replace with actual endpoint
    this.initializeUser();
  }

  public static getInstance(): AnalyticsService {
    if (!AnalyticsService.instance) {
      AnalyticsService.instance = new AnalyticsService();
    }
    return AnalyticsService.instance;
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateUserId(): string {
    return `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private async initializeUser(): Promise<void> {
    try {
      let userId = await AsyncStorage.getItem('analytics_user_id');
      if (!userId) {
        userId = this.generateUserId();
        await AsyncStorage.setItem('analytics_user_id', userId);
      }
      this.userId = userId;

      // Track first launch
      const firstLaunch = await AsyncStorage.getItem('first_launch_date');
      if (!firstLaunch) {
        const now = Date.now();
        await AsyncStorage.setItem('first_launch_date', now.toString());
        this.trackEvent('app_first_launch', {
          platform: Platform.OS,
          version: '1.0.0',
        });
      }

      // Track app open
      this.trackEvent('app_open', {
        platform: Platform.OS,
        session_id: this.sessionId,
      });

    } catch (error) {
      console.error('Analytics initialization error:', error);
    }
  }

  // Track custom events
  public trackEvent(eventName: string, parameters: Record<string, any> = {}): void {
    const event: AnalyticsEvent = {
      eventName,
      parameters,
      timestamp: Date.now(),
      sessionId: this.sessionId,
      userId: this.userId || undefined,
    };

    this.events.push(event);
    console.log('Analytics Event:', eventName, parameters);

    // Flush events if batch size reached
    if (this.events.length >= this.batch_size) {
      this.flushEvents();
    }
  }

  // Game session tracking
  public startGameSession(gameType: GameType, difficulty: Difficulty): void {
    this.currentSession = {
      id: this.generateSessionId(),
      startTime: Date.now(),
      gameType,
      difficulty,
    };

    this.trackEvent('game_session_start', {
      game_type: gameType,
      difficulty,
      session_id: this.currentSession.id,
    });
  }

  public endGameSession(
    moves: number,
    score: number,
    completed: boolean,
    powerUpsUsed: number = 0
  ): void {
    if (!this.currentSession) return;

    const endTime = Date.now();
    const duration = endTime - this.currentSession.startTime;

    const sessionData = {
      ...this.currentSession,
      endTime,
      moves,
      score,
      completed,
      powerUpsUsed,
      duration,
    };

    this.trackEvent('game_session_end', {
      game_type: this.currentSession.gameType,
      difficulty: this.currentSession.difficulty,
      moves,
      score,
      completed,
      duration,
      powerUps_used: powerUpsUsed,
      session_id: this.currentSession.id,
    });

    // Update user metrics
    this.updateUserMetrics(sessionData);

    this.currentSession = null;
  }

  // Track game-specific events
  public trackPowerUpUsed(powerUpId: string, powerUpType: string): void {
    this.trackEvent('power_up_used', {
      power_up_id: powerUpId,
      power_up_type: powerUpType,
      game_type: this.currentSession?.gameType,
    });
  }

  public trackLevelUp(newLevel: number, previousLevel: number): void {
    this.trackEvent('level_up', {
      new_level: newLevel,
      previous_level: previousLevel,
    });
  }

  public trackAchievementUnlocked(achievementId: string, achievementTitle: string): void {
    this.trackEvent('achievement_unlocked', {
      achievement_id: achievementId,
      achievement_title: achievementTitle,
    });
  }

  public trackInAppPurchase(productId: string, price: number, currency: string): void {
    this.trackEvent('in_app_purchase', {
      product_id: productId,
      price,
      currency,
      revenue: price,
    });
  }

  public trackAdWatched(adType: string, rewarded: boolean): void {
    this.trackEvent('ad_watched', {
      ad_type: adType,
      rewarded,
    });
  }

  public trackTutorialStep(step: number, totalSteps: number): void {
    this.trackEvent('tutorial_step', {
      step,
      total_steps: totalSteps,
      completion_rate: step / totalSteps,
    });
  }

  public trackTutorialCompleted(): void {
    this.trackEvent('tutorial_completed');
  }

  public trackSocialAction(action: 'invite_sent' | 'invite_accepted' | 'share', platform: string): void {
    this.trackEvent('social_action', {
      action,
      platform,
    });
  }

  // Performance tracking
  public trackPerformance(metric: string, value: number, unit: string): void {
    this.trackEvent('performance_metric', {
      metric_name: metric,
      value,
      unit,
    });
  }

  public trackError(errorType: string, errorMessage: string, context?: string): void {
    this.trackEvent('error', {
      error_type: errorType,
      error_message: errorMessage,
      context,
    });
  }

  // User metrics tracking
  public async updateUserMetrics(sessionData: GameSession): Promise<void> {
    try {
      const existingMetrics = await this.getUserMetrics();

      const updatedMetrics: UserMetrics = {
        ...existingMetrics,
        totalSessions: existingMetrics.totalSessions + 1,
        totalPlayTime: existingMetrics.totalPlayTime + (sessionData.duration || 0),
        lastActiveDate: Date.now(),
        averageSessionLength: (existingMetrics.totalPlayTime + (sessionData.duration || 0)) / (existingMetrics.totalSessions + 1),
      };

      // Update favorite game type
      if (sessionData.completed && sessionData.score > 0) {
        // Simple logic to determine favorite - could be more sophisticated
        updatedMetrics.favoriteGameType = sessionData.gameType;
      }

      // Check retention
      const firstLaunch = new Date(existingMetrics.firstLaunchDate);
      const now = new Date();
      const daysSinceFirstLaunch = Math.floor((now.getTime() - firstLaunch.getTime()) / (1000 * 60 * 60 * 24));

      if (daysSinceFirstLaunch >= 1 && !existingMetrics.retentionDay1) {
        updatedMetrics.retentionDay1 = true;
      }
      if (daysSinceFirstLaunch >= 7 && !existingMetrics.retentionDay7) {
        updatedMetrics.retentionDay7 = true;
      }
      if (daysSinceFirstLaunch >= 30 && !existingMetrics.retentionDay30) {
        updatedMetrics.retentionDay30 = true;
      }

      await AsyncStorage.setItem('user_metrics', JSON.stringify(updatedMetrics));
    } catch (error) {
      console.error('Error updating user metrics:', error);
    }
  }

  public async getUserMetrics(): Promise<UserMetrics> {
    try {
      const metrics = await AsyncStorage.getItem('user_metrics');
      if (!metrics) {
        const defaultMetrics: UserMetrics = {
          totalSessions: 0,
          totalPlayTime: 0,
          averageSessionLength: 0,
          retentionDay1: false,
          retentionDay7: false,
          retentionDay30: false,
          firstLaunchDate: Date.now(),
          lastActiveDate: Date.now(),
          achievementsUnlocked: 0,
          powerUpsPurchased: 0,
          adsWatched: 0,
          premiumStatus: 'free',
        };
        await AsyncStorage.setItem('user_metrics', JSON.stringify(defaultMetrics));
        return defaultMetrics;
      }
      return JSON.parse(metrics);
    } catch (error) {
      console.error('Error getting user metrics:', error);
      return this.getDefaultMetrics();
    }
  }

  private getDefaultMetrics(): UserMetrics {
    return {
      totalSessions: 0,
      totalPlayTime: 0,
      averageSessionLength: 0,
      retentionDay1: false,
      retentionDay7: false,
      retentionDay30: false,
      firstLaunchDate: Date.now(),
      lastActiveDate: Date.now(),
      achievementsUnlocked: 0,
      powerUpsPurchased: 0,
      adsWatched: 0,
      premiumStatus: 'free',
    };
  }

  // Flush events to server
  public async flushEvents(): Promise<void> {
    if (this.events.length === 0) return;

    const now = Date.now();
    if (now - this.last_flush < 5000) return; // Don't flush more than once every 5 seconds

    const eventsToSend = [...this.events];
    this.events = [];
    this.last_flush = now;

    try {
      await this.sendEvents(eventsToSend);
    } catch (error) {
      console.error('Error flushing events:', error);
      // Re-add events to queue for retry
      this.events.unshift(...eventsToSend);
    }
  }

  private async sendEvents(events: AnalyticsEvent[]): Promise<void> {
    try {
      // Simulate API call - replace with actual implementation
      console.log('Sending events to analytics:', events.length, 'events');

      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      // In real implementation, make actual HTTP request:
      // await fetch(this.endpoint, {
      //   method: 'POST',
      //   headers: {
      //     'Content-Type': 'application/json',
      //     'Authorization': `Bearer ${this.apiKey}`,
      //   },
      //   body: JSON.stringify({
      //     events,
      //     app_version: '1.0.0',
      //     platform: Platform.OS,
      //   }),
      // });
    } catch (error) {
      throw error;
    }
  }

  // Public methods for getting analytics data
  public async getRetentionMetrics(): Promise<{
    day1: number;
    day7: number;
    day30: number;
  }> {
    try {
      const metrics = await this.getUserMetrics();
      return {
        day1: metrics.retentionDay1 ? 1 : 0,
        day7: metrics.retentionDay7 ? 1 : 0,
        day30: metrics.retentionDay30 ? 1 : 0,
      };
    } catch (error) {
      return { day1: 0, day7: 0, day30: 0 };
    }
  }

  public async getEngagementMetrics(): Promise<{
    averageSessionLength: number;
    totalSessions: number;
    totalPlayTime: number;
    favoriteGameType: GameType | null;
  }> {
    try {
      const metrics = await this.getUserMetrics();
      return {
        averageSessionLength: metrics.averageSessionLength,
        totalSessions: metrics.totalSessions,
        totalPlayTime: metrics.totalPlayTime,
        favoriteGameType: metrics.favoriteGameType || null,
      };
    } catch (error) {
      return {
        averageSessionLength: 0,
        totalSessions: 0,
        totalPlayTime: 0,
        favoriteGameType: null,
      };
    }
  }

  // Clean up old events
  public async cleanup(): Promise<void> {
    await this.flushEvents();
    this.events = [];
  }

  // Set user properties
  public setUserProperty(property: string, value: any): void {
    this.trackEvent('user_property_set', {
      property_name: property,
      property_value: value,
    });
  }

  public setUserProperties(properties: Record<string, any>): void {
    this.trackEvent('user_properties_set', { properties });
  }
}

export default AnalyticsService;