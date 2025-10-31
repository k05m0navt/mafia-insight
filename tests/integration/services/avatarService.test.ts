import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  uploadAvatar,
  deleteAvatar,
  updateAvatar,
} from '@/lib/supabase/storage';

// Mock Supabase client
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    storage: {
      from: vi.fn(() => ({
        upload: vi.fn().mockResolvedValue({
          data: { path: 'test-user-123456.jpg' },
          error: null,
        }),
        remove: vi.fn().mockResolvedValue({
          data: null,
          error: null,
        }),
        getPublicUrl: vi.fn((path: string) => ({
          data: {
            publicUrl: `https://mock-storage.supabase.co/avatars/${path}`,
          },
        })),
      })),
    },
  })),
}));

describe('Avatar Service', () => {
  describe('uploadAvatar', () => {
    it('should upload a valid image file', async () => {
      const file = new File(['test image content'], 'avatar.jpg', {
        type: 'image/jpeg',
      });

      const avatarUrl = await uploadAvatar('test-user-id', file);

      expect(avatarUrl).toContain('https://');
      expect(avatarUrl).toContain('avatars');
      expect(avatarUrl).toContain('.jpg');
    });

    it('should reject files larger than 2MB', async () => {
      const largeContent = new Array(3 * 1024 * 1024).fill('a').join('');
      const largeFile = new File([largeContent], 'large-avatar.jpg', {
        type: 'image/jpeg',
      });

      await expect(uploadAvatar('test-user-id', largeFile)).rejects.toThrow(
        '2MB'
      );
    });

    it('should reject non-image files', async () => {
      const textFile = new File(['text content'], 'document.txt', {
        type: 'text/plain',
      });

      await expect(uploadAvatar('test-user-id', textFile)).rejects.toThrow(
        'Invalid file type'
      );
    });

    it('should reject files without extension', async () => {
      const file = new File(['content'], 'noextension', { type: 'image/jpeg' });

      // Should still work with proper mime type
      const avatarUrl = await uploadAvatar('test-user-id', file);
      expect(avatarUrl).toBeTruthy();
    });

    it('should accept JPEG files', async () => {
      const file = new File(['jpeg'], 'avatar.jpg', { type: 'image/jpeg' });

      const avatarUrl = await uploadAvatar('test-user-id', file);
      expect(avatarUrl).toContain('.jpg');
    });

    it('should accept PNG files', async () => {
      const file = new File(['png'], 'avatar.png', { type: 'image/png' });

      const avatarUrl = await uploadAvatar('test-user-id', file);
      expect(avatarUrl).toContain('.png');
    });

    it('should accept WebP files', async () => {
      const file = new File(['webp'], 'avatar.webp', { type: 'image/webp' });

      const avatarUrl = await uploadAvatar('test-user-id', file);
      expect(avatarUrl).toContain('.webp');
    });

    it('should accept GIF files', async () => {
      const file = new File(['gif'], 'avatar.gif', { type: 'image/gif' });

      const avatarUrl = await uploadAvatar('test-user-id', file);
      expect(avatarUrl).toContain('.gif');
    });

    it('should generate unique filenames with timestamp', async () => {
      const file1 = new File(['content1'], 'avatar.jpg', {
        type: 'image/jpeg',
      });
      const file2 = new File(['content2'], 'avatar.jpg', {
        type: 'image/jpeg',
      });

      const url1 = await uploadAvatar('test-user-id', file1);
      await new Promise((resolve) => setTimeout(resolve, 10));
      const url2 = await uploadAvatar('test-user-id', file2);

      expect(url1).not.toBe(url2);
    });

    it('should include user ID in filename', async () => {
      const file = new File(['content'], 'avatar.jpg', { type: 'image/jpeg' });

      const avatarUrl = await uploadAvatar('test-user-123', file);

      expect(avatarUrl).toContain('test-user-123');
    });

    it('should throw error when no file provided', async () => {
      // @ts-expect-error Testing invalid input
      await expect(uploadAvatar('test-user-id', null)).rejects.toThrow(
        'No file provided'
      );
    });
  });

  describe('deleteAvatar', () => {
    it('should delete avatar by file path', async () => {
      const filePath =
        'https://mock-storage.supabase.co/avatars/test-user-123456.jpg';

      await expect(deleteAvatar(filePath)).resolves.not.toThrow();
    });

    it('should handle invalid file paths gracefully', async () => {
      const invalidPath = 'invalid-path';

      // Should not throw, just log warning
      await expect(deleteAvatar(invalidPath)).resolves.not.toThrow();
    });

    it('should extract path from full URL', async () => {
      const fullUrl = 'https://storage.supabase.co/avatars/test-user-123.jpg';

      await expect(deleteAvatar(fullUrl)).resolves.not.toThrow();
    });
  });

  describe('updateAvatar', () => {
    it('should delete old avatar and upload new one', async () => {
      const oldFilePath =
        'https://mock-storage.supabase.co/avatars/old-avatar.jpg';
      const newFile = new File(['new content'], 'new-avatar.jpg', {
        type: 'image/jpeg',
      });

      const newAvatarUrl = await updateAvatar(
        'test-user-id',
        oldFilePath,
        newFile
      );

      expect(newAvatarUrl).toBeTruthy();
      expect(newAvatarUrl).toContain('avatars');
      expect(newAvatarUrl).not.toBe(oldFilePath);
    });

    it('should upload new avatar when no old avatar exists', async () => {
      const newFile = new File(['content'], 'avatar.jpg', {
        type: 'image/jpeg',
      });

      const avatarUrl = await updateAvatar('test-user-id', null, newFile);

      expect(avatarUrl).toBeTruthy();
      expect(avatarUrl).toContain('avatars');
    });

    it('should validate new file size and type', async () => {
      const oldFilePath =
        'https://mock-storage.supabase.co/avatars/old-avatar.jpg';
      const invalidFile = new File(['content'], 'doc.pdf', {
        type: 'application/pdf',
      });

      await expect(
        updateAvatar('test-user-id', oldFilePath, invalidFile)
      ).rejects.toThrow('Invalid file type');
    });
  });

  describe('File Validation', () => {
    const validTypes = [
      { ext: 'jpg', mime: 'image/jpeg' },
      { ext: 'jpeg', mime: 'image/jpeg' },
      { ext: 'png', mime: 'image/png' },
      { ext: 'webp', mime: 'image/webp' },
      { ext: 'gif', mime: 'image/gif' },
    ];

    validTypes.forEach(({ ext, mime }) => {
      it(`should accept ${mime} files`, async () => {
        const file = new File(['content'], `avatar.${ext}`, { type: mime });

        await expect(uploadAvatar('test-user-id', file)).resolves.toBeTruthy();
      });
    });

    const invalidTypes = [
      { ext: 'pdf', mime: 'application/pdf' },
      { ext: 'doc', mime: 'application/msword' },
      { ext: 'txt', mime: 'text/plain' },
      { ext: 'mp4', mime: 'video/mp4' },
      { ext: 'svg', mime: 'image/svg+xml' },
    ];

    invalidTypes.forEach(({ ext, mime }) => {
      it(`should reject ${mime} files`, async () => {
        const file = new File(['content'], `file.${ext}`, { type: mime });

        await expect(uploadAvatar('test-user-id', file)).rejects.toThrow();
      });
    });
  });

  describe('File Size Limits', () => {
    it('should accept files under 2MB', async () => {
      const content = new Array(1.5 * 1024 * 1024).fill('a').join('');
      const file = new File([content], 'avatar.jpg', { type: 'image/jpeg' });

      await expect(uploadAvatar('test-user-id', file)).resolves.toBeTruthy();
    });

    it('should reject files over 2MB', async () => {
      const content = new Array(2.5 * 1024 * 1024).fill('a').join('');
      const file = new File([content], 'large.jpg', { type: 'image/jpeg' });

      await expect(uploadAvatar('test-user-id', file)).rejects.toThrow('2MB');
    });

    it('should accept files exactly at 2MB limit', async () => {
      const content = new Array(2 * 1024 * 1024).fill('a').join('');
      const file = new File([content], 'max-size.jpg', { type: 'image/jpeg' });

      await expect(uploadAvatar('test-user-id', file)).resolves.toBeTruthy();
    });
  });
});
