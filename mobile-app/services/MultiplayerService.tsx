import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Alert,
  Platform,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import {
  RTCPeerConnection,
  RTCIceCandidate,
  RTCSessionDescription,
  RTCView,
  MediaStream,
  mediaDevices,
} from 'react-native-webrtc';

interface MultiplayerRoom {
  id: string;
  name: string;
  hostId: string;
  hostName: string;
  gameType: string;
  maxPlayers: number;
  currentPlayers: number[];
  isPrivate: boolean;
  password?: string;
  status: 'waiting' | 'playing' | 'finished';
  createdAt: Date;
  settings: {
    difficulty: string;
    timeLimit?: number;
    powerUps: boolean;
    chat: boolean;
  };
}

interface MultiplayerPlayer {
  id: string;
  name: string;
  avatar: string;
  level: number;
  score: number;
  status: 'online' | 'offline' | 'playing';
  isReady: boolean;
  progress: number;
  moves: number;
  voiceEnabled: boolean;
  videoEnabled: boolean;
}

interface WebRTCDataMessage {
  type: 'move' | 'chat' | 'progress' | 'ready' | 'game_start' | 'game_end' | 'voice' | 'video';
  data: any;
  timestamp: number;
  senderId: string;
}

interface MultiplayerContextType {
  isConnected: boolean;
  currentRoom: MultiplayerRoom | null;
  players: MultiplayerPlayer[];
  isHost: boolean;
  localStream: MediaStream | null;
  remoteStreams: Map<string, MediaStream>;
  isVoiceEnabled: boolean;
  isVideoEnabled: boolean;
  createRoom: (gameType: string, settings: any) => Promise<void>;
  joinRoom: (roomId: string, password?: string) => Promise<void>;
  leaveRoom: () => void;
  sendMove: (move: any) => void;
  sendChat: (message: string) => void;
  toggleVoice: () => void;
  toggleVideo: () => void;
  startGame: () => void;
  endGame: () => void;
}

const MultiplayerContext = createContext<MultiplayerContextType | null>(null);

export const useMultiplayer = () => {
  const context = useContext(MultiplayerContext);
  if (!context) {
    throw new Error('useMultiplayer must be used within MultiplayerProvider');
  }
  return context;
};

interface MultiplayerProviderProps {
  children: React.ReactNode;
  currentPlayer: MultiplayerPlayer;
}

const TURN_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    {
      urls: 'turn:turn.imagi-craft.com:3478',
      username: 'imagi-craft-user',
      credential: 'imagi-craft-turn-credential',
    },
  ],
};

