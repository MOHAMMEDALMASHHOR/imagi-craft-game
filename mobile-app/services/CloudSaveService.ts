import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserStats, HighScore, Achievement, GameState } from '@/types';

interface CloudSaveData {
  version: string;
  timestamp: number;
  deviceId: string;
  data: {
    userStats: UserStats;
    achievements: Achievement[];
    highScores: HighScore[];
    gameProgress: {
      [gameType: string]: {
        bestScores: number[];
        totalGamesPlayed: number;
        totalTimePlayed: number;
        currentStreak: number;
        lastPlayDate?: string;
      };
    };
    settings: {
      soundEnabled: boolean;
      hapticsEnabled: boolean;
      theme: 'light' | 'dark' | 'system';
      notificationsEnabled: boolean;
    };
  };
}

class CloudSaveService {
  private static instance: CloudSaveService;
  private deviceId: string;
  private cloudUrl: string;
  private apiToken: string | null = null;
  private syncInProgress = false;
  private lastSyncTime = 0;
  private syncInterval = 60000; // 1 minute

  private constructor() {
    this.deviceId = this.generateDeviceId();
    this.cloudUrl = 'https://api.imagicraft.com/sync'; // Replace with actual API endpoint
  }

  public static getInstance(): CloudSaveService {
    if (!CloudSaveService.instance) {
      CloudSaveService.instance = new CloudSaveService();
    }
    return CloudSaveService.instance;
  }

  private generateDeviceId(): string {
    const timestamp = Date.now().toString();
    const random = Math.random().toString(36).substr(2, 9);
    return `device_${timestamp}_${random}`;
  }

  // Save data to local storage
  public async saveLocalData(data: Partial<CloudSaveData['data']>): Promise<void> {
    try {
      const existingData = await this.getLocalData();
      const updatedData = {
        ...existingData,
        ...data,
        lastModified: Date.now(),
      };

      await AsyncStorage.setItem('game_save', JSON.stringify(updatedData));
      console.log('Local save successful');
    } catch (error) {
      console.error('Error saving local data:', error);
      throw error;
    }
  }

  // Load data from local storage
  public async getLocalData(): Promise<CloudSaveData['data']> {
    try {
      const savedData = await AsyncStorage.getItem('game_save');
      if (!savedData) {
        return this.getDefaultData();
      }

      const parsed = JSON.parse(savedData);
      return {
        userStats: parsed.userStats || this.getDefaultData().userStats,
        achievements: parsed.achievements || this.getDefaultData().achievements,
        highScores: parsed.highScores || this.getDefaultData().highScores,
        gameProgress: parsed.gameProgress || this.getDefaultData().gameProgress,
        settings: parsed.settings || this.getDefaultData().settings,
      };
    } catch (error) {
      console.error('Error loading local data:', error);
      return this.getDefaultData();
    }
  }

  // Sync with cloud
  public async syncWithCloud(forceSync: boolean = false): Promise<boolean> {
    if (this.syncInProgress && !forceSync) {
      console.log('Sync already in progress');
      return false;
    }

    const now = Date.now();
    if (!forceSync && now - this.lastSyncTime < this.syncInterval) {
      console.log('Sync not needed yet');
      return true;
    }

    this.syncInProgress = true;

    try {
      // Get local data
      const localData = await this.getLocalData();

      // Prepare cloud save data
      const cloudData: CloudSaveData = {
        version: '1.0.0',
        timestamp: now,
        deviceId: this.deviceId,
        data: localData,
      };

      // Upload to cloud (simulate API call)
      const success = await this.uploadToCloud(cloudData);

      if (success) {
        this.lastSyncTime = now;
        await AsyncStorage.setItem('last_sync_time', now.toString());
        console.log('Cloud sync successful');
        return true;
      }

      return false;
    } catch (error) {
      console.error('Cloud sync failed:', error);
      return false;
    } finally {
      this.syncInProgress = false;
    }
  }

  // Download from cloud
  public async downloadFromCloud(): Promise<boolean> {
    try {
      // Simulate API call to download data
      const cloudData = await this.fetchFromCloud();

      if (cloudData) {
        await this.saveLocalData(cloudData.data);
        this.lastSyncTime = Date.now();
        await AsyncStorage.setItem('last_sync_time', this.lastSyncTime.toString());
        console.log('Cloud download successful');
        return true;
      }

      return false;
    } catch (error) {
      console.error('Cloud download failed:', error);
      return false;
    }
  }

  // Merge cloud data with local data
  public async mergeWithCloud(): Promise<void> {
    try {
      const localData = await this.getLocalData();
      const cloudData = await this.fetchFromCloud();

      if (!cloudData) {
        console.log('No cloud data available to merge');
        return;
      }

      // Merge logic - favor local data if more recent
      const mergedData: CloudSaveData['data'] = {
        userStats: this.mergeUserStats(localData.userStats, cloudData.data.userStats),
        achievements: this.mergeAchievements(localData.achievements, cloudData.data.achievements),
        highScores: this.mergeHighScores(localData.highScores, cloudData.data.highScores),
        gameProgress: this.mergeGameProgress(localData.gameProgress, cloudData.data.gameProgress),
        settings: cloudData.data.settings, // Usually favor cloud settings
      };

      await this.saveLocalData(mergedData);
      this.lastSyncTime = Date.now();
      console.log('Cloud merge successful');
    } catch (error) {
      console.error('Cloud merge failed:', error);
      throw error;
    }
  }

