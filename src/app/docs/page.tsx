import Link from 'next/link';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Book, FileText, HelpCircle, ArrowRight } from 'lucide-react';

export default function DocsPage() {
  return (
    <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-foreground mb-4">
          Documentation
        </h1>
        <p className="text-lg text-muted-foreground">
          Learn how to use Mafia Insight to track and analyze your game
          performance
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Book className="h-5 w-5 text-primary" />
              <CardTitle>Getting Started</CardTitle>
            </div>
            <CardDescription>
              New to Mafia Insight? Start here to learn the basics.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>• Creating your account</li>
              <li>• Setting up your profile</li>
              <li>• Understanding the dashboard</li>
              <li>• Basic navigation</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              <CardTitle>Analytics Guide</CardTitle>
            </div>
            <CardDescription>
              Learn how to interpret and use analytics data.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>• Understanding ELO ratings</li>
              <li>• Reading performance statistics</li>
              <li>• Analyzing win rates</li>
              <li>• Role-specific analytics</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <HelpCircle className="h-5 w-5 text-primary" />
              <CardTitle>FAQ</CardTitle>
            </div>
            <CardDescription>
              Frequently asked questions and answers.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>• How do I sync my game data?</li>
              <li>• What is ELO rating?</li>
              <li>• How are statistics calculated?</li>
              <li>• Can I export my data?</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              <CardTitle>API Documentation</CardTitle>
            </div>
            <CardDescription>
              Technical documentation for developers.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>• API endpoints</li>
              <li>• Authentication</li>
              <li>• Rate limits</li>
              <li>• Example requests</li>
            </ul>
          </CardContent>
        </Card>
      </div>

      <div className="text-center">
        <p className="text-muted-foreground mb-4">
          Need more help? Visit our help page or contact support.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button asChild variant="outline">
            <Link href="/help">
              Help Center
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          <Button asChild>
            <Link href="/signup">Get Started</Link>
          </Button>
        </div>
      </div>
    </main>
  );
}
