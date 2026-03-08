'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Save } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { showSuccessToast, showErrorToast } from '@/lib/toast';

type GlobalSettings = {
  id: number;
  app_name: string;
  hotel_name: string;
  bank_account_number: string;
  max_file_size_mb: number;
  currency: string;
  contact_email: string | null;
  contact_phone: string | null;
  updated_at: string;
};

export default function GlobalSettingsPage() {
  const [settings, setSettings] = useState<GlobalSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<Partial<GlobalSettings>>({});

  // Fetch global settings
  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('global_settings')
        .select('*')
        .eq('id', 1)
        .single();

      if (error) throw error;
      
      setSettings(data);
      setFormData(data);
    } catch (error) {
      console.error('Error fetching global settings:', error);
      showErrorToast(error, 'Gagal mengambil pengaturan global');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const numValue = parseInt(value, 10);
    if (!isNaN(numValue) && numValue > 0) {
      setFormData(prev => ({ ...prev, [name]: numValue }));
    } else if (value === '') {
      setFormData(prev => ({ ...prev, [name]: 0 }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const { error } = await supabase
        .from('global_settings')
        .update({
          app_name: formData.app_name,
          hotel_name: formData.hotel_name,
          bank_account_number: formData.bank_account_number,
          max_file_size_mb: formData.max_file_size_mb,
          currency: formData.currency,
          contact_email: formData.contact_email || null,
          contact_phone: formData.contact_phone || null,
        })
        .eq('id', 1);

      if (error) throw error;

      // Refresh settings
      await fetchSettings();
      showSuccessToast('Pengaturan global berhasil disimpan');
    } catch (error) {
      console.error('Error saving global settings:', error);
      showErrorToast(error, 'Gagal menyimpan pengaturan global');
    } finally {
      setSaving(false);
    }
  };

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
        <h1 className="text-3xl font-bold text-gray-900">Pengaturan Global</h1>
        <p className="text-gray-600">Kelola pengaturan umum sistem hotel booking.</p>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Informasi Aplikasi</CardTitle>
            <CardDescription>Pengaturan dasar aplikasi dan hotel</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="app_name">Nama Aplikasi</Label>
                <Input
                  id="app_name"
                  name="app_name"
                  value={formData.app_name || ''}
                  onChange={handleInputChange}
                  placeholder="Hotel Booking System"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="hotel_name">Nama Hotel</Label>
                <Input
                  id="hotel_name"
                  name="hotel_name"
                  value={formData.hotel_name || ''}
                  onChange={handleInputChange}
                  placeholder="LuxuryStay"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="currency">Mata Uang</Label>
                <Input
                  id="currency"
                  name="currency"
                  value={formData.currency || ''}
                  onChange={handleInputChange}
                  placeholder="IDR"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="max_file_size_mb">
                  Ukuran File Maksimal (MB)
                </Label>
                <Input
                  id="max_file_size_mb"
                  name="max_file_size_mb"
                  type="number"
                  min="1"
                  value={formData.max_file_size_mb || 2}
                  onChange={handleNumberChange}
                  required
                />
                <p className="text-xs text-gray-500">
                  Ukuran maksimal file upload dalam megabytes
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Informasi Kontak</CardTitle>
            <CardDescription>Detail kontak untuk hotel</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="contact_email">Email Kontak</Label>
                <Input
                  id="contact_email"
                  name="contact_email"
                  type="email"
                  value={formData.contact_email || ''}
                  onChange={handleInputChange}
                  placeholder="contact@hotel.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contact_phone">Telepon Kontak</Label>
                <Input
                  id="contact_phone"
                  name="contact_phone"
                  value={formData.contact_phone || ''}
                  onChange={handleInputChange}
                  placeholder="+62 812-3456-7890"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Informasi Bank</CardTitle>
            <CardDescription>Detail rekening bank untuk pembayaran</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="bank_account_number">Nomor Rekening Bank</Label>
              <Input
                id="bank_account_number"
                name="bank_account_number"
                value={formData.bank_account_number || ''}
                onChange={handleInputChange}
                placeholder="BCA 1234567890 a.n. Hotel Booking"
                required
              />
              <p className="text-xs text-gray-500">
                Format: Nama Bank NomorRekening a.n. Pemilik Rekening
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="mt-8 flex justify-end">
          <Button type="submit" disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Menyimpan...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Simpan Pengaturan
              </>
            )}
          </Button>
        </div>
      </form>

      {settings && (
        <div className="mt-8 p-4 bg-gray-50 border border-gray-200 rounded-lg">
          <h3 className="text-sm font-medium text-gray-800 mb-2">Info Terakhir Diperbarui</h3>
          <p className="text-sm text-gray-600">
            Terakhir diperbarui: {new Date(settings.updated_at).toLocaleDateString('id-ID', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </p>
        </div>
      )}
    </div>
  );
}