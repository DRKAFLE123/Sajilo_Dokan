"use client";
import { usePathname } from 'next/navigation';
import Navbar from './Navbar';
import Footer from './Footer';

export default function NavigationWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isDashboard = pathname.startsWith('/dashboard') || pathname.startsWith('/saas-admin');

  return (
    <>
      {!isDashboard && <Navbar />}
      <main className="flex-grow flex flex-col">{children}</main>
      {!isDashboard && !pathname.startsWith('/chat') && <Footer />}
    </>
  );
}
