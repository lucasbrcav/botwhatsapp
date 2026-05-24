import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class WahaService {
  private readonly logger = new Logger(WahaService.name);
  private readonly baseUrl: string;
  private readonly apiKey: string;

  constructor(private readonly http: HttpService) {
    this.baseUrl = process.env.WAHA_URL || 'http://localhost:3000';
    this.apiKey = process.env.WAHA_API_KEY || '';
  }

  private get headers() {
    return { 'X-Api-Key': this.apiKey };
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
    const url = `${this.baseUrl}/api/sessions/start`;
    const { data } = await firstValueFrom(
      this.http.post(url, { name: session }, { headers: this.headers }),
    );
    return data;
  }

  async stopSession(session = 'default') {
    const url = `${this.baseUrl}/api/sessions/stop`;
    const { data } = await firstValueFrom(
      this.http.post(url, { name: session }, { headers: this.headers }),
    );
    return data;
  }

  async restartSession(session = 'default') {
    try {
      await this.stopSession(session);
    } catch (e) {
      this.logger.warn('Stop session failed (may not be running): ' + e.message);
    }
    return this.startSession(session);
  }
}
