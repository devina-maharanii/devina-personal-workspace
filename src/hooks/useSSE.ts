import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
 
import { useRealtimeStore } from '@/stores/realtimeStore';

export type RealtimeEvent = 'notification' | 'team_activity' | 'credit_update' | 'announcement';

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const getString = (value: unknown) => (typeof value === 'string' ? value : undefined);
const getNumber = (value: unknown) => (typeof value === 'number' ? value : undefined);

export function useSSE() {
  const [isConnected, setIsConnected] = useState(false);
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectAttemptRef = useRef(0);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const connect = () => {
    if (eventSourceRef.current) return;

    const sse = new EventSource('/api/sse');
    eventSourceRef.current = sse;

    sse.onopen = () => {
      setIsConnected(true);
      reconnectAttemptRef.current = 0; // reset backoff
    };

    sse.addEventListener('connected', () => {
      // Connection confirmed
    });

    sse.addEventListener('ping', () => {
      // Heartbeat received, connection active
    });

    // Custom Event Listeners
    const eventTypes: RealtimeEvent[] = ['notification', 'team_activity', 'credit_update', 'announcement'];
    
    eventTypes.forEach(eventType => {
      sse.addEventListener(eventType, (e) => {
        try {
          const data = JSON.parse((e as MessageEvent).data);
          handleRealtimeEvent(eventType, data);
        } catch (error) {
          console.error(`Failed to parse SSE event data for ${eventType}`, error);
        }
      });
    });

    sse.onerror = (err) => {
      console.error('SSE Error:', err);
      sse.close();
      eventSourceRef.current = null;
      setIsConnected(false);
      scheduleReconnect();
    };
  };

   
  const handleRealtimeEvent = (eventType: RealtimeEvent, data: unknown) => {
    const payload = isRecord(data) ? data : {};

    switch(eventType) {
      case 'notification':
        toast.info(getString(payload.title) || "New Notification");
        break;
      case 'team_activity':
        useRealtimeStore.getState().addActivity({
          id: `sse-${Date.now()}`,
          action: getString(payload.action) === 'join' ? 'Joined the workspace' : 
                  getString(payload.action) === 'remove' ? 'Removed a member' : 
                  getString(payload.action) === 'role_update' ? 'Updated a role' : 'Team activity',
          createdAt: new Date().toISOString(),
          user: {
            name: getString(payload.name),
            email: getString(payload.email) || 'system@team.local',
          }
        });
        break;
      case 'credit_update':
        if (typeof getNumber(payload.remainingCredits) === 'number') {
          useRealtimeStore.getState().setCreditsRemaining(getNumber(payload.remainingCredits) as number);
        }
        break;
      case 'announcement':
        toast(getString(payload.message) || "New Announcement");
        break;
    }
  };

  const scheduleReconnect = () => {
    if (reconnectTimeoutRef.current) return;
    
    // Exponential backoff: 1s, 2s, 4s, ..., max 30s
    const baseDelay = 1000;
    const maxDelay = 30000;
    const attempt = reconnectAttemptRef.current;
    
    const delay = Math.min(baseDelay * Math.pow(2, attempt), maxDelay);
    reconnectAttemptRef.current += 1;

    console.log(`Reconnecting SSE in ${delay}ms...`);
    reconnectTimeoutRef.current = setTimeout(() => {
      reconnectTimeoutRef.current = null;
      connect();
    }, delay);
  };

  useEffect(() => {
    connect();
    
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { isConnected };
}
