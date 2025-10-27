import { Navigation } from '@/components/layout/Navigation';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <Navigation userRole="ADMIN" />

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Admin Panel</h1>
          <p className="text-muted-foreground">
            Manage system settings, users, and data imports
          </p>
        </div>
        {children}
      </main>
    </div>
  );
}
