'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function TestDBPage() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState<string>('');
  const [data, setData] = useState<any[] | null>(null);

  useEffect(() => {
    const testConnection = async () => {
      try {
        // Test Supabase connection by querying rooms table
        const { data: roomsData, error } = await supabase
          .from('rooms')
          .select('*')
          .limit(5);

        if (error) {
          throw error;
        }

        // If we get here, connection is successful
        setStatus('success');
        setMessage('✅ Koneksi Database Berhasil!');
        setData(roomsData || []);
      } catch (err: any) {
        setStatus('error');
        setMessage(`❌ Error: ${err.message || 'Tidak dapat terhubung ke database'}`);
        console.error('Database connection error:', err);
      }
    };

    testConnection();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">Halaman Pengujian Database</h1>
        <p className="text-gray-600 mb-8">
          Halaman ini menguji koneksi ke database Supabase dengan melakukan query sederhana ke tabel rooms.
        </p>

        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-2">Status Koneksi</h2>
            <div className="flex items-center space-x-3">
              <div className={`w-3 h-3 rounded-full ${
                status === 'loading' ? 'bg-yellow-500 animate-pulse' :
                status === 'success' ? 'bg-green-500' :
                'bg-red-500'
              }`} />
              <span className={`font-medium ${
                status === 'loading' ? 'text-yellow-600' :
                status === 'success' ? 'text-green-600' :
                'text-red-600'
              }`}>
                {status === 'loading' ? 'Menguji koneksi...' :
                 status === 'success' ? 'Terhubung' :
                 'Gagal terhubung'}
              </span>
            </div>
          </div>

          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Hasil</h2>
            <div className={`text-center py-8 rounded-lg ${
              status === 'success' ? 'bg-green-50 border border-green-200' :
              status === 'error' ? 'bg-red-50 border border-red-200' :
              'bg-gray-50 border border-gray-200'
            }`}>
              {status === 'loading' ? (
                <div className="space-y-4">
                  <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-gray-600" />
                  <p className="text-gray-700">Menghubungkan ke database...</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className={`text-5xl font-bold ${
                    status === 'success' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {status === 'success' ? '✅' : '❌'}
                  </div>
                  <p className={`text-2xl font-bold ${
                    status === 'success' ? 'text-green-700' : 'text-red-700'
                  }`}>
                    {message}
                  </p>
                </div>
              )}
            </div>
          </div>

          {status === 'success' && data && (
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Data Rooms (Contoh)</h2>
              {data.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full bg-white border border-gray-200 rounded-lg">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="py-3 px-4 border-b text-left text-gray-700 font-medium">ID</th>
                        <th className="py-3 px-4 border-b text-left text-gray-700 font-medium">Nama</th>
                        <th className="py-3 px-4 border-b text-left text-gray-700 font-medium">Kuota</th>
                        <th className="py-3 px-4 border-b text-left text-gray-700 font-medium">Harga</th>
                        <th className="py-3 px-4 border-b text-left text-gray-700 font-medium">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.map((room) => (
                        <tr key={room.id} className="hover:bg-gray-50">
                          <td className="py-3 px-4 border-b">{room.id}</td>
                          <td className="py-3 px-4 border-b">{room.name}</td>
                          <td className="py-3 px-4 border-b">{room.quota}</td>
                          <td className="py-3 px-4 border-b">{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(room.price)}</td>
                          <td className="py-3 px-4 border-b">
                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                              room.status === 'AVAILABLE' ? 'bg-green-100 text-green-800' :
                              room.status === 'TEMPORARILY_RESERVED' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-blue-100 text-blue-800'
                            }`}>
                              {room.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8 bg-gray-50 rounded-lg border border-gray-200">
                  <p className="text-gray-600">Tabel rooms kosong atau belum ada data.</p>
                  <p className="text-gray-500 text-sm mt-2">Koneksi berhasil tetapi tidak ada data yang ditemukan.</p>
                </div>
              )}
            </div>
          )}

          {status === 'error' && (
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Pemecahan Masalah</h2>
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <p className="text-gray-700 mb-3">Kemungkinan penyebab error:</p>
                <ul className="list-disc pl-5 space-y-2 text-gray-600">
                  <li>Variabel environment <code className="bg-gray-100 px-1 py-0.5 rounded">NEXT_PUBLIC_SUPABASE_URL</code> dan <code className="bg-gray-100 px-1 py-0.5 rounded">NEXT_PUBLIC_SUPABASE_ANON_KEY</code> belum diisi di file <code className="bg-gray-100 px-1 py-0.5 rounded">.env.local</code></li>
                  <li>Tabel <code className="bg-gray-100 px-1 py-0.5 rounded">rooms</code> belum dibuat di database Supabase</li>
                  <li>Kunci API (anon key) tidak valid atau tidak memiliki izin akses</li>
                  <li>URL Supabase tidak valid atau proyek belum dibuat</li>
                </ul>
                <p className="text-gray-700 mt-4">
                  Pastikan untuk menjalankan SQL schema di Supabase dashboard terlebih dahulu sebelum menguji koneksi.
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-blue-800 mb-3">Informasi</h3>
          <p className="text-blue-700 mb-3">
            Halaman ini hanya untuk pengujian koneksi database. Setelah koneksi berhasil, halaman ini dapat dihapus atau diabaikan.
          </p>
          <p className="text-blue-600 text-sm">
            File pengujian: <code className="bg-blue-100 px-1 py-0.5 rounded">src/app/test-db/page.tsx</code>
          </p>
        </div>
      </div>
    </div>
  );
}