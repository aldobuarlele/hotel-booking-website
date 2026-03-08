'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Loader2, Plus, Edit, Trash2, Wifi, Tv, Coffee, Bath, Wind, Utensils, Car, Dumbbell } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { showSuccessToast, showErrorToast } from '@/lib/toast';

type Amenity = {
  id: number;
  name: string;
  icon_name: string;
  created_at: string;
};

type AmenityFormData = {
  name: string;
  icon_name: string;
};

const COMMON_ICONS = [
  { value: 'wifi', label: 'WiFi', icon: <Wifi className="h-4 w-4" /> },
  { value: 'tv', label: 'TV', icon: <Tv className="h-4 w-4" /> },
  { value: 'coffee', label: 'Coffee', icon: <Coffee className="h-4 w-4" /> },
  { value: 'bath', label: 'Bath', icon: <Bath className="h-4 w-4" /> },
  { value: 'wind', label: 'AC', icon: <Wind className="h-4 w-4" /> },
  { value: 'utensils', label: 'Restaurant', icon: <Utensils className="h-4 w-4" /> },
  { value: 'car', label: 'Parking', icon: <Car className="h-4 w-4" /> },
  { value: 'dumbbell', label: 'Gym', icon: <Dumbbell className="h-4 w-4" /> },
];

const getIconComponent = (iconName: string) => {
  const icon = COMMON_ICONS.find(i => i.value === iconName);
  return icon ? icon.icon : <Wifi className="h-4 w-4" />;
};

const getIconLabel = (iconName: string) => {
  const icon = COMMON_ICONS.find(i => i.value === iconName);
  return icon ? icon.label : iconName;
};

