export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Admin Panel</h1>
        <p className="text-muted-foreground">
          Manage system settings, users, and data imports
        </p>
      </div>
      {children}
    </div>
  );
}
