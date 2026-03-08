'use client';

import { DB_TABLES, DEFAULT_LOCALE, ROOM_STATUS } from '@/lib/config';
import { getGlobalSettings, getLandingPageContent } from '@/lib/cms';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/lib/supabase';
import { 
  Hotel, Star, Users, Calendar, MapPin, Loader2, ArrowRight, 
  Wifi, Tv, Coffee, Wind, Droplets, Car, Dumbbell, Utensils,
  Search, ChevronRight, Shield, Clock, Award, Heart
} from 'lucide-react';
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

// Helper function to clean HTML from database (replace className with class for proper HTML rendering)
const cleanHtmlForRender = (html: string): string => {
  if (!html) return '';
  // Replace className with class for HTML compatibility
  return html.replace(/className=/g, 'class=');
};

export default function HomePage() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [globalSettings, setGlobalSettings] = useState<any>(null);
  const [heroContent, setHeroContent] = useState<any>(null);
  const [searchDates, setSearchDates] = useState({
    checkIn: '',
    checkOut: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch rooms
      const { data: roomsData, error: roomsError } = await supabase
        .from(DB_TABLES.ROOMS)
        .select('*')
        .eq('status', ROOM_STATUS.AVAILABLE)
        .gt('quota', 0)
        .order('price', { ascending: true });

      if (roomsError) throw roomsError;
      setRooms(roomsData || []);

      // Fetch global settings
      const settings = await getGlobalSettings();
      setGlobalSettings(settings);

      // Fetch hero content
      const hero = await getLandingPageContent('HERO');
      setHeroContent(hero);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat(DEFAULT_LOCALE, {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getOriginalPrice = (price: number) => {
    return Math.round(price * 1.3); // Harga asli 30% lebih tinggi untuk efek diskon
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 text-white min-h-[60vh] overflow-hidden">
        {/* Overlay Pattern */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBkPSJNMCAwaDUwdjUwSDB6TTUwIDUwaDUwdjUwSDUweiIgZmlsbD0icmdiYSgyNTUsMjU1LDI1NSwwLjA1KSIvPjwvc3ZnPg==')] opacity-20"></div>
        
        <div className="container mx-auto px-4 py-24 relative z-10 h-full flex items-center">
          <div className="max-w-4xl mx-auto text-center w-full">
            {/* Judul Hero */}
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
              {heroContent?.title ? (
                <div dangerouslySetInnerHTML={{ __html: cleanHtmlForRender(heroContent.title) }} />
              ) : (
                <>
                  Temukan Pengalaman{' '}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-300 to-cyan-300">Menginap Terbaik</span>
                </>
              )}
            </h1>
            
            {/* Subtitle Hero */}
            <div className="text-lg text-blue-200 max-w-2xl mx-auto mb-10">
              {heroContent?.subtitle ? (
                <div dangerouslySetInnerHTML={{ __html: cleanHtmlForRender(heroContent.subtitle) }} />
              ) : (
                'Jelajahi koleksi kamar eksklusif dengan fasilitas premium dan layanan bintang lima.'
              )}
            </div>
          </div>
        </div>
        
        {/* Wave Decoration */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1200 120" preserveAspectRatio="none" className="w-full h-auto">
            <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V0H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z" fill="white"></path>
          </svg>
        </div>
      </div>

      {/* Floating Search Widget */}
      <div className="relative z-20 -mt-16 mx-auto max-w-4xl mb-12">
        <div className="bg-white rounded-2xl shadow-2xl p-6 md:p-8 mx-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Check-in Date */}
            <div className="relative">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                <Calendar className="inline h-4 w-4 mr-1" />
                Check-in
              </label>
              <Input
                type="date"
                className="pl-4 pr-4 py-3 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={searchDates.checkIn}
                onChange={(e) => setSearchDates({...searchDates, checkIn: e.target.value})}
              />
            </div>
            
            {/* Check-out Date */}
            <div className="relative">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                <Calendar className="inline h-4 w-4 mr-1" />
                Check-out
              </label>
              <Input
                type="date"
                className="pl-4 pr-4 py-3 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={searchDates.checkOut}
                onChange={(e) => setSearchDates({...searchDates, checkOut: e.target.value})}
              />
            </div>
            
            {/* Search Button */}
            <div className="flex items-end">
              <Button 
                className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white py-3 rounded-xl text-lg font-semibold"
                size="lg"
              >
                <Search className="mr-2 h-5 w-5" />
                Cari Kamar
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Katalog Kamar Enterprise */}
      <div className="container mx-auto px-4 py-12">
        {/* Header Katalog */}
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Kamar <span className="text-blue-600">Premium</span> Terpopuler
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto text-lg">
            Pilih dari koleksi kamar mewah kami yang dilengkapi dengan fasilitas terbaik untuk pengalaman menginap yang tak terlupakan.
          </p>
        </div>

        {/* Room Grid */}
        {rooms.length === 0 ? (
          <div className="text-center py-16 bg-gray-50 rounded-2xl">
            <div className="bg-white rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-6 shadow-lg">
              <Hotel className="h-12 w-12 text-gray-400" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">Tidak ada kamar tersedia</h3>
            <p className="text-gray-600 max-w-md mx-auto mb-8">
              Maaf, saat ini semua kamar sudah dipesan. Silakan coba lagi nanti.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {rooms.map((room) => (
              <Card 
                key={room.id} 
                className="overflow-hidden hover:shadow-2xl transition-all duration-300 border-0 rounded-2xl group hover:-translate-y-2"
              >
                {/* Room Image dengan Overlay */}
                <div className="relative h-56 overflow-hidden">
                  {room.photo_path ? (
                    <img
                      src={room.photo_path}
                      alt={room.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                      <Hotel className="h-20 w-20 text-white opacity-80" />
                    </div>
                  )}
                  
                  {/* Overlay Gradient */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                  
                  {/* Badge Kuota */}
                  <div className="absolute top-4 left-4">
                    {room.quota < 3 ? (
                      <Badge className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 text-sm font-bold">
                        ⚠️ Sisa {room.quota} Kamar!
                      </Badge>
                    ) : (
                      <Badge className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 text-sm font-bold">
                        ✅ Tersedia
                      </Badge>
                    )}
                  </div>
                </div>

                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-xl font-bold text-gray-900">{room.name}</CardTitle>
                      <div className="flex items-center gap-2 mt-1">
                        <MapPin className="h-4 w-4 text-gray-400" />
                        <span className="text-sm text-gray-500">Hotel Central, Jakarta</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Facilities Icons */}
                  <div className="flex gap-2 mt-3">
                    {[Wifi, Tv, Wind, Droplets].map((Icon, index) => (
                      <div key={index} className="bg-blue-50 p-2 rounded-lg">
                        <Icon className="h-4 w-4 text-blue-600" />
                      </div>
                    ))}
                  </div>
                </CardHeader>

                <CardContent className="pb-3">
                  <p className="text-gray-600 line-clamp-2 mb-4 text-sm">
                    {room.description || 'Kamar mewah dengan desain modern dan fasilitas lengkap untuk kenyamanan maksimal.'}
                  </p>
                  
                  {/* Pricing Section dengan Diskon */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl font-bold text-blue-700">
                        {formatCurrency(room.price)}
                      </span>
                      <span className="text-sm text-gray-500">/malam</span>
                    </div>
                    
                    {/* Harga Coret (Original Price) */}
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-400 line-through">
                        {formatCurrency(getOriginalPrice(room.price))}
                      </span>
                      <Badge className="bg-green-100 text-green-800 hover:bg-green-200 text-xs">
                        -30%
                      </Badge>
                    </div>
                    
                    {/* Tax & Fees Info */}
                    <div className="text-xs text-gray-500">
                      Termasuk pajak & biaya layanan
                    </div>
                  </div>
                </CardContent>

                <CardFooter className="pt-3 border-t border-gray-100">
                  <Link href={`/rooms/${room.id}`} className="w-full">
                    <Button className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-xl py-6 font-semibold">
                      Pilih Kamar
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                  </Link>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Hotel className="h-6 w-6 text-blue-400" />
              <span className="text-xl font-bold">{globalSettings?.hotel_name || 'LuxuryStay'}</span>
            </div>
            <div className="text-gray-400 text-center text-sm">
              <p>© 2024 {globalSettings?.hotel_name || 'LuxuryStay'}. All rights reserved.</p>
              <p className="mt-1">Platform booking hotel premium</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}