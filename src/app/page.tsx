import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { roleColors, featureColors } from '@/lib/constants/colors';

export default function Home() {
  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      {/* Hero Section */}
      <div className="text-center mb-16">
        <h1 className="text-5xl font-bold text-slate-900 dark:text-slate-100 mb-6">
          Mafia Insight
        </h1>
        <p className="text-xl text-slate-600 dark:text-slate-400 mb-8 max-w-3xl mx-auto">
          Comprehensive analytics platform for Sport Mafia game players, teams,
          and tournaments. Track your performance, analyze trends, and dominate
          the game.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button asChild size="lg" className="text-lg px-8 py-3">
            <Link href="/players">View Players</Link>
          </Button>
          <Button
            asChild
            variant="outline"
            size="lg"
            className="text-lg px-8 py-3"
          >
            <Link href="/clubs">Explore Clubs</Link>
          </Button>
        </div>
      </div>

      {/* Features Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
        <Card className="text-center">
          <CardHeader>
            <CardTitle className="flex items-center justify-center gap-2">
              <Badge className={`${featureColors.PLAYER.primary} text-white`}>
                Player
              </Badge>
              Player Analytics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-slate-600 dark:text-slate-400">
              Track your performance across different roles with detailed
              statistics, ELO ratings, and win rates.
            </p>
          </CardContent>
        </Card>

        <Card className="text-center">
          <CardHeader>
            <CardTitle className="flex items-center justify-center gap-2">
              <Badge className={`${featureColors.TEAM.primary} text-white`}>
                Team
              </Badge>
              Team Analytics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-slate-600 dark:text-slate-400">
              Monitor your club's performance with team statistics, member
              rankings, and collaborative insights.
            </p>
          </CardContent>
        </Card>

        <Card className="text-center">
          <CardHeader>
            <CardTitle className="flex items-center justify-center gap-2">
              <Badge
                className={`${featureColors.TOURNAMENT.primary} text-white`}
              >
                Tournament
              </Badge>
              Tournament Analytics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-slate-600 dark:text-slate-400">
              Follow live tournament updates, track brackets, and analyze
              tournament performance.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Role Performance Section */}
      <div className="text-center mb-16">
        <h2 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-8">
          Master Every Role
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
          <Card className="p-4">
            <div className="text-center">
              <Badge className={`${roleColors.DON.primary} text-white mb-2`}>
                DON
              </Badge>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Lead the mafia team to victory
              </p>
            </div>
          </Card>
          <Card className="p-4">
            <div className="text-center">
              <Badge className={`${roleColors.MAFIA.primary} text-white mb-2`}>
                MAFIA
              </Badge>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Execute strategic eliminations
              </p>
            </div>
          </Card>
          <Card className="p-4">
            <div className="text-center">
              <Badge
                className={`${roleColors.SHERIFF.primary} text-black mb-2`}
              >
                SHERIFF
              </Badge>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Investigate and protect the town
              </p>
            </div>
          </Card>
          <Card className="p-4">
            <div className="text-center">
              <Badge
                className={`${roleColors.CITIZEN.primary} text-white mb-2`}
              >
                CITIZEN
              </Badge>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Vote wisely to survive
              </p>
            </div>
          </Card>
        </div>
      </div>

      {/* CTA Section */}
      <div className="text-center">
        <h2 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-4">
          Ready to Analyze Your Game?
        </h2>
        <p className="text-lg text-slate-600 dark:text-slate-400 mb-8">
          Join thousands of players who are already improving their game with
          Mafia Insight.
        </p>
        <Button asChild size="lg" className="text-lg px-8 py-3">
          <Link href="/players">Get Started</Link>
        </Button>
      </div>
    </main>
  );
}
