import { useEffect, useRef, useState, useCallback } from "react";
import { supabase, isSupabaseEnabled } from "../lib/supabase";
import { useGameStore } from "../stores/useGameStore";
import type {
  AttackEventPayload,
  MultiplayerMessageType,
  PartyMessage,
  ReconnectSyncPayload,
  RoomJoinPayload,
  SyncTickPayload,
} from "../types/multiplayer.types";
import type { RealtimeChannel } from "@supabase/supabase-js";

export function detectCurrentPlatform(): "PC" | "MOBILE" {
  if (typeof window === "undefined") return "PC";
  const ua = navigator.userAgent || "";
  const isTouchMobile =
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua) ||
    ("maxTouchPoints" in navigator && navigator.maxTouchPoints > 2 && window.innerWidth <= 1024);
  return isTouchMobile ? "MOBILE" : "PC";
}

interface UseOnlineRaidOptions {
  partyCode: string;
  isHost: boolean;
  onPartnerJoined?: (partner: RoomJoinPayload) => void;
  onPartnerReady?: (isReady: boolean) => void;
  onRaidStart?: (seed: number, duration: number) => void;
  onPartnerAttack?: (attack: AttackEventPayload) => void;
  onSyncTick?: (sync: SyncTickPayload) => void;
  onPartnerLeft?: (name: string) => void;
  onPartnerDisconnected?: (payload: { playerName: string; reason?: string }) => void;
  onPartnerReconnectRequest?: (payload: { playerName: string }) => void;
  onReconnectSync?: (sync: ReconnectSyncPayload) => void;
  onReconnectResume?: () => void;
}

interface NetworkPacket {
  type: MultiplayerMessageType;
  payload: any;
  clientId: string;
  senderSessionId: string;
}

