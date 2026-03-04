import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Hotel } from 'lucide-react';

export default function Header() {
  return (
    <header className="bg-white border-b shadow-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 text-gray-900 hover:text-gray-700 transition-colors">
            <div className="bg-blue-600 p-2 rounded-lg">
              <Hotel className="h-6 w-6 text-white" />
            </div>
            <span className="text-xl font-bold">LuxuryStay</span>
          </Link>

          {/* Admin Login Button */}
          <Link href="/admin/login">
            <Button className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-lg px-6">
              Admin Login
            </Button>
          </Link>
        </div>
      </div>
    </header>
  );
}