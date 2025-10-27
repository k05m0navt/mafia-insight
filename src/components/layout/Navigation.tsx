'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { VisuallyHidden } from '@/components/ui/visually-hidden';
import {
  Menu,
  _X,
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

interface NavigationProps {
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

export function Navigation({ userRole = 'GUEST' }: NavigationProps) {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const menuItems = getNavigationMenu(userRole);

  const Icon = ({ name }: { name: string }) => {
    const IconComponent = iconMap[name as keyof typeof iconMap];
    return IconComponent ? <IconComponent className="h-4 w-4" /> : null;
  };

  const isActive = (href: string) => {
    if (href === '/') {
      return pathname === '/';
    }
    return pathname.startsWith(href);
  };

  const NavItem = ({ item }: { item: any }) => (
    <Link
      href={item.href}
      className={cn(
        'flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors',
        isActive(item.href)
          ? 'bg-primary text-primary-foreground'
          : 'text-muted-foreground hover:text-foreground hover:bg-muted'
      )}
      onClick={() => setIsOpen(false)}
    >
      <Icon name={item.icon} />
      {item.label}
    </Link>
  );

  return (
    <nav className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="h-8 w-8 bg-primary rounded-md flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">
                M
              </span>
            </div>
            <span className="text-xl font-bold">Mafia Insight</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1">
            {menuItems.map((item) => (
              <NavItem key={item.id} item={item} />
            ))}
          </div>

          {/* Mobile Navigation */}
          <div className="md:hidden">
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="sm">
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Open menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-64">
                <VisuallyHidden>
                  <SheetTitle>Navigation Menu</SheetTitle>
                  <SheetDescription>
                    Main navigation menu for the Mafia Insight platform
                  </SheetDescription>
                </VisuallyHidden>
                <div className="flex flex-col gap-4 mt-8">
                  {menuItems.map((item) => (
                    <NavItem key={item.id} item={item} />
                  ))}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </nav>
  );
}