export const MultiplayerProvider: React.FC<MultiplayerProviderProps> = ({
  children,
  currentPlayer
}) => {
  const [isConnected, setIsConnected] = useState(false);
  const [currentRoom, setCurrentRoom] = useState<MultiplayerRoom | null>(null);
  const [players, setPlayers] = useState<MultiplayerPlayer[]>([]);
  const [isHost, setIsHost] = useState(false);
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(false);

  const peerConnections = useRef(new Map<string, RTCPeerConnection>());
  const localStream = useRef<MediaStream | null>(null);
  const remoteStreams = useRef(new Map<string, MediaStream>());
  const websocket = useRef<any>(null);
  const roomId = useRef<string | null>(null);

  useEffect(() => {
    initializeWebRTC();
    return () => {
      cleanup();
    };
  }, []);

  const initializeWebRTC = async () => {
    try {
      // Get user media for voice/video
      const stream = await mediaDevices.getUserMedia({
        audio: true,
        video: Platform.OS === 'web',
      });

      localStream.current = stream;
      setIsConnected(true);

      // Initialize WebSocket for signaling
      initializeWebSocket();

    } catch (error) {
      console.error('WebRTC initialization failed:', error);
      Alert.alert('Error', 'Failed to initialize multiplayer features');
    }
  };

  const initializeWebSocket = () => {
    // In production, connect to your WebSocket signaling server
    const wsUrl = Platform.OS === 'web'
      ? 'ws://localhost:8080/multiplayer'
      : 'wss://api.imagi-craft.com/multiplayer';

    websocket.current = new WebSocket(wsUrl);

    websocket.current.onopen = () => {
      console.log('Multiplayer WebSocket connected');
      authenticatePlayer();
    };

    websocket.current.onmessage = handleWebSocketMessage;
    websocket.current.onerror = (error) => {
      console.error('WebSocket error:', error);
      setIsConnected(false);
    };
    websocket.current.onclose = () => {
      console.log('WebSocket disconnected');
      setIsConnected(false);
    };
  };

  const authenticatePlayer = () => {
    sendMessage({
      type: 'auth',
      data: {
        playerId: currentPlayer.id,
        playerName: currentPlayer.name,
        avatar: currentPlayer.avatar,
        level: currentPlayer.level,
      },
    });
  };

  const handleWebSocketMessage = (event: any) => {
    const message = JSON.parse(event.data);

    switch (message.type) {
      case 'room_created':
        handleRoomCreated(message.data);
        break;
      case 'room_joined':
        handleRoomJoined(message.data);
        break;
      case 'player_joined':
        handlePlayerJoined(message.data);
        break;
      case 'player_left':
        handlePlayerLeft(message.data);
        break;
      case 'offer':
        handleOffer(message.data);
        break;
      case 'answer':
        handleAnswer(message.data);
        break;
      case 'ice_candidate':
        handleIceCandidate(message.data);
        break;
      case 'game_message':
        handleGameMessage(message.data);
        break;
      case 'room_list':
        handleRoomList(message.data);
        break;
    }
  };

  const createRoom = async (gameType: string, settings: any) => {
    try {
      const roomData = {
        name: `${currentPlayer.name}'s Room`,
        gameType,
        settings,
        maxPlayers: settings.maxPlayers || 4,
        isPrivate: settings.isPrivate || false,
        password: settings.password,
      };

      sendMessage({
        type: 'create_room',
        data: roomData,
      });
    } catch (error) {
      console.error('Failed to create room:', error);
      Alert.alert('Error', 'Failed to create room');
    }
  };

  const joinRoom = async (roomId: string, password?: string) => {
    try {
      sendMessage({
        type: 'join_room',
        data: {
          roomId,
          password,
        },
      });
    } catch (error) {
      console.error('Failed to join room:', error);
      Alert.alert('Error', 'Failed to join room');
    }
  };

  const handleRoomCreated = (room: MultiplayerRoom) => {
    setCurrentRoom(room);
    setIsHost(true);
    roomId.current = room.id;

    // Add current player as the first player
    setPlayers([{
      ...currentPlayer,
      status: 'online',
      isReady: false,
      progress: 0,
      moves: 0,
      voiceEnabled: false,
      videoEnabled: false,
    }]);

    // Create peer connections for other players when they join
  };

  const handleRoomJoined = (room: MultiplayerRoom) => {
    setCurrentRoom(room);
    setIsHost(false);
    roomId.current = room.id;

    // Add current player to the room
    setPlayers(prev => [...prev, {
      ...currentPlayer,
      status: 'online',
      isReady: false,
      progress: 0,
      moves: 0,
      voiceEnabled: false,
      videoEnabled: false,
    }]);

    // Create peer connections with existing players
    createPeerConnections(room.currentPlayers.filter(id => id !== currentPlayer.id));
  };

  const handlePlayerJoined = (newPlayer: MultiplayerPlayer) => {
    setPlayers(prev => [...prev, newPlayer]);

    // Create peer connection with new player
    if (!isHost) {
      createPeerConnection(newPlayer.id, true); // Create offer as joiner
    }
  };

  const handlePlayerLeft = (playerId: string) => {
    setPlayers(prev => prev.filter(p => p.id !== playerId));

    // Close peer connection
    const pc = peerConnections.current.get(playerId);
    if (pc) {
      pc.close();
      peerConnections.current.delete(playerId);
    }

    // Remove remote stream
    remoteStreams.current.delete(playerId);
  };

  const createPeerConnections = (playerIds: string[]) => {
    playerIds.forEach(playerId => {
      createPeerConnection(playerId, false);
    });
  };

  const createPeerConnection = async (playerId: string, createOffer: boolean) => {
    try {
      const pc = new RTCPeerConnection(TURN_SERVERS);

      // Add local stream
      if (localStream.current) {
        localStream.current.getTracks().forEach(track => {
          pc.addTrack(track, localStream.current!);
        });
      }

      // Handle ICE candidates
      pc.onicecandidate = (event) => {
        if (event.candidate) {
          sendMessage({
            type: 'ice_candidate',
            data: {
              targetPlayerId: playerId,
              candidate: event.candidate,
            },
          });
        }
      };

      // Handle remote stream
      pc.ontrack = (event) => {
        const [remoteStream] = event.streams;
        remoteStreams.current.set(playerId, remoteStream);
      };

      // Handle connection state change
      pc.onconnectionstatechange = () => {
        console.log(`Connection state with ${playerId}:`, pc.connectionState);

        if (pc.connectionState === 'failed') {
          // Retry connection
          setTimeout(() => createPeerConnection(playerId, createOffer), 2000);
        }
      };

      peerConnections.current.set(playerId, pc);

      if (createOffer) {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);

        sendMessage({
          type: 'offer',
          data: {
            targetPlayerId: playerId,
            offer,
          },
        });
      }

    } catch (error) {
      console.error(`Failed to create peer connection with ${playerId}:`, error);
    }
  };

  const handleOffer = async (data: any) => {
    const { senderId, offer } = data;

    try {
      const pc = peerConnections.current.get(senderId) || await createPeerConnection(senderId, false);
      await pc.setRemoteDescription(new RTCSessionDescription(offer));

      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      sendMessage({
        type: 'answer',
        data: {
          targetPlayerId: senderId,
          answer,
        },
      });
    } catch (error) {
      console.error('Failed to handle offer:', error);
    }
  };

  const handleAnswer = async (data: any) => {
    const { senderId, answer } = data;

    try {
      const pc = peerConnections.current.get(senderId);
      if (pc) {
        await pc.setRemoteDescription(new RTCSessionDescription(answer));
      }
    } catch (error) {
      console.error('Failed to handle answer:', error);
    }
  };

  const handleIceCandidate = async (data: any) => {
    const { senderId, candidate } = data;

    try {
      const pc = peerConnections.current.get(senderId);
      if (pc) {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      }
    } catch (error) {
      console.error('Failed to handle ICE candidate:', error);
    }
  };

  const handleGameMessage = (data: WebRTCDataMessage) => {
    switch (data.type) {
      case 'move':
        // Handle opponent's move
        break;
      case 'chat':
        // Handle chat message
        break;
      case 'progress':
        // Update player progress
        setPlayers(prev => prev.map(p =>
          p.id === data.senderId
            ? { ...p, progress: data.data.progress, moves: data.data.moves }
            : p
        ));
        break;
      case 'ready':
        // Update player ready status
        setPlayers(prev => prev.map(p =>
          p.id === data.senderId
            ? { ...p, isReady: data.data.isReady }
            : p
        ));
        break;
    }
  };

  const handleRoomList = (rooms: MultiplayerRoom[]) => {
    // Update available rooms list for room browser
  };

  const sendMove = (move: any) => {
    sendGameMessage('move', move);
  };

  const sendChat = (message: string) => {
    sendGameMessage('chat', { message });
  };

  const sendGameMessage = (type: string, data: any) => {
    const message: WebRTCDataMessage = {
      type,
      data,
      timestamp: Date.now(),
      senderId: currentPlayer.id,
    };

    if (websocket.current && websocket.current.readyState === WebSocket.OPEN) {
      sendMessage({
        type: 'game_message',
        data: {
          roomId: roomId.current,
          message,
        },
      });
    }
  };

  const toggleVoice = async () => {
    if (localStream.current) {
      const audioTracks = localStream.current.getAudioTracks();
      audioTracks.forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsVoiceEnabled(!isVoiceEnabled);
    }
  };

  const toggleVideo = async () => {
    if (localStream.current) {
      const videoTracks = localStream.current.getVideoTracks();
      videoTracks.forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsVideoEnabled(!isVideoEnabled);
    }
  };

  const startGame = () => {
    if (isHost && currentRoom) {
      sendGameMessage('game_start', { roomId: currentRoom.id });
      setCurrentRoom(prev => prev ? { ...prev, status: 'playing' } : null);
    }
  };

  const endGame = () => {
    if (isHost && currentRoom) {
      sendGameMessage('game_end', { roomId: currentRoom.id });
      setCurrentRoom(prev => prev ? { ...prev, status: 'finished' } : null);
    }
  };

  const leaveRoom = () => {
    if (roomId.current) {
      sendMessage({
        type: 'leave_room',
        data: { roomId: roomId.current },
      });
    }

    // Cleanup peer connections
    peerConnections.current.forEach(pc => pc.close());
    peerConnections.current.clear();

    // Clear streams
    remoteStreams.current.clear();

    // Reset state
    setCurrentRoom(null);
    setPlayers([]);
    setIsHost(false);
    roomId.current = null;
  };

  const sendMessage = (message: any) => {
    if (websocket.current && websocket.current.readyState === WebSocket.OPEN) {
      websocket.current.send(JSON.stringify(message));
    }
  };

  const cleanup = () => {
    leaveRoom();

    if (localStream.current) {
      localStream.current.getTracks().forEach(track => track.stop());
    }

    if (websocket.current) {
      websocket.current.close();
    }
  };

  const value: MultiplayerContextType = {
    isConnected,
    currentRoom,
    players,
    isHost,
    localStream: localStream.current,
    remoteStreams: remoteStreams.current,
    isVoiceEnabled,
    isVideoEnabled,
    createRoom,
    joinRoom,
    leaveRoom,
    sendMove,
    sendChat,
    toggleVoice,
    toggleVideo,
    startGame,
    endGame,
  };

  return (
    <MultiplayerContext.Provider value={value}>
      {children}
    </MultiplayerContext.Provider>
  );
};

