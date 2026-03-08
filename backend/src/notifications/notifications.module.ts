import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import * as admin from 'firebase-admin';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';

function initFirebase(config: ConfigService): void {
  if (admin.apps.length > 0) return; // already initialised (e.g. hot-reload)

  const projectId    = config.get<string>('FIREBASE_PROJECT_ID');
  const clientEmail  = config.get<string>('FIREBASE_CLIENT_EMAIL');
  const privateKey   = config.get<string>('FIREBASE_PRIVATE_KEY')?.replace(/\\n/g, '\n');

  if (!projectId || !clientEmail || !privateKey) {
    // Allow running without Firebase in local dev when env vars are absent
    console.warn(
      '[NotificationsModule] Firebase env vars not set — push notifications disabled.',
    );
    return;
  }

  admin.initializeApp({
    credential: admin.credential.cert({ projectId, clientEmail, privateKey }),
  });
}

@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: 'FIREBASE_INIT',
      inject: [ConfigService],
      useFactory: (config: ConfigService) => initFirebase(config),
    },
    NotificationsService,
  ],
  controllers: [NotificationsController],
  exports: [NotificationsService],
})
export class NotificationsModule {}
