'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { supabase } from '@/lib/supabase';
import { BANK_ACCOUNT_NUMBER } from '@/lib/config';
import { Hotel, Star, MapPin, Calendar, Users, ArrowLeft, Loader2, Check, User, Mail, Phone, CreditCard } from 'lucide-react';
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
  const [bookingForm, setBookingForm] = useState<BookingFormData>({
    guest_name: '',
    guest_email: '',
    guest_phone: '',
    check_in_date: '',
    check_out_date: '',
  });
  const [totalNights, setTotalNights] = useState(1);
  const [totalPrice, setTotalPrice] = useState(0);

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
        .from('rooms')
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
        .from('bookings')
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
      alert('Harap isi semua field wajib (nama, email, tanggal check-in/out)');
      return;
    }

    // Validate date range
    const checkIn = new Date(bookingForm.check_in_date);
    const checkOut = new Date(bookingForm.check_out_date);
    
    if (checkOut <= checkIn) {
      alert('Tanggal check-out harus setelah tanggal check-in.');
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
        alert(`Maaf, kamar ini sudah penuh pada tanggal tersebut. Sudah ada ${overlappingBookingsCount} booking yang overlap dengan kuota ${room.quota}.`);
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
        .from('bookings')
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

      alert(`
        Booking berhasil dibuat!
        
        Detail Booking:
        - Nomor Booking: ${accountNumber}
        - Kamar: ${room.name}
        - Tanggal: ${new Date(bookingForm.check_in_date).toLocaleDateString('id-ID')} - ${new Date(bookingForm.check_out_date).toLocaleDateString('id-ID')}
        - Total: Rp ${totalPrice.toLocaleString('id-ID')}
        
        Silakan transfer ke:
        ${BANK_ACCOUNT_NUMBER}
        
        Konfirmasi pembayaran akan diproses dalam 1x24 jam.
      `);

      // Redirect to home
      router.push('/');
    } catch (error) {
      console.error('Error creating booking:', error);
      alert('Gagal membuat booking. Silakan coba lagi.');
    } finally {
      setIsSubmitting(false);
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!room) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-16 text-center">
          <div className="bg-gray-100 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-6">
            <Hotel className="h-12 w-12 text-gray-400" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Kamar Tidak Ditemukan</h1>
          <p className="text-gray-600 mb-8">Kamar yang Anda cari tidak tersedia atau sudah tidak aktif.</p>
          <Link href="/">
            <Button>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Kembali ke Katalog
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2 text-gray-700 hover:text-gray-900">
              <ArrowLeft className="h-5 w-5" />
              <span>Kembali ke Katalog</span>
            </Link>
            <div className="flex items-center gap-2">
              <Hotel className="h-6 w-6 text-blue-600" />
              <span className="font-semibold">Hotel Booking</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Room Details */}
          <div className="lg:col-span-2">
            {/* Room Image */}
            <div className="rounded-2xl overflow-hidden mb-8">
              {room.photo_path ? (
                <img
                  src={room.photo_path}
                  alt={room.name}
                  className="w-full h-96 object-cover"
                />
              ) : (
                <div className="w-full h-96 bg-gradient-to-br from-blue-100 to-indigo-200 flex items-center justify-center">
                  <Hotel className="h-32 w-32 text-blue-400" />
                </div>
              )}
            </div>

            {/* Room Info */}
            <Card>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-3xl">{room.name}</CardTitle>
                    <div className="flex items-center gap-4 mt-2">
                      <div className="flex items-center gap-1">
                        <MapPin className="h-5 w-5 text-gray-400" />
                        <span className="text-gray-600">Hotel Central</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Star className="h-5 w-5 text-yellow-500 fill-current" />
                        <span className="font-semibold">4.8</span>
                        <span className="text-gray-500">(128 review)</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold text-blue-700">{formatCurrency(room.price)}</div>
                    <div className="text-gray-500">per malam</div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Description */}
                <div>
                  <h3 className="text-xl font-semibold mb-3">Deskripsi Kamar</h3>
                  <p className="text-gray-700 leading-relaxed">
                    {room.description || 'Kamar nyaman dengan fasilitas lengkap untuk kenyamanan Anda selama menginap. Dilengkapi dengan AC, TV, WiFi gratis, kamar mandi pribadi, dan sarapan pagi.'}
                  </p>
                </div>

                {/* Facilities */}
                <div>
                  <h3 className="text-xl font-semibold mb-3">Fasilitas</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {['AC', 'TV', 'WiFi Gratis', 'Kamar Mandi Pribadi', 'Sarapan', 'Parkir Gratis', 'Room Service', 'Kolam Renang', 'Gym'].map((facility) => (
                      <div key={facility} className="flex items-center gap-2">
                        <Check className="h-5 w-5 text-green-500" />
                        <span>{facility}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Availability */}
                <div>
                  <h3 className="text-xl font-semibold mb-3">Ketersediaan</h3>
                  <div className="flex items-center gap-4">
                    <div className={`px-4 py-2 rounded-full ${room.quota > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {room.quota > 0 ? `${room.quota} kamar tersedia` : 'Tidak tersedia'}
                    </div>
                    <div className="text-gray-600">
                      Status: <span className="font-semibold">{room.status === 'AVAILABLE' ? 'Tersedia' : 'Sementara Dipesan'}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Booking Panel */}
          <div>
            <Card className="sticky top-8">
              <CardHeader>
                <CardTitle>Booking Kamar</CardTitle>
                <CardDescription>
                  Isi form di bawah untuk melakukan pemesanan kamar ini
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Price Summary */}
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-gray-700">Harga per malam</span>
                    <span className="font-semibold">{formatCurrency(room.price)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-700">Kuota tersedia</span>
                    <span className="font-semibold">{room.quota} kamar</span>
                  </div>
                </div>

                {/* Booking Info */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-gray-600">
                    <Users className="h-5 w-5" />
                    <span>Maksimal 2 orang per kamar</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <Calendar className="h-5 w-5" />
                    <span>Check-in: 14:00, Check-out: 12:00</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <CreditCard className="h-5 w-5" />
                    <span>Pembayaran via transfer bank</span>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Dialog open={isBookingDialogOpen} onOpenChange={setIsBookingDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="w-full bg-blue-600 hover:bg-blue-700 text-lg py-6" disabled={room.quota === 0}>
                      {room.quota === 0 ? 'Kamar Penuh' : 'Booking Sekarang'}
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                      <DialogTitle>Form Booking Kamar</DialogTitle>
                      <DialogDescription>
                        Isi data diri Anda dan tanggal menginap untuk melakukan booking kamar {room.name}.
                      </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-4 py-4">
                      {/* Guest Information */}
                      <div className="space-y-4">
                        <h4 className="font-medium">Data Diri</h4>
                        <div className="grid gap-3">
                          <div className="grid gap-2">
                            <label htmlFor="guest_name" className="text-sm font-medium">Nama Lengkap *</label>
                            <Input
                              id="guest_name"
                              name="guest_name"
                              value={bookingForm.guest_name}
                              onChange={handleBookingInputChange}
                              placeholder="Nama lengkap"
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
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Date Selection */}
                      <div className="space-y-4">
                        <h4 className="font-medium">Tanggal Menginap *</h4>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="grid gap-2">
                            <label htmlFor="check_in_date" className="text-sm font-medium">Check-in</label>
                            <Input
                              id="check_in_date"
                              name="check_in_date"
                              type="date"
                              value={bookingForm.check_in_date}
                              onChange={handleDateChange}
                              min={new Date().toISOString().split('T')[0]}
                            />
                          </div>
                          <div className="grid gap-2">
                            <label htmlFor="check_out_date" className="text-sm font-medium">Check-out</label>
                            <Input
                              id="check_out_date"
                              name="check_out_date"
                              type="date"
                              value={bookingForm.check_out_date}
                              onChange={handleDateChange}
                              min={bookingForm.check_in_date ? 
                                new Date(new Date(bookingForm.check_in_date).getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0] : 
                                new Date().toISOString().split('T')[0]
                              }
                            />
                          </div>
                        </div>
                      </div>

                      {/* Price Summary */}
                      <div className="bg-blue-50 p-4 rounded-lg space-y-2">
                        <div className="flex justify-between">
                          <span className="text-gray-700">Durasi menginap:</span>
                          <span className="font-semibold">{totalNights} malam</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-700">Harga per malam:</span>
                          <span>{formatCurrency(room.price)}</span>
                        </div>
                        <div className="flex justify-between text-lg font-bold border-t pt-2">
                          <span>Total Biaya:</span>
                          <span className="text-blue-700">{formatCurrency(totalPrice)}</span>
                        </div>
                      </div>

                      {/* Payment Instructions */}
                      <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                        <h4 className="font-medium text-yellow-800 mb-2">Instruksi Pembayaran</h4>
                        <p className="text-sm text-yellow-700">
                          Setelah submit, Anda akan mendapatkan nomor booking. Silakan transfer ke:
                        </p>
                        <p className="font-mono text-sm bg-yellow-100 p-2 rounded mt-2 text-center font-bold">
                          {BANK_ACCOUNT_NUMBER}
                        </p>
                        <p className="text-xs text-yellow-600 mt-2">
                          Konfirmasi pembayaran akan diproses dalam 1x24 jam.
                        </p>
                      </div>
                    </div>

                    <DialogFooter>
                      <Button
                        variant="outline"
                        onClick={() => setIsBookingDialogOpen(false)}
                        disabled={isSubmitting}
                      >
                        Batal
                      </Button>
                      <Button 
                        onClick={handleSubmitBooking}
                        disabled={isSubmitting}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Submit Booking
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </CardFooter>
            </Card>

            {/* Additional Info */}
            <div className="mt-6 space-y-4">
              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <h4 className="font-medium text-green-800 mb-2">Kebijakan Pembatalan</h4>
                <p className="text-sm text-green-700">
                  Pembatalan gratis hingga 24 jam sebelum check-in. Setelah itu, dikenakan biaya 50% dari total harga.
                </p>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                <h4 className="font-medium text-purple-800 mb-2">Perhatian</h4>
                <p className="text-sm text-purple-700">
                  Pastikan ketersediaan kamar dengan mengecek kalender booking. Kami akan melakukan pengecekan ulang sebelum konfirmasi.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}