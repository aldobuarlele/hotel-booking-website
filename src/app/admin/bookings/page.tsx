'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { supabase } from '@/lib/supabase';
import { Calendar, User, Mail, Phone, DollarSign, CheckCircle, XCircle, Plus, Loader2, Clock, CreditCard } from 'lucide-react';
import { BANK_ACCOUNT_NUMBER } from '@/lib/config';
import { DB_TABLES } from '@/lib/config';
import { DEFAULT_LOCALE } from '@/lib/config';
import { ROOM_STATUS } from '@/lib/config';

type Booking = {
  id: number;
  room_id: number;
  account_number: string;
  payment_status: 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED';
  guest_name: string;
  guest_email: string;
  guest_phone: string | null;
  check_in_date: string;
  check_out_date: string;
  total_price: number;
  created_at: string;
  updated_at: string;
  rooms?: {
    name: string;
    price: number;
  };
};

type Room = {
  id: number;
  name: string;
  price: number;
  quota: number;
};

type ManualBookingFormData = {
  room_id: string;
  guest_name: string;
  guest_email: string;
  guest_phone: string;
  check_in_date: string;
  check_out_date: string;
  account_number: string;
  total_price: string;
};

export default function BookingManagementPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [isManualBookingOpen, setIsManualBookingOpen] = useState(false);
  const [isCreatingBooking, setIsCreatingBooking] = useState(false);
  const [manualBookingForm, setManualBookingForm] = useState<ManualBookingFormData>({
    room_id: '',
    guest_name: '',
    guest_email: '',
    guest_phone: '',
    check_in_date: '',
    check_out_date: '',
    account_number: 'MANUAL-' + Date.now(),
    total_price: '',
  });

  // Fetch bookings and rooms
  useEffect(() => {
    fetchBookings();
    fetchRooms();
  }, []);

  const fetchBookings = async () => {
    try {
      const { data, error } = await supabase
        .from(DB_TABLES.BOOKINGS)
        .select(`
          *,
          rooms (
            name,
            price
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setBookings(data || []);
    } catch (error) {
      console.error('Error fetching bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRooms = async () => {
    try {
      const { data, error } = await supabase
        .from(DB_TABLES.ROOMS)
        .select('id, name, price, quota')
        .eq('status', ROOM_STATUS.AVAILABLE);

      if (error) throw error;
      setRooms(data || []);
    } catch (error) {
      console.error('Error fetching rooms:', error);
    }
  };

  const handleManualBookingInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setManualBookingForm(prev => ({ ...prev, [name]: value }));

    // Calculate total price if room_id or dates change
    if (name === 'room_id' || name === 'check_in_date' || name === 'check_out_date') {
      calculateTotalPrice({
        ...manualBookingForm,
        [name]: value
      });
    }
  };

  const calculateTotalPrice = (form: ManualBookingFormData) => {
    if (!form.room_id || !form.check_in_date || !form.check_out_date) {
      setManualBookingForm(prev => ({ ...prev, total_price: '' }));
      return;
    }

    const selectedRoom = rooms.find(r => r.id === parseInt(form.room_id));
    if (!selectedRoom) return;

    const checkIn = new Date(form.check_in_date);
    const checkOut = new Date(form.check_out_date);
    const nights = Math.max(1, Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24)));
    
    const totalPrice = selectedRoom.price * nights;
    setManualBookingForm(prev => ({ ...prev, total_price: totalPrice.toString() }));
  };

  const checkOverlap = async (roomId: number, checkInDate: string, checkOutDate: string): Promise<number> => {
    try {
      // Query bookings for the same room that overlap with the selected dates
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

  const handleCreateManualBooking = async () => {
    if (!manualBookingForm.room_id || !manualBookingForm.guest_name || !manualBookingForm.guest_email || 
        !manualBookingForm.check_in_date || !manualBookingForm.check_out_date) {
      alert('Harap isi semua field wajib (kamar, nama tamu, email, tanggal check-in/out)');
      return;
    }

    // Validate date range
    const checkIn = new Date(manualBookingForm.check_in_date);
    const checkOut = new Date(manualBookingForm.check_out_date);
    
    if (checkOut <= checkIn) {
      alert('Tanggal check-out harus setelah tanggal check-in.');
      return;
    }

    const roomId = parseInt(manualBookingForm.room_id);
    const selectedRoom = rooms.find(r => r.id === roomId);
    
    if (!selectedRoom) {
      alert('Kamar tidak ditemukan.');
      return;
    }

    // Check for overbooking
    setIsCreatingBooking(true);
    try {
      const overlappingBookingsCount = await checkOverlap(
        roomId, 
        manualBookingForm.check_in_date, 
        manualBookingForm.check_out_date
      );

      if (overlappingBookingsCount >= selectedRoom.quota) {
        alert(`Kamar penuh pada tanggal tersebut. Sudah ada ${overlappingBookingsCount} booking yang overlap dengan kuota ${selectedRoom.quota}.`);
        setIsCreatingBooking(false);
        return;
      }

      const bookingData = {
        room_id: roomId,
        guest_name: manualBookingForm.guest_name,
        guest_email: manualBookingForm.guest_email,
        guest_phone: manualBookingForm.guest_phone || null,
        check_in_date: manualBookingForm.check_in_date,
        check_out_date: manualBookingForm.check_out_date,
        account_number: manualBookingForm.account_number,
        total_price: parseFloat(manualBookingForm.total_price) || 0,
        payment_status: 'PAID' as const, // Manual bookings are marked as paid
      };

      const { error } = await supabase
        .from(DB_TABLES.BOOKINGS)
        .insert(bookingData);

      if (error) throw error;

      // Refresh bookings list
      await fetchBookings();
      setIsManualBookingOpen(false);
      
      // Reset form
      setManualBookingForm({
        room_id: '',
        guest_name: '',
        guest_email: '',
        guest_phone: '',
        check_in_date: '',
        check_out_date: '',
        account_number: 'MANUAL-' + Date.now(),
        total_price: '',
      });

      alert('Booking manual berhasil dibuat!');
    } catch (error) {
      console.error('Error creating manual booking:', error);
      alert('Gagal membuat booking manual. Silakan coba lagi.');
    } finally {
      setIsCreatingBooking(false);
    }
  };

  const handleUpdatePaymentStatus = async (bookingId: number, newStatus: 'PAID' | 'FAILED' | 'REFUNDED' | 'PENDING') => {
    let message = '';
    if (newStatus === 'PAID') message = 'DITERIMA';
    else if (newStatus === 'FAILED') message = 'DIBATALKAN';
    else if (newStatus === 'REFUNDED') message = 'DIKEMBALIKAN';
    else if (newStatus === 'PENDING') message = 'MENUNGGU';
    
    if (!confirm(`Apakah Anda yakin ingin mengubah status pembayaran menjadi ${message}?`)) return;

    try {
      const { error } = await supabase
        .from(DB_TABLES.BOOKINGS)
        .update({ payment_status: newStatus })
        .eq('id', bookingId);

      if (error) throw error;

      // Refresh bookings list
      await fetchBookings();
      alert(`Status pembayaran berhasil diubah menjadi ${newStatus}`);
    } catch (error) {
      console.error('Error updating payment status:', error);
      alert('Gagal mengubah status pembayaran. Silakan coba lagi.');
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat(DEFAULT_LOCALE, {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(DEFAULT_LOCALE, {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PAID':
        return 'bg-green-100 text-green-800';
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'FAILED':
        return 'bg-red-100 text-red-800';
      case 'REFUNDED':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'PAID':
        return 'DITERIMA';
      case 'PENDING':
        return 'MENUNGGU';
      case 'FAILED':
        return 'GAGAL';
      case 'REFUNDED':
        return 'DIKEMBALIKAN';
      default:
        return status;
    }
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Manajemen Reservasi</h1>
        <p className="text-gray-600">Kelola semua reservasi hotel, termasuk mengubah status pembayaran dan membuat booking manual.</p>
      </div>

      {/* Action Bar */}
      <div className="mb-6 flex justify-between items-center">
        <div className="text-sm text-gray-500">
          Total {bookings.length} reservasi
        </div>
        <Dialog open={isManualBookingOpen} onOpenChange={setIsManualBookingOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Manual Booking
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Buat Booking Manual</DialogTitle>
              <DialogDescription>
                Buat reservasi manual untuk tamu walk-in. Semua field wajib diisi kecuali nomor telepon.
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <label htmlFor="room_id" className="text-sm font-medium">Pilih Kamar *</label>
                <select
                  id="room_id"
                  name="room_id"
                  value={manualBookingForm.room_id}
                  onChange={(e) => handleManualBookingInputChange(e as any)}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="">Pilih kamar...</option>
                  {rooms.map((room) => (
                    <option key={room.id} value={room.id}>
                      {room.name} - {formatCurrency(room.price)}/malam (Kuota: {room.quota})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid gap-2">
                <label htmlFor="guest_name" className="text-sm font-medium">Nama Tamu *</label>
                <Input
                  id="guest_name"
                  name="guest_name"
                  value={manualBookingForm.guest_name}
                  onChange={handleManualBookingInputChange}
                  placeholder="Nama lengkap tamu"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <label htmlFor="guest_email" className="text-sm font-medium">Email *</label>
                  <Input
                    id="guest_email"
                    name="guest_email"
                    type="email"
                    value={manualBookingForm.guest_email}
                    onChange={handleManualBookingInputChange}
                    placeholder="email@contoh.com"
                  />
                </div>
                <div className="grid gap-2">
                  <label htmlFor="guest_phone" className="text-sm font-medium">Telepon</label>
                  <Input
                    id="guest_phone"
                    name="guest_phone"
                    value={manualBookingForm.guest_phone}
                    onChange={handleManualBookingInputChange}
                    placeholder="08xxx"
                  />
                </div>
              </div>

              <div className="grid gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Tanggal Menginap *</label>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <label htmlFor="check_in_date" className="text-xs text-gray-500">Check-in</label>
                      <Input
                        id="check_in_date"
                        name="check_in_date"
                        type="date"
                        value={manualBookingForm.check_in_date}
                        onChange={handleManualBookingInputChange}
                        min={new Date().toISOString().split('T')[0]}
                      />
                    </div>
                    <div className="grid gap-2">
                      <label htmlFor="check_out_date" className="text-xs text-gray-500">Check-out</label>
                      <Input
                        id="check_out_date"
                        name="check_out_date"
                        type="date"
                        value={manualBookingForm.check_out_date}
                        onChange={(e) => {
                          const newCheckOut = e.target.value;
                          const checkIn = new Date(manualBookingForm.check_in_date);
                          const checkOut = new Date(newCheckOut);
                          
                          // Auto-adjust if check-out is before or same as check-in
                          if (checkOut <= checkIn && manualBookingForm.check_in_date) {
                            const nextDay = new Date(checkIn);
                            nextDay.setDate(nextDay.getDate() + 1);
                            const adjustedCheckOut = nextDay.toISOString().split('T')[0];
                            
                            setManualBookingForm(prev => ({
                              ...prev,
                              check_out_date: adjustedCheckOut
                            }));
                            
                            // Recalculate price with adjusted date
                            calculateTotalPrice({
                              ...manualBookingForm,
                              check_out_date: adjustedCheckOut
                            });
                          } else {
                            handleManualBookingInputChange(e);
                          }
                        }}
                        min={manualBookingForm.check_in_date ? 
                          new Date(new Date(manualBookingForm.check_in_date).getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0] : 
                          new Date().toISOString().split('T')[0]
                        }
                      />
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Check-out otomatis disesuaikan jika lebih awal dari check-in
                  </p>
                </div>
              </div>

              <div className="grid gap-2">
                <label htmlFor="account_number" className="text-sm font-medium">Nomor Rekening</label>
                <Input
                  id="account_number"
                  name="account_number"
                  value={manualBookingForm.account_number}
                  onChange={handleManualBookingInputChange}
                  placeholder="Nomor rekening pembayaran"
                  readOnly
                />
                <p className="text-xs text-gray-500">Otomatis di-generate untuk booking manual</p>
              </div>

              <div className="grid gap-2">
                <label htmlFor="total_price" className="text-sm font-medium">Total Harga</label>
                <Input
                  id="total_price"
                  name="total_price"
                  value={formatCurrency(parseFloat(manualBookingForm.total_price) || 0)}
                  readOnly
                  className="font-bold"
                />
                <p className="text-xs text-gray-500">Dihitung otomatis berdasarkan kamar dan jumlah malam</p>
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsManualBookingOpen(false)}
                disabled={isCreatingBooking}
              >
                Batal
              </Button>
              <Button onClick={handleCreateManualBooking} disabled={isCreatingBooking}>
                {isCreatingBooking && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Buat Booking
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Bookings List */}
      <Card>
        <CardHeader>
          <CardTitle>Daftar Reservasi</CardTitle>
          <CardDescription>
            Semua reservasi yang ada di sistem. Klik tombol aksi untuk mengubah status pembayaran.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
          ) : bookings.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="h-12 w-12 mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Belum ada reservasi</h3>
              <p className="text-gray-500 mb-4">Mulai dengan membuat reservasi manual atau tunggu reservasi dari tamu.</p>
              <Button onClick={() => setIsManualBookingOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Buat Booking Manual Pertama
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-medium text-gray-700">ID</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Tamu</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Kamar</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Tanggal</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Total</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Status</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {bookings.map((booking) => (
                    <tr key={booking.id} className="border-b hover:bg-gray-50">
                      <td className="py-4 px-4">
                        <div className="font-mono text-sm">{booking.id}</div>
                        <div className="text-xs text-gray-500">
                          {formatDate(booking.created_at)}
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div>
                          <p className="font-medium flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {booking.guest_name}
                          </p>
                          <p className="text-sm text-gray-500 flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {booking.guest_email}
                          </p>
                          {booking.guest_phone && (
                            <p className="text-sm text-gray-500 flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              {booking.guest_phone}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div>
                          <p className="font-medium">{booking.rooms?.name || 'Kamar tidak ditemukan'}</p>
                          <p className="text-sm text-gray-500">
                            No. Rek: {booking.account_number}
                          </p>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div>
                          <p className="text-sm">
                            <span className="font-medium">Check-in:</span> {formatDate(booking.check_in_date)}
                          </p>
                          <p className="text-sm">
                            <span className="font-medium">Check-out:</span> {formatDate(booking.check_out_date)}
                          </p>
                          <p className="text-xs text-gray-500">
                            {Math.ceil((new Date(booking.check_out_date).getTime() - new Date(booking.check_in_date).getTime()) / (1000 * 60 * 60 * 24))} malam
                          </p>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="font-bold">{formatCurrency(booking.total_price)}</div>
                      </td>
                      <td className="py-4 px-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(booking.payment_status)}`}>
                          {getStatusText(booking.payment_status)}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex flex-col gap-2">
                          {booking.payment_status === 'PENDING' && (
                            <>
                              <Button
                                size="sm"
                                className="bg-green-600 hover:bg-green-700 text-white"
                                onClick={() => handleUpdatePaymentStatus(booking.id, 'PAID')}
                              >
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                onClick={() => handleUpdatePaymentStatus(booking.id, 'FAILED')}
                              >
                                <XCircle className="h-3 w-3 mr-1" />
                                Cancel
                              </Button>
                            </>
                          )}
                          {booking.payment_status === 'PAID' && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                              onClick={() => handleUpdatePaymentStatus(booking.id, 'REFUNDED')}
                            >
                              <CreditCard className="h-3 w-3 mr-1" />
                              Refund
                            </Button>
                          )}
                          {(booking.payment_status === 'FAILED' || booking.payment_status === 'REFUNDED') && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleUpdatePaymentStatus(booking.id, 'PENDING')}
                            >
                              <Clock className="h-3 w-3 mr-1" />
                              Reset ke Pending
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Summary Stats */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Reservasi</CardTitle>
            <Calendar className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{bookings.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Diterima</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {bookings.filter(b => b.payment_status === 'PAID').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Menunggu</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {bookings.filter(b => b.payment_status === 'PENDING').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pendapatan</CardTitle>
            <DollarSign className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {formatCurrency(bookings.filter(b => b.payment_status === 'PAID').reduce((sum, b) => sum + b.total_price, 0))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}