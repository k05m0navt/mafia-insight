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
import { WifiOff } from 'lucide-react';

export default function NetworkErrorPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/20">
            <WifiOff className="h-6 w-6 text-red-600 dark:text-red-400" />
          </div>
          <CardTitle className="text-2xl">Network Error</CardTitle>
          <CardDescription>Unable to connect to the server</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg bg-red-50 dark:bg-red-900/10 p-4 border border-red-200 dark:border-red-800">
            <p className="text-sm text-red-800 dark:text-red-200">
              We're having trouble connecting to our servers. This could be due
              to:
            </p>
            <ul className="mt-2 space-y-1 text-sm text-red-700 dark:text-red-300 list-disc list-inside">
              <li>Internet connection issues</li>
              <li>Server maintenance</li>
              <li>High traffic volume</li>
              <li>Firewall or proxy settings</li>
            </ul>
          </div>
          <div className="text-sm text-muted-foreground">
            <p>Please try the following:</p>
            <ul className="mt-2 space-y-1 list-disc list-inside">
              <li>Check your internet connection</li>
              <li>Refresh the page</li>
              <li>Disable VPN if you're using one</li>
              <li>Try again in a few minutes</li>
            </ul>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-2">
          <Button asChild className="w-full">
            <Link href="/">Try Again</Link>
          </Button>
          <Button asChild variant="outline" className="w-full">
            <Link href="/contact">Contact Support</Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
