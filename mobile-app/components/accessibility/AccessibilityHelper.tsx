import React, { createContext, useContext, useState, useEffect } from 'react';
import { Platform } from 'react-native';

interface AccessibilitySettings {
  reduceMotion: boolean;
  highContrast: boolean;
  largeText: boolean;
  screenReaderEnabled: boolean;
  soundEnabled: boolean;
  hapticFeedbackEnabled: boolean;
  colorBlindMode: 'none' | 'protanopia' | 'deuteranopia' | 'tritanopia';
  gestureSensitivity: 'low' | 'normal' | 'high';
  autoPlayAnimations: boolean;
}

interface AccessibilityContextType {
  settings: AccessibilitySettings;
  updateSetting: (setting: keyof AccessibilitySettings, value: any) => void;
  isColorBlindFriendly: (color: string) => string;
  getAdaptiveFontSize: (baseSize: number) => number;
  shouldReduceMotion: () => boolean;
  announceForAccessibility: (message: string) => void;
}

const AccessibilityContext = createContext<AccessibilityContextType | null>(null);

export const useAccessibility = () => {
  const context = useContext(AccessibilityContext);
  if (!context) {
    throw new Error('useAccessibility must be used within AccessibilityProvider');
  }
  return context;
};

interface AccessibilityProviderProps {
  children: React.ReactNode;
}

export const AccessibilityProvider: React.FC<AccessibilityProviderProps> = ({ children }) => {
  const [settings, setSettings] = useState<AccessibilitySettings>({
    reduceMotion: false,
    highContrast: false,
    largeText: false,
    screenReaderEnabled: false,
    soundEnabled: true,
    hapticFeedbackEnabled: true,
    colorBlindMode: 'none',
    gestureSensitivity: 'normal',
    autoPlayAnimations: true,
  });

  useEffect(() => {
    loadAccessibilitySettings();
    detectSystemAccessibility();
  }, []);

  const loadAccessibilitySettings = async () => {
    try {
      // In a real app, load from AsyncStorage
      const savedSettings = await localStorage.getItem('accessibility_settings');
      if (savedSettings) {
        const parsed = JSON.parse(savedSettings);
        setSettings(prev => ({ ...prev, ...parsed }));
      }
    } catch (error) {
      console.error('Error loading accessibility settings:', error);
    }
  };

  const detectSystemAccessibility = () => {
    // Detect system accessibility preferences
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const prefersHighContrast = window.matchMedia('(prefers-contrast: high)').matches;

    setSettings(prev => ({
      ...prev,
      reduceMotion: prefersReducedMotion,
      highContrast: prefersHighContrast,
    }));
  };

  const updateSetting = (setting: keyof AccessibilitySettings, value: any) => {
    const newSettings = { ...settings, [setting]: value };
    setSettings(newSettings);

    // Save to storage
    try {
      localStorage.setItem('accessibility_settings', JSON.stringify(newSettings));
    } catch (error) {
      console.error('Error saving accessibility settings:', error);
    }
  };

  const isColorBlindFriendly = (color: string): string => {
    if (settings.colorBlindMode === 'none') return color;

    const colorMap: { [key: string]: { [key: string]: string } } = {
      '#6366F1': { // Primary blue
        protanopia: '#4F46E5', // More blue-friendly
        deuteranopia: '#4338CA', // More blue-purple
        tritanopia: '#4F46E5', // Blue-shifted
      },
      '#10B981': { // Success green
        protanopia: '#059669', // Darker green
        deuteranopia: '#047857', // Darker green-blue
        tritanopia: '#0891B2', // Blue-tinted
      },
      '#F59E0B': { // Warning yellow
        protanopia: '#D97706', // Darker orange
        deuteranopia: '#B45309', // Brown
        tritanopia: '#EA580C', // Red-orange
      },
      '#EF4444': { // Error red
        protanopia: '#DC2626', // Darker red
        deuteranopia: '#B91C1C', // Very dark red
        tritanopia: '#1E40AF', // Blue
      },
    };

    const colorVariants = colorMap[color];
    if (colorVariants && colorVariants[settings.colorBlindMode]) {
      return colorVariants[settings.colorBlindMode];
    }

    return color;
  };

  const getAdaptiveFontSize = (baseSize: number): number => {
    if (settings.largeText) {
      return baseSize * 1.25;
    }
    if (settings.highContrast) {
      return baseSize * 1.1;
    }
    return baseSize;
  };

  const shouldReduceMotion = (): boolean => {
    return settings.reduceMotion || !settings.autoPlayAnimations;
  };

  const announceForAccessibility = (message: string) => {
    if (Platform.OS === 'web' && 'speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(message);
      utterance.rate = 0.9;
      window.speechSynthesis.speak(utterance);
    }
    // For native, would use React Native's Accessibility API
  };

  const value: AccessibilityContextType = {
    settings,
    updateSetting,
    isColorBlindFriendly,
    getAdaptiveFontSize,
    shouldReduceMotion,
    announceForAccessibility,
  };

  return (
    <AccessibilityContext.Provider value={value}>
      {children}
    </AccessibilityContext.Provider>
  );
};

