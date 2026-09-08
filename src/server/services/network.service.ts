import os from 'node:os';
import QRCode from 'qrcode';

export interface INetworkInfo {
  ipAddress: string;
  port: number;
  url: string;
  qrCodeDataUrl: string;
  qrCodeSvg: string;
}

const FALLBACK_IP = '127.0.0.1';
const DEFAULT_PORT = 3000;

/**
 * Service to detect active local LAN IPv4 network interfaces and generate QR codes.
 */
export class NetworkService {
  /**
   * Scans system network interfaces to find the active non-internal IPv4 address.
   */
  public static getLocalIpAddress(): string {
    const interfaces = os.networkInterfaces();

    for (const interfaceName of Object.keys(interfaces)) {
      const networkCards = interfaces[interfaceName];
      if (!networkCards) continue;

      for (const card of networkCards) {
        const isIpv4 = card.family === 'IPv4';
        const isNotInternal = !card.internal;

        if (isIpv4 && isNotInternal) {
          return card.address;
        }
      }
    }

    return FALLBACK_IP;
  }

  /**
   * Generates a QR code data URL (PNG base64) for client web browsers.
   */
  public static async generateQrDataUrl(url: string): Promise<string> {
    return QRCode.toDataURL(url, {
      errorCorrectionLevel: 'M',
      margin: 2,
      scale: 6
    });
  }

  /**
   * Generates an inline SVG representation of the QR code.
   */
  public static async generateQrSvg(url: string): Promise<string> {
    return QRCode.toString(url, {
      type: 'svg',
      errorCorrectionLevel: 'M',
      margin: 1
    });
  }

  /**
   * Prints a visual ASCII QR code directly into the terminal stream.
   */
  public static async printTerminalQr(url: string): Promise<void> {
    try {
      const terminalQr = await QRCode.toString(url, {
        type: 'terminal',
        small: true
      });
      console.log(terminalQr);
    } catch (error) {
      console.error('Failed to render terminal QR code:', error);
    }
  }

  /**
   * Assembles full network connection information for client devices.
   */
  public static async getNetworkInfo(port: number = DEFAULT_PORT): Promise<INetworkInfo> {
    const ipAddress = this.getLocalIpAddress();
    const url = `http://${ipAddress}:${port}`;

    const [qrCodeDataUrl, qrCodeSvg] = await Promise.all([
      this.generateQrDataUrl(url),
      this.generateQrSvg(url)
    ]);

    return {
      ipAddress,
      port,
      url,
      qrCodeDataUrl,
      qrCodeSvg
    };
  }
}
