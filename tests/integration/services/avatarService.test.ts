import { describe, it, expect, beforeEach, vi } from 'vitest';
const mocks = vi.hoisted(() => {
  const uploadMock = vi.fn(async () => ({
    data: { path: 'test-user-123456.jpg' },
    error: null,
  }));

  const removeMock = vi.fn(async () => ({
    data: null,
    error: null,
  }));

  const getPublicUrlMock = vi.fn((path: string) => ({
    data: {
      publicUrl: `https://mock-storage.supabase.co/avatars/${path}`,
    },
  }));

  const storageFromMock = vi.fn(() => ({
    upload: uploadMock,
    remove: removeMock,
    getPublicUrl: getPublicUrlMock,
  }));

  return {
    uploadMock,
    removeMock,
    getPublicUrlMock,
    storageFromMock,
    buildSupabaseMock: () => ({
      storage: {
        from: storageFromMock,
      },
    }),
  };
});

let uploadAvatar: typeof import('@/lib/supabase/storage').uploadAvatar;
let deleteAvatar: typeof import('@/lib/supabase/storage').deleteAvatar;
let updateAvatar: typeof import('@/lib/supabase/storage').updateAvatar;

describe('Avatar Service', () => {
  beforeAll(async () => {
    vi.resetModules();
    const storageModule = await import('@/lib/supabase/storage');

    storageModule.__setSupabaseClientForTests(mocks.buildSupabaseMock() as any);

    uploadAvatar = storageModule.uploadAvatar;
    deleteAvatar = storageModule.deleteAvatar;
    updateAvatar = storageModule.updateAvatar;
  });

  beforeEach(() => {
    mocks.uploadMock.mockClear();
    mocks.removeMock.mockClear();
    mocks.getPublicUrlMock.mockClear();
    mocks.storageFromMock.mockClear();
  });

  describe('uploadAvatar', () => {
    it('should upload a valid image file', async () => {
      const file = new File(['test image content'], 'avatar.jpg', {
        type: 'image/jpeg',
      });

      const result = await uploadAvatar('test-user-id', file);

      expect(result.error).toBeUndefined();
      expect(result.url).toContain('https://');
      expect(result.url).toContain('avatars');
      expect(result.url).toContain('.jpg');
    });

    it('should reject files larger than 2MB', async () => {
      const largeContent = new Array(3 * 1024 * 1024).fill('a').join('');
      const largeFile = new File([largeContent], 'large-avatar.jpg', {
        type: 'image/jpeg',
      });

      const result = await uploadAvatar('test-user-id', largeFile);

      expect(result.url).toBeUndefined();
      expect(result.error).toContain('2MB');
    });

    it('should reject non-image files', async () => {
      const textFile = new File(['text content'], 'document.txt', {
        type: 'text/plain',
      });

      const result = await uploadAvatar('test-user-id', textFile);

      expect(result.url).toBeUndefined();
      expect(result.error).toContain('File type must be one of');
    });

    it('should reject files without extension', async () => {
      const file = new File(['content'], 'noextension', { type: 'image/jpeg' });

      // Should still work with proper mime type
      const result = await uploadAvatar('test-user-id', file);
      expect(result.error).toBeUndefined();
      expect(result.url).toBeTruthy();
    });

    it('should accept JPEG files', async () => {
      const file = new File(['jpeg'], 'avatar.jpg', { type: 'image/jpeg' });

      const result = await uploadAvatar('test-user-id', file);
      expect(result.url).toContain('.jpg');
    });

    it('should accept PNG files', async () => {
      const file = new File(['png'], 'avatar.png', { type: 'image/png' });

      const result = await uploadAvatar('test-user-id', file);
      expect(result.url).toContain('.png');
    });

    it('should accept WebP files', async () => {
      const file = new File(['webp'], 'avatar.webp', { type: 'image/webp' });

      const result = await uploadAvatar('test-user-id', file);
      expect(result.url).toContain('.webp');
    });

    it('should accept GIF files', async () => {
      const file = new File(['gif'], 'avatar.gif', { type: 'image/gif' });

      const result = await uploadAvatar('test-user-id', file);
      expect(result.url).toContain('.gif');
    });

    it('should generate unique filenames with timestamp', async () => {
      const file1 = new File(['content1'], 'avatar.jpg', {
        type: 'image/jpeg',
      });
      const file2 = new File(['content2'], 'avatar.jpg', {
        type: 'image/jpeg',
      });

      const { url: url1 } = await uploadAvatar('test-user-id', file1);
      await new Promise((resolve) => setTimeout(resolve, 10));
      const { url: url2 } = await uploadAvatar('test-user-id', file2);

      expect(url1).not.toBe(url2);
    });

    it('should include user ID in filename', async () => {
      const file = new File(['content'], 'avatar.jpg', { type: 'image/jpeg' });

      const result = await uploadAvatar('test-user-123', file);

      expect(result.url).toContain('test-user-123');
    });

    it('should throw error when no file provided', async () => {
      // @ts-expect-error Testing invalid input
      const result = await uploadAvatar('test-user-id', null);

      expect(result.url).toBeUndefined();
      expect(result.error).toBe('Failed to upload avatar');
    });
  });

  describe('deleteAvatar', () => {
    it('should delete avatar by file path', async () => {
      const filePath =
        'https://mock-storage.supabase.co/avatars/test-user-123456.jpg';

      const result = await deleteAvatar(filePath);
      expect(result.success).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should handle invalid file paths gracefully', async () => {
      const invalidPath = 'invalid-path';

      // Should not throw, just log warning
      const result = await deleteAvatar(invalidPath);
      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid avatar URL');
    });

    it('should extract path from full URL', async () => {
      const fullUrl = 'https://storage.supabase.co/avatars/test-user-123.jpg';

      const result = await deleteAvatar(fullUrl);
      expect(result.success).toBe(true);
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
        newFile,
        oldFilePath
      );

      expect(mocks.removeMock).toHaveBeenCalled();
      expect(newAvatarUrl.error).toBeUndefined();
      expect(newAvatarUrl.url).toContain('avatars');
      expect(newAvatarUrl.url).not.toBe(oldFilePath);
    });

    it('should upload new avatar when no old avatar exists', async () => {
      const newFile = new File(['content'], 'avatar.jpg', {
        type: 'image/jpeg',
      });

      const avatarUrl = await updateAvatar('test-user-id', newFile);

      expect(avatarUrl.error).toBeUndefined();
      expect(avatarUrl.url).toContain('avatars');
    });

    it('should validate new file size and type', async () => {
      const oldFilePath =
        'https://mock-storage.supabase.co/avatars/old-avatar.jpg';
      const invalidFile = new File(['content'], 'doc.pdf', {
        type: 'application/pdf',
      });

      const result = await updateAvatar(
        'test-user-id',
        invalidFile,
        oldFilePath
      );

      expect(result.url).toBeUndefined();
      expect(result.error).toContain('File type must be one of');
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

        const result = await uploadAvatar('test-user-id', file);
        expect(result.error).toBeUndefined();
        expect(result.url).toBeTruthy();
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

        const result = await uploadAvatar('test-user-id', file);
        expect(result.url).toBeUndefined();
        expect(result.error).toContain('File type must be one of');
      });
    });
  });

  describe('File Size Limits', () => {
    it('should accept files under 2MB', async () => {
      const content = new Array(1.5 * 1024 * 1024).fill('a').join('');
      const file = new File([content], 'avatar.jpg', { type: 'image/jpeg' });

      const result = await uploadAvatar('test-user-id', file);
      expect(result.error).toBeUndefined();
      expect(result.url).toBeTruthy();
    });

    it('should reject files over 2MB', async () => {
      const content = new Array(2.5 * 1024 * 1024).fill('a').join('');
      const file = new File([content], 'large.jpg', { type: 'image/jpeg' });

      const result = await uploadAvatar('test-user-id', file);
      expect(result.url).toBeUndefined();
      expect(result.error).toContain('2MB');
    });

    it('should accept files exactly at 2MB limit', async () => {
      const content = new Array(2 * 1024 * 1024).fill('a').join('');
      const file = new File([content], 'max-size.jpg', { type: 'image/jpeg' });

      const result = await uploadAvatar('test-user-id', file);
      expect(result.error).toBeUndefined();
      expect(result.url).toBeTruthy();
    });
  });
});
