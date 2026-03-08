'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Loader2, Hotel, Lock, Mail } from 'lucide-react';

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      // Successfully logged in, redirect to admin dashboard
      router.push('/admin');
    } catch (error: unknown) {
      console.error('Login error:', error);
      setError((error instanceof Error) ? error.message : 'Login gagal. Periksa email dan password Anda.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo/Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-full mb-4">
            <Hotel className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Hotel Booking Admin</h1>
          <p className="text-gray-600">Masuk ke dashboard administrator</p>
        </div>

        {/* Login Card */}
        <Card className="shadow-lg border-gray-200">
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2">
              <Lock className="h-5 w-5" />
              Login Admin
            </CardTitle>
            <CardDescription>
              Masukkan email dan password untuk mengakses dashboard
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleLogin}>
            <CardContent className="space-y-4">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="admin@hotel.com"
                    className="pl-10"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    className="pl-10"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="text-sm text-gray-500">
                <p>
                  Demo credentials (sesuaikan dengan akun Supabase Auth Anda):
                </p>
                <p className="font-mono text-xs mt-1 bg-gray-100 p-2 rounded">
                  Email: admin@hotel.com<br />
                  Password: admin123
                </p>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-4">
              <Button 
                type="submit" 
                className="w-full bg-blue-600 hover:bg-blue-700"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sedang Login...
                  </>
                ) : (
                  'Login'
                )}
              </Button>

              <div className="text-center text-sm text-gray-500">
                <p>
                  Pastikan Anda telah membuat user admin di Supabase Auth
                  dan mengatur environment variables dengan benar.
                </p>
              </div>
            </CardFooter>
          </form>
        </Card>

        {/* Instructions */}
        <div className="mt-8 text-sm text-gray-600 bg-white/50 backdrop-blur-sm p-4 rounded-lg border border-gray-200">
          <h3 className="font-semibold mb-2">Cara Setup:</h3>
          <ol className="list-decimal pl-5 space-y-1">
            <li>Buat user admin di Supabase Auth Dashboard</li>
            <li>Tambahkan email dan password di .env.local jika perlu</li>
            <li>Pastikan Supabase Realtime sudah diaktifkan untuk tabel chat_messages</li>
          </ol>
        </div>
      </div>
    </div>
  );
}