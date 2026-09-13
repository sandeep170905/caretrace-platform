import { Response } from 'express';

interface SSEClient {
  id: string;
  res: Response;
}

export class NotificationService {
  private static clients: SSEClient[] = [];

  public static addClient(id: string, res: Response) {
    this.clients.push({ id, res });
    // Send initial connected ping
    res.write(`data: ${JSON.stringify({ type: 'CONNECTED', timestamp: new Date().toISOString() })}\n\n`);
  }

  public static removeClient(id: string) {
    this.clients = this.clients.filter(c => c.id !== id);
  }

  public static broadcast(eventType: string, payload: any) {
    const message = `event: ${eventType}\ndata: ${JSON.stringify(payload)}\n\n`;
    this.clients.forEach(client => {
      try {
        client.res.write(message);
      } catch (err) {
        // Client might have disconnected
      }
    });
  }
}

