'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/components/hooks/use-toast';
import { Loader2 } from 'lucide-react';

interface UserRoleManagerProps {
  userId: string;
  currentRole: string;
  onRoleUpdate?: () => void;
}

export function UserRoleManager({
  userId,
  currentRole,
  onRoleUpdate,
}: UserRoleManagerProps) {
  const { toast } = useToast();
  const [selectedRole, setSelectedRole] = useState(currentRole);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const handleRoleChange = (newRole: string) => {
    if (newRole === currentRole) {
      return; // No change needed
    }
    setSelectedRole(newRole);
    setIsDialogOpen(true);
  };

  const handleConfirmRoleChange = async () => {
    setIsUpdating(true);

    try {
      const response = await fetch(`/api/admin/users/${userId}/role`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ role: selectedRole }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.message || 'Failed to update role');
      }

      toast({
        title: 'Role Updated',
        description: `User role has been successfully updated to ${selectedRole}.`,
      });

      setIsDialogOpen(false);
      if (onRoleUpdate) {
        onRoleUpdate();
      }
    } catch (error) {
      console.error('Update role error:', error);
      toast({
        title: 'Update Failed',
        description:
          error instanceof Error ? error.message : 'Failed to update user role',
        variant: 'destructive',
      });
      // Reset to current role on error
      setSelectedRole(currentRole);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCancel = () => {
    setIsDialogOpen(false);
    setSelectedRole(currentRole);
  };

  return (
    <>
      <Select
        value={selectedRole}
        onValueChange={handleRoleChange}
        disabled={isUpdating}
      >
        <SelectTrigger className="w-[120px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="user">User</SelectItem>
          <SelectItem value="admin">Admin</SelectItem>
          <SelectItem value="moderator">Moderator</SelectItem>
          <SelectItem value="guest">Guest</SelectItem>
        </SelectContent>
      </Select>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Role Change</DialogTitle>
            <DialogDescription>
              Are you sure you want to change this user's role from{' '}
              <strong className="capitalize">{currentRole}</strong> to{' '}
              <strong className="capitalize">{selectedRole}</strong>?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={handleCancel}
              disabled={isUpdating}
            >
              Cancel
            </Button>
            <Button onClick={handleConfirmRoleChange} disabled={isUpdating}>
              {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isUpdating ? 'Updating...' : 'Confirm'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
