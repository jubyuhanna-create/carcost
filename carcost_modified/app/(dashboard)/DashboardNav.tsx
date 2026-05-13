'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

interface DashboardNavProps {
  email: string;
}

export default function DashboardNav({ email }: DashboardNavProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);

  async function handleLogout() {
    setLoggingOut(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  }

  const isDashboard = pathname === '/dashboard';
  const isCars = pathname.startsWith('/cars');

  return (
    <>
      {/* Desktop top nav */}
      <header className="hidden md:flex items-center justify-between px-6 py-4 border-b border-border bg-bg-surface/80 backdrop-blur-md sticky top-0 z-40">
        <Link href="/dashboard" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-accent/15 border border-accent/30 flex items-center justify-center text-sm">
            🚗
          </div>
          <span className="font-display font-bold text-lg text-text-primary">CarCost</span>
        </Link>

        <nav className="flex items-center gap-1">
          <NavLink href="/dashboard" active={isDashboard}>
            Dashboard
          </NavLink>
          <NavLink href="/cars/new" active={false}>
            + Add Car
          </NavLink>
        </nav>

        <div className="flex items-center gap-3">
          <span className="text-text-muted text-sm">{email}</span>
          <button
            onClick={handleLogout}
            disabled={loggingOut}
            className="text-sm text-text-muted hover:text-text-primary transition-colors px-3 py-1.5 rounded-lg hover:bg-bg-elevated"
          >
            Sign out
          </button>
        </div>
      </header>

      {/* Mobile top bar */}
      <header className="md:hidden flex items-center justify-between px-4 py-3 border-b border-border bg-bg-surface/80 backdrop-blur-md sticky top-0 z-40">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-accent/15 border border-accent/30 flex items-center justify-center text-sm">
            🚗
          </div>
          <span className="font-display font-bold text-base text-text-primary">CarCost</span>
        </Link>
        <button
          onClick={handleLogout}
          disabled={loggingOut}
          className="text-xs text-text-muted hover:text-text-primary transition-colors px-3 py-1.5 rounded-lg hover:bg-bg-elevated"
        >
          Sign out
        </button>
      </header>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-bg-surface/95 backdrop-blur-md border-t border-border safe-bottom">
        <div className="flex items-center justify-around px-4 py-2">
          <MobileNavItem
            href="/dashboard"
            active={isDashboard}
            icon={
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
                <rect x="3" y="3" width="7" height="7" rx="1" />
                <rect x="14" y="3" width="7" height="7" rx="1" />
                <rect x="3" y="14" width="7" height="7" rx="1" />
                <rect x="14" y="14" width="7" height="7" rx="1" />
              </svg>
            }
            label="Dashboard"
          />
          <MobileNavItem
            href="/cars/new"
            active={pathname === '/cars/new'}
            icon={
              <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center shadow-accent-glow -mt-5">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-5 h-5 text-white">
                  <path d="M12 5v14M5 12h14" strokeLinecap="round" />
                </svg>
              </div>
            }
            label="Add Car"
          />
          <MobileNavItem
            href="/dashboard"
            active={false}
            onClick={handleLogout}
            icon={
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
                <path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            }
            label="Sign out"
          />
        </div>
      </nav>
    </>
  );
}

function NavLink({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
        active
          ? 'bg-accent/15 text-accent'
          : 'text-text-muted hover:text-text-primary hover:bg-bg-elevated'
      }`}
    >
      {children}
    </Link>
  );
}

function MobileNavItem({
  href,
  active,
  icon,
  label,
  onClick,
}: {
  href: string;
  active: boolean;
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
}) {
  const content = (
    <div className="flex flex-col items-center gap-0.5 py-1">
      <span className={active ? 'text-accent' : 'text-text-muted'}>{icon}</span>
      <span className={`text-[10px] font-medium ${active ? 'text-accent' : 'text-text-muted'}`}>{label}</span>
    </div>
  );

  if (onClick) {
    return (
      <button onClick={onClick} className="flex-1">
        {content}
      </button>
    );
  }

  return (
    <Link href={href} className="flex-1">
      {content}
    </Link>
  );
}
