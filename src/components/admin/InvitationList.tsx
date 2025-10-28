'use client';

import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Mail,
  MoreHorizontal,
  Clock,
  CheckCircle,
  XCircle,
  RefreshCw,
  Trash2,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import type { UserRole } from '@/types/navigation';

interface UserInvitation {
  id: string;
  email: string;
  role: UserRole;
  invitedBy: string;
  token: string;
  expiresAt: string;
  acceptedAt?: string;
  createdAt: string;
}

interface InvitationListProps {
  className?: string;
}

export const InvitationList: React.FC<InvitationListProps> = ({
  className = '',
}) => {
  const [invitations, setInvitations] = useState<UserInvitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchInvitations = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/users/invitations');

      if (!response.ok) {
        throw new Error('Failed to fetch invitations');
      }

      const data = await response.json();
      setInvitations(data.invitations || []);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvitations();
  }, []);

  const handleResendInvitation = async (invitationId: string) => {
    try {
      const response = await fetch(
        `/api/users/invitations/${invitationId}/resend`,
        {
          method: 'POST',
        }
      );

      if (!response.ok) {
        throw new Error('Failed to resend invitation');
      }

      // Refresh the list
      await fetchInvitations();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to resend invitation'
      );
    }
  };

  const handleCancelInvitation = async (invitationId: string) => {
    try {
      const response = await fetch(`/api/users/invitations/${invitationId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to cancel invitation');
      }

      // Refresh the list
      await fetchInvitations();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to cancel invitation'
      );
    }
  };

  const getStatusBadge = (invitation: UserInvitation) => {
    const now = new Date();
    const expiresAt = new Date(invitation.expiresAt);
    const acceptedAt = invitation.acceptedAt
      ? new Date(invitation.acceptedAt)
      : null;

    if (acceptedAt) {
      return (
        <Badge variant="default" className="bg-green-100 text-green-800">
          <CheckCircle className="h-3 w-3 mr-1" />
          Accepted
        </Badge>
      );
    }

    if (now > expiresAt) {
      return (
        <Badge variant="destructive">
          <XCircle className="h-3 w-3 mr-1" />
          Expired
        </Badge>
      );
    }

    return (
      <Badge variant="secondary">
        <Clock className="h-3 w-3 mr-1" />
        Pending
      </Badge>
    );
  };

  const getRoleBadge = (role: UserRole) => {
    const variants = {
      guest: 'secondary',
      user: 'default',
      admin: 'destructive',
      moderator: 'outline',
    } as const;

    return <Badge variant={variants[role]}>{role}</Badge>;
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            User Invitations
          </CardTitle>
          <CardDescription>Manage pending user invitations</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-6 w-6 animate-spin" />
            <span className="ml-2">Loading invitations...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              User Invitations
            </CardTitle>
            <CardDescription>Manage pending user invitations</CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchInvitations}
            disabled={loading}
          >
            <RefreshCw
              className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`}
            />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="mb-4 rounded-lg bg-red-50 border border-red-200 p-4">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {invitations.length === 0 ? (
          <div className="text-center py-8">
            <Mail className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium text-muted-foreground mb-2">
              No invitations found
            </h3>
            <p className="text-sm text-muted-foreground">
              There are no pending user invitations at this time.
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Invited</TableHead>
                <TableHead>Expires</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invitations.map((invitation) => (
                <TableRow key={invitation.id}>
                  <TableCell className="font-medium">
                    {invitation.email}
                  </TableCell>
                  <TableCell>{getRoleBadge(invitation.role)}</TableCell>
                  <TableCell>{getStatusBadge(invitation)}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDistanceToNow(new Date(invitation.createdAt), {
                      addSuffix: true,
                    })}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDistanceToNow(new Date(invitation.expiresAt), {
                      addSuffix: true,
                    })}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {!invitation.acceptedAt &&
                          new Date() < new Date(invitation.expiresAt) && (
                            <DropdownMenuItem
                              onClick={() =>
                                handleResendInvitation(invitation.id)
                              }
                            >
                              <RefreshCw className="h-4 w-4 mr-2" />
                              Resend
                            </DropdownMenuItem>
                          )}
                        <DropdownMenuItem
                          onClick={() => handleCancelInvitation(invitation.id)}
                          className="text-red-600"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Cancel
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
};