// Multiplayer Room Browser Component
export const MultiplayerRoomBrowser: React.FC<{
  visible: boolean;
  onClose: () => void;
  onRoomSelect: (room: MultiplayerRoom) => void;
  onCreateRoom: () => void;
}> = ({ visible, onClose, onRoomSelect, onCreateRoom }) => {
  const [rooms, setRooms] = useState<MultiplayerRoom[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible) {
      loadRooms();
    }
  }, [visible]);

  const loadRooms = async () => {
    setLoading(true);
    try {
      // Fetch available rooms from server
      // const response = await fetch('https://api.imagi-craft.com/multiplayer/rooms');
      // const data = await response.json();
      // setRooms(data);

      // Mock data for now
      setRooms([]);
    } catch (error) {
      console.error('Failed to load rooms:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderRoom = (room: MultiplayerRoom) => (
    <TouchableOpacity
      key={room.id}
      style={styles.roomItem}
      onPress={() => onRoomSelect(room)}
    >
      <View style={styles.roomHeader}>
        <Text style={styles.roomName}>{room.name}</Text>
        <View style={styles.roomStatus}>
          <View style={[
            styles.statusIndicator,
            { backgroundColor: room.status === 'waiting' ? '#10B981' : '#F59E0B' }
          ]} />
          <Text style={styles.statusText}>{room.status}</Text>
        </View>
      </View>

      <View style={styles.roomDetails}>
        <Text style={styles.roomGameType}>{room.gameType}</Text>
        <Text style={styles.roomPlayers}>
          {room.currentPlayers.length}/{room.maxPlayers} players
        </Text>
      </View>

      <View style={styles.roomSettings}>
        {room.settings.difficulty && (
          <Text style={styles.settingTag}>{room.settings.difficulty}</Text>
        )}
        {room.settings.powerUps && (
          <Text style={styles.settingTag}>Power-ups</Text>
        )}
        {room.isPrivate && (
          <MaterialIcons name="lock" size={16} color="#6B7280" />
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose}>
            <MaterialIcons name="arrow-back" size={24} color="#1F2937" />
          </TouchableOpacity>
          <Text style={styles.title}>Multiplayer Rooms</Text>
          <TouchableOpacity onPress={onCreateRoom}>
            <MaterialIcons name="add" size={24} color="#6366F1" />
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <Text>Loading rooms...</Text>
          </View>
        ) : (
          <View style={styles.roomsList}>
            {rooms.length === 0 ? (
              <View style={styles.emptyState}>
                <MaterialIcons name="people" size={48} color="#9CA3AF" />
                <Text style={styles.emptyText}>No rooms available</Text>
                <Text style={styles.emptySubtext}>Create your own room to start playing!</Text>
              </View>
            ) : (
              rooms.map(renderRoom)
            )}
          </View>
        )}
      </View>
    </Modal>
  );
};

