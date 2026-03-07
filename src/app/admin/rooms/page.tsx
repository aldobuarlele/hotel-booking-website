'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { supabase } from '@/lib/supabase';
import { Hotel, Plus, Edit, Trash2, Upload, Image as ImageIcon, Loader2 } from 'lucide-react';
import { MAX_FILE_SIZE_BYTES, VALID_FILE_TYPES, MAX_FILE_SIZE_MB, DB_TABLES, DEFAULT_LOCALE, ROOM_STATUS, SUPABASE_BUCKETS } from '@/lib/config';

type Room = {
  id: number;
  name: string;
  description: string | null;
  price: number;
  quota: number;
  photo_path: string;
  status: 'AVAILABLE' | 'TEMPORARILY_RESERVED' | 'INQUIRY_ONLY';
  created_at: string;
  updated_at: string;
};

type RoomFormData = {
  name: string;
  description: string;
  price: string;
  quota: string;
  photo_file: File | null;
};

export default function RoomManagementPage() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentRoom, setCurrentRoom] = useState<Room | null>(null);
  const [formData, setFormData] = useState<RoomFormData>({
    name: '',
    description: '',
    price: '',
    quota: '',
    photo_file: null,
  });
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string>('');

  // Fetch rooms from Supabase
  useEffect(() => {
    fetchRooms();
  }, []);

  const fetchRooms = async () => {
    try {
      const { data, error } = await supabase
        .from(DB_TABLES.ROOMS)
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRooms(data || []);
    } catch (error) {
      console.error('Error fetching rooms:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\./g, '');
    
    // Only allow numbers
    if (value === '' || /^\d+$/.test(value)) {
      // Store the numeric value (without formatting)
      setFormData(prev => ({ ...prev, price: value }));
    }
  };

  const handleQuotaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    
    // Only allow positive numbers, including zero
    if (value === '' || /^\d+$/.test(value)) {
      const numValue = parseInt(value);
      // Allow empty string or any positive number (including 0)
      if (value === '' || numValue >= 0) {
        setFormData(prev => ({ ...prev, quota: value }));
      }
    }
  };

  const formatPriceDisplay = (price: string) => {
    if (!price) return '';
    return price.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  };

  const formatQuotaDisplay = (quota: string) => {
    if (!quota) return '';
    return quota;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setFormData(prev => ({ ...prev, photo_file: file }));

    if (file) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    } else {
      setPreviewUrl('');
    }
  };

  const handleOpenCreateDialog = () => {
    setIsEditing(false);
    setCurrentRoom(null);
    setFormData({
      name: '',
      description: '',
      price: '',
      quota: '',
      photo_file: null,
    });
    setPreviewUrl('');
    setIsDialogOpen(true);
  };

  const handleOpenEditDialog = (room: Room) => {
    setIsEditing(true);
    setCurrentRoom(room);
    setFormData({
      name: room.name,
      description: room.description || '',
      price: room.price.toString(),
      quota: room.quota.toString(),
      photo_file: null,
    });
    setPreviewUrl(room.photo_path || '');
    setIsDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.price || !formData.quota) {
      alert('Nama, harga, dan kuota wajib diisi');
      return;
    }

    // Validate photo for new room
    if (!isEditing && !formData.photo_file) {
      alert('Foto kamar wajib diisi untuk kamar baru');
      return;
    }

    setUploading(true);
    try {
      let photoPath = currentRoom?.photo_path || '';

      // Upload file if new file selected
      if (formData.photo_file) {
        const file = formData.photo_file;
        
        // Validate file size using config constant
        if (file.size > MAX_FILE_SIZE_BYTES) {
          alert(`Ukuran file terlalu besar. Maksimal ${MAX_FILE_SIZE_MB}MB.`);
          setUploading(false);
          return;
        }

        // Validate file type using config constant
        if (!VALID_FILE_TYPES.includes(file.type)) {
          alert(`Format file tidak didukung. Gunakan ${VALID_FILE_TYPES.map(t => t.split('/')[1]).join(', ').toUpperCase()}.`);
          setUploading(false);
          return;
        }

        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
        const filePath = `room-photos/${fileName}`;

        console.log('Uploading file:', filePath, file.type, file.size);
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from(SUPABASE_BUCKETS.ROOM_PHOTOS)
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false
          });

        if (uploadError) {
          console.error('Upload error:', uploadError);
          throw new Error(`Gagal upload foto: ${uploadError.message}`);
        }

        console.log('Upload successful:', uploadData);

        // Get public URL
        const { data: urlData } = supabase.storage
          .from(SUPABASE_BUCKETS.ROOM_PHOTOS)
          .getPublicUrl(filePath);

        console.log('Public URL:', urlData);
        photoPath = urlData.publicUrl;
      }

      const roomData = {
        name: formData.name,
        description: formData.description,
        price: parseFloat(formData.price),
        quota: parseInt(formData.quota),
        photo_path: photoPath,
        status: ROOM_STATUS.AVAILABLE,
      };

      console.log('Saving room data:', roomData);

      if (isEditing && currentRoom) {
        // Update existing room
        const { data, error } = await supabase
          .from(DB_TABLES.ROOMS)
          .update(roomData)
          .eq('id', currentRoom.id)
          .select();

        if (error) throw error;
        console.log('Update successful:', data);
      } else {
        // Create new room
        const { data, error } = await supabase
          .from(DB_TABLES.ROOMS)
          .insert(roomData)
          .select();

        if (error) throw error;
        console.log('Create successful:', data);
      }

      // Refresh rooms list
      await fetchRooms();
      setIsDialogOpen(false);
      setFormData({
        name: '',
        description: '',
        price: '',
        quota: '',
        photo_file: null,
      });
      setPreviewUrl('');
      
      alert(isEditing ? 'Kamar berhasil diperbarui!' : 'Kamar baru berhasil ditambahkan!');
    } catch (error: any) {
      console.error('Error saving room:', error);
      alert(`Gagal menyimpan kamar: ${error.message || 'Silakan coba lagi.'}`);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (roomId: number) => {
    if (!confirm('Apakah Anda yakin ingin menghapus kamar ini?')) return;

    try {
      const { error } = await supabase
        .from(DB_TABLES.ROOMS)
        .delete()
        .eq('id', roomId);

      if (error) throw error;

      // Refresh rooms list
      await fetchRooms();
    } catch (error) {
      console.error('Error deleting room:', error);
      alert('Gagal menghapus kamar. Silakan coba lagi.');
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat(DEFAULT_LOCALE, {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Manajemen Kamar</h1>
        <p className="text-gray-600">Kelola daftar kamar hotel, termasuk menambah, mengedit, dan menghapus.</p>
      </div>

      {/* Action Bar */}
      <div className="mb-6 flex justify-between items-center">
        <div className="text-sm text-gray-500">
          Total {rooms.length} kamar
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleOpenCreateDialog}>
              <Plus className="mr-2 h-4 w-4" />
              Tambah Kamar Baru
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>{isEditing ? 'Edit Kamar' : 'Tambah Kamar Baru'}</DialogTitle>
              <DialogDescription>
                Isi detail kamar di bawah ini. Semua field wajib diisi kecuali deskripsi.
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <label htmlFor="name" className="text-sm font-medium">Nama Kamar *</label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Contoh: Suite Deluxe"
                />
              </div>

              <div className="grid gap-2">
                <label htmlFor="description" className="text-sm font-medium">Deskripsi</label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  placeholder="Deskripsi fasilitas kamar..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <label htmlFor="price" className="text-sm font-medium">Harga per Malam *</label>
                  <Input
                    id="price"
                    name="price"
                    value={formatPriceDisplay(formData.price)}
                    onChange={handlePriceChange}
                    placeholder="Contoh: 500.000"
                  />
                  <p className="text-xs text-gray-500">Format otomatis: 300000 → 300.000</p>
                </div>
                <div className="grid gap-2">
                  <label htmlFor="quota" className="text-sm font-medium">Kuota Kamar *</label>
                  <Input
                    id="quota"
                    name="quota"
                    type="number"
                    value={formData.quota}
                    onChange={handleQuotaChange}
                    placeholder="Contoh: 5"
                    min="0"
                  />
                  <p className="text-xs text-gray-500">Minimal 0 (tidak boleh minus)</p>
                </div>
              </div>

              <div className="grid gap-2">
                <label htmlFor="photo" className="text-sm font-medium">Foto Kamar *</label>
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <Input
                      id="photo"
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="cursor-pointer"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Upload foto kamar (JPG, PNG, maks 5MB)
                    </p>
                  </div>
                </div>

                {/* Preview */}
                {(previewUrl || currentRoom?.photo_path) && (
                  <div className="mt-4">
                    <p className="text-sm font-medium mb-2">Preview:</p>
                    <div className="relative w-32 h-32 border rounded-lg overflow-hidden">
                      <img
                        src={previewUrl || currentRoom?.photo_path || ''}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
                disabled={uploading}
              >
                Batal
              </Button>
              <Button onClick={handleSubmit} disabled={uploading}>
                {uploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isEditing ? 'Perbarui Kamar' : 'Simpan Kamar'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Rooms List */}
      <Card>
        <CardHeader>
          <CardTitle>Daftar Kamar</CardTitle>
          <CardDescription>
            Semua kamar yang tersedia di sistem. Klik edit untuk mengubah atau hapus untuk menghapus.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
          ) : rooms.length === 0 ? (
            <div className="text-center py-8">
              <Hotel className="h-12 w-12 mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Belum ada kamar</h3>
              <p className="text-gray-500 mb-4">Mulai dengan menambahkan kamar pertama Anda.</p>
              <Button onClick={handleOpenCreateDialog}>
                <Plus className="mr-2 h-4 w-4" />
                Tambah Kamar Pertama
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Nama</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Harga</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Kuota</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Status</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Foto</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {rooms.map((room) => (
                    <tr key={room.id} className="border-b hover:bg-gray-50">
                      <td className="py-4 px-4">
                        <div>
                          <p className="font-medium">{room.name}</p>
                          {room.description && (
                            <p className="text-sm text-gray-500 truncate max-w-xs">{room.description}</p>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-4">{formatCurrency(room.price)}</td>
                      <td className="py-4 px-4">{room.quota}</td>
                      <td className="py-4 px-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          room.status === ROOM_STATUS.AVAILABLE 
                            ? 'bg-green-100 text-green-800' 
                            : room.status === ROOM_STATUS.TEMPORARILY_RESERVED
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {room.status === ROOM_STATUS.AVAILABLE ? 'Tersedia' : 
                           room.status === ROOM_STATUS.TEMPORARILY_RESERVED ? 'Sementara Dipesan' : 'Hanya Inquiry'}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        {room.photo_path ? (
                          <div className="w-12 h-12 rounded overflow-hidden border">
                            <img
                              src={room.photo_path}
                              alt={room.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ) : (
                          <div className="w-12 h-12 rounded border flex items-center justify-center bg-gray-100">
                            <ImageIcon className="h-5 w-5 text-gray-400" />
                          </div>
                        )}
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenEditDialog(room)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={() => handleDelete(room.id)}
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

      {/* Storage Bucket Note */}
      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h3 className="text-sm font-medium text-blue-800 mb-2">Catatan Upload File</h3>
        <p className="text-sm text-blue-700">
          Foto kamar di-upload ke bucket Supabase Storage bernama <code className="bg-blue-100 px-1 py-0.5 rounded">room-photos</code>.
          Pastikan bucket tersebut sudah dibuat di dashboard Supabase sebelum mengupload foto.
        </p>
      </div>
    </div>
  );
}