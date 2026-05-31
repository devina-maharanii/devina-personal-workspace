import { redisPub } from './redis';
import { logger } from './logger';

export type RealtimeEventType = 'notification' | 'team_activity' | 'credit_update' | 'announcement';

export interface RealtimeMessage {
  event: RealtimeEventType;
   
  data: unknown;
  timestamp: number;
}

/**
 * Publishes a real-time event to a specific user's channel.
 */
 
export async function publishToUser(userId: string, event: RealtimeEventType, data: unknown) {
  try {
    const channel = `user:${userId}`;
    const payload: RealtimeMessage = { event, data, timestamp: Date.now() };
    await redisPub.publish(channel, JSON.stringify(payload));
  } catch (error) {
    logger.error({ error, userId, event }, "Failed to publish Redis event to user");
  }
}

/**
 * Publishes a real-time event to an entire organization's channel.
 */
 
export async function publishToOrg(orgId: string, event: RealtimeEventType, data: unknown) {
  try {
    const channel = `org:${orgId}`;
    const payload: RealtimeMessage = { event, data, timestamp: Date.now() };
    await redisPub.publish(channel, JSON.stringify(payload));
  } catch (error) {
    logger.error({ error, orgId, event }, "Failed to publish Redis event to organization");
  }
}
