import { Home, Hotel, CalendarDays } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
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
        </nav>
        
        <div className="pt-6 border-t border-gray-200">
          <Button variant="outline" className="w-full">
            Keluar
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