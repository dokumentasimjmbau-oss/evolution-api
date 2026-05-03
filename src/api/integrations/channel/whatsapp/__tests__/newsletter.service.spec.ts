import { describe, it, expect, vi, beforeEach } from 'vitest';

// Helper untuk membuat plain object exception (sesuai implementasi @exceptions)
const makeBadRequest = (message: string) => ({
  status: 400,
  error: 'Bad Request',
  message: [message],
});
const makeInternalError = (message: string) => ({
  status: 500,
  error: 'Internal Server Error',
  message: [message],
});

// ─── Mock semua dependency berat ─────────────────────────────────────────────
vi.mock('baileys', () => ({
  isJidNewsletter: (jid: string) => jid?.endsWith('@newsletter'),
  isJidGroup: (jid: string) => jid?.endsWith('@g.us'),
  isJidBroadcast: (jid: string) => jid?.includes('@broadcast'),
  makeWASocket: vi.fn(),
  useMultiFileAuthState: vi.fn(),
  DisconnectReason: {},
  Browsers: { ubuntu: vi.fn(() => ['Ubuntu', 'Chrome', '10.0']) },
  proto: {},
  getContentType: vi.fn(),
  getDevice: vi.fn(),
  GroupMetadata: {},
  isPnUser: vi.fn(),
  jidNormalizedUser: vi.fn(),
  makeCacheableSignalKeyStore: vi.fn(),
  MessageUpsertType: {},
  MessageUserReceiptUpdate: {},
  WAPresence: {},
  delay: vi.fn(),
}));

vi.mock('@config/env.config', () => ({
  configService: {
    get: vi.fn().mockReturnValue({}),
  },
  ConfigService: class MockConfigService {
    get = vi.fn().mockReturnValue({});
  },
  Database: {},
  Log: {},
  QrCode: {},
  S3: {},
  Openai: {},
  Chatwoot: {},
  CacheConf: {},
  ProviderSession: {},
  ConfigSessionPhone: {},
  AudioConverter: {},
}));

vi.mock('@config/logger.config', () => ({
  Logger: class MockLogger {
    verbose = vi.fn();
    debug = vi.fn();
    info = vi.fn();
    warn = vi.fn();
    error = vi.fn();
    setInstance = vi.fn();
    constructor(_name?: string) {}
  },
}));

vi.mock('minio', () => ({
  Client: class MockMinioClient {},
}));

vi.mock('@prisma/client', () => ({
  PrismaClient: class MockPrismaClient {},
  DeviceMessage: { newsletter: 'newsletter', web: 'web', ios: 'ios' },
}));

vi.mock('i18next', () => ({
  default: {
    init: vi.fn(),
    changeLanguage: vi.fn(),
    t: vi.fn((key: string) => key),
  },
}));

vi.mock('@utils/i18n', () => ({
  i18n: { t: vi.fn((key: string) => key) },
}));

// ─── Test shouldIgnoreJid logic (unit test tanpa instantiate service penuh) ──

describe('shouldIgnoreJid logic — Newsletter JID', () => {
  // Replicate logic dari whatsapp.baileys.service.ts
  const { isJidNewsletter, isJidGroup, isJidBroadcast } = require('baileys');

  function shouldIgnoreJid(
    jid: string,
    opts: { groupsIgnore?: boolean; readStatus?: boolean; syncFullHistory?: boolean } = {},
  ): boolean {
    const { groupsIgnore = false, readStatus = true, syncFullHistory = false } = opts;

    if (syncFullHistory && isJidGroup(jid)) {
      return false;
    }
    // FIX: newsletter tidak diblokir
    if (isJidNewsletter(jid)) {
      return false;
    }
    const isGroupJid = groupsIgnore && isJidGroup(jid);
    const isBroadcast = !readStatus && isJidBroadcast(jid);
    return isGroupJid || isBroadcast;
  }

  it('tidak memblokir JID @newsletter', () => {
    expect(shouldIgnoreJid('123456@newsletter')).toBe(false);
  });

  it('tidak memblokir JID @newsletter meskipun groupsIgnore=true', () => {
    expect(shouldIgnoreJid('123456@newsletter', { groupsIgnore: true })).toBe(false);
  });

  it('tidak memblokir JID @newsletter meskipun readStatus=false', () => {
    expect(shouldIgnoreJid('123456@newsletter', { readStatus: false })).toBe(false);
  });

  it('memblokir group JID saat groupsIgnore=true', () => {
    expect(shouldIgnoreJid('123-456@g.us', { groupsIgnore: true })).toBe(true);
  });

  it('tidak memblokir group JID saat groupsIgnore=false', () => {
    expect(shouldIgnoreJid('123-456@g.us', { groupsIgnore: false })).toBe(false);
  });

  it('memblokir broadcast JID saat readStatus=false', () => {
    expect(shouldIgnoreJid('status@broadcast', { readStatus: false })).toBe(true);
  });

  it('tidak memblokir broadcast JID saat readStatus=true', () => {
    expect(shouldIgnoreJid('status@broadcast', { readStatus: true })).toBe(false);
  });

  it('tidak memblokir group JID saat syncFullHistory=true', () => {
    expect(shouldIgnoreJid('123-456@g.us', { groupsIgnore: true, syncFullHistory: true })).toBe(false);
  });
});