export default function AmenitiesPage() {
  const [amenities, setAmenities] = useState<Amenity[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentAmenity, setCurrentAmenity] = useState<Amenity | null>(null);
  const [formData, setFormData] = useState<AmenityFormData>({
    name: '',
    icon_name: 'wifi',
  });
  const [saving, setSaving] = useState(false);

  // Fetch amenities
  useEffect(() => {
    fetchAmenities();
  }, []);

  const fetchAmenities = async () => {
    try {
      const { data, error } = await supabase
        .from('amenities')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAmenities(data || []);
    } catch (error) {
      console.error('Error fetching amenities:', error);
      showErrorToast(error, 'Gagal mengambil fasilitas');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleOpenCreateDialog = () => {
    setIsEditing(false);
    setCurrentAmenity(null);
    setFormData({
      name: '',
      icon_name: 'wifi',
    });
    setIsDialogOpen(true);
  };

  const handleOpenEditDialog = (amenity: Amenity) => {
    setIsEditing(true);
    setCurrentAmenity(amenity);
    setFormData({
      name: amenity.name,
      icon_name: amenity.icon_name,
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      alert('Nama fasilitas wajib diisi');
      return;
    }

    if (!formData.icon_name.trim()) {
      alert('Icon name wajib diisi');
      return;
    }

    setSaving(true);
    try {
      const amenityData = {
        name: formData.name.trim(),
        icon_name: formData.icon_name,
      };

      if (isEditing && currentAmenity) {
        const { error } = await supabase
          .from('amenities')
          .update(amenityData)
          .eq('id', currentAmenity.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('amenities')
          .insert(amenityData);

        if (error) throw error;
      }

      // Refresh amenities list
      await fetchAmenities();
      setIsDialogOpen(false);
      
      showSuccessToast(isEditing ? 'Fasilitas berhasil diperbarui' : 'Fasilitas baru berhasil ditambahkan');
    } catch (error: unknown) {
      console.error('Error saving amenity:', error);
      showErrorToast(error, 'Gagal menyimpan fasilitas');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Apakah Anda yakin ingin menghapus fasilitas ini?')) return;

    try {
      const { error } = await supabase
        .from('amenities')
        .delete()
        .eq('id', id);

      if (error) throw error;

      // Refresh amenities list
      await fetchAmenities();
      showSuccessToast('Fasilitas berhasil dihapus');
    } catch (error) {
      console.error('Error deleting amenity:', error);
      showErrorToast(error, 'Gagal menghapus fasilitas');
    }
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Fasilitas Kamar</h1>
        <p className="text-gray-600">Kelola daftar fasilitas yang tersedia di kamar hotel.</p>
      </div>

      {/* Action Bar */}
      <div className="mb-6 flex justify-between items-center">
        <div className="text-sm text-gray-500">
          Total {amenities.length} fasilitas
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleOpenCreateDialog}>
              <Plus className="mr-2 h-4 w-4" />
              Tambah Fasilitas Baru
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>{isEditing ? 'Edit Fasilitas' : 'Tambah Fasilitas Baru'}</DialogTitle>
              <DialogDescription>
                Isi detail fasilitas. Nama fasilitas dan icon wajib diisi.
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Nama Fasilitas *</Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Contoh: WiFi Cepat"
                  required
                />
                <p className="text-xs text-gray-500">
                  Nama fasilitas yang akan ditampilkan kepada pengguna
                </p>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="icon_name">Icon *</Label>
                <select
                  id="icon_name"
                  name="icon_name"
                  value={formData.icon_name}
                  onChange={handleSelectChange}
                  className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {COMMON_ICONS.map(icon => (
                    <option key={icon.value} value={icon.value}>
                      {icon.label} ({icon.value})
                    </option>
                  ))}
                </select>
                <div className="flex items-center gap-2 mt-2">
                  <div className="p-2 border rounded-lg">
                    {getIconComponent(formData.icon_name)}
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">
                      Icon yang dipilih: <span className="font-medium">{getIconLabel(formData.icon_name)}</span>
                    </p>
                    <p className="text-xs text-gray-500">
                      Nama icon: <code className="bg-gray-100 px-1">{formData.icon_name}</code>
                    </p>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Gunakan nama icon dari Lucide React. Pastikan icon tersedia di library.
                </p>
              </div>

              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <h4 className="text-sm font-medium text-blue-800 mb-1">Catatan Icon</h4>
                <p className="text-xs text-blue-700">
                  Icon akan digunakan untuk menampilkan fasilitas di frontend. Pastikan icon name sesuai dengan nama icon di Lucide React.
                </p>
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
                disabled={saving}
              >
                Batal
              </Button>
              <Button onClick={handleSubmit} disabled={saving}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isEditing ? 'Perbarui Fasilitas' : 'Simpan Fasilitas'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Amenities List */}
      <Card>
        <CardHeader>
          <CardTitle>Daftar Fasilitas</CardTitle>
          <CardDescription>
            Semua fasilitas yang tersedia di kamar hotel. Klik edit untuk mengubah atau hapus untuk menghapus.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
          ) : amenities.length === 0 ? (
            <div className="text-center py-8">
              <Wifi className="h-12 w-12 mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Belum ada fasilitas</h3>
              <p className="text-gray-500 mb-4">Mulai dengan menambahkan fasilitas pertama Anda.</p>
              <Button onClick={handleOpenCreateDialog}>
                <Plus className="mr-2 h-4 w-4" />
                Tambah Fasilitas Pertama
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Icon</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Nama Fasilitas</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Icon Name</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Tanggal Dibuat</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {amenities.map((amenity) => (
                    <tr key={amenity.id} className="border-b hover:bg-gray-50">
                      <td className="py-4 px-4">
                        <div className="p-3 border rounded-lg inline-flex items-center justify-center bg-gray-50">
                          {getIconComponent(amenity.icon_name)}
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <p className="font-medium text-gray-900">{amenity.name}</p>
                      </td>
                      <td className="py-4 px-4">
                        <code className="text-sm bg-gray-100 px-2 py-1 rounded">
                          {amenity.icon_name}
                        </code>
                      </td>
                      <td className="py-4 px-4">
                        <p className="text-sm text-gray-600">
                          {new Date(amenity.created_at).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </p>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenEditDialog(amenity)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={() => handleDelete(amenity.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
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

      <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
        {COMMON_ICONS.map(icon => (
          <div key={icon.value} className="p-4 border rounded-lg flex flex-col items-center">
            <div className="p-3 rounded-full bg-gray-100 mb-2">
              {icon.icon}
            </div>
            <p className="text-sm font-medium text-gray-900">{icon.label}</p>
            <p className="text-xs text-gray-500">{icon.value}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h3 className="text-sm font-medium text-blue-800 mb-2">Panduan Icon</h3>
        <ul className="text-sm text-blue-700 space-y-1">
          <li><strong>Nama Icon</strong>: Harus sesuai dengan nama icon di Lucide React (contoh: 'wifi', 'tv', 'coffee')</li>
          <li><strong>Pemilihan Icon</strong>: Pilih icon yang merepresentasikan fasilitas dengan jelas</li>
          <li><strong>Konsistensi</strong>: Gunakan icon yang konsisten untuk fasilitas serupa</li>
        </ul>
        <p className="text-xs text-blue-600 mt-2">
          Lihat dokumentasi Lucide React untuk daftar icon lengkap: 
          <a href="https://lucide.dev/icons" target="_blank" rel="noopener noreferrer" className="underline ml-1">
            https://lucide.dev/icons
          </a>
        </p>
      </div>
    </div>
  );
}