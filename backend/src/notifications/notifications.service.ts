import { Injectable, Logger } from '@nestjs/common';
import * as admin from 'firebase-admin';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  async sendPushNotification(
    fcmToken: string,
    title: string,
    body: string,
    data?: Record<string, string>,
  ): Promise<void> {
    try {
      await admin.messaging().send({
        token: fcmToken,
        notification: { title, body },
        data,
        apns: { payload: { aps: { sound: 'default' } } },
        android: { notification: { sound: 'default' } },
      });
    } catch (error) {
      this.logger.error(`Failed to send push notification: ${error}`);
    }
  }

  async sendMulticast(
    tokens: string[],
    title: string,
    body: string,
    data?: Record<string, string>,
  ): Promise<void> {
    if (!tokens.length) return;
    try {
      await admin.messaging().sendEachForMulticast({
        tokens,
        notification: { title, body },
        data,
      });
    } catch (error) {
      this.logger.error(`Failed to send multicast notification: ${error}`);
    }
  }
}