  // Check sync status
  public async getSyncStatus(): Promise<{
    lastSync: number | null;
    pendingSync: boolean;
    cloudAvailable: boolean;
  }> {
    try {
      const lastSyncStr = await AsyncStorage.getItem('last_sync_time');
      const lastSync = lastSyncStr ? parseInt(lastSyncStr) : null;

      return {
        lastSync,
        pendingSync: this.syncInProgress,
        cloudAvailable: await this.checkCloudAvailability(),
      };
    } catch (error) {
      console.error('Error checking sync status:', error);
      return {
        lastSync: null,
        pendingSync: false,
        cloudAvailable: false,
      };
    }
  }

  // Export data for backup
  public async exportData(): Promise<string> {
    try {
      const data = await this.getLocalData();
      const exportData: CloudSaveData = {
        version: '1.0.0',
        timestamp: Date.now(),
        deviceId: this.deviceId,
        data,
      };

      return JSON.stringify(exportData, null, 2);
    } catch (error) {
      console.error('Error exporting data:', error);
      throw error;
    }
  }

  // Import data from backup
  public async importData(jsonData: string): Promise<boolean> {
    try {
      const importData: CloudSaveData = JSON.parse(jsonData);

      // Validate data structure
      if (!importData.data) {
        throw new Error('Invalid data format');
      }

      await this.saveLocalData(importData.data);
      console.log('Data import successful');
      return true;
    } catch (error) {
      console.error('Error importing data:', error);
      return false;
    }
  }

  // Clear all data
  public async clearAllData(): Promise<void> {
    try {
      await AsyncStorage.removeItem('game_save');
      await AsyncStorage.removeItem('last_sync_time');
      console.log('All data cleared successfully');
    } catch (error) {
      console.error('Error clearing data:', error);
      throw error;
    }
  }

  // Private helper methods
  private getDefaultData(): CloudSaveData['data'] {
    return {
      userStats: {
        totalGamesPlayed: 0,
        totalTimePlayed: 0,
        favoriteGame: null,
        achievements: [],
        highScores: [],
        currentStreak: 0,
        bestStreak: 0,
      },
      achievements: [],
      highScores: [],
      gameProgress: {},
      settings: {
        soundEnabled: true,
        hapticsEnabled: true,
        theme: 'system',
        notificationsEnabled: true,
      },
    };
  }

  private async uploadToCloud(data: CloudSaveData): Promise<boolean> {
    try {
      // Simulate API call - replace with actual implementation
      console.log('Uploading to cloud:', data);

      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Simulate success/failure (90% success rate)
      return Math.random() > 0.1;
    } catch (error) {
      console.error('Upload error:', error);
      return false;
    }
  }

  private async fetchFromCloud(): Promise<CloudSaveData | null> {
    try {
      // Simulate API call - replace with actual implementation
      console.log('Fetching from cloud');

      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Return null for now - in real implementation, fetch from server
      return null;
    } catch (error) {
      console.error('Fetch error:', error);
      return null;
    }
  }

  private async checkCloudAvailability(): Promise<boolean> {
    try {
      // Simulate checking cloud availability
      return true;
    } catch (error) {
      return false;
    }
  }

  private mergeUserStats(local: UserStats, cloud: UserStats): UserStats {
    return {
      totalGamesPlayed: Math.max(local.totalGamesPlayed, cloud.totalGamesPlayed),
      totalTimePlayed: Math.max(local.totalTimePlayed, cloud.totalTimePlayed),
      favoriteGame: local.favoriteGame || cloud.favoriteGame,
      achievements: local.achievements, // Use local achievements
      highScores: this.mergeHighScores(local.highScores, cloud.highScores),
      currentStreak: Math.max(local.currentStreak, cloud.currentStreak),
      bestStreak: Math.max(local.bestStreak, cloud.bestStreak),
    };
  }

  private mergeAchievements(local: Achievement[], cloud: Achievement[]): Achievement[] {
    const merged = new Map<string, Achievement>();

    // Add all achievements from both sources
    [...local, ...cloud].forEach(achievement => {
      const existing = merged.get(achievement.id);
      if (!existing || !existing.unlocked && achievement.unlocked) {
        merged.set(achievement.id, { ...achievement });
      } else if (existing && achievement.unlocked) {
        // Keep the earliest unlock date
        merged.set(achievement.id, {
          ...existing,
          unlockedAt: existing.unlockedAt || achievement.unlockedAt,
        });
      }
    });

    return Array.from(merged.values());
  }

  private mergeHighScores(local: HighScore[], cloud: HighScore[]): HighScore[] {
    const allScores = [...local, ...cloud];

    // Sort by date and remove duplicates, keeping the best score for each game
    const uniqueScores = new Map<string, HighScore>();

    allScores.forEach(score => {
      const key = `${score.gameType}_${score.difficulty}`;
      const existing = uniqueScores.get(key);

      if (!existing || score.score > existing.score) {
        uniqueScores.set(key, score);
      }
    });

    return Array.from(uniqueScores.values())
      .sort((a, b) => b.score - a.score)
      .slice(0, 100); // Keep top 100 scores
  }

  private mergeGameProgress(local: any, cloud: any): any {
    const merged = { ...local };

    Object.keys(cloud).forEach(gameType => {
      if (!merged[gameType]) {
        merged[gameType] = cloud[gameType];
      } else {
        merged[gameType] = {
          bestScores: [...new Set([...merged[gameType].bestScores, ...cloud[gameType].bestScores])]
            .sort((a: number, b: number) => b - a)
            .slice(0, 10),
          totalGamesPlayed: merged[gameType].totalGamesPlayed + cloud[gameType].totalGamesPlayed,
          totalTimePlayed: merged[gameType].totalTimePlayed + cloud[gameType].totalTimePlayed,
          currentStreak: Math.max(merged[gameType].currentStreak, cloud[gameType].currentStreak),
          lastPlayDate: merged[gameType].lastPlayDate || cloud[gameType].lastPlayDate,
        };
      }
    });

    return merged;
  }
}

export default CloudSaveService;