// In-Game Multiplayer HUD
export const MultiplayerGameHUD: React.FC<{
  visible: boolean;
  players: MultiplayerPlayer[];
  onChatPress: () => void;
  onVoiceToggle: () => void;
  isVoiceEnabled: boolean;
}> = ({
  visible,
  players,
  onChatPress,
  onVoiceToggle,
  isVoiceEnabled
}) => {
  if (!visible) return null;

  return (
    <View style={styles.hudContainer}>
      {/* Player Progress */}
      <View style={styles.playerProgress}>
        {players.map((player, index) => (
          <View key={player.id} style={styles.playerItem}>
            <View style={styles.playerAvatar}>
              <Text style={styles.avatarText}>{player.avatar}</Text>
            </View>
            <View style={styles.playerInfo}>
              <Text style={styles.playerName}>{player.name}</Text>
              <View style={styles.progressBar}>
                <View
                  style={[
                    styles.progressFill,
                    { width: `${player.progress}%` }
                  ]}
                />
              </View>
              <Text style={styles.playerMoves}>{player.moves} moves</Text>
            </View>
            {player.isReady && (
              <MaterialIcons name="check-circle" size={20} color="#10B981" />
            )}
          </View>
        ))}
      </View>

      {/* Controls */}
      <View style={styles.controls}>
        <TouchableOpacity
          style={[styles.controlButton, styles.chatButton]}
          onPress={onChatPress}
        >
          <MaterialIcons name="chat" size={20} color="#FFFFFF" />
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.controlButton,
            styles.voiceButton,
            isVoiceEnabled && styles.voiceActive
          ]}
          onPress={onVoiceToggle}
        >
          <MaterialIcons
            name={isVoiceEnabled ? "mic" : "mic-off"}
            size={20}
            color="#FFFFFF"
          />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  roomsList: {
    flex: 1,
    padding: 16,
  },
  roomItem: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  roomHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  roomName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  roomStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    color: '#6B7280',
    textTransform: 'capitalize',
  },
  roomDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  roomGameType: {
    fontSize: 14,
    color: '#4B5563',
  },
  roomPlayers: {
    fontSize: 14,
    color: '#6B7280',
  },
  roomSettings: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  settingTag: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    fontSize: 12,
    color: '#6B7280',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#6B7280',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 8,
    textAlign: 'center',
  },
  hudContainer: {
    position: 'absolute',
    top: 60,
    left: 16,
    right: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    borderRadius: 12,
    padding: 12,
  },
  playerProgress: {
    marginBottom: 12,
  },
  playerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  playerAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#6366F1',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  playerInfo: {
    flex: 1,
  },
  playerName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  progressBar: {
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 2,
    marginBottom: 2,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#10B981',
    borderRadius: 2,
  },
  playerMoves: {
    fontSize: 12,
    color: '#D1D5DB',
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  controlButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chatButton: {
    backgroundColor: '#6366F1',
  },
  voiceButton: {
    backgroundColor: '#6B7280',
  },
  voiceActive: {
    backgroundColor: '#10B981',
  },
});

export default MultiplayerProvider;