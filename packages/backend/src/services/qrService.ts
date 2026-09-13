import QRCode from 'qrcode';
import crypto from 'crypto';

const QR_SECRET = 'caretrace-secure-qr-secret-key-2026';

export interface QRPayloadData {
  donationId: string;
  donorId: string;
  institutionId: string;
  issuedAt: string;
  signature: string;
}

export class QRService {
  /**
   * Generates a tamper-resistant signature for the QR payload
   */
  public static signPayload(donationId: string, timestamp: string): string {
    return crypto
      .createHmac('sha256', QR_SECRET)
      .update(`${donationId}:${timestamp}`)
      .digest('hex')
      .slice(0, 16);
  }

  /**
   * Formats string payload for QR code
   */
  public static createPayloadString(donationId: string, donorId: string, institutionId: string): string {
    const issuedAt = new Date().toISOString();
    const signature = this.signPayload(donationId, issuedAt);
    const payload: QRPayloadData = {
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
  public static verifyPayloadString(payloadStr: string): { valid: boolean; donationId?: string; error?: string } {
    try {
      // Allow raw donation ID for quick testing or full JSON payload
      if (payloadStr.startsWith('CT-')) {
        return { valid: true, donationId: payloadStr.trim() };
      }

      const parsed: QRPayloadData = JSON.parse(payloadStr);
      if (!parsed.donationId || !parsed.signature || !parsed.issuedAt) {
        return { valid: false, error: 'Invalid CareTrace QR code structure.' };
      }

      const expectedSig = this.signPayload(parsed.donationId, parsed.issuedAt);
      if (parsed.signature !== expectedSig) {
        return { valid: false, error: 'QR Code signature mismatch. Possible counterfeit code.' };
      }

      return { valid: true, donationId: parsed.donationId };
    } catch (err: any) {
      return { valid: false, error: 'Malformed QR code data.' };
    }
  }

  /**
   * Renders the QR code as a PNG data URL
   */
  public static async generateQRDataUrl(payload: string): Promise<string> {
    try {
      return await QRCode.toDataURL(payload, {
        errorCorrectionLevel: 'H',
        margin: 2,
        width: 300,
        color: {
          dark: '#0F766E', // Trust Teal
          light: '#FFFFFF'
        }
      });
    } catch (err) {
      console.error('Failed to generate QR data URL:', err);
      return '';
    }
  }
}

