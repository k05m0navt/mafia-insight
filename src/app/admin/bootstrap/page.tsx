import { Metadata } from 'next';
import { AdminBootstrapForm } from '@/components/auth/AdminBootstrap';

export const metadata: Metadata = {
  title: 'Admin Bootstrap | Mafia Insight',
  description: 'Create the first administrator account',
};

export default function AdminBootstrapPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 px-4 py-12">
      <div className="w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Admin Bootstrap
          </h1>
          <p className="text-muted-foreground">
            Create the first administrator account to get started
          </p>
        </div>
        <AdminBootstrapForm />
      </div>
    </div>
  );
}
