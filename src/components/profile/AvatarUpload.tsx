'use client';

import React, { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/hooks/use-toast';
import { Upload, Loader2, X } from 'lucide-react';

interface AvatarUploadProps {
  userId: string;
  currentAvatar?: string | null;
  userName: string;
}

export function AvatarUpload({
  userId: _userId,
  currentAvatar,
  userName,
}: AvatarUploadProps) {
  const router = useRouter();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(
    currentAvatar || null
  );

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Invalid File Type',
        description: 'Please select an image file (JPEG, PNG, WebP, or GIF).',
        variant: 'destructive',
      });
      return;
    }

    // Validate file size (2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: 'File Too Large',
        description: 'Please select an image smaller than 2MB.',
        variant: 'destructive',
      });
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);

    // Upload file
    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/profile/avatar', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to upload avatar');
      }

      toast({
        title: 'Avatar Updated',
        description: 'Your profile picture has been successfully updated.',
      });

      router.refresh();
    } catch (error) {
      console.error('Avatar upload error:', error);
      toast({
        title: 'Upload Failed',
        description:
          error instanceof Error ? error.message : 'Failed to upload avatar',
        variant: 'destructive',
      });
      // Revert preview on error
      setPreviewUrl(currentAvatar || null);
    } finally {
      setIsUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDelete = async () => {
    if (!currentAvatar) return;

    setIsDeleting(true);

    try {
      const response = await fetch('/api/profile/avatar', {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete avatar');
      }

      setPreviewUrl(null);
      toast({
        title: 'Avatar Removed',
        description: 'Your profile picture has been removed.',
      });

      router.refresh();
    } catch (error) {
      console.error('Avatar deletion error:', error);
      toast({
        title: 'Delete Failed',
        description:
          error instanceof Error ? error.message : 'Failed to delete avatar',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
      {/* Avatar Preview */}
      <div className="relative">
        <Avatar className="h-32 w-32">
          <AvatarImage src={previewUrl || undefined} alt={userName} />
          <AvatarFallback className="text-3xl">
            {getInitials(userName)}
          </AvatarFallback>
        </Avatar>
        {isUploading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full">
            <Loader2 className="h-8 w-8 animate-spin text-white" />
          </div>
        )}
      </div>

      {/* Upload Controls */}
      <div className="flex-1 space-y-4">
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">
            Recommended: Square image, at least 200x200 pixels
          </p>
          <p className="text-sm text-muted-foreground">
            Supported formats: JPEG, PNG, WebP, GIF (max 2MB)
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            onChange={handleFileSelect}
            className="hidden"
            aria-label="Upload avatar"
          />

          <Button
            type="button"
            variant="outline"
            onClick={handleUploadClick}
            disabled={isUploading || isDeleting}
          >
            {isUploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Upload New
              </>
            )}
          </Button>

          {currentAvatar && (
            <Button
              type="button"
              variant="outline"
              onClick={handleDelete}
              disabled={isUploading || isDeleting}
              className="text-destructive hover:text-destructive"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Removing...
                </>
              ) : (
                <>
                  <X className="mr-2 h-4 w-4" />
                  Remove
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
