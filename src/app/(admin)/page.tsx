import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Users,
  Database,
  Settings,
  Activity,
  Shield,
  BarChart3,
} from 'lucide-react';

export default function AdminPage() {
  const adminFeatures = [
    {
      title: 'User Management',
      description: 'Manage user accounts, roles, and permissions',
      icon: Users,
      href: '/admin/users',
      status: 'active',
    },
    {
      title: 'Data Import',
      description: 'Import and sync data from GoMafia',
      icon: Database,
      href: '/import',
      status: 'active',
    },
    {
      title: 'System Settings',
      description: 'Configure system-wide settings and preferences',
      icon: Settings,
      href: '/admin/settings',
      status: 'coming-soon',
    },
    {
      title: 'Activity Monitor',
      description: 'Monitor system activity and performance',
      icon: Activity,
      href: '/admin/activity',
      status: 'coming-soon',
    },
    {
      title: 'Security Audit',
      description: 'Review security logs and access patterns',
      icon: Shield,
      href: '/admin/security',
      status: 'coming-soon',
    },
    {
      title: 'Analytics Dashboard',
      description: 'Advanced analytics and reporting tools',
      icon: BarChart3,
      href: '/admin/analytics',
      status: 'coming-soon',
    },
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800">Active</Badge>;
      case 'coming-soon':
        return <Badge variant="secondary">Coming Soon</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {adminFeatures.map((feature) => {
          const Icon = feature.icon;
          return (
            <Card
              key={feature.title}
              className="hover:shadow-lg transition-shadow"
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <CardTitle className="text-lg">{feature.title}</CardTitle>
                  </div>
                  {getStatusBadge(feature.status)}
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm mb-4">
                  {feature.description}
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  disabled={feature.status === 'coming-soon'}
                >
                  {feature.status === 'coming-soon' ? 'Coming Soon' : 'Access'}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>System Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">Online</div>
              <div className="text-sm text-muted-foreground">System Status</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">99.9%</div>
              <div className="text-sm text-muted-foreground">Uptime</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">1.2s</div>
              <div className="text-sm text-muted-foreground">Avg Response</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
