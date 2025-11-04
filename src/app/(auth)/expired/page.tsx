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
import { Clock } from 'lucide-react';

export default function SessionExpiredPage() {
  return (
    <main
      className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 px-4 sm:px-6 lg:px-8 py-12"
      role="main"
      aria-labelledby="expired-title"
    >
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div
            className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-900/20"
            role="img"
            aria-label="Session expired icon"
          >
            <Clock
              className="h-6 w-6 text-orange-600 dark:text-orange-400"
              aria-hidden="true"
            />
          </div>
          <CardTitle id="expired-title" className="text-2xl">
            Session Expired
          </CardTitle>
          <CardDescription>
            Your session has expired for security reasons
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div
            className="rounded-lg bg-orange-50 dark:bg-orange-900/10 p-4 border border-orange-200 dark:border-orange-800"
            role="alert"
            aria-live="polite"
          >
            <p className="text-sm text-orange-800 dark:text-orange-200">
              For your security, your session has expired. This can happen when:
            </p>
            <ul className="mt-2 space-y-1 text-sm text-orange-700 dark:text-orange-300 list-disc list-inside">
              <li>You've been inactive for too long</li>
              <li>Your session token has expired</li>
              <li>You've signed in from another device</li>
              <li>There was a security concern</li>
            </ul>
          </div>
          <div className="text-sm text-muted-foreground">
            <p>To continue, please sign in again:</p>
            <ul className="mt-2 space-y-1 list-disc list-inside">
              <li>Use your email and password</li>
              <li>Check that your system clock is correct</li>
              <li>Clear your browser cookies if needed</li>
              <li>Contact support if you need help</li>
            </ul>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-2">
          <Button asChild className="w-full">
            <Link href="/login" aria-label="Sign in again to continue">
              Sign In Again
            </Link>
          </Button>
          <Button asChild variant="outline" className="w-full">
            <Link href="/" aria-label="Return to home page">
              Return Home
            </Link>
          </Button>
        </CardFooter>
      </Card>
    </main>
  );
}
