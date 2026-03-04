'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { DollarSign, Hotel, Calendar, TrendingUp, Users, CreditCard, Loader2, FileDown } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { BANK_ACCOUNT_NUMBER } from '@/lib/config';

type DashboardStats = {
  totalRevenue: number;
  totalRooms: number;
  activeBookings: number;
  occupancyRate: number;
  totalGuests: number;
  pendingPayments: number;
  revenueByMonth: { month: string; revenue: number }[];
  bookingsByStatus: { status: string; count: number; color: string }[];
  recentActivity: { guest: string; room: string; action: string; time: string; status: string }[];
};

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Fetch rooms
      const { data: rooms, error: roomsError } = await supabase
        .from('rooms')
        .select('*');
      
      if (roomsError) throw roomsError;

      // Fetch bookings
      const { data: bookings, error: bookingsError } = await supabase
        .from('bookings')
        .select('*');
      
      if (bookingsError) throw bookingsError;

      // Calculate stats
      const totalRevenue = bookings
        .filter(b => b.payment_status === 'PAID')
        .reduce((sum, b) => sum + (b.total_price || 0), 0);
      
      const totalRooms = rooms?.length || 0;
      const activeBookings = bookings?.filter(b => b.payment_status === 'PAID').length || 0;
      const totalGuests = bookings?.length || 0;
      const pendingPayments = bookings?.filter(b => b.payment_status === 'PENDING').length || 0;
      
      // Calculate occupancy rate (simplified: active bookings / total rooms * 100)
      const occupancyRate = totalRooms > 0 ? Math.round((activeBookings / totalRooms) * 100) : 0;

      // Generate revenue by month from actual booking data
      const last6Months = Array.from({ length: 6 }, (_, i) => {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        return {
          month: date.toLocaleDateString('en-US', { month: 'short' }),
          year: date.getFullYear(),
          monthIndex: date.getMonth(),
          yearValue: date.getFullYear()
        };
      }).reverse();

      // Initialize revenue by month
      const revenueByMonth = last6Months.map(month => ({
        month: month.month,
        revenue: 0
      }));

      // Calculate revenue from bookings for each month
      if (bookings && bookings.length > 0) {
        bookings.forEach(booking => {
          // Only count bookings that are not FAILED or REFUNDED
          if (booking.payment_status === 'FAILED' || booking.payment_status === 'REFUNDED') return;
          
          const bookingDate = new Date(booking.created_at);
          const bookingMonth = bookingDate.toLocaleDateString('en-US', { month: 'short' });
          const bookingYear = bookingDate.getFullYear();
          
          // Find the corresponding month in revenueByMonth
          const monthIndex = last6Months.findIndex(m => 
            m.month === bookingMonth && m.year === bookingYear
          );
          
          if (monthIndex !== -1) {
            revenueByMonth[monthIndex].revenue += booking.total_price || 0;
          }
        });
      }

      // Generate bookings by status data
      const statusCounts = {
        PAID: bookings?.filter(b => b.payment_status === 'PAID').length || 0,
        PENDING: bookings?.filter(b => b.payment_status === 'PENDING').length || 0,
        FAILED: bookings?.filter(b => b.payment_status === 'FAILED').length || 0,
        REFUNDED: bookings?.filter(b => b.payment_status === 'REFUNDED').length || 0,
      };

      const bookingsByStatus = [
        { status: 'Paid', count: statusCounts.PAID, color: '#10b981' },
        { status: 'Pending', count: statusCounts.PENDING, color: '#f59e0b' },
        { status: 'Failed', count: statusCounts.FAILED, color: '#ef4444' },
        { status: 'Refunded', count: statusCounts.REFUNDED, color: '#3b82f6' },
      ];

      // Get recent activity from bookings (real data)
      const recentActivity = bookings?.slice(0, 5).map(booking => {
        // Determine action based on payment status
        let action = '';
        let status = 'success';
        
        switch (booking.payment_status) {
          case 'PAID':
            action = 'Payment received';
            status = 'success';
            break;
          case 'PENDING':
            action = 'Booking confirmed';
            status = 'success';
            break;
          case 'FAILED':
            action = 'Payment failed';
            status = 'error';
            break;
          case 'REFUNDED':
            action = 'Refund processed';
            status = 'error';
            break;
          default:
            action = 'Booking updated';
        }

        // Calculate time ago
        const created = new Date(booking.created_at);
        const now = new Date();
        const diffMs = now.getTime() - created.getTime();
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        
        let time = '';
        if (diffHours < 1) {
          time = 'Just now';
        } else if (diffHours < 24) {
          time = `${diffHours} hours ago`;
        } else {
          const diffDays = Math.floor(diffHours / 24);
          time = `${diffDays} days ago`;
        }

        // Get room name if available
        const roomName = rooms?.find(r => r.id === booking.room_id)?.name || `Room #${booking.room_id}`;
        
        return {
          guest: booking.guest_name,
          room: roomName,
          action,
          time,
          status
        };
      }) || [];

      setStats({
        totalRevenue,
        totalRooms,
        activeBookings,
        occupancyRate,
        totalGuests,
        pendingPayments,
        revenueByMonth,
        bookingsByStatus,
        recentActivity
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
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

  const generateReports = async () => {
    try {
      // Fetch all bookings with room details
      const { data: bookings, error } = await supabase
        .from('bookings')
        .select(`
          *,
          rooms (
            name,
            price
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Convert to CSV
      const headers = [
        'ID',
        'Tanggal Booking',
        'Nama Tamu',
        'Email',
        'Telepon',
        'Kamar',
        'Check-in',
        'Check-out',
        'Malam',
        'Total Harga',
        'Status Pembayaran',
        'Nomor Rekening'
      ];

      const rows = bookings?.map(booking => [
        booking.id,
        new Date(booking.created_at).toLocaleDateString('id-ID'),
        booking.guest_name,
        booking.guest_email,
        booking.guest_phone || '',
        booking.rooms?.name || 'Tidak diketahui',
        new Date(booking.check_in_date).toLocaleDateString('id-ID'),
        new Date(booking.check_out_date).toLocaleDateString('id-ID'),
        Math.ceil((new Date(booking.check_out_date).getTime() - new Date(booking.check_in_date).getTime()) / (1000 * 60 * 60 * 24)),
        formatCurrency(booking.total_price),
        booking.payment_status,
        booking.account_number
      ]) || [];

      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
      ].join('\n');

      // Create download link
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `booking-reports-${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      alert(`Laporan berhasil diunduh. Total ${bookings?.length || 0} data booking.`);
    } catch (error) {
      console.error('Error generating reports:', error);
      alert('Gagal membuat laporan. Silakan coba lagi.');
    }
  };

  const statItems = stats ? [
    { title: 'Total Revenue', value: formatCurrency(stats.totalRevenue), change: '+0%', icon: <DollarSign className="h-5 w-5" />, color: 'bg-green-100 text-green-600' },
    { title: 'Total Rooms', value: stats.totalRooms.toString(), change: '+0 new', icon: <Hotel className="h-5 w-5" />, color: 'bg-blue-100 text-blue-600' },
    { title: 'Active Bookings', value: stats.activeBookings.toString(), change: '+0', icon: <Calendar className="h-5 w-5" />, color: 'bg-purple-100 text-purple-600' },
    { title: 'Occupancy Rate', value: `${stats.occupancyRate}%`, change: '+0%', icon: <TrendingUp className="h-5 w-5" />, color: 'bg-orange-100 text-orange-600' },
    { title: 'Total Guests', value: stats.totalGuests.toString(), change: '+0', icon: <Users className="h-5 w-5" />, color: 'bg-cyan-100 text-cyan-600' },
    { title: 'Pending Payments', value: stats.pendingPayments.toString(), change: '+0', icon: <CreditCard className="h-5 w-5" />, color: 'bg-red-100 text-red-600' },
  ] : [];

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard Overview</h1>
        <p className="text-gray-600">Welcome back! Here's what's happening with your hotel today.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {statItems.map((stat, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                {stat.title}
              </CardTitle>
              <div className={`p-2 rounded-full ${stat.color}`}>
                {stat.icon}
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-gray-500 mt-1">
                <span className="text-gray-500">{stat.change}</span> from last month
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts */}
      {stats && (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Monthly Revenue Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Monthly Revenue</CardTitle>
                <CardDescription>Total revenue for the past 6 months</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stats.revenueByMonth}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip formatter={(value) => [formatCurrency(Number(value)), 'Revenue']} />
                      <Legend />
                      <Bar dataKey="revenue" fill="#8884d8" name="Revenue" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Bookings by Status Pie Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Bookings by Status</CardTitle>
                <CardDescription>Distribution of bookings by payment status</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={stats.bookingsByStatus}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ payload, percent }) => {
                          const status = payload?.status || 'Unknown';
                          return `${status}: ${((percent || 0) * 100).toFixed(0)}%`;
                        }}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="count"
                      >
                        {stats.bookingsByStatus.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value, name) => [`${value} bookings`, name]} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity & Quick Actions */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Latest bookings and updates</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {stats.recentActivity.map((activity, index) => (
                    <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <p className="font-medium">{activity.guest}</p>
                        <p className="text-sm text-gray-500">{activity.room} • {activity.action}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-500">{activity.time}</p>
                        <span className={`inline-block px-2 py-1 text-xs rounded-full ${activity.status === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                          {activity.status === 'success' ? 'Completed' : 'Cancelled'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>Common admin tasks</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Link href="/admin/rooms">
                    <Button className="w-full justify-start" variant="outline">
                      <Hotel className="mr-2 h-4 w-4" />
                      Add New Room
                    </Button>
                  </Link>
                  <Link href="/admin/bookings">
                    <Button className="w-full justify-start" variant="outline">
                      <Calendar className="mr-2 h-4 w-4" />
                      Create Manual Booking
                    </Button>
                  </Link>
                  <Link href="/admin/bookings">
                    <Button className="w-full justify-start" variant="outline">
                      <CreditCard className="mr-2 h-4 w-4" />
                      Process Payments
                    </Button>
                  </Link>
                  <Link href="/admin/bookings">
                    <Button className="w-full justify-start" variant="outline">
                      <Users className="mr-2 h-4 w-4" />
                      Manage Guests
                    </Button>
                  </Link>
                  <Button 
                    className="w-full justify-start" 
                    variant="outline"
                    onClick={generateReports}
                  >
                    <FileDown className="mr-2 h-4 w-4" />
                    Generate Reports
                  </Button>
                </div>
                <div className="mt-6 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <h4 className="text-sm font-medium text-blue-800 mb-1">Bank Account Information</h4>
                  <p className="text-sm text-blue-700">{BANK_ACCOUNT_NUMBER}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
