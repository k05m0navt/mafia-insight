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
            <nav className="flex-1 p-4">
              <div className="space-y-2">
                {menuItems.map((item) => (
                  <Link
                    key={item.id}
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
