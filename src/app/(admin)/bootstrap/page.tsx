'use client';

import { useState } from 'react';
import { BootstrapAdminForm } from '@/components/admin/BootstrapAdminForm';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function BootstrapAdminPage() {
  const [isComplete, setIsComplete] = useState(false);
  const [createdUser, setCreatedUser] = useState<{
    id: string;
    email: string;
    name: string;
    role: string;
  } | null>(null);

  const handleSuccess = (user: {
    id: string;
    email: string;
    name: string;
    role: string;
  }) => {
    setCreatedUser(user);
    setIsComplete(true);
  };

  if (isComplete) {
    return (
      <div className="container mx-auto p-6 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-600">
              <CheckCircle className="h-6 w-6" />
              Admin User Created Successfully
            </CardTitle>
            <CardDescription>
              The first administrator account has been created and the system is
              now ready to use.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
              <h3 className="font-semibold text-green-800 dark:text-green-200 mb-2">
                Admin Account Details:
              </h3>
              <div className="space-y-1 text-sm">
                <p>
                  <strong>Name:</strong> {createdUser?.name}
                </p>
                <p>
                  <strong>Email:</strong> {createdUser?.email}
                </p>
                <p>
                  <strong>Role:</strong> {createdUser?.role}
                </p>
              </div>
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
              <h3 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">
                Next Steps:
              </h3>
              <ul className="text-sm space-y-1 text-blue-700 dark:text-blue-300">
                <li>• You can now log in with the admin account</li>
                <li>• Create additional users through the admin panel</li>
                <li>• Configure system settings and permissions</li>
                <li>• Start using the full functionality of the application</li>
              </ul>
            </div>

            <div className="flex gap-4 pt-4">
              <Button asChild className="flex-1">
                <Link href="/admin/users">
                  Go to Admin Panel
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Link>
              </Button>
              <Button asChild variant="outline" className="flex-1">
                <Link href="/">Go to Home</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-2xl">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold mb-4">System Setup</h1>
        <p className="text-muted-foreground text-lg">
          Welcome to Mafia Insight! Let's set up your first administrator
          account.
        </p>
      </div>

      <BootstrapAdminForm onSuccess={handleSuccess} />
    </div>
  );
}
