import { AppError, logServerError } from './errors';

export interface LightningInvoice {
  paymentRequest: string;
  paymentHash: string;
  amountSats: number;
  memo?: string;
  expiresAt: string;
}

export interface LightningPayment {
  paymentHash: string;
  preimage: string;
  amountSats: number;
  feeSats: number;
  destination: string;
  settledAt: string;
}

export interface LightningInvoiceStatus {
  paymentHash: string;
  settled: boolean;
  amountSats: number;
  settledAt?: string;
}

export interface LightningProvider {
  createInvoice(amountSats: number, memo?: string): Promise<LightningInvoice>;
  payInvoice(paymentRequest: string): Promise<LightningPayment>;
  payToAddress(address: string, amountSats: number): Promise<LightningPayment>;
  checkInvoice(paymentHash: string): Promise<LightningInvoiceStatus>;
  getBalance(): Promise<number>;
}

class StubLightningProvider implements LightningProvider {
  async createInvoice(amountSats: number, memo?: string): Promise<LightningInvoice> {
    return {
      paymentRequest: `lnbc${amountSats}stub${Date.now()}`,
      paymentHash: `hash_${crypto.randomUUID()}`,
      amountSats,
      memo,
      expiresAt: new Date(Date.now() + 3600_000).toISOString(),
    };
  }

  async payInvoice(paymentRequest: string): Promise<LightningPayment> {
    const match = paymentRequest.match(/lnbc(\d+)/);
    const amount = match ? parseInt(match[1], 10) : 0;
    return {
      paymentHash: `hash_${crypto.randomUUID()}`,
      preimage: `preimage_${crypto.randomUUID()}`,
      amountSats: amount,
      feeSats: 0,
      destination: 'stub_destination',
      settledAt: new Date().toISOString(),
    };
  }

  async payToAddress(address: string, amountSats: number): Promise<LightningPayment> {
    return {
      paymentHash: `hash_${crypto.randomUUID()}`,
      preimage: `preimage_${crypto.randomUUID()}`,
      amountSats,
      feeSats: 0,
      destination: address,
      settledAt: new Date().toISOString(),
    };
  }

  async checkInvoice(paymentHash: string): Promise<LightningInvoiceStatus> {
    return { paymentHash, settled: true, amountSats: 0, settledAt: new Date().toISOString() };
  }

  async getBalance(): Promise<number> {
    return 1_000_000;
  }
}

let provider: LightningProvider | null = null;

export function getLightningProvider(): LightningProvider {
  if (provider) return provider;

  const providerType = process.env.LIGHTNING_PROVIDER ?? 'stub';

  switch (providerType) {
    case 'stub':
      provider = new StubLightningProvider();
      break;
    default:
      logServerError('lightning.getProvider', new Error(`Unknown provider: ${providerType}`), {});
      throw new AppError('CONFIG_ERROR', `Unknown Lightning provider: ${providerType}`, 500);
  }

  return provider;
}

export async function payToAddress(address: string, amountSats: number): Promise<LightningPayment> {
  if (amountSats <= 0) {
    throw new AppError('INVALID_AMOUNT', 'Payment amount must be positive', 400);
  }
  return getLightningProvider().payToAddress(address, amountSats);
}

export async function createDepositInvoice(amountSats: number, agentId: string): Promise<LightningInvoice> {
  if (amountSats <= 0) {
    throw new AppError('INVALID_AMOUNT', 'Deposit amount must be positive', 400);
  }
  return getLightningProvider().createInvoice(amountSats, `PlanetLoga deposit for ${agentId}`);
}
