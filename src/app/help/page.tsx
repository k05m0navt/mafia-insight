import Link from 'next/link';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Mail, MessageCircle, ArrowRight } from 'lucide-react';

export default function HelpPage() {
  return (
    <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-foreground mb-4">Help Center</h1>
        <p className="text-lg text-muted-foreground">
          Find answers to common questions and get support
        </p>
      </div>

      <div className="space-y-6 mb-12">
        <Card>
          <CardHeader>
            <CardTitle>Getting Started</CardTitle>
            <CardDescription>Common questions for new users</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">
                How do I create an account?
              </h3>
              <p className="text-sm text-muted-foreground">
                Click the "Sign Up" button in the navigation or visit the signup
                page. You can use email/password or sign in with OAuth providers
                like Google or GitHub.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Is Mafia Insight free?</h3>
              <p className="text-sm text-muted-foreground">
                Yes! Mafia Insight offers a free tier with access to core
                analytics features. You can explore public statistics and create
                an account to track your personal performance.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">
                What data do I need to provide?
              </h3>
              <p className="text-sm text-muted-foreground">
                You only need to provide your email address to create an
                account. Game data can be synced from GoMafia Pro or entered
                manually.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Using Features</CardTitle>
            <CardDescription>Questions about platform features</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">
                How do I sync my game data?
              </h3>
              <p className="text-sm text-muted-foreground">
                Once you're signed in, you can sync your data from GoMafia Pro
                through the import feature in the admin panel. The system will
                automatically import your games, players, and tournament data.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">What is ELO rating?</h3>
              <p className="text-sm text-muted-foreground">
                ELO rating is a numerical representation of your skill level. It
                increases when you win games and decreases when you lose. The
                average starting ELO is 1200.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">
                Can I view statistics for specific roles?
              </h3>
              <p className="text-sm text-muted-foreground">
                Yes! You can filter analytics by role (DON, MAFIA, SHERIFF,
                CITIZEN) to see your performance in each role separately.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Account & Settings</CardTitle>
            <CardDescription>
              Managing your account and preferences
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">
                How do I change my password?
              </h3>
              <p className="text-sm text-muted-foreground">
                Go to your profile settings and use the "Change Password"
                option. You'll need to provide your current password and set a
                new one.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">
                Can I change my email address?
              </h3>
              <p className="text-sm text-muted-foreground">
                Yes, you can update your email address in your profile settings.
                You'll need to verify the new email address before it's
                activated.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">
                How do I delete my account?
              </h3>
              <p className="text-sm text-muted-foreground">
                Contact support to request account deletion. We'll process your
                request and permanently delete your account and data.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-primary" />
              <CardTitle>Contact Support</CardTitle>
            </div>
            <CardDescription>
              Need personalized help? Reach out to our support team.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Send us an email and we'll get back to you as soon as possible.
            </p>
            <Button asChild variant="outline" className="w-full">
              <a href="mailto:support@mafiainsight.com">
                Email Support
                <ArrowRight className="ml-2 h-4 w-4" />
              </a>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5 text-primary" />
              <CardTitle>Community</CardTitle>
            </div>
            <CardDescription>
              Join our community for discussions and tips.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Connect with other players and share strategies.
            </p>
            <Button asChild variant="outline" className="w-full">
              <Link href="/docs">
                View Documentation
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="text-center">
        <p className="text-muted-foreground mb-4">
          Still have questions? We're here to help!
        </p>
        <Button asChild>
          <Link href="/signup">Get Started</Link>
        </Button>
      </div>
    </main>
  );
}
