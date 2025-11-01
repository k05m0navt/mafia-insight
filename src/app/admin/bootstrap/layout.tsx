'use client';

export default function BootstrapLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Bootstrap page should not use AdminLayout
  // It has its own full-page styling
  return <>{children}</>;
}
