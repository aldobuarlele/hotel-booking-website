'use client';

import { useState, useEffect } from 'react';
import { Home, Hotel, CalendarDays, MessageSquare, LogOut, Settings, Globe, Wifi } from 'lucide-react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';

export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        // Jika session tidak ada dan pathname bukan /admin/login, redirect ke login
        if (!session && pathname !== '/admin/login') {
          router.push('/admin/login');
          return;
        }

        // Jika sudah di halaman login dan session ada, redirect ke admin dashboard
        if (session && pathname === '/admin/login') {
          router.push('/admin');
          return;
        }

        setIsAuthLoading(false);
      } catch (error) {
        console.error('Auth check error:', error);
        setIsAuthLoading(false);
      }
    };

    checkAuth();

    // Subscribe to auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!session && pathname !== '/admin/login') {
          router.push('/admin/login');
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [router, pathname]);

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      // Clear any local state/cookies
      localStorage.clear();
      sessionStorage.clear();
      
      // Redirect to login page
      router.push('/admin/login');
    } catch (error) {
      console.error('Logout error:', error);
      alert('Gagal logout. Silakan coba lagi.');
    }
  };

  // Tampilkan loading sementara selama pengecekan auth
  if (isAuthLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading Admin...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="w-64 bg-white border-r border-gray-200 p-6 flex flex-col">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-800">Admin Dashboard</h1>
          <p className="text-gray-500 text-sm mt-1">Hotel Booking System</p>
        </div>
        
        <nav className="space-y-2 flex-1">
          <SidebarLink href="/admin" icon={<Home size={20} />} label="Dashboard" />
          <SidebarLink href="/admin/rooms" icon={<Hotel size={20} />} label="Manajemen Kamar" />
          <SidebarLink href="/admin/bookings" icon={<CalendarDays size={20} />} label="Manajemen Reservasi" />
          <SidebarLink href="/admin/chats" icon={<MessageSquare size={20} />} label="Live Chat" />
          <SidebarLink href="/admin/settings" icon={<Settings size={20} />} label="Pengaturan Global" />
          <SidebarLink href="/admin/landing" icon={<Globe size={20} />} label="Landing Page" />
          <SidebarLink href="/admin/amenities" icon={<Wifi size={20} />} label="Fasilitas Kamar" />
        </nav>
        
        <div className="pt-6 border-t border-gray-200">
          <Button 
            variant="outline" 
            className="w-full bg-red-50 border-red-200 text-red-700 hover:bg-red-100 hover:text-red-800"
            onClick={handleLogout}
          >
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Button>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="flex-1 p-8 overflow-auto">
        <div className="max-w-7xl mx-auto">
          {children}
        </div>
      </div>
    </div>
  );
}

function SidebarLink({ href, icon, label }: { href: string; icon: React.ReactNode; label: string }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
    >
      <div className="text-gray-500">
        {icon}
      </div>
      <span className="font-medium">{label}</span>
    </Link>
  );
}