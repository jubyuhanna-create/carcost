import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import DashboardNav from './DashboardNav';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  return (
    <div className="min-h-screen min-h-dvh bg-bg-base flex flex-col">
      <DashboardNav email={user.email ?? ''} />
      <main className="flex-1 pb-24 md:pb-8">
        {children}
      </main>
    </div>
  );
}