export function useOnlineRaid({
  partyCode,
  isHost,
  onPartnerJoined,
  onPartnerReady,
  onRaidStart,
  onPartnerAttack,
  onSyncTick,
  onPartnerLeft,
  onPartnerDisconnected,
  onPartnerReconnectRequest,
  onReconnectSync,
  onReconnectResume,
}: UseOnlineRaidOptions) {
  const broadcastChannelRef = useRef<BroadcastChannel | null>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const clientIdRef = useRef<string>(
    `client_${Math.random().toString(36).substring(2, 9)}_${Date.now()}`
  );
  const hasPartnerRef = useRef(false);
  const lastPartnerHeartbeatRef = useRef<number>(Date.now());

  const [isConnected, setIsConnected] = useState(false);
  const [hasPartner, setHasPartner] = useState(false);
  const [lastLaserEvent, setLastLaserEvent] = useState<{
    id: number;
    damage: number;
    playerName: string;
    timestamp: number;
  } | null>(null);

  const isCloud = isSupabaseEnabled();

  const playerData = useGameStore((state) => state.playerData);
  const character = useGameStore((state) => state.character);
  const spacemanColor = useGameStore((state) => state.spacemanColor);
  const spacemanHat = useGameStore((state) => state.spacemanHat);
  const spacemanPet = useGameStore((state) => state.spacemanPet);
  const remoteCoPilot = useGameStore((state) => state.remoteCoPilot);
  const setRemoteCoPilot = useGameStore((state) => state.setRemoteCoPilot);
  const updateRemoteCoPilot = useGameStore((state) => state.updateRemoteCoPilot);

  const onPartnerJoinedRef = useRef(onPartnerJoined);
  onPartnerJoinedRef.current = onPartnerJoined;
  const onPartnerReadyRef = useRef(onPartnerReady);
  onPartnerReadyRef.current = onPartnerReady;
  const onRaidStartRef = useRef(onRaidStart);
  onRaidStartRef.current = onRaidStart;
  const onPartnerAttackRef = useRef(onPartnerAttack);
  onPartnerAttackRef.current = onPartnerAttack;
  const onSyncTickRef = useRef(onSyncTick);
  onSyncTickRef.current = onSyncTick;
  const onPartnerLeftRef = useRef(onPartnerLeft);
  onPartnerLeftRef.current = onPartnerLeft;
  const onPartnerDisconnectedRef = useRef(onPartnerDisconnected);
  onPartnerDisconnectedRef.current = onPartnerDisconnected;
  const onPartnerReconnectRequestRef = useRef(onPartnerReconnectRequest);
  onPartnerReconnectRequestRef.current = onPartnerReconnectRequest;
  const onReconnectSyncRef = useRef(onReconnectSync);
  onReconnectSyncRef.current = onReconnectSync;
  const onReconnectResumeRef = useRef(onReconnectResume);
  onReconnectResumeRef.current = onReconnectResume;


  const sendBroadcast = useCallback(
    (msg: PartyMessage) => {
      const cleanCode = partyCode.toUpperCase().trim();
      if (!cleanCode) return;

      const packet: NetworkPacket = {
        type: msg.type,
        payload: msg.payload,
        clientId: clientIdRef.current,
        senderSessionId: clientIdRef.current,
      };


      if (broadcastChannelRef.current) {
        try {
          broadcastChannelRef.current.postMessage(packet);
        } catch (err) {
          console.warn("[useOnlineRaid] BroadcastChannel postMessage error:", err);
        }
      }


      try {
        localStorage.setItem(
          `space_academy_raid_evt_${cleanCode}`,
          JSON.stringify({ ...packet, _nonce: Math.random() })
        );
      } catch (_) {}


      if (channelRef.current && isSupabaseEnabled()) {
        channelRef.current
          .send({
            type: "broadcast",
            event: msg.type,
            payload: packet,
          })
          .catch((err) => console.warn("[useOnlineRaid] Supabase broadcast error:", err));
      }
    },
    [partyCode]
  );

  const sendBroadcastRef = useRef(sendBroadcast);
  sendBroadcastRef.current = sendBroadcast;

  const handlePacket = useCallback(
    (packet: NetworkPacket) => {
      if (!packet || packet.clientId === clientIdRef.current) {
        return;
      }

      switch (packet.type) {
        case "ROOM_JOIN": {
          const joinPayload = packet.payload as RoomJoinPayload;
          hasPartnerRef.current = true;
          setHasPartner(true);

          setRemoteCoPilot({
            name: joinPayload.playerName || "CO-PILOT",
            character: joinPayload.character || "white",
            colorId: joinPayload.colorId || "ion-cyan",
            petId: joinPayload.petId || "none",
            hatId: joinPayload.hatId || "none",
            hits: 0,
            damage: 0,
            combo: 0,
            lastActionTime: Date.now(),
            isOnline: true,
            platform: joinPayload.platform || "PC",
            totalScore: joinPayload.totalScore || 0,
            isReady: !!joinPayload.isReady,
          });


          if (isHost && !joinPayload.isHost) {
            sendBroadcastRef.current({
              type: "ROOM_JOIN",
              payload: {
                playerName: playerData.name || "P1 HOST",
                character,
                colorId: spacemanColor,
                hatId: spacemanHat,
                petId: spacemanPet,
                isHost: true,
                platform: detectCurrentPlatform(),
                totalScore: useGameStore.getState().getTotalScore(),
                timestamp: Date.now(),
              } as RoomJoinPayload,
            });
          }

          onPartnerJoinedRef.current?.(joinPayload);
          break;
        }

        case "ROOM_READY": {
          const isReady = !!packet.payload.isReady;
          updateRemoteCoPilot({ isReady });
          onPartnerReadyRef.current?.(isReady);
          break;
        }

        case "RAID_START": {
          onRaidStartRef.current?.(packet.payload.seed, packet.payload.duration);
          break;
        }

        case "ATTACK_EVENT": {
          const attack = packet.payload as AttackEventPayload;
          updateRemoteCoPilot({
            hits: attack.combo || 1,
            damage: attack.damage,
            combo: attack.combo,
            lastActionTime: Date.now(),
          });

          setLastLaserEvent({
            id: Date.now(),
            damage: attack.damage,
            playerName: attack.senderName,
            timestamp: Date.now(),
          });

          onPartnerAttackRef.current?.(attack);
          break;
        }

        case "SYNC_TICK": {
          lastPartnerHeartbeatRef.current = Date.now();
          onSyncTickRef.current?.(packet.payload as SyncTickPayload);
          break;
        }

        case "HEARTBEAT_PING": {
          lastPartnerHeartbeatRef.current = Date.now();
          if (!hasPartnerRef.current) {
            hasPartnerRef.current = true;
            setHasPartner(true);
            updateRemoteCoPilot({ isOnline: true });
          }
          break;
        }

        case "PLAYER_DISCONNECTED": {
          hasPartnerRef.current = false;
          setHasPartner(false);
          updateRemoteCoPilot({ isOnline: false });
          onPartnerDisconnectedRef.current?.(packet.payload);
          break;
        }

        case "RECONNECT_REQUEST": {
          hasPartnerRef.current = true;
          setHasPartner(true);
          updateRemoteCoPilot({ isOnline: true });
          lastPartnerHeartbeatRef.current = Date.now();
          onPartnerReconnectRequestRef.current?.(packet.payload);
          break;
        }

        case "RECONNECT_SYNC": {
          hasPartnerRef.current = true;
          setHasPartner(true);
          updateRemoteCoPilot({ isOnline: true });
          lastPartnerHeartbeatRef.current = Date.now();
          onReconnectSyncRef.current?.(packet.payload as ReconnectSyncPayload);
          break;
        }

        case "RECONNECT_RESUME": {
          hasPartnerRef.current = true;
          setHasPartner(true);
          updateRemoteCoPilot({ isOnline: true });
          lastPartnerHeartbeatRef.current = Date.now();
          onReconnectResumeRef.current?.();
          break;
        }

        case "ROOM_LEAVE": {
          hasPartnerRef.current = false;
          setHasPartner(false);
          updateRemoteCoPilot({ isOnline: false });
          onPartnerLeftRef.current?.(packet.payload.playerName);
          onPartnerDisconnectedRef.current?.({
            playerName: packet.payload.playerName || "CO-PILOT",
            reason: "room_leave",
          });
          break;
        }
      }
    },
    [
      isHost,
      playerData.name,
      character,
      spacemanColor,
      spacemanHat,
      spacemanPet,
      setRemoteCoPilot,
      updateRemoteCoPilot,
    ]
  );

  const sendAttack = useCallback(
    (damage: number, bugCategory: string, combo: number, newBossHP: number) => {
      sendBroadcast({
        type: "ATTACK_EVENT",
        payload: {
          senderId: isHost ? "P1" : "P2",
          senderName: playerData.name || (isHost ? "P1" : "P2"),
          damage,
          bugCategory,
          combo,
          newBossHP,
          timestamp: Date.now(),
        },
      });
    },
    [sendBroadcast, isHost, playerData.name]
  );

  const sendSync = useCallback(
    (bossHP: number, timeLeft: number) => {
      if (!isHost) return;
      sendBroadcast({
        type: "SYNC_TICK",
        payload: {
          bossHP,
          timeLeft,
          timestamp: Date.now(),
        },
      });
    },
    [sendBroadcast, isHost]
  );

  const sendStartRaid = useCallback(
    (seed: number = Math.floor(Math.random() * 10000), duration: number = 60) => {
      sendBroadcast({
        type: "RAID_START",
        payload: {
          seed,
          duration,
          timestamp: Date.now(),
        },
      });
    },
    [sendBroadcast]
  );

  const sendReady = useCallback(
    (isReady: boolean) => {
      sendBroadcast({
        type: "ROOM_READY",
        payload: {
          isReady,
          senderId: isHost ? "P1" : "P2",
          timestamp: Date.now(),
        },
      });
    },
    [sendBroadcast, isHost]
  );

  const sendDisconnect = useCallback(
    (reason: string = "voluntary_leave") => {
      sendBroadcast({
        type: "PLAYER_DISCONNECTED",
        payload: {
          senderId: isHost ? "P1" : "P2",
          playerName: playerData.name || (isHost ? "P1" : "P2"),
          reason,
          timestamp: Date.now(),
        },
      });
    },
    [sendBroadcast, isHost, playerData.name]
  );

  const sendReconnectRequest = useCallback(() => {
    sendBroadcast({
      type: "RECONNECT_REQUEST",
      payload: {
        senderId: isHost ? "P1" : "P2",
        playerName: playerData.name || (isHost ? "P1" : "P2"),
        timestamp: Date.now(),
      },
    });
  }, [sendBroadcast, isHost, playerData.name]);

  const sendReconnectSync = useCallback(
    (snapshot: { bossHP: number; timeLeft: number; score: number; combo: number }) => {
      sendBroadcast({
        type: "RECONNECT_SYNC",
        payload: {
          ...snapshot,
          timestamp: Date.now(),
        },
      });
    },
    [sendBroadcast]
  );

  const sendReconnectResume = useCallback(() => {
    sendBroadcast({
      type: "RECONNECT_RESUME",
      payload: {
        timestamp: Date.now(),
      },
    });
  }, [sendBroadcast]);

  useEffect(() => {
    const cleanCode = partyCode.toUpperCase().trim();
    if (!cleanCode) {
      setIsConnected(false);
      setHasPartner(false);
      return;
    }


    setIsConnected(true);
    hasPartnerRef.current = false;
    setHasPartner(false);

    const channelName = `space_academy_raid_${cleanCode}`;
    const storageKey = `space_academy_raid_evt_${cleanCode}`;


    let bc: BroadcastChannel | null = null;
    if (typeof BroadcastChannel !== "undefined") {
      try {
        bc = new BroadcastChannel(channelName);
        bc.onmessage = (event) => {
          if (event.data) {
            handlePacket(event.data);
          }
        };
        broadcastChannelRef.current = bc;
      } catch (err) {
        console.warn("[useOnlineRaid] BroadcastChannel setup failed:", err);
      }
    }


    const handleStorage = (event: StorageEvent) => {
      if (event.key === storageKey && event.newValue) {
        try {
          const data = JSON.parse(event.newValue);
          handlePacket(data);
        } catch (_) {}
      }
    };
    window.addEventListener("storage", handleStorage);


    let channel: RealtimeChannel | null = null;
    if (isSupabaseEnabled() && supabase) {
      channel = supabase.channel(`raid-room-${cleanCode}`, {
        config: {
          broadcast: { self: false },
        },
      });
      channelRef.current = channel;

      channel
        .on("broadcast", { event: "*" }, ({ event, payload }) => {
          handlePacket({
            type: event as MultiplayerMessageType,
            payload: payload?.payload || payload,
            clientId: payload?.clientId || "",
            senderSessionId: payload?.senderSessionId || "",
          });
        })
        .subscribe((status) => {
          if (status === "SUBSCRIBED") {

            sendBroadcastRef.current({
              type: "ROOM_JOIN",
              payload: {
                playerName: playerData.name || (isHost ? "P1 HOST" : "P2 GUEST"),
                character,
                colorId: spacemanColor,
                hatId: spacemanHat,
                petId: spacemanPet,
                isHost,
                platform: detectCurrentPlatform(),
                totalScore: useGameStore.getState().getTotalScore(),
                timestamp: Date.now(),
              } as RoomJoinPayload,
            });
          }
        });
    }


    const announcePresence = () => {
      sendBroadcastRef.current({
        type: "ROOM_JOIN",
        payload: {
          playerName: playerData.name || (isHost ? "P1 HOST" : "P2 GUEST"),
          character,
          colorId: spacemanColor,
          hatId: spacemanHat,
          petId: spacemanPet,
          isHost,
          platform: detectCurrentPlatform(),
          totalScore: useGameStore.getState().getTotalScore(),
          timestamp: Date.now(),
        } as RoomJoinPayload,
      });
    };

    announcePresence();


    let heartbeatCount = 0;
    const initialHeartbeatTimer = setInterval(() => {
      heartbeatCount++;
      if (hasPartnerRef.current || heartbeatCount > 50) {
        clearInterval(initialHeartbeatTimer);
        return;
      }
      announcePresence();
    }, 1500);

    const continuousPingTimer = setInterval(() => {
      sendBroadcastRef.current({
        type: "HEARTBEAT_PING",
        payload: {
          senderId: isHost ? "P1" : "P2",
          playerName: playerData.name || (isHost ? "P1" : "P2"),
          isHost,
          timestamp: Date.now(),
        },
      });

      if (hasPartnerRef.current && Date.now() - lastPartnerHeartbeatRef.current > 7000) {
        hasPartnerRef.current = false;
        setHasPartner(false);
        updateRemoteCoPilot({ isOnline: false });
        onPartnerDisconnectedRef.current?.({
          playerName: remoteCoPilot?.name || "CO-PILOT",
          reason: "timeout",
        });
      }
    }, 2200);

    return () => {
      clearInterval(initialHeartbeatTimer);
      clearInterval(continuousPingTimer);
      window.removeEventListener("storage", handleStorage);

      sendBroadcastRef.current({
        type: "PLAYER_DISCONNECTED",
        payload: {
          senderId: isHost ? "P1" : "P2",
          playerName: playerData.name || (isHost ? "P1" : "P2"),
          reason: "voluntary_leave",
          timestamp: Date.now(),
        },
      });

      sendBroadcastRef.current({
        type: "ROOM_LEAVE",
        payload: {
          playerName: playerData.name || (isHost ? "P1" : "P2"),
          timestamp: Date.now(),
        },
      });

      if (bc) {
        try {
          bc.close();
        } catch (_) {}
        broadcastChannelRef.current = null;
      }

      if (channel && supabase) {
        supabase.removeChannel(channel);
        channelRef.current = null;
      }
    };
  }, [
    partyCode,
    isHost,
    playerData.name,
    character,
    spacemanColor,
    spacemanHat,
    spacemanPet,
    remoteCoPilot?.name,
    updateRemoteCoPilot,
    handlePacket,
  ]);

  return {
    isConnected,
    hasPartner,
    isCloud,
    lastLaserEvent,
    sendAttack,
    sendSync,
    sendStartRaid,
    sendReady,
    sendDisconnect,
    sendReconnectRequest,
    sendReconnectSync,
    sendReconnectResume,
  };
}
