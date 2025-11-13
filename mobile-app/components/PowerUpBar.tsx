import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { PowerUp, GamePowerUp, POWER_UPS, RARITY_COLORS } from '@/types/powerups';

interface PowerUpBarProps {
  availablePowerUps: { [key: string]: number };
  coins: number;
  onPowerUpUse: (powerUp: PowerUp) => void;
  activePowerUps: GamePowerUp[];
  style?: any;
}

export default function PowerUpBar({
  availablePowerUps,
  coins,
  onPowerUpUse,
  activePowerUps,
  style
}: PowerUpBarProps) {
  const [showStore, setShowStore] = useState(false);
  const [selectedPowerUp, setSelectedPowerUp] = useState<PowerUp | null>(null);
  const [animatedValue] = useState(new Animated.Value(0));

  useEffect(() => {
    // Animate bar when power-ups are available
    if (Object.keys(availablePowerUps).some(key => availablePowerUps[key] > 0)) {
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(animatedValue, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [availablePowerUps]);

  const handlePowerUpPress = (powerUp: PowerUp) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    if (availablePowerUps[powerUp.id] > 0) {
      onPowerUpUse(powerUp);
    } else {
      setSelectedPowerUp(powerUp);
      setShowStore(true);
    }
  };

  const renderPowerUpButton = (powerUp: PowerUp) => {
    const count = availablePowerUp[powerUp.id] || 0;
    const isActive = activePowerUps.some(p => p.powerUp.id === powerUp.id);
    const canAfford = coins >= powerUp.cost;

    return (
      <TouchableOpacity
        key={powerUp.id}
        style={[
          styles.powerUpButton,
          {
            borderColor: isActive ? '#10B981' : RARITY_COLORS[powerUp.rarity],
            backgroundColor: isActive ? '#10B98120' : '#FFFFFF',
          }
        ]}
        onPress={() => handlePowerUpPress(powerUp)}
        disabled={!canAfford && count === 0}
        activeOpacity={0.8}
      >
        <View style={styles.powerUpIcon}>
          <MaterialIcons
            name={powerUp.icon as any}
            size={20}
            color={isActive ? '#10B981' : RARITY_COLORS[powerUp.rarity]}
          />
        </View>

        {count > 0 ? (
          <View style={styles.countBadge}>
            <Text style={styles.countText}>{count}</Text>
          </View>
        ) : (
          <View style={[styles.costBadge, { opacity: canAfford ? 1 : 0.5 }]}>
            <Text style={styles.costText}>{powerUp.cost}</Text>
          </View>
        )}

        {isActive && (
          <View style={styles.activeIndicator} />
        )}
      </TouchableOpacity>
    );
  };

  return (
    <>
      <Animated.View
        style={[
          styles.container,
          style,
          {
            transform: [
              {
                translateY: animatedValue.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, -5],
                }),
              },
            ],
          },
        ]}
      >
        <View style={styles.powerUpRow}>
          <Text style={styles.sectionTitle}>Power-Ups</Text>
          <View style={styles.powerUps}>
            {POWER_UPS.slice(0, 4).map(renderPowerUpButton)}
          </View>

          <TouchableOpacity
            style={styles.moreButton}
            onPress={() => setShowStore(true)}
          >
            <MaterialIcons name="store" size={20} color="#6B7280" />
          </TouchableOpacity>
        </View>

        {/* Active Power-Ups Display */}
        {activePowerUps.length > 0 && (
          <View style={styles.activePowerUps}>
            <Text style={styles.activeTitle}>Active:</Text>
            {activePowerUps.map((gamePowerUp, index) => (
              <View key={index} style={styles.activePowerUp}>
                <MaterialIcons
                  name={gamePowerUp.powerUp.icon as any}
                  size={16}
                  color="#10B981"
                />
                <Text style={styles.activePowerUpText}>
                  {gamePowerUp.powerUp.name}
                </Text>
              </View>
            ))}
          </View>
        )}
      </Animated.View>

      {/* Power-Up Store Modal */}
      <Modal
        visible={showStore}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowStore(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Power-Up Store</Text>
              <TouchableOpacity onPress={() => setShowStore(false)}>
                <MaterialIcons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <View style={styles.coinsDisplay}>
              <MaterialIcons name="monetization-on" size={24} color="#F59E0B" />
              <Text style={styles.coinsText}>{coins}</Text>
            </View>

            <View style={styles.powerUpGrid}>
              {POWER_UPS.map((powerUp) => {
                const count = availablePowerUp[powerUp.id] || 0;
                const canAfford = coins >= powerUp.cost;

                return (
                  <View
                    key={powerUp.id}
                    style={[
                      styles.powerUpCard,
                      { borderColor: RARITY_COLORS[powerUp.rarity] }
                    ]}
                  >
                    <View style={styles.powerUpCardHeader}>
                      <MaterialIcons
                        name={powerUp.icon as any}
                        size={32}
                        color={RARITY_COLORS[powerUp.rarity]}
                      />
                      <View style={styles.rarityBadge}>
                        <Text style={[
                          styles.rarityText,
                          { color: RARITY_COLORS[powerUp.rarity] }
                        ]}>
                          {powerUp.rarity.toUpperCase()}
                        </Text>
                      </View>
                    </View>

                    <Text style={styles.powerUpName}>{powerUp.name}</Text>
                    <Text style={styles.powerUpDescription}>
                      {powerUp.description}
                    </Text>

                    {powerUp.effect && (
                      <Text style={styles.powerUpEffect}>
                        💫 {powerUp.effect}
                      </Text>
                    )}

                    <View style={styles.powerUpFooter}>
                      {count > 0 ? (
                        <View style={styles.ownedDisplay}>
                          <Text style={styles.ownedText}>Owned: {count}</Text>
                        </View>
                      ) : (
                        <TouchableOpacity
                          style={[
                            styles.buyButton,
                            {
                              backgroundColor: canAfford ? '#10B981' : '#9CA3AF',
                            }
                          ]}
                          disabled={!canAfford}
                        >
                          <MaterialIcons name="monetization-on" size={16} color="#FFFFFF" />
                          <Text style={styles.buyButtonText}>{powerUp.cost}</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                );
              })}
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  powerUpRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginRight: 12,
    minWidth: 70,
  },
  powerUps: {
    flexDirection: 'row',
    flex: 1,
    gap: 8,
  },
  powerUpButton: {
    width: 48,
    height: 48,
    borderRadius: 12,
    borderWidth: 2,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  powerUpIcon: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  countBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#10B981',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  countText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  costBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    backgroundColor: '#F59E0B',
    borderRadius: 8,
    minWidth: 24,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  costText: {
    color: '#FFFFFF',
    fontSize: 8,
    fontWeight: 'bold',
  },
  activeIndicator: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: '#10B981',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  moreButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  activePowerUps: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
    gap: 8,
  },
  activeTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#10B981',
    marginRight: 8,
  },
  activePowerUp: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10B98120',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  activePowerUpText: {
    fontSize: 10,
    color: '#10B981',
    fontWeight: '500',
    marginLeft: 4,
  },
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
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  coinsDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF9C4',
    padding: 12,
    borderRadius: 12,
    marginBottom: 20,
  },
  coinsText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#F59E0B',
    marginLeft: 8,
  },
  powerUpGrid: {
    flexDirection: 'column',
    gap: 12,
    maxHeight: 400,
  },
  powerUpCard: {
    borderWidth: 2,
    borderRadius: 12,
    padding: 12,
    backgroundColor: '#FFFFFF',
  },
  powerUpCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  rarityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    backgroundColor: '#F3F4F6',
  },
  rarityText: {
    fontSize: 10,
    fontWeight: '600',
  },
  powerUpName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  powerUpDescription: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 8,
  },
  powerUpEffect: {
    fontSize: 11,
    color: '#8B5CF6',
    fontStyle: 'italic',
    marginBottom: 8,
  },
  powerUpFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  ownedDisplay: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  ownedText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '600',
  },
  buyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  buyButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
});