import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class WahaService implements OnModuleInit {
  private readonly logger = new Logger(WahaService.name);
  private readonly baseUrl: string;
  private readonly apiKey: string;
  private readonly webhookSecret: string;
  private readonly backendInternalUrl: string;

  constructor(private readonly http: HttpService) {
    this.baseUrl = process.env.WAHA_URL || 'http://localhost:3000';
    this.apiKey = process.env.WAHA_API_KEY || '';
    this.webhookSecret = process.env.WEBHOOK_SECRET || '';
    this.backendInternalUrl = process.env.BACKEND_INTERNAL_URL || 'http://backend:3001';
  }

  private get headers() {
    return { 'X-Api-Key': this.apiKey };
  }

  async onModuleInit() {
    this.configureSessionWithRetry().catch((e) =>
      this.logger.error('Failed to configure WAHA session: ' + e.message),
    );
  }

  private async configureSessionWithRetry(attempts = 12, delayMs = 10000) {
    for (let i = 0; i < attempts; i++) {
      try {
        const session = await this.getStatus();

        const storeEnabled = session?.config?.noweb?.store?.enabled === true;
        const hasSecret =
          !this.webhookSecret ||
          session?.config?.webhooks?.[0]?.customHeaders?.some(
            (h: { name: string }) => h.name === 'x-webhook-secret',
          );

        if (storeEnabled && hasSecret) {
          this.logger.log('WAHA session already configured correctly');
          return;
        }

        await this.upsertSessionConfig();
        this.logger.log('WAHA session configured successfully');
        return;
      } catch (e) {
        this.logger.warn(
          `Session configure attempt ${i + 1}/${attempts} failed: ${e.message}`,
        );
        if (i < attempts - 1) {
          await new Promise((r) => setTimeout(r, delayMs));
        }
      }
    }
    this.logger.error('Could not configure WAHA session after multiple attempts');
  }

  async upsertSessionConfig(session = 'default') {
    const webhookUrl = `${this.backendInternalUrl}/api/webhooks/waha`;
    const customHeaders = this.webhookSecret
      ? [{ name: 'x-webhook-secret', value: this.webhookSecret }]
      : [];

    const config = {
      noweb: { store: { enabled: true, fullSync: false } },
      webhooks: [
        {
          url: webhookUrl,
          events: ['message', 'session.status'],
          customHeaders,
        },
      ],
    };

    // Try PUT (update existing) first; if 404, POST to create
    try {
      const { data } = await firstValueFrom(
        this.http.put(
          `${this.baseUrl}/api/sessions/${session}`,
          { name: session, config },
          { headers: this.headers },
        ),
      );
      return data;
    } catch (e) {
      if (e?.response?.status === 404) {
        const { data } = await firstValueFrom(
          this.http.post(
            `${this.baseUrl}/api/sessions`,
            { name: session, config },
            { headers: this.headers },
          ),
        );
        return data;
      }
      throw e;
    }
  }

  async sendText(chatId: string, text: string, session = 'default') {
    const url = `${this.baseUrl}/api/sendText`;
    const { data } = await firstValueFrom(
      this.http.post(url, { chatId, text, session }, { headers: this.headers }),
    );
    return data;
  }

  async getChats(session = 'default') {
    const url = `${this.baseUrl}/api/${session}/chats`;
    const { data } = await firstValueFrom(
      this.http.get(url, { headers: this.headers }),
    );
    return data;
  }

  async getGroups(session = 'default') {
    const url = `${this.baseUrl}/api/${session}/groups`;
    const { data } = await firstValueFrom(
      this.http.get(url, { headers: this.headers }),
    );
    return data;
  }

  async getStatus(session = 'default') {
    const url = `${this.baseUrl}/api/sessions/${session}`;
    const { data } = await firstValueFrom(
      this.http.get(url, { headers: this.headers }),
    );
    return data;
  }

  async getQR(session = 'default') {
    const url = `${this.baseUrl}/api/${session}/auth/qr`;
    const { data } = await firstValueFrom(
      this.http.get(url, { headers: this.headers }),
    );
    return data;
  }

  async startSession(session = 'default') {
    const url = `${this.baseUrl}/api/sessions/${session}/start`;
    const { data } = await firstValueFrom(
      this.http.post(url, {}, { headers: this.headers }),
    );
    return data;
  }

  async stopSession(session = 'default') {
    const url = `${this.baseUrl}/api/sessions/${session}/stop`;
    const { data } = await firstValueFrom(
      this.http.post(url, {}, { headers: this.headers }),
    );
    return data;
  }

  async restartSession(session = 'default') {
    const url = `${this.baseUrl}/api/sessions/${session}/restart`;
    const { data } = await firstValueFrom(
      this.http.post(url, {}, { headers: this.headers }),
    );
    return data;
  }
}
