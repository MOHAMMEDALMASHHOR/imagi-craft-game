import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { InAppPurchase } from 'expo-in-app-purchases';

const { width, height } = Dimensions.get('window');

interface PremiumProduct {
  id: string;
  name: string;
  description: string;
  price: string;
  originalPrice?: string;
  icon: string;
  type: 'subscription' | 'lifetime' | 'coins' | 'powerups';
  features: string[];
  popular?: boolean;
  discount?: number;
  coins?: number;
  powerUps?: string[];
}

interface PremiumStoreProps {
  isPremium: boolean;
  userCoins: number;
  onPurchase: (productId: string) => void;
  onRestore: () => void;
}

export default function PremiumStore({
  isPremium,
  userCoins,
  onPurchase,
  onRestore,
}: PremiumStoreProps) {
  const [showStore, setShowStore] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<PremiumProduct | null>(null);
  const [activeTab, setActiveTab] = useState<'premium' | 'coins' | 'powerups'>('premium');

  const premiumProducts: PremiumProduct[] = [
    {
      id: 'premium_monthly',
      name: 'Premium Monthly',
      description: 'Unlock all features with monthly subscription',
      price: '$4.99',
      originalPrice: '$9.99',
      icon: 'workspace-premium',
      type: 'subscription',
      features: [
        'Remove all ads',
        'Unlimited hints',
        'Exclusive game modes',
        'Daily bonus coins',
        'Priority support',
        'Custom themes',
        'Cloud save sync',
      ],
      popular: true,
      discount: 50,
    },
    {
      id: 'premium_yearly',
      name: 'Premium Yearly',
      description: 'Best value - Save 67% with annual plan',
      price: '$19.99',
      originalPrice: '$59.99',
      icon: 'star',
      type: 'subscription',
      features: [
        'Everything in Premium Monthly',
        '2 months FREE',
        'Exclusive achievements',
        'Special event access',
        'Advanced analytics',
        'Custom avatar creator',
      ],
      discount: 67,
    },
    {
      id: 'premium_lifetime',
      name: 'Premium Lifetime',
      description: 'One-time purchase for unlimited access',
      price: '$49.99',
      originalPrice: '$99.99',
      icon: 'diamond',
      type: 'lifetime',
      features: [
        'Lifetime access to all features',
        'All future updates included',
        'Never pay again',
        'VIP status & badge',
        'Special lifetime gifts',
        'Maximum savings',
      ],
      discount: 50,
    },
  ];

  const coinProducts: PremiumProduct[] = [
    {
      id: 'coins_small',
      name: 'Starter Pack',
      description: 'Perfect for beginners',
      price: '$0.99',
      icon: 'monetization-on',
      type: 'coins',
      coins: 100,
      features: ['100 coins', '+10 bonus coins'],
    },
    {
      id: 'coins_medium',
      name: 'Value Pack',
      description: 'Most popular choice',
      price: '$4.99',
      icon: 'attach-money',
      type: 'coins',
      coins: 500,
      features: ['500 coins', '+50 bonus coins'],
      popular: true,
    },
    {
      id: 'coins_large',
      name: 'Mega Pack',
      description: 'Maximum value',
      price: '$9.99',
      icon: 'account-balance-wallet',
      type: 'coins',
      coins: 1200,
      features: ['1200 coins', '+200 bonus coins'],
    },
    {
      id: 'coins_epic',
      name: 'Epic Pack',
      description: 'Ultimate coin bundle',
      price: '$19.99',
      icon: 'workspace-premium',
      type: 'coins',
      coins: 3000,
      features: ['3000 coins', '+500 bonus coins'],
    },
  ];

  const powerUpProducts: PremiumProduct[] = [
    {
      id: 'powerup_starter',
      name: 'Power-Up Starter',
      description: 'Essential power-ups collection',
      price: '$2.99',
      icon: 'bolt',
      type: 'powerups',
      powerUps: ['time_freeze', 'hint_eye', 'move_saver'],
      features: ['3 Time Freeze', '2 Hint Eyes', '1 Move Saver'],
    },
    {
      id: 'powerup_advanced',
      name: 'Power-Up Advanced',
      description: 'Strategic power-ups bundle',
      price: '$4.99',
      icon: 'auto-fix-high',
      type: 'powerups',
      powerUps: ['piece_reveal', 'lucky_shuffle', 'double_xp'],
      features: ['2 Piece Revealers', '1 Lucky Shuffle', '1 Double XP'],
      popular: true,
    },
    {
      id: 'powerup_ultimate',
      name: 'Power-Up Ultimate',
      description: 'Complete power-up arsenal',
      price: '$9.99',
      icon: 'stars',
      type: 'powerups',
      powerUps: ['auto_solve', 'perfect_vision', 'time_freeze'],
      features: ['1 Auto Solver', '2 Perfect Vision', '5 Time Freeze'],
    },
  ];

  const handlePurchase = (product: PremiumProduct) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

    if (isPremium && product.type === 'subscription') {
      Alert.alert(
        'Already Premium',
        'You already have an active Premium subscription!',
        [{ text: 'OK' }]
      );
      return;
    }

    setSelectedProduct(product);
    Alert.alert(
      'Confirm Purchase',
      `Purchase ${product.name} for ${product.price}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Purchase',
          onPress: () => {
            onPurchase(product.id);
            setShowStore(false);
          },
        },
      ]
    );
  };

  const handleRestore = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onRestore();
  };

  const renderProduct = (product: PremiumProduct) => {
    const isPurchased = isPremium && product.type !== 'coins' && product.type !== 'powerups';

    return (
      <TouchableOpacity
        key={product.id}
        style={[
          styles.productCard,
          {
            borderColor: product.popular ? '#8B5CF6' : '#E5E7EB',
            backgroundColor: isPurchased ? '#10B98110' : '#FFFFFF',
          }
        ]}
        onPress={() => !isPurchased && handlePurchase(product)}
        disabled={isPurchased}
        activeOpacity={0.8}
      >
        {/* Discount Badge */}
        {product.discount && !isPurchased && (
          <View style={styles.discountBadge}>
            <Text style={styles.discountText}>-{product.discount}%</Text>
          </View>
        )}

        {/* Popular Badge */}
        {product.popular && !isPurchased && (
          <View style={styles.popularBadge}>
            <Text style={styles.popularText}>POPULAR</Text>
          </View>
        )}

        {/* Purchased Badge */}
        {isPurchased && (
          <View style={styles.purchasedBadge}>
            <MaterialIcons name="check-circle" size={16} color="#FFFFFF" />
            <Text style={styles.purchasedText}>OWNED</Text>
          </View>
        )}

        <View style={styles.productHeader}>
          <View style={[
            styles.productIcon,
            { backgroundColor: product.popular ? '#8B5CF620' : '#F3F4F6' }
          ]}>
            <MaterialIcons
              name={product.icon as any}
              size={32}
              color={product.popular ? '#8B5CF6' : '#6B7280'}
            />
          </View>
          <View style={styles.productInfo}>
            <Text style={styles.productName}>{product.name}</Text>
            <Text style={styles.productDescription}>{product.description}</Text>
          </View>
        </View>

        <View style={styles.productFeatures}>
          {product.features.map((feature, index) => (
            <View key={index} style={styles.featureItem}>
              <MaterialIcons
                name="check-circle"
                size={14}
                color={isPurchased ? '#10B981' : '#8B5CF6'}
              />
              <Text style={[
                styles.featureText,
                { color: isPurchased ? '#10B981' : '#374151' }
              ]}>
                {feature}
              </Text>
            </View>
          ))}
        </View>

        <View style={styles.productFooter}>
          <View style={styles.priceContainer}>
            {product.originalPrice && !isPurchased && (
              <Text style={styles.originalPrice}>{product.originalPrice}</Text>
            )}
            <Text style={[
              styles.price,
              { color: isPurchased ? '#10B981' : '#1F2937' }
            ]}>
              {isPurchased ? 'Owned' : product.price}
            </Text>
          </View>

          {!isPurchased && (
            <TouchableOpacity
              style={[
                styles.purchaseButton,
                {
                  backgroundColor: product.popular ? '#8B5CF6' : '#6366F1',
                }
              ]}
              onPress={() => handlePurchase(product)}
            >
              <Text style={styles.purchaseButtonText}>
                {product.type === 'subscription' ? 'Subscribe' : 'Purchase'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <>
      <TouchableOpacity
        style={styles.storeButton}
        onPress={() => setShowStore(true)}
      >
        <MaterialIcons name="store" size={24} color="#FFFFFF" />
        <Text style={styles.storeButtonText}>Store</Text>
        {isPremium && (
          <View style={styles.premiumIndicator}>
            <MaterialIcons name="star" size={12} color="#FFFFFF" />
          </View>
        )}
      </TouchableOpacity>

      <Modal
        visible={showStore}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowStore(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Premium Store</Text>
              <TouchableOpacity onPress={() => setShowStore(false)}>
                <MaterialIcons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            {/* User Status */}
            <View style={styles.userStatus}>
              <View style={styles.userInfo}>
                <Text style={styles.userCoins}>
                  <MaterialIcons name="monetization-on" size={16} color="#F59E0B" />
                  {' '}{userCoins} Coins
                </Text>
                <Text style={[
                  styles.userStatusText,
                  { color: isPremium ? '#10B981' : '#6B7280' }
                ]}>
                  {isPremium ? '👑 Premium Member' : 'Free User'}
                </Text>
              </View>
              <TouchableOpacity style={styles.restoreButton} onPress={handleRestore}>
                <MaterialIcons name="restore" size={16} color="#6366F1" />
                <Text style={styles.restoreButtonText}>Restore</Text>
              </TouchableOpacity>
            </View>

            {/* Tabs */}
            <View style={styles.tabContainer}>
              <TouchableOpacity
                style={[styles.tab, activeTab === 'premium' && styles.activeTab]}
                onPress={() => setActiveTab('premium')}
              >
                <MaterialIcons
                  name="workspace-premium"
                  size={20}
                  color={activeTab === 'premium' ? '#8B5CF6' : '#6B7280'}
                />
                <Text style={[
                  styles.tabText,
                  activeTab === 'premium' && styles.activeTabText
                ]}>
                  Premium
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.tab, activeTab === 'coins' && styles.activeTab]}
                onPress={() => setActiveTab('coins')}
              >
                <MaterialIcons
                  name="monetization-on"
                  size={20}
                  color={activeTab === 'coins' ? '#8B5CF6' : '#6B7280'}
                />
                <Text style={[
                  styles.tabText,
                  activeTab === 'coins' && styles.activeTabText
                ]}>
                  Coins
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.tab, activeTab === 'powerups' && styles.activeTab]}
                onPress={() => setActiveTab('powerups')}
              >
                <MaterialIcons
                  name="bolt"
                  size={20}
                  color={activeTab === 'powerups' ? '#8B5CF6' : '#6B7280'}
                />
                <Text style={[
                  styles.tabText,
                  activeTab === 'powerups' && styles.activeTabText
                ]}>
                  Power-Ups
                </Text>
              </TouchableOpacity>
            </View>

            {/* Content */}
            <ScrollView style={styles.contentContainer} showsVerticalScrollIndicator={false}>
              {activeTab === 'premium' && (
                <View>
                  <Text style={styles.sectionTitle}>
                    {isPremium ? 'Your Premium Benefits' : 'Unlock Premium Features'}
                  </Text>
                  {premiumProducts.map(renderProduct)}
                </View>
              )}

              {activeTab === 'coins' && (
                <View>
                  <Text style={styles.sectionTitle}>Purchase Coins</Text>
                  {coinProducts.map(renderProduct)}
                </View>
              )}

              {activeTab === 'powerups' && (
                <View>
                  <Text style={styles.sectionTitle}>Power-Up Bundles</Text>
                  {powerUpProducts.map(renderProduct)}
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  storeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F59E0B',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginBottom: 16,
    position: 'relative',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  storeButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  premiumIndicator: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#10B981',
    justifyContent: 'center',
    alignItems: 'center',
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
    width: '100%',
    maxWidth: 400,
    height: '85%',
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
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  userStatus: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#F9FAFB',
  },
  userInfo: {
    flexDirection: 'column',
  },
  userCoins: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  userStatusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  restoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
  },
  restoreButtonText: {
    color: '#6B7280',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  tabContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
    gap: 4,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#8B5CF6',
  },
  tabText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  activeTabText: {
    color: '#8B5CF6',
  },
  contentContainer: {
    flex: 1,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  productCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    borderWidth: 2,
    marginBottom: 16,
    position: 'relative',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  discountBadge: {
    position: 'absolute',
    top: -8,
    left: 16,
    backgroundColor: '#EF4444',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  discountText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  popularBadge: {
    position: 'absolute',
    top: -8,
    right: 16,
    backgroundColor: '#8B5CF6',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
  },
  popularText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  purchasedBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10B981',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  purchasedText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  productHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  productIcon: {
    width: 56,
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  productDescription: {
    fontSize: 14,
    color: '#6B7280',
  },
  productFeatures: {
    marginBottom: 16,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  featureText: {
    fontSize: 14,
    marginLeft: 8,
  },
  productFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priceContainer: {
    alignItems: 'flex-start',
  },
  originalPrice: {
    fontSize: 12,
    color: '#9CA3AF',
    textDecorationLine: 'through',
    marginBottom: 2,
  },
  price: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  purchaseButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  purchaseButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});