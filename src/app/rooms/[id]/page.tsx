'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { supabase } from '@/lib/supabase';
import { BANK_ACCOUNT_NUMBER, DB_TABLES, DEFAULT_LOCALE, ROOM_STATUS } from '@/lib/config';
import { toastError, toastSuccess, toastWarning, toastInfo } from '@/lib/toast';
import { 
  Hotel, Star, MapPin, Calendar, Users, ArrowLeft, Loader2, Check, 
  User, Mail, Phone, CreditCard, MessageCircle, ChevronRight,
  Wifi, Tv, Wind, Droplets, Coffee, Car, Dumbbell, Utensils,
  Shield, Clock, Award, Heart, Bed, Bath, Thermometer,
  Maximize, Eye, Share2, Bookmark
} from 'lucide-react';
import Link from 'next/link';
import ChatRoom from '@/components/ChatRoom';

type Room = {
  id: number;
  name: string;
  description: string | null;
  price: number;
  quota: number;
  photo_path: string;
  status: 'AVAILABLE' | 'TEMPORARILY_RESERVED' | 'INQUIRY_ONLY';
};

type BookingFormData = {
  guest_name: string;
  guest_email: string;
  guest_phone: string;
  check_in_date: string;
  check_out_date: string;
};

export default function RoomDetailPage() {
  const params = useParams();
  const router = useRouter();
  const roomId = params?.id ? parseInt(params.id as string) : null;
  
  const [room, setRoom] = useState<Room | null>(null);
  const [loading, setLoading] = useState(true);
  const [isBookingDialogOpen, setIsBookingDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showChatRoom, setShowChatRoom] = useState(false);
  const [bookingForm, setBookingForm] = useState<BookingFormData>({
    guest_name: '',
    guest_email: '',
    guest_phone: '',
    check_in_date: '',
    check_out_date: '',
  });
  const [totalNights, setTotalNights] = useState(1);
  const [totalPrice, setTotalPrice] = useState(0);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  useEffect(() => {
    if (roomId) {
      fetchRoom();
    }
  }, [roomId]);

  useEffect(() => {
    if (bookingForm.check_in_date && bookingForm.check_out_date && room) {
      const checkIn = new Date(bookingForm.check_in_date);
      const checkOut = new Date(bookingForm.check_out_date);
      const nights = Math.max(1, Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24)));
      setTotalNights(nights);
      setTotalPrice(room.price * nights);
    }
  }, [bookingForm.check_in_date, bookingForm.check_out_date, room]);

  const fetchRoom = async () => {
    try {
      const { data, error } = await supabase
        .from(DB_TABLES.ROOMS)
        .select('*')
        .eq('id', roomId)
        .single();

      if (error) throw error;
      setRoom(data);
    } catch (error) {
      console.error('Error fetching room:', error);
      setRoom(null);
    } finally {
      setLoading(false);
    }
  };

  const handleBookingInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setBookingForm(prev => ({ ...prev, [name]: value }));
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setBookingForm(prev => ({ ...prev, [name]: value }));

    // Auto-adjust check-out date if it's before check-in
    if (name === 'check_out_date' && bookingForm.check_in_date) {
      const checkIn = new Date(bookingForm.check_in_date);
      const checkOut = new Date(value);
      
      if (checkOut <= checkIn) {
        const nextDay = new Date(checkIn);
        nextDay.setDate(nextDay.getDate() + 1);
        const adjustedCheckOut = nextDay.toISOString().split('T')[0];
        setBookingForm(prev => ({ ...prev, check_out_date: adjustedCheckOut }));
      }
    }
  };

  const checkOverlap = async (checkInDate: string, checkOutDate: string): Promise<number> => {
    if (!roomId) return 0;
    
    try {
      const { data, error } = await supabase
        .from(DB_TABLES.BOOKINGS)
        .select('id')
        .eq('room_id', roomId)
        .or(`and(check_in_date.lte.${checkOutDate},check_out_date.gte.${checkInDate})`);

      if (error) throw error;
      return data?.length || 0;
    } catch (error) {
      console.error('Error checking overlap:', error);
      return 0;
    }
  };

  const handleSubmitBooking = async () => {
    if (!room || !roomId) return;

    // Validate form
    if (!bookingForm.guest_name || !bookingForm.guest_email || !bookingForm.check_in_date || !bookingForm.check_out_date) {
      toastWarning('Harap isi semua field wajib (nama, email, tanggal check-in/out)');
      return;
    }

    // Validate date range
    const checkIn = new Date(bookingForm.check_in_date);
    const checkOut = new Date(bookingForm.check_out_date);
    
    if (checkOut <= checkIn) {
      toastWarning('Tanggal check-out harus setelah tanggal check-in.');
      return;
    }

    setIsSubmitting(true);

    try {
      // Check for overbooking
      const overlappingBookingsCount = await checkOverlap(
        bookingForm.check_in_date,
        bookingForm.check_out_date
      );

      if (overlappingBookingsCount >= room.quota) {
        toastError(`Maaf, kamar ini sudah penuh pada tanggal tersebut. Sudah ada ${overlappingBookingsCount} booking yang overlap dengan kuota ${room.quota}.`);
        setIsSubmitting(false);
        return;
      }

      // Generate account number
      const accountNumber = `BOOK-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

      // Create booking
      const bookingData = {
        room_id: roomId,
        guest_name: bookingForm.guest_name,
        guest_email: bookingForm.guest_email,
        guest_phone: bookingForm.guest_phone || null,
        check_in_date: bookingForm.check_in_date,
        check_out_date: bookingForm.check_out_date,
        account_number: accountNumber,
        total_price: totalPrice,
        payment_status: 'PENDING' as const,
      };

      const { error } = await supabase
        .from(DB_TABLES.BOOKINGS)
        .insert(bookingData);

      if (error) throw error;

      // Success
      setIsBookingDialogOpen(false);
      setBookingForm({
        guest_name: '',
        guest_email: '',
        guest_phone: '',
        check_in_date: '',
        check_out_date: '',
      });

      toastSuccess(
        `Booking berhasil dibuat!\n\n` +
        `Detail Booking:\n` +
        `- Nomor Booking: ${accountNumber}\n` +
        `- Kamar: ${room.name}\n` +
        `- Tanggal: ${new Date(bookingForm.check_in_date).toLocaleDateString(DEFAULT_LOCALE)} - ${new Date(bookingForm.check_out_date).toLocaleDateString(DEFAULT_LOCALE)}\n` +
        `- Total: Rp ${totalPrice.toLocaleString(DEFAULT_LOCALE)}\n\n` +
        `Silakan transfer ke:\n${BANK_ACCOUNT_NUMBER}\n\n` +
        `Konfirmasi pembayaran akan diproses dalam 1x24 jam.`
      );

      // Redirect to home
      router.push('/');
    } catch (error) {
      console.error('Error creating booking:', error);
      toastError('Gagal membuat booking. Silakan coba lagi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSoftBooking = async () => {
    if (!room || !roomId) return;
    
    try {
      // Update room status to TEMPORARILY_RESERVED
      const { error } = await supabase
        .from(DB_TABLES.ROOMS)
        .update({ status: ROOM_STATUS.TEMPORARILY_RESERVED })
        .eq('id', roomId);

      if (error) throw error;

      // Update local state
      setRoom({ ...room, status: ROOM_STATUS.TEMPORARILY_RESERVED });
      
      // Show chat room
      setShowChatRoom(true);
      
      toastSuccess('Kamar telah ditandai sebagai sementara dipesan. Silakan chat dengan admin untuk konfirmasi lebih lanjut.');
    } catch (error) {
      console.error('Error updating room status:', error);
      toastError('Gagal memulai chat dengan admin. Silakan coba lagi.');
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

  // Dummy room images
  const roomImages = [
    room?.photo_path || 'https://images.unsplash.com/photo-1611892440504-42a792e24d32?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1584132967334-10e028bd69f7?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1590490360182-c33d57733427?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1566665797739-1674de7a421a?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80',
  ];

  const facilityIcons = [
    { icon: Wifi, label: 'WiFi Gratis' },
    { icon: Tv, label: 'TV LED 42"' },
    { icon: Wind, label: 'AC' },
    { icon: Droplets, label: 'Kamar Mandi Pribadi' },
    { icon: Coffee, label: 'Coffee Maker' },
    { icon: Bed, label: 'King Size Bed' },
    { icon: Bath, label: 'Bathtub' },
    { icon: Car, label: 'Parkir Gratis' },
    { icon: Dumbbell, label: 'Akses Gym' },
    { icon: Utensils, label: 'Restoran 24 Jam' },
    { icon: Thermometer, label: 'Heating' },
    { icon: Shield, label: 'Safe Deposit Box' },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Memuat detail kamar...</p>
        </div>
      </div>
    );
  }

  if (!room) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="container mx-auto px-4 py-16 text-center">
          <div className="bg-white rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-6 shadow-lg">
            <Hotel className="h-12 w-12 text-gray-400" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Kamar Tidak Ditemukan</h1>
          <p className="text-gray-600 mb-8">Kamar yang Anda cari tidak tersedia atau sudah tidak aktif.</p>
          <Link href="/">
            <Button className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Kembali ke Katalog
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      {/* Simple Header */}
      <div className="bg-white border-b shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2 text-gray-700 hover:text-gray-900 transition-colors">
              <ArrowLeft className="h-5 w-5" />
              <span className="font-medium">Kembali ke Beranda</span>
            </Link>
            <div className="flex items-center gap-2">
              <div className="bg-blue-600 p-2 rounded-lg">
                <Hotel className="h-6 w-6 text-white" />
              </div>
              <span className="font-bold text-gray-900">LuxuryStay</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - 2/3 width for Room Details */}
          <div className="lg:col-span-2 space-y-8">
            {/* Room Header */}
            <div>
              <div className="flex flex-wrap items-center justify-between mb-4">
                <div>
                  <h1 className="text-3xl lg:text-4xl font-bold text-gray-900">{room.name}</h1>
                  <div className="flex items-center gap-4 mt-2">
                    <div className="flex items-center gap-1">
                      <MapPin className="h-5 w-5 text-gray-400" />
                      <span className="text-gray-600">Hotel Central, Jakarta</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Star className="h-5 w-5 text-yellow-500 fill-current" />
                      <span className="font-bold">4.8</span>
                      <span className="text-gray-500">(128 reviews)</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4 mt-4 lg:mt-0">
                  <Badge className="bg-green-100 text-green-800 hover:bg-green-200">
                    {room.quota > 0 ? `${room.quota} Tersedia` : 'Penuh'}
                  </Badge>
                  <Badge variant="outline" className="border-blue-200 text-blue-700">
                    {room.status === ROOM_STATUS.AVAILABLE ? '✅ Tersedia' : '⏳ Sementara Dipesan'}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Room Gallery */}
            <div className="space-y-4">
              <div className="rounded-2xl overflow-hidden">
                <img
                  src={roomImages[selectedImageIndex]}
                  alt={room.name}
                  className="w-full h-96 object-cover"
                />
              </div>
              <div className="grid grid-cols-4 gap-3">
                {roomImages.map((img, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImageIndex(index)}
                    className={`rounded-lg overflow-hidden ${selectedImageIndex === index ? 'ring-2 ring-blue-500' : ''}`}
                  >
                    <img
                      src={img}
                      alt={`Room view ${index + 1}`}
                      className="w-full h-20 object-cover"
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Room Description */}
            <Card className="rounded-2xl border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="text-2xl">Deskripsi Kamar</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 leading-relaxed text-lg">
                  {room.description || 'Kamar mewah dengan desain modern yang menawarkan kenyamanan maksimal. Dilengkapi dengan tempat tidur king size, kamar mandi pribadi dengan bathtub, dan pemandangan kota yang menakjubkan. Ruangan yang luas dan pencahayaan alami menciptakan atmosfer yang sempurna untuk relaksasi.'}
                </p>
                
                {/* Room Specs */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-8">
                  <div className="text-center">
                    <div className="bg-blue-50 w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-2">
                      <Bed className="h-6 w-6 text-blue-600" />
                    </div>
                    <div className="font-bold text-gray-900">King Size</div>
                    <div className="text-sm text-gray-500">Tempat Tidur</div>
                  </div>
                  <div className="text-center">
                    <div className="bg-blue-50 w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-2">
                      <Maximize className="h-6 w-6 text-blue-600" />
                    </div>
                    <div className="font-bold text-gray-900">45 m²</div>
                    <div className="text-sm text-gray-500">Luas Kamar</div>
                  </div>
                  <div className="text-center">
                    <div className="bg-blue-50 w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-2">
                      <Users className="h-6 w-6 text-blue-600" />
                    </div>
                    <div className="font-bold text-gray-900">2 Orang</div>
                    <div className="text-sm text-gray-500">Kapasitas</div>
                  </div>
                  <div className="text-center">
                    <div className="bg-blue-50 w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-2">
                      <Bath className="h-6 w-6 text-blue-600" />
                    </div>
                    <div className="font-bold text-gray-900">Pribadi</div>
                    <div className="text-sm text-gray-500">Kamar Mandi</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Facilities */}
            <Card className="rounded-2xl border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="text-2xl">Fasilitas Kamar</CardTitle>
                <CardDescription>Nikmati berbagai fasilitas premium untuk kenyamanan Anda</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {facilityIcons.map(({ icon: Icon, label }, index) => (
                    <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors">
                      <div className="bg-white p-2 rounded-lg">
                        <Icon className="h-5 w-5 text-blue-600" />
                      </div>
                      <span className="font-medium">{label}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* House Rules & Policies */}
            <Card className="rounded-2xl border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="text-2xl">Kebijakan & Peraturan</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Clock className="h-5 w-5 text-blue-600" />
                      <h4 className="font-bold">Check-in & Check-out</h4>
                    </div>
                    <ul className="space-y-2 text-gray-600">
                      <li className="flex items-center gap-2">
                        <ChevronRight className="h-4 w-4 text-gray-400" />
                        Check-in: 14:00 WIB
                      </li>
                      <li className="flex items-center gap-2">
                        <ChevronRight className="h-4 w-4 text-gray-400" />
                        Check-out: 12:00 WIB
                      </li>
                      <li className="flex items-center gap-2">
                        <ChevronRight className="h-4 w-4 text-gray-400" />
                        Early check-in tersedia
                      </li>
                    </ul>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Shield className="h-5 w-5 text-green-600" />
                      <h4 className="font-bold">Kebijakan Pembatalan</h4>
                    </div>
                    <ul className="space-y-2 text-gray-600">
                      <li className="flex items-center gap-2">
                        <ChevronRight className="h-4 w-4 text-gray-400" />
                        Gratis hingga 24 jam sebelum check-in
                      </li>
                      <li className="flex items-center gap-2">
                        <ChevronRight className="h-4 w-4 text-gray-400" />
                        50% biaya setelah batas waktu
                      </li>
                      <li className="flex items-center gap-2">
                        <ChevronRight className="h-4 w-4 text-gray-400" />
                        No-show: 100% biaya
                      </li>
                    </ul>
                  </div>
                </div>
                
                <div className="bg-yellow-50 p-4 rounded-xl border border-yellow-200">
                  <div className="flex items-start gap-3">
                    <Award className="h-6 w-6 text-yellow-600 mt-1" />
                    <div>
                      <h4 className="font-bold text-yellow-800 mb-1">Best Price Guarantee</h4>
                      <p className="text-yellow-700 text-sm">
                        Kami menjamin harga terbaik untuk kamar ini. Jika Anda menemukan harga lebih rendah di platform lain, kami akan menyesuaikan harganya.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - 1/3 width for Booking Card */}
          <div>
            {/* Sticky Booking Card */}
            <div className="sticky top-8">
              <Card className="rounded-2xl border-0 shadow-2xl overflow-hidden">
                {/* Price Header */}
                <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white p-6">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <div className="text-3xl font-bold">{formatCurrency(room.price)}</div>
                      <div className="text-blue-200">per malam</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-blue-200">Harga Asli</div>
                      <div className="text-lg line-through opacity-80">{formatCurrency(getOriginalPrice(room.price))}</div>
                    </div>
                  </div>
                  <Badge className="bg-green-400 hover:bg-green-500 text-white">
                    Hemat 30% • Diskon Spesial
                  </Badge>
                </div>

                <CardContent className="p-6 space-y-6">
                  {/* Date Range Picker */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-gray-900">Pilih Tanggal Menginap</h4>
                      <Badge variant="outline" className="text-xs">
                        Min. 1 malam
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">
                          Check-in
                        </label>
                        <Input
                          type="date"
                          name="check_in_date"
                          value={bookingForm.check_in_date}
                          onChange={handleDateChange}
                          className="rounded-xl border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                          min={new Date().toISOString().split('T')[0]}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">
                          Check-out
                        </label>
                        <Input
                          type="date"
                          name="check_out_date"
                          value={bookingForm.check_out_date}
                          onChange={handleDateChange}
                          className="rounded-xl border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                          min={(() => {
                            if (!bookingForm.check_in_date) {
                              return new Date().toISOString().split('T')[0];
                            }
                            const nextDay = new Date(bookingForm.check_in_date);
                            nextDay.setDate(nextDay.getDate() + 1);
                            return nextDay.toISOString().split('T')[0];
                          })()}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Price Breakdown */}
                  <div className="space-y-3">
                    <h4 className="font-bold text-gray-900">Ringkasan Biaya</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between text-gray-600">
                        <span>{formatCurrency(room.price)} × {totalNights} malam</span>
                        <span>{formatCurrency(room.price * totalNights)}</span>
                      </div>
                      <div className="flex justify-between text-gray-600">
                        <span>Diskon 30%</span>
                        <span className="text-green-600">-{formatCurrency(getOriginalPrice(room.price) * totalNights - room.price * totalNights)}</span>
                      </div>
                      <div className="flex justify-between text-gray-600">
                        <span>Pajak & Layanan</span>
                        <span>Termasuk</span>
                      </div>
                      <div className="border-t pt-2">
                        <div className="flex justify-between font-bold text-lg">
                          <span>Total Pembayaran</span>
                          <span className="text-blue-700">{formatCurrency(totalPrice)}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Availability Alert */}
                  {room.quota < 3 && (
                    <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-xl">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="h-2 w-2 bg-red-500 rounded-full animate-pulse"></div>
                        <span className="font-bold">Hampir Habis!</span>
                      </div>
                      <p className="text-sm">Hanya tersisa {room.quota} kamar dengan harga ini.</p>
                    </div>
                  )}
                </CardContent>

                <CardFooter className="p-6 pt-0 flex flex-col gap-3">
                  {/* Hard Book Button */}
                  <Dialog open={isBookingDialogOpen} onOpenChange={setIsBookingDialogOpen}>
                    <DialogTrigger asChild>
                      <Button 
                        className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white py-6 text-lg font-bold rounded-xl shadow-lg"
                        size="lg"
                        disabled={room.quota === 0}
                      >
                        {room.quota === 0 ? 'Kamar Penuh' : 'Hard Book Sekarang'}
                        <CreditCard className="ml-2 h-5 w-5" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[500px]">
                      <DialogHeader>
                        <DialogTitle>Konfirmasi Booking</DialogTitle>
                        <DialogDescription>
                          Lengkapi data diri Anda untuk menyelesaikan booking kamar {room.name}.
                        </DialogDescription>
                      </DialogHeader>

                      <div className="grid gap-4 py-4">
                        <div className="grid gap-3">
                          <div className="grid gap-2">
                            <label htmlFor="guest_name" className="text-sm font-medium">Nama Lengkap *</label>
                            <Input
                              id="guest_name"
                              name="guest_name"
                              value={bookingForm.guest_name}
                              onChange={handleBookingInputChange}
                              placeholder="Nama lengkap"
                              className="rounded-xl"
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div className="grid gap-2">
                              <label htmlFor="guest_email" className="text-sm font-medium">Email *</label>
                              <Input
                                id="guest_email"
                                name="guest_email"
                                type="email"
                                value={bookingForm.guest_email}
                                onChange={handleBookingInputChange}
                                placeholder="email@contoh.com"
                                className="rounded-xl"
                              />
                            </div>
                            <div className="grid gap-2">
                              <label htmlFor="guest_phone" className="text-sm font-medium">Telepon</label>
                              <Input
                                id="guest_phone"
                                name="guest_phone"
                                value={bookingForm.guest_phone}
                                onChange={handleBookingInputChange}
                                placeholder="08xxx"
                                className="rounded-xl"
                              />
                            </div>
                          </div>
                        </div>

                        <div className="bg-blue-50 p-4 rounded-xl">
                          <div className="font-bold text-blue-800 mb-2">Instruksi Pembayaran</div>
                          <p className="text-sm text-blue-700 mb-2">
                            Setelah submit, silakan transfer ke rekening berikut:
                          </p>
                          <div className="bg-white p-3 rounded-lg border border-blue-200">
                            <div className="font-mono text-center font-bold">{BANK_ACCOUNT_NUMBER}</div>
                          </div>
                        </div>
                      </div>

                      <DialogFooter>
                        <Button
                          variant="outline"
                          onClick={() => setIsBookingDialogOpen(false)}
                          disabled={isSubmitting}
                          className="rounded-xl"
                        >
                          Batal
                        </Button>
                        <Button 
                          onClick={handleSubmitBooking}
                          disabled={isSubmitting}
                          className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 rounded-xl"
                        >
                          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                          Konfirmasi & Bayar
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>

                  {/* Tanya Admin Button */}
                  {room.status === ROOM_STATUS.AVAILABLE && (
                    <Button 
                      onClick={handleSoftBooking}
                      variant="outline"
                      className="w-full border-blue-600 text-blue-600 hover:bg-blue-50 hover:text-blue-700 py-6 rounded-xl font-bold"
                      size="lg"
                    >
                      <MessageCircle className="mr-2 h-5 w-5" />
                      Tanya Admin (Inquiry)
                    </Button>
                  )}

                  {/* Trust Badges */}
                  <div className="grid grid-cols-2 gap-3 pt-4 border-t">
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4 text-green-600" />
                      <span className="text-xs text-gray-600">100% Aman</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-blue-600" />
                      <span className="text-xs text-gray-600">Konfirmasi Instan</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Award className="h-4 w-4 text-yellow-600" />
                      <span className="text-xs text-gray-600">Best Price</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-600" />
                      <span className="text-xs text-gray-600">No Hidden Fees</span>
                    </div>
                  </div>
                </CardFooter>
              </Card>

              {/* Need Help Card */}
              <Card className="mt-6 rounded-2xl border-0 shadow-lg">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="bg-blue-100 p-3 rounded-xl">
                      <Phone className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900 mb-1">Butuh Bantuan?</h4>
                      <p className="text-sm text-gray-600 mb-3">
                        Tim customer service kami siap membantu 24/7
                      </p>
                      <div className="font-bold text-blue-700">021-8888-9999</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Chat Room Modal */}
      {showChatRoom && room && (
        <ChatRoom 
          roomId={room.id}
          roomName={room.name}
          onClose={() => setShowChatRoom(false)}
        />
      )}
    </div>
  );
}