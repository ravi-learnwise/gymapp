import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { App, cert, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth, DecodedIdToken } from 'firebase-admin/auth';

@Injectable()
export class FirebaseAdminService {
  private readonly logger = new Logger(FirebaseAdminService.name);
  private app: App | null = null;

  constructor(private config: ConfigService) {}

  private getApp(): App {
    if (this.app) return this.app;
    const existing = getApps()[0];
    if (existing) {
      this.app = existing;
      return this.app;
    }

    const json = this.config.get<string>('FIREBASE_SERVICE_ACCOUNT');
    if (json?.trim()) {
      this.app = initializeApp({
        credential: cert(JSON.parse(json) as Record<string, string>),
      });
      return this.app;
    }

    this.logger.error('FIREBASE_SERVICE_ACCOUNT is not set');
    throw new ServiceUnavailableException(
      'Member login is not configured. Set FIREBASE_SERVICE_ACCOUNT on the API.',
    );
  }

  async verifyIdToken(idToken: string): Promise<DecodedIdToken> {
    return getAuth(this.getApp()).verifyIdToken(idToken);
  }
}