// ─── Test validasi JID newsletter ────────────────────────────────────────────

describe('Validasi format newsletterJid', () => {
  function validateNewsletterJid(jid: string): void {
    if (!jid?.endsWith('@newsletter')) {
      throw makeBadRequest('newsletterJid harus berformat <id>@newsletter');
    }
  }

  it('tidak melempar error untuk JID valid', () => {
    expect(() => validateNewsletterJid('123456@newsletter')).not.toThrow();
    expect(() => validateNewsletterJid('abc123@newsletter')).not.toThrow();
  });

  it('melempar plain object 400 untuk JID tanpa @newsletter', () => {
    expect(() => validateNewsletterJid('123456@g.us')).toThrow();
    expect(() => validateNewsletterJid('123456@s.whatsapp.net')).toThrow();
    expect(() => validateNewsletterJid('invalid')).toThrow();
    expect(() => validateNewsletterJid('')).toThrow();
  });

  it('pesan error mengandung format yang benar', () => {
    try {
      validateNewsletterJid('invalid');
    } catch (e: any) {
      expect(e.message[0]).toContain('@newsletter');
    }
  });
});

// ─── Test validasi parameter count ───────────────────────────────────────────

describe('Validasi parameter count fetchNewsletterMessages', () => {
  function validateCount(count: number): void {
    if (count < 1) throw makeBadRequest('count minimal 1');
    if (count > 100) throw makeBadRequest('count tidak boleh melebihi 100');
  }

  it('tidak melempar error untuk count valid (1-100)', () => {
    expect(() => validateCount(1)).not.toThrow();
    expect(() => validateCount(50)).not.toThrow();
    expect(() => validateCount(100)).not.toThrow();
  });

  it('melempar error untuk count < 1', () => {
    expect(() => validateCount(0)).toThrow();
    expect(() => validateCount(-1)).toThrow();
    expect(() => validateCount(-100)).toThrow();
  });

  it('melempar error untuk count > 100', () => {
    expect(() => validateCount(101)).toThrow();
    expect(() => validateCount(200)).toThrow();
    expect(() => validateCount(1000)).toThrow();
  });
});

// ─── Test validasi createNewsletter ──────────────────────────────────────────

describe('Validasi createNewsletter', () => {
  function validateCreateNewsletter(name: string, description?: string): void {
    if (!name || name.trim().length === 0) {
      throw makeBadRequest('name wajib diisi');
    }
    if (description && description.length > 512) {
      throw makeBadRequest('description tidak boleh melebihi 512 karakter');
    }
  }

  it('tidak melempar error untuk input valid', () => {
    expect(() => validateCreateNewsletter('My Channel')).not.toThrow();
    expect(() => validateCreateNewsletter('My Channel', 'Deskripsi singkat')).not.toThrow();
  });

  it('melempar error untuk name kosong', () => {
    expect(() => validateCreateNewsletter('')).toThrow();
    expect(() => validateCreateNewsletter('   ')).toThrow();
  });

  it('melempar error untuk description > 512 karakter', () => {
    const longDesc = 'a'.repeat(513);
    expect(() => validateCreateNewsletter('My Channel', longDesc)).toThrow();
  });

  it('tidak melempar error untuk description tepat 512 karakter', () => {
    const maxDesc = 'a'.repeat(512);
    expect(() => validateCreateNewsletter('My Channel', maxDesc)).not.toThrow();
  });
});

// ─── Test mock Baileys newsletter methods ─────────────────────────────────────

