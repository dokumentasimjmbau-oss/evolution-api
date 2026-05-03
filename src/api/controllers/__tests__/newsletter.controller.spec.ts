import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NewsletterController } from '../newsletter.controller';

// Helper: buat plain object exception seperti yang dilempar @exceptions
const makeBadRequest = (message: string) => ({
  status: 400,
  error: 'Bad Request',
  message: [message],
});
const makeNotFound = (message: string) => ({
  status: 404,
  error: 'Not Found',
  message: [message],
});

// Mock WAMonitoringService
const mockInstance = {
  findNewsletterMetadata: vi.fn(),
  followNewsletter: vi.fn(),
  unfollowNewsletter: vi.fn(),
  subscribeNewsletterUpdates: vi.fn(),
  fetchNewsletterMessages: vi.fn(),
  createNewsletter: vi.fn(),
  reactToNewsletterMessage: vi.fn(),
};

const mockWaMonitor = {
  waInstances: {
    'test-instance': mockInstance,
  },
} as any;

const instanceDto = { instanceName: 'test-instance' } as any;

describe('NewsletterController', () => {
  let controller: NewsletterController;

  beforeEach(() => {
    controller = new NewsletterController(mockWaMonitor);
    vi.clearAllMocks();
  });

  // ─── findNewsletterMetadata ───────────────────────────────────────────────

  describe('findNewsletterMetadata', () => {
    it('memanggil service dengan newsletterJid yang benar', async () => {
      const metadata = { id: '123@newsletter', name: 'Test Channel' };
      mockInstance.findNewsletterMetadata.mockResolvedValue(metadata);

      const result = await controller.findNewsletterMetadata(instanceDto, {
        newsletterJid: '123@newsletter',
      });

      expect(mockInstance.findNewsletterMetadata).toHaveBeenCalledWith({
        newsletterJid: '123@newsletter',
      });
      expect(result).toEqual(metadata);
    });

    it('memanggil service dengan inviteCode', async () => {
      const metadata = { id: '456@newsletter', name: 'Invite Channel' };
      mockInstance.findNewsletterMetadata.mockResolvedValue(metadata);

      const result = await controller.findNewsletterMetadata(instanceDto, {
        inviteCode: 'abc123',
      });

      expect(mockInstance.findNewsletterMetadata).toHaveBeenCalledWith({
        inviteCode: 'abc123',
      });
      expect(result).toEqual(metadata);
    });

    it('meneruskan error dari service', async () => {
      mockInstance.findNewsletterMetadata.mockRejectedValue(
        new Error('Connection Closed'),
      );

      await expect(
        controller.findNewsletterMetadata(instanceDto, {
          newsletterJid: '123@newsletter',
        }),
      ).rejects.toThrow('Connection Closed');
    });
  });

  // ─── followNewsletter ─────────────────────────────────────────────────────

  describe('followNewsletter', () => {
    it('mengembalikan { followed: true, jid } saat berhasil', async () => {
      const jid = '123@newsletter';
      mockInstance.followNewsletter.mockResolvedValue({ followed: true, jid });

      const result = await controller.followNewsletter(instanceDto, {
        newsletterJid: jid,
      });

      expect(result).toEqual({ followed: true, jid });
      expect(mockInstance.followNewsletter).toHaveBeenCalledWith({
        newsletterJid: jid,
      });
    });

    it('meneruskan BadRequestException untuk JID tidak valid', async () => {
      mockInstance.followNewsletter.mockRejectedValue(
        makeBadRequest('newsletterJid harus berformat <id>@newsletter'),
      );

      await expect(
        controller.followNewsletter(instanceDto, { newsletterJid: 'invalid' }),
      ).rejects.toMatchObject({ status: 400, error: 'Bad Request' });
    });
  });

  // ─── unfollowNewsletter ───────────────────────────────────────────────────

  describe('unfollowNewsletter', () => {
    it('mengembalikan { followed: false, jid } saat berhasil', async () => {
      const jid = '123@newsletter';
      mockInstance.unfollowNewsletter.mockResolvedValue({ followed: false, jid });

      const result = await controller.unfollowNewsletter(instanceDto, {
        newsletterJid: jid,
      });

      expect(result).toEqual({ followed: false, jid });
    });
  });

  // ─── subscribeNewsletterUpdates ───────────────────────────────────────────

  describe('subscribeNewsletterUpdates', () => {
    it('mengembalikan { subscribed: true, jid } saat berhasil', async () => {
      const jid = '123@newsletter';
      mockInstance.subscribeNewsletterUpdates.mockResolvedValue({
        subscribed: true,
        jid,
      });

      const result = await controller.subscribeNewsletterUpdates(instanceDto, {
        newsletterJid: jid,
      });

      expect(result).toEqual({ subscribed: true, jid });
    });
  });

  // ─── fetchNewsletterMessages ──────────────────────────────────────────────

  describe('fetchNewsletterMessages', () => {
    it('memanggil service dengan parameter yang benar', async () => {
      const messages = [{ key: { id: 'msg1' } }];
      mockInstance.fetchNewsletterMessages.mockResolvedValue(messages);

      const result = await controller.fetchNewsletterMessages(instanceDto, {
        newsletterJid: '123@newsletter',
        count: 10,
      });

      expect(mockInstance.fetchNewsletterMessages).toHaveBeenCalledWith({
        newsletterJid: '123@newsletter',
        count: 10,
      });
      expect(result).toEqual(messages);
    });

    it('meneruskan error count tidak valid dari service', async () => {
      mockInstance.fetchNewsletterMessages.mockRejectedValue(
        makeBadRequest('count tidak boleh melebihi 100'),
      );

      await expect(
        controller.fetchNewsletterMessages(instanceDto, {
          newsletterJid: '123@newsletter',
          count: 200,
        }),
      ).rejects.toMatchObject({ status: 400, message: ['count tidak boleh melebihi 100'] });
    });
  });

  // ─── createNewsletter ─────────────────────────────────────────────────────

  describe('createNewsletter', () => {
    it('mengembalikan metadata newsletter baru saat berhasil', async () => {
      const newNewsletter = {
        id: 'new123@newsletter',
        name: 'My Channel',
        description: 'Test',
      };
      mockInstance.createNewsletter.mockResolvedValue(newNewsletter);

      const result = await controller.createNewsletter(instanceDto, {
        name: 'My Channel',
        description: 'Test',
      });

      expect(result).toEqual(newNewsletter);
      expect(mockInstance.createNewsletter).toHaveBeenCalledWith({
        name: 'My Channel',
        description: 'Test',
      });
    });

    it('meneruskan error name kosong dari service', async () => {
      mockInstance.createNewsletter.mockRejectedValue(
        makeBadRequest('name wajib diisi'),
      );

      await expect(
        controller.createNewsletter(instanceDto, { name: '' }),
      ).rejects.toMatchObject({ status: 400, message: ['name wajib diisi'] });
    });
  });

  // ─── reactToNewsletterMessage ─────────────────────────────────────────────

  describe('reactToNewsletterMessage', () => {
    it('mengembalikan konfirmasi reaksi saat berhasil', async () => {
      const reaction = {
        reacted: true,
        jid: '123@newsletter',
        serverId: 'srv1',
        reaction: '👍',
      };
      mockInstance.reactToNewsletterMessage.mockResolvedValue(reaction);

      const result = await controller.reactToNewsletterMessage(instanceDto, {
        newsletterJid: '123@newsletter',
        serverId: 'srv1',
        reaction: '👍',
      });

      expect(result).toEqual(reaction);
    });

    it('menghapus reaksi saat reaction adalah string kosong', async () => {
      const reaction = {
        reacted: true,
        jid: '123@newsletter',
        serverId: 'srv1',
        reaction: '',
      };
      mockInstance.reactToNewsletterMessage.mockResolvedValue(reaction);

      const result = await controller.reactToNewsletterMessage(instanceDto, {
        newsletterJid: '123@newsletter',
        serverId: 'srv1',
        reaction: '',
      });

      expect(mockInstance.reactToNewsletterMessage).toHaveBeenCalledWith({
        newsletterJid: '123@newsletter',
        serverId: 'srv1',
        reaction: '',
      });
      expect(result.reaction).toBe('');
    });

    it('meneruskan NotFoundException saat serverId tidak ditemukan', async () => {
      mockInstance.reactToNewsletterMessage.mockRejectedValue(
        makeNotFound('Server_ID tidak ditemukan dalam newsletter tersebut'),
      );

      await expect(
        controller.reactToNewsletterMessage(instanceDto, {
          newsletterJid: '123@newsletter',
          serverId: 'nonexistent',
          reaction: '👍',
        }),
      ).rejects.toMatchObject({ status: 404, error: 'Not Found' });
    });
  });

  // ─── Instance tidak ditemukan ─────────────────────────────────────────────

  describe('instance tidak ditemukan', () => {
    it('melempar error saat instance tidak ada di waInstances', async () => {
      const invalidInstance = { instanceName: 'nonexistent-instance' } as any;

      await expect(
        controller.followNewsletter(invalidInstance, {
          newsletterJid: '123@newsletter',
        }),
      ).rejects.toThrow();
    });
  });
});
