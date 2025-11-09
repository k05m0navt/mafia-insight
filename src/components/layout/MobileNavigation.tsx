'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import {
  Menu,
  Home,
  Users,
  Trophy,
  Building2,
  Gamepad2,
  Activity,
  Settings,
  LayoutDashboard,
  Database,
  Lock,
} from 'lucide-react';
import { getNavigationMenu, UserRole } from '@/lib/navigation';
import { cn } from '@/lib/utils';

interface MobileNavigationProps {
  userRole?: UserRole;
}

const iconMap = {
  Home,
  Users,
  Trophy,
  Building2,
  Gamepad2,
  Activity,
  Settings,
  LayoutDashboard,
  Database,
  Lock,
};

export function MobileNavigation({
  userRole = 'guest',
}: MobileNavigationProps) {
  const pathname = usePathname();
  const menuItems = getNavigationMenu(userRole);

  const Icon = ({ name }: { name?: string }) => {
    if (!name) return null;
    const IconComponent = iconMap[name as keyof typeof iconMap];
    return IconComponent ? <IconComponent className="h-5 w-5" /> : null;
  };

  const isActive = (href: string) => {
    if (href === '/') {
      return pathname === '/';
    }
    return pathname.startsWith(href);
  };

  return (
    <div className="md:hidden">
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="ghost" size="sm" className="p-2">
            <Menu className="h-6 w-6" />
            <span className="sr-only">Open navigation menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-72">
          <div className="flex flex-col h-full">
            {/* Logo */}
            <div className="flex items-center gap-2 p-4 border-b">
              <div className="h-8 w-8 bg-primary rounded-md flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-sm">
                  M
                </span>
              </div>
              <span className="text-lg font-bold">Mafia Insight</span>
            </div>

            {/* Navigation Items */}
            <nav className="flex-1 p-4 overflow-y-auto">
              <div className="space-y-1">
                {menuItems.map((item) => (
                  <div key={item.id}>
                    <Link
                      href={item.path}
                      className={cn(
                        'flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-colors',
                        isActive(item.path)
                          ? 'bg-primary text-primary-foreground'
                          : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                      )}
                    >
                      <Icon name={item.icon} />
                      {item.label}
                    </Link>
                    {item.children && item.children.length > 0 && (
                      <div className="ml-6 mt-1 space-y-1 border-l pl-3">
                        {item.children.map((child) => (
                          <Link
                            key={child.id}
                            href={child.path}
                            className={cn(
                              'flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors',
                              isActive(child.path)
                                ? 'bg-primary/10 text-primary font-medium'
                                : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                            )}
                          >
                            <Icon name={child.icon} />
                            {child.label}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </nav>

            {/* Footer */}
            <div className="p-4 border-t">
              <p className="text-xs text-muted-foreground text-center">
                Mafia Insight v1.0
              </p>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