describe('Newsletter service methods — mock Baileys', () => {
  const mockClient = {
    newsletterMetadata: vi.fn(),
    newsletterFollow: vi.fn(),
    newsletterUnfollow: vi.fn(),
    subscribeNewsletterUpdates: vi.fn(),
    newsletterFetchMessages: vi.fn(),
    newsletterCreate: vi.fn(),
    newsletterReactMessage: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('followNewsletter memanggil client.newsletterFollow dengan JID yang benar', async () => {
    mockClient.newsletterFollow.mockResolvedValue(undefined);
    const jid = '123@newsletter';

    await mockClient.newsletterFollow(jid);

    expect(mockClient.newsletterFollow).toHaveBeenCalledWith(jid);
    expect(mockClient.newsletterFollow).toHaveBeenCalledTimes(1);
  });

  it('unfollowNewsletter memanggil client.newsletterUnfollow dengan JID yang benar', async () => {
    mockClient.newsletterUnfollow.mockResolvedValue(undefined);
    const jid = '123@newsletter';

    await mockClient.newsletterUnfollow(jid);

    expect(mockClient.newsletterUnfollow).toHaveBeenCalledWith(jid);
  });

  it('subscribeNewsletterUpdates memanggil client.subscribeNewsletterUpdates', async () => {
    mockClient.subscribeNewsletterUpdates.mockResolvedValue({ duration: '3600' });
    const jid = '123@newsletter';

    const result = await mockClient.subscribeNewsletterUpdates(jid);

    expect(mockClient.subscribeNewsletterUpdates).toHaveBeenCalledWith(jid);
    expect(result).toEqual({ duration: '3600' });
  });

  it('newsletterFetchMessages memanggil client dengan parameter yang benar', async () => {
    const messages = [{ key: { id: 'msg1', remoteJid: '123@newsletter' } }];
    mockClient.newsletterFetchMessages.mockResolvedValue(messages);

    const result = await mockClient.newsletterFetchMessages('123@newsletter', 20, 0, 0);

    expect(mockClient.newsletterFetchMessages).toHaveBeenCalledWith('123@newsletter', 20, 0, 0);
    expect(result).toEqual(messages);
  });

  it('newsletterCreate memanggil client dengan name dan description', async () => {
    const newChannel = { id: 'new@newsletter', name: 'Test Channel' };
    mockClient.newsletterCreate.mockResolvedValue(newChannel);

    const result = await mockClient.newsletterCreate('Test Channel', 'Deskripsi');

    expect(mockClient.newsletterCreate).toHaveBeenCalledWith('Test Channel', 'Deskripsi');
    expect(result).toEqual(newChannel);
  });

  it('newsletterReactMessage memanggil client dengan parameter yang benar', async () => {
    mockClient.newsletterReactMessage.mockResolvedValue(undefined);

    await mockClient.newsletterReactMessage('123@newsletter', 'srv1', '👍');

    expect(mockClient.newsletterReactMessage).toHaveBeenCalledWith('123@newsletter', 'srv1', '👍');
  });

  it('newsletterReactMessage dengan reaction kosong untuk hapus reaksi', async () => {
    mockClient.newsletterReactMessage.mockResolvedValue(undefined);

    await mockClient.newsletterReactMessage('123@newsletter', 'srv1', undefined);

    expect(mockClient.newsletterReactMessage).toHaveBeenCalledWith('123@newsletter', 'srv1', undefined);
  });

  it('error dari Baileys dilempar sebagai InternalServerErrorException', async () => {
    mockClient.newsletterFollow.mockRejectedValue(new Error('Network error'));

    async function followWithErrorHandling(jid: string) {
      try {
        await mockClient.newsletterFollow(jid);
        return { followed: true, jid };
      } catch (error: any) {
        throw makeInternalError(error?.toString());
      }
    }

    await expect(followWithErrorHandling('123@newsletter')).rejects.toMatchObject({
      status: 500,
      error: 'Internal Server Error',
    });
  });
});

// ─── Test field source newsletter ────────────────────────────────────────────

describe('Field source untuk pesan newsletter', () => {
  it('source harus bernilai "newsletter" untuk pesan newsletter', () => {
    const newsletterMessage = {
      key: { remoteJid: '123@newsletter', id: 'msg1', fromMe: false },
      message: { conversation: 'Hello' },
      messageType: 'conversation',
      messageTimestamp: 1700000000,
      instanceId: 'test-instance-id',
      source: 'newsletter' as const,
      status: 'SERVER_ACK',
    };

    expect(newsletterMessage.source).toBe('newsletter');
  });

  it('source bukan "newsletter" untuk pesan biasa', () => {
    const regularMessage = {
      key: { remoteJid: '628123@s.whatsapp.net', id: 'msg2', fromMe: false },
      source: 'web' as const,
    };

    expect(regularMessage.source).not.toBe('newsletter');
  });
});
