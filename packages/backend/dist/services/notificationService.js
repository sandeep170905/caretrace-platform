"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationService = void 0;
class NotificationService {
    static clients = [];
    static addClient(id, res) {
        this.clients.push({ id, res });
        // Send initial connected ping
        res.write(`data: ${JSON.stringify({ type: 'CONNECTED', timestamp: new Date().toISOString() })}\n\n`);
    }
    static removeClient(id) {
        this.clients = this.clients.filter(c => c.id !== id);
    }
    static broadcast(eventType, payload) {
        const message = `event: ${eventType}\ndata: ${JSON.stringify(payload)}\n\n`;
        this.clients.forEach(client => {
            try {
                client.res.write(message);
            }
            catch (err) {
                // Client might have disconnected
            }
        });
    }
}
exports.NotificationService = NotificationService;