// Accessibility components
export const AccessibleButton: React.FC<{
  children: React.ReactNode;
  onPress: () => void;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  accessibilityRole?: string;
  style?: any;
  className?: string;
}> = ({
  children,
  onPress,
  accessibilityLabel,
  accessibilityHint,
  accessibilityRole,
  style,
  className,
}) => {
  const { announceForAccessibility } = useAccessibility();

  const handlePress = () => {
    if (accessibilityLabel) {
      announceForAccessibility(accessibilityLabel);
    }
    onPress();
  };

  return (
    <button
      onClick={handlePress}
      aria-label={accessibilityLabel}
      aria-describedby={accessibilityHint}
      role={accessibilityRole || 'button'}
      className={className}
      style={{
        ...style,
        // Ensure minimum touch target size (44x44 points)
        minHeight: 44,
        minWidth: 44,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {children}
    </button>
  );
};

export const AccessibleText: React.FC<{
  children: React.ReactNode;
  fontSize?: number;
  important?: boolean;
  style?: any;
}> = ({ children, fontSize = 16, important = false, style }) => {
  const { getAdaptiveFontSize, settings } = useAccessibility();

  const adaptedSize = getAdaptiveFontSize(fontSize);

  return (
    <Text
      style={{
        fontSize: adaptedSize,
        fontWeight: important ? 'bold' : 'normal',
        color: settings.highContrast ? '#000000' : '#374151',
        lineHeight: adaptedSize * 1.4,
        ...style,
      }}
      accessibilityRole={important ? 'heading' : 'text'}
    >
      {children}
    </Text>
  );
};

export const ColorBlindSafeView: React.FC<{
  children: React.ReactNode;
  backgroundColor?: string;
  style?: any;
}> = ({ children, backgroundColor = '#FFFFFF', style }) => {
  const { isColorBlindFriendly, settings } = useAccessibility();

  const adaptedColor = isColorBlindFriendly(backgroundColor);

  return (
    <View
      style={{
        backgroundColor: adaptedColor,
        ...(settings.highContrast && {
          borderWidth: 2,
          borderColor: '#000000',
        }),
        ...style,
      }}
    >
      {children}
    </View>
  );
};

export const MotionReducedAnimation: React.FC<{
  children: React.ReactNode;
  duration?: number;
  style?: any;
}> = ({ children, duration = 300, style }) => {
  const { shouldReduceMotion } = useAccessibility();

  if (shouldReduceMotion()) {
    return <View style={style}>{children}</View>;
  }

  return (
    <Animated.View
      style={{
        animation: `fadeIn ${duration}ms ease-in-out`,
        ...style,
      }}
    >
      {children}
    </Animated.View>
  );
};

// Accessibility settings modal
export const AccessibilitySettingsModal: React.FC<{
  visible: boolean;
  onClose: () => void;
}> = ({ visible, onClose }) => {
  const { settings, updateSetting } = useAccessibility();

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Accessibility Settings</Text>

          <ScrollView style={styles.settingsContainer}>
            {/* Reduce Motion */}
            <View style={styles.settingItem}>
              <Text style={styles.settingLabel}>Reduce Motion</Text>
              <Switch
                value={settings.reduceMotion}
                onValueChange={(value) => updateSetting('reduceMotion', value)}
              />
            </View>

            {/* High Contrast */}
            <View style={styles.settingItem}>
              <Text style={styles.settingLabel}>High Contrast</Text>
              <Switch
                value={settings.highContrast}
                onValueChange={(value) => updateSetting('highContrast', value)}
              />
            </View>

            {/* Large Text */}
            <View style={styles.settingItem}>
              <Text style={styles.settingLabel}>Large Text</Text>
              <Switch
                value={settings.largeText}
                onValueChange={(value) => updateSetting('largeText', value)}
              />
            </View>

            {/* Sound */}
            <View style={styles.settingItem}>
              <Text style={styles.settingLabel}>Sound Effects</Text>
              <Switch
                value={settings.soundEnabled}
                onValueChange={(value) => updateSetting('soundEnabled', value)}
              />
            </View>

            {/* Haptic Feedback */}
            <View style={styles.settingItem}>
              <Text style={styles.settingLabel}>Haptic Feedback</Text>
              <Switch
                value={settings.hapticFeedbackEnabled}
                onValueChange={(value) => updateSetting('hapticFeedbackEnabled', value)}
              />
            </View>

            {/* Color Blind Mode */}
            <View style={styles.settingItem}>
              <Text style={styles.settingLabel}>Color Blind Mode</Text>
              <Picker
                selectedValue={settings.colorBlindMode}
                onValueChange={(value) => updateSetting('colorBlindMode', value)}
                style={styles.picker}
              >
                <Picker.Item label="None" value="none" />
                <Picker.Item label="Protanopia" value="protanopia" />
                <Picker.Item label="Deuteranopia" value="deuteranopia" />
                <Picker.Item label="Tritanopia" value="tritanopia" />
              </Picker>
            </View>

            {/* Gesture Sensitivity */}
            <View style={styles.settingItem}>
              <Text style={styles.settingLabel}>Gesture Sensitivity</Text>
              <Picker
                selectedValue={settings.gestureSensitivity}
                onValueChange={(value) => updateSetting('gestureSensitivity', value)}
                style={styles.picker}
              >
                <Picker.Item label="Low" value="low" />
                <Picker.Item label="Normal" value="normal" />
                <Picker.Item label="High" value="high" />
              </Picker>
            </View>

            {/* Auto Play Animations */}
            <View style={styles.settingItem}>
              <Text style={styles.settingLabel}>Auto Play Animations</Text>
              <Switch
                value={settings.autoPlayAnimations}
                onValueChange={(value) => updateSetting('autoPlayAnimations', value)}
              />
            </View>
          </ScrollView>

          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  settingsContainer: {
    maxHeight: 400,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  settingLabel: {
    fontSize: 16,
    color: '#1F2937',
  },
  picker: {
    width: 150,
  },
  closeButton: {
    backgroundColor: '#6366F1',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  closeButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});