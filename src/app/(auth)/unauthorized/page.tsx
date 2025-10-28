import Link from 'next/link';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ShieldOff } from 'lucide-react';

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 px-4 sm:px-6 lg:px-8 py-12">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-900/20">
            <ShieldOff className="h-6 w-6 text-orange-600 dark:text-orange-400" />
          </div>
          <CardTitle className="text-2xl">Unauthorized Access</CardTitle>
          <CardDescription>
            You don't have permission to access this resource
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg bg-orange-50 dark:bg-orange-900/10 p-4 border border-orange-200 dark:border-orange-800">
            <p className="text-sm text-orange-800 dark:text-orange-200">
              This page or feature requires additional permissions that your
              account doesn't currently have.
            </p>
          </div>
          <div className="text-sm text-muted-foreground">
            <p>To access this content, you may need to:</p>
            <ul className="mt-2 space-y-1 list-disc list-inside">
              <li>Sign in with an authorized account</li>
              <li>Upgrade your subscription tier</li>
              <li>Request access from an administrator</li>
              <li>Wait for role permissions to be updated</li>
            </ul>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-2">
          <Button asChild className="w-full">
            <Link href="/">Return Home</Link>
          </Button>
          <Button asChild variant="outline" className="w-full">
            <Link href="/contact">Contact Support</Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
