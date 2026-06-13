"use client";
import { useAuth } from '@/context/AuthContext';
import DashboardSidebar from '@/components/DashboardSidebar';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated || user?.user_type !== 2) {
        router.push('/login');
      }
    }
  }, [isAuthenticated, user, isLoading, router]);

  if (isLoading || !isAuthenticated || user?.user_type !== 2) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-50">Loading dashboard...</div>;
  }

  return (
    <div className="flex min-h-screen bg-gray-50/30">
      <DashboardSidebar />
      <div className="flex-1 p-8">
        {children}
      </div>
    </div>
  );
}
