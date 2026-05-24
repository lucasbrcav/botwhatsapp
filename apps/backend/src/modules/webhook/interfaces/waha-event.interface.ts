export interface WahaMessageEvent {
  event: string;
  session: string;
  payload: {
    id: string;
    timestamp: number;
    from: string;
    to: string;
    body: string;
    hasMedia: boolean;
    ack: number;
    _data?: any;
  };
  engine?: string;
  environment?: any;
}
