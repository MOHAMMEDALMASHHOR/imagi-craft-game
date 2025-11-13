import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Alert,
  Dimensions,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { GameType } from '@/types';

const { width } = Dimensions.get('window');

interface Player {
  id: string;
  name: string;
  avatar: string;
  level: number;
  score: number;
  status: 'online' | 'offline' | 'playing';
  isFriend?: boolean;
}

interface MultiplayerRoom {
  id: string;
  name: string;
  gameType: GameType;
  host: Player;
  players: Player[];
  maxPlayers: number;
  isPrivate: boolean;
  status: 'waiting' | 'playing' | 'finished';
}

interface MultiplayerManagerProps {
  currentPlayer: Player;
  onRoomJoin: (room: MultiplayerRoom) => void;
  onGameStart: (room: MultiplayerRoom) => void;
}

export default function MultiplayerManager({
  currentPlayer,
  onRoomJoin,
  onGameStart,
}: MultiplayerManagerProps) {
  const [showManager, setShowManager] = useState(false);
  const [activeTab, setActiveTab] = useState<'rooms' | 'friends' | 'leaderboard'>('rooms');
  const [rooms, setRooms] = useState<MultiplayerRoom[]>([]);
  const [friends, setFriends] = useState<Player[]>([]);
  const [leaderboard, setLeaderboard] = useState<Player[]>([]);
  const [invites, setInvites] = useState<MultiplayerRoom[]>([]);

  // Mock data - replace with real API calls
  useEffect(() => {
    loadMockData();
  }, []);

  const loadMockData = () => {
    setRooms([
      {
        id: '1',
        name: 'Quick Match',
        gameType: 'memory-match',
        host: { id: 'host1', name: 'PuzzleMaster', avatar: '🎮', level: 25, score: 15000, status: 'online' },
        players: [
          { id: 'p1', name: 'QuickPlayer', avatar: '⚡', level: 18, score: 8500, status: 'online' },
          { id: 'p2', name: 'MemoryKing', avatar: '👑', level: 22, score: 12000, status: 'online' },
        ],
        maxPlayers: 4,
        isPrivate: false,
        status: 'waiting',
      },
      {
        id: '2',
        name: 'Photo Puzzle Pro',
        gameType: 'photo-puzzle',
        host: { id: 'host2', name: 'PhotoExpert', avatar: '📸', level: 30, score: 20000, status: 'online' },
        players: [
          { id: 'p3', name: 'LensMaster', avatar: '🔍', level: 28, score: 18000, status: 'online' },
        ],
        maxPlayers: 2,
        isPrivate: false,
        status: 'waiting',
      },
    ]);

    setFriends([
      { id: 'f1', name: 'BestFriend', avatar: '🤝', level: 15, score: 6000, status: 'online', isFriend: true },
      { id: 'f2', name: 'GameBuddy', avatar: '🎯', level: 20, score: 9000, status: 'playing', isFriend: true },
      { id: 'f3', name: 'PuzzlePal', avatar: '🧩', level: 12, score: 4500, status: 'offline', isFriend: true },
    ]);

    setLeaderboard([
      { id: 'l1', name: 'GrandMaster', avatar: '🏆', level: 50, score: 50000, status: 'online' },
      { id: 'l2', name: 'Champion', avatar: '🥇', level: 45, score: 42000, status: 'online' },
      { id: 'l3', name: 'Expert', avatar: '⭐', level: 40, score: 35000, status: 'online' },
    ]);
  };

  const handleRoomJoin = (room: MultiplayerRoom) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (room.players.length < room.maxPlayers) {
      onRoomJoin(room);
      setShowManager(false);
    } else {
      Alert.alert('Room Full', 'This room is already full. Try another one!');
    }
  };

  const sendGameInvite = (friend: Player) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert(
      'Invite Sent',
      `Game invite sent to ${friend.name}!`,
      [{ text: 'OK' }]
    );
  };

  const renderRoomItem = ({ item }: { item: MultiplayerRoom }) => (
    <TouchableOpacity
      style={styles.roomItem}
      onPress={() => handleRoomJoin(item)}
      disabled={item.players.length >= item.maxPlayers}
    >
      <View style={styles.roomHeader}>
        <View style={styles.roomInfo}>
          <Text style={styles.roomName}>{item.name}</Text>
          <Text style={styles.roomGame}>{getGameDisplayName(item.gameType)}</Text>
        </View>
        <View style={[
          styles.roomStatus,
          { backgroundColor: item.status === 'waiting' ? '#10B981' : '#F59E0B' }
        ]}>
          <Text style={styles.statusText}>
            {item.status === 'waiting' ? 'Waiting' : 'Playing'}
          </Text>
        </View>
      </View>

      <View style={styles.roomPlayers}>
        <View style={styles.playerAvatars}>
          {item.players.slice(0, 4).map((player, index) => (
            <View key={player.id} style={[styles.avatar, { left: index * 20 }]}>
              <Text style={styles.avatarText}>{player.avatar}</Text>
            </View>
          ))}
        </View>
        <Text style={styles.playerCount}>
          {item.players.length}/{item.maxPlayers}
        </Text>
      </View>

      {item.isPrivate && (
        <View style={styles.privateBadge}>
          <MaterialIcons name="lock" size={12} color="#FFFFFF" />
          <Text style={styles.privateText}>Private</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  const renderFriendItem = ({ item }: { item: Player }) => (
    <View style={styles.friendItem}>
      <View style={styles.friendInfo}>
        <View style={styles.friendAvatar}>
          <Text style={styles.avatarText}>{item.avatar}</Text>
        </View>
        <View style={styles.friendDetails}>
          <Text style={styles.friendName}>{item.name}</Text>
          <Text style={styles.friendLevel}>Level {item.level}</Text>
        </View>
      </View>

      <View style={styles.friendStatus}>
        <View style={[
          styles.statusDot,
          {
            backgroundColor: item.status === 'online' ? '#10B981' :
                             item.status === 'playing' ? '#F59E0B' : '#9CA3AF'
          }
        ]} />
        <TouchableOpacity
          style={styles.inviteButton}
          onPress={() => sendGameInvite(item)}
          disabled={item.status === 'offline'}
        >
          <MaterialIcons
            name="send"
            size={16}
            color={item.status === 'offline' ? '#9CA3AF' : '#FFFFFF'}
          />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderLeaderboardItem = ({ item, index }: { item: Player; index: number }) => (
    <View style={styles.leaderboardItem}>
      <View style={styles.rankContainer}>
        <Text style={[
          styles.rank,
          {
            color: index === 0 ? '#F59E0B' :
                    index === 1 ? '#9CA3AF' :
                    index === 2 ? '#CD7F32' : '#6B7280'
          }
        ]}>
          #{index + 1}
        </Text>
        {index < 3 && (
          <MaterialIcons
            name={index === 0 ? 'emoji-events' : index === 1 ? 'workspace-premium' : 'military-tech'}
            size={16}
            color={index === 0 ? '#F59E0B' : index === 1 ? '#9CA3AF' : '#CD7F32'}
          />
        )}
      </View>

      <View style={styles.playerInfo}>
        <View style={styles.playerAvatar}>
          <Text style={styles.avatarText}>{item.avatar}</Text>
        </View>
        <Text style={styles.playerName}>{item.name}</Text>
      </View>

      <View style={styles.scoreInfo}>
        <Text style={styles.playerScore}>{item.score.toLocaleString()}</Text>
        <Text style={styles.playerLevel}>Lvl {item.level}</Text>
      </View>
    </View>
  );

  const getGameDisplayName = (gameType: GameType) => {
    const gameNames: { [key in GameType]: string } = {
      'photo-puzzle': 'Photo Puzzle',
      'memory-match': 'Memory Match',
      'sliding-puzzle': 'Sliding Puzzle',
      '2048': '2048',
      'sudoku': 'Sudoku',
      'word-search': 'Word Search',
      'simon-says': 'Simon Says',
    };
    return gameNames[gameType] || gameType;
  };

  return (
    <>
      <TouchableOpacity
        style={styles.multiplayerButton}
        onPress={() => setShowManager(true)}
      >
        <MaterialIcons name="groups" size={24} color="#FFFFFF" />
        <Text style={styles.multiplayerButtonText}>Multiplayer</Text>
      </TouchableOpacity>

      <Modal
        visible={showManager}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowManager(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Multiplayer</Text>
              <TouchableOpacity onPress={() => setShowManager(false)}>
                <MaterialIcons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <View style={styles.tabContainer}>
              <TouchableOpacity
                style={[styles.tab, activeTab === 'rooms' && styles.activeTab]}
                onPress={() => setActiveTab('rooms')}
              >
                <Text style={[styles.tabText, activeTab === 'rooms' && styles.activeTabText]}>
                  Rooms
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.tab, activeTab === 'friends' && styles.activeTab]}
                onPress={() => setActiveTab('friends')}
              >
                <Text style={[styles.tabText, activeTab === 'friends' && styles.activeTabText]}>
                  Friends
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.tab, activeTab === 'leaderboard' && styles.activeTab]}
                onPress={() => setActiveTab('leaderboard')}
              >
                <Text style={[styles.tabText, activeTab === 'leaderboard' && styles.activeTabText]}>
                  Rankings
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.contentContainer}>
              {activeTab === 'rooms' && (
                <FlatList
                  data={rooms}
                  renderItem={renderRoomItem}
                  keyExtractor={item => item.id}
                  showsVerticalScrollIndicator={false}
                  ListHeaderComponent={
                    <View style={styles.sectionHeader}>
                      <Text style={styles.sectionTitle}>Available Rooms</Text>
                      <TouchableOpacity style={styles.createRoomButton}>
                        <MaterialIcons name="add" size={20} color="#FFFFFF" />
                        <Text style={styles.createRoomText}>Create</Text>
                      </TouchableOpacity>
                    </View>
                  }
                />
              )}

              {activeTab === 'friends' && (
                <FlatList
                  data={friends}
                  renderItem={renderFriendItem}
                  keyExtractor={item => item.id}
                  showsVerticalScrollIndicator={false}
                  ListHeaderComponent={
                    <View style={styles.sectionHeader}>
                      <Text style={styles.sectionTitle}>Friends Online</Text>
                      <TouchableOpacity style={styles.addFriendButton}>
                        <MaterialIcons name="person-add" size={20} color="#FFFFFF" />
                      </TouchableOpacity>
                    </View>
                  }
                />
              )}

              {activeTab === 'leaderboard' && (
                <FlatList
                  data={leaderboard}
                  renderItem={renderLeaderboardItem}
                  keyExtractor={item => item.id}
                  showsVerticalScrollIndicator={false}
                  ListHeaderComponent={
                    <View style={styles.sectionHeader}>
                      <Text style={styles.sectionTitle}>Global Rankings</Text>
                    </View>
                  }
                />
              )}
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  multiplayerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#8B5CF6',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  multiplayerButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
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
    height: '80%',
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
  tabContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#6366F1',
  },
  tabText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  activeTabText: {
    color: '#6366F1',
  },
  contentContainer: {
    flex: 1,
    padding: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  createRoomButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10B981',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  createRoomText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  addFriendButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  roomItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 12,
    position: 'relative',
  },
  roomHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  roomInfo: {
    flex: 1,
  },
  roomName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  roomGame: {
    fontSize: 12,
    color: '#6B7280',
  },
  roomStatus: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '600',
  },
  roomPlayers: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  playerAvatars: {
    flexDirection: 'row',
    height: 32,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
  },
  avatarText: {
    fontSize: 16,
  },
  playerCount: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '600',
  },
  privateBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EF4444',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  privateText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '600',
    marginLeft: 2,
  },
  friendItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 8,
  },
  friendInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  friendAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  friendDetails: {
    flex: 1,
  },
  friendName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  friendLevel: {
    fontSize: 12,
    color: '#6B7280',
  },
  friendStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  inviteButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#6366F1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  leaderboardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 8,
  },
  rankContainer: {
    width: 60,
    alignItems: 'center',
  },
  rank: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  playerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  playerAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  playerName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  scoreInfo: {
    alignItems: 'flex-end',
  },
  playerScore: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  playerLevel: {
    fontSize: 10,
    color: '#6B7280',
  },
});