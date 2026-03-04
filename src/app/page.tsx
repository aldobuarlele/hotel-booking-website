'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';
import { Hotel, Star, Users, Calendar, MapPin, Loader2, ArrowRight } from 'lucide-react';
import Link from 'next/link';

type Room = {
  id: number;
  name: string;
  description: string | null;
  price: number;
  quota: number;
  photo_path: string;
  status: 'AVAILABLE' | 'TEMPORARILY_RESERVED' | 'INQUIRY_ONLY';
};

export default function HomePage() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRooms();
  }, []);

  const fetchRooms = async () => {
    try {
      // Fetch only available rooms with quota > 0
      const { data, error } = await supabase
        .from('rooms')
        .select('*')
        .eq('status', 'AVAILABLE')
        .gt('quota', 0)
        .order('price', { ascending: true });

      if (error) throw error;
      setRooms(data || []);
    } catch (error) {
      console.error('Error fetching rooms:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        {/* Hero Section */}
        <div className="relative bg-gradient-to-r from-blue-600 to-indigo-700 text-white py-20">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Hotel Booking System</h1>
            <p className="text-xl text-blue-100 max-w-2xl mx-auto">
              Temukan penginapan terbaik dengan fasilitas lengkap dan harga terjangkau
            </p>
          </div>
        </div>

        {/* Loading State */}
        <div className="container mx-auto px-4 py-12">
          <div className="flex justify-center items-center min-h-[400px]">
            <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-r from-blue-600 to-indigo-700 text-white py-20">
        <div className="container mx-auto px-4 text-center">
          <div className="flex justify-center mb-6">
            <Hotel className="h-16 w-16" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Hotel Booking System</h1>
          <p className="text-xl text-blue-100 max-w-2xl mx-auto mb-8">
            Temukan penginapan terbaik dengan fasilitas lengkap dan harga terjangkau
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg px-6 py-3 flex items-center gap-2">
              <Star className="h-5 w-5 text-yellow-300" />
              <span>Bersertifikat</span>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg px-6 py-3 flex items-center gap-2">
              <Users className="h-5 w-5" />
              <span>Ramah Keluarga</span>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg px-6 py-3 flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              <span>Booking Instan</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-12 flex-1">
        {/* Header */}
        <div className="mb-10 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-3">Katalog Kamar Tersedia</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Pilih kamar yang sesuai dengan kebutuhan Anda. Semua kamar dilengkapi dengan fasilitas terbaik 
            dan harga yang kompetitif.
          </p>
        </div>

        {/* Room Grid */}
        {rooms.length === 0 ? (
          <div className="text-center py-16">
            <div className="bg-gray-100 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-6">
              <Hotel className="h-12 w-12 text-gray-400" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">Tidak ada kamar tersedia</h3>
            <p className="text-gray-600 max-w-md mx-auto mb-8">
              Maaf, saat ini semua kamar sudah dipesan. Silakan coba lagi nanti.
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {rooms.map((room) => (
                <Card key={room.id} className="overflow-hidden hover:shadow-lg transition-shadow duration-300">
                  {/* Room Image */}
                  <div className="relative h-48 overflow-hidden">
                    {room.photo_path ? (
                      <img
                        src={room.photo_path}
                        alt={room.name}
                        className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-blue-100 to-indigo-200 flex items-center justify-center">
                        <Hotel className="h-16 w-16 text-blue-400" />
                      </div>
                    )}
                    <div className="absolute top-4 right-4">
                      <span className="bg-green-600 text-white text-xs font-semibold px-3 py-1 rounded-full">
                        {room.quota} tersedia
                      </span>
                    </div>
                  </div>

                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-xl">{room.name}</CardTitle>
                        <div className="flex items-center gap-2 mt-1">
                          <MapPin className="h-4 w-4 text-gray-400" />
                          <span className="text-sm text-gray-500">Hotel Central</span>
                        </div>
                      </div>
                      <div className="flex items-center bg-yellow-50 px-3 py-1 rounded-full">
                        <Star className="h-4 w-4 text-yellow-500 fill-current" />
                        <span className="text-sm font-semibold ml-1">4.8</span>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent>
                    <p className="text-gray-600 line-clamp-2 mb-4">
                      {room.description || 'Kamar nyaman dengan fasilitas lengkap untuk kenyamanan Anda.'}
                    </p>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-2xl font-bold text-blue-700">{formatCurrency(room.price)}</div>
                        <div className="text-sm text-gray-500">per malam</div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-gray-500">Kuota</div>
                        <div className="font-semibold">{room.quota} kamar</div>
                      </div>
                    </div>
                  </CardContent>

                  <CardFooter className="pt-4 border-t">
                    <Link href={`/rooms/${room.id}`} className="w-full">
                      <Button className="w-full bg-blue-600 hover:bg-blue-700">
                        Lihat Detail
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </Link>
                  </CardFooter>
                </Card>
              ))}
            </div>

            {/* Stats */}
            <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-blue-50 p-6 rounded-xl">
                <div className="flex items-center gap-4">
                  <div className="bg-blue-100 p-3 rounded-full">
                    <Hotel className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900">{rooms.length}</h3>
                    <p className="text-gray-600">Kamar Tersedia</p>
                  </div>
                </div>
              </div>
              <div className="bg-green-50 p-6 rounded-xl">
                <div className="flex items-center gap-4">
                  <div className="bg-green-100 p-3 rounded-full">
                    <Users className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900">
                      {rooms.reduce((sum, room) => sum + room.quota, 0)}
                    </h3>
                    <p className="text-gray-600">Total Kuota</p>
                  </div>
                </div>
              </div>
              <div className="bg-purple-50 p-6 rounded-xl">
                <div className="flex items-center gap-4">
                  <div className="bg-purple-100 p-3 rounded-full">
                    <Calendar className="h-6 w-6 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900">
                      {formatCurrency(Math.min(...rooms.map(r => r.price)))}
                    </h3>
                    <p className="text-gray-600">Harga Termurah</p>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* CTA Section */}
        <div className="mt-20 text-center">
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-10">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Siap untuk Menginap?</h2>
            <p className="text-gray-600 max-w-2xl mx-auto mb-8">
              Booking kamar favorit Anda sekarang dan nikmati pengalaman menginap yang tak terlupakan.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link href="/admin">
                <Button variant="outline" size="lg">
                  Panel Admin
                </Button>
              </Link>
              <Link href="#katalog">
                <Button size="lg" className="bg-blue-600 hover:bg-blue-700">
                  Lihat Semua Kamar
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-10">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-6 md:mb-0">
              <div className="flex items-center gap-2 mb-4">
                <Hotel className="h-8 w-8" />
                <span className="text-xl font-bold">Hotel Booking</span>
              </div>
              <p className="text-gray-400">Solusi booking hotel terpercaya sejak 2024</p>
            </div>
            <div className="text-center md:text-right">
              <p className="text-gray-400">© 2024 Hotel Booking System. All rights reserved.</p>
              <p className="text-gray-400 mt-2">Kontak: info@hotelbooking.com | 021-12345678</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}