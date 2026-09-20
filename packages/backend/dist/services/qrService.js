"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.QRService = void 0;
const qrcode_1 = __importDefault(require("qrcode"));
const crypto_1 = __importDefault(require("crypto"));
const QR_SECRET = 'caretrace-secure-qr-secret-key-2026';
class QRService {
    /**
     * Generates a tamper-resistant signature for the QR payload
     */
    static signPayload(donationId, timestamp) {
        return crypto_1.default
            .createHmac('sha256', QR_SECRET)
            .update(`${donationId}:${timestamp}`)
            .digest('hex')
            .slice(0, 16);
    }
    /**
     * Formats string payload for QR code
     */
    static createPayloadString(donationId, donorId, institutionId) {
        const issuedAt = new Date().toISOString();
        const signature = this.signPayload(donationId, issuedAt);
        const payload = {
            donationId,
            donorId,
            institutionId,
            issuedAt,
            signature
        };
        return JSON.stringify(payload);
    }
    /**
     * Validates a scanned QR code payload
     */
    static verifyPayloadString(payloadStr) {
        try {
            // Allow raw donation ID for quick testing or full JSON payload
            if (payloadStr.startsWith('CT-')) {
                return { valid: true, donationId: payloadStr.trim() };
            }
            const parsed = JSON.parse(payloadStr);
            if (!parsed.donationId || !parsed.signature || !parsed.issuedAt) {
                return { valid: false, error: 'Invalid CareTrace QR code structure.' };
            }
            const expectedSig = this.signPayload(parsed.donationId, parsed.issuedAt);
            if (parsed.signature !== expectedSig) {
                return { valid: false, error: 'QR Code signature mismatch. Possible counterfeit code.' };
            }
            return { valid: true, donationId: parsed.donationId };
        }
        catch (err) {
            return { valid: false, error: 'Malformed QR code data.' };
        }
    }
    /**
     * Renders the QR code as a PNG data URL
     */
    static async generateQRDataUrl(payload) {
        try {
            return await qrcode_1.default.toDataURL(payload, {
                errorCorrectionLevel: 'H',
                margin: 2,
                width: 300,
                color: {
                    dark: '#0F766E', // Trust Teal
                    light: '#FFFFFF'
                }
            });
        }
        catch (err) {
            console.error('Failed to generate QR data URL:', err);
            return '';
        }
    }
}
exports.QRService = QRService;
