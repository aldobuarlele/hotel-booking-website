'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Loader2, Plus, Edit, Trash2, Globe, Eye, EyeOff } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { showSuccessToast, showErrorToast } from '@/lib/toast';

type LandingPageContent = {
  id: number;
  section_key: string;
  title: string | null;
  subtitle: string | null;
  image_url: string | null;
  is_active: boolean;
  updated_at: string;
};

type LandingPageFormData = {
  section_key: string;
  title: string;
  subtitle: string;
  image_url: string;
};

const SECTION_KEYS = [
  { value: 'HERO', label: 'Hero Section' },
  { value: 'ABOUT', label: 'About Section' },
  { value: 'PROMO', label: 'Promo Section' },
];

export default function LandingPageEditor() {
  const [contents, setContents] = useState<LandingPageContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentContent, setCurrentContent] = useState<LandingPageContent | null>(null);
  const [formData, setFormData] = useState<LandingPageFormData>({
    section_key: 'HERO',
    title: '',
    subtitle: '',
    image_url: '',
  });
  const [saving, setSaving] = useState(false);

  // Fetch landing page contents
  useEffect(() => {
    fetchContents();
  }, []);

  const fetchContents = async () => {
    try {
      const { data, error } = await supabase
        .from('landing_page_content')
        .select('*')
        .order('section_key', { ascending: true });

      if (error) throw error;
      setContents(data || []);
    } catch (error) {
      console.error('Error fetching landing page contents:', error);
      showErrorToast(error, 'Gagal mengambil konten landing page');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleOpenCreateDialog = () => {
    setIsEditing(false);
    setCurrentContent(null);
    setFormData({
      section_key: 'HERO',
      title: '',
      subtitle: '',
      image_url: '',
    });
    setIsDialogOpen(true);
  };

  const handleOpenEditDialog = (content: LandingPageContent) => {
    setIsEditing(true);
    setCurrentContent(content);
    setFormData({
      section_key: content.section_key,
      title: content.title || '',
      subtitle: content.subtitle || '',
      image_url: content.image_url || '',
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.section_key || !formData.title) {
      alert('Section key dan title wajib diisi');
      return;
    }

    setSaving(true);
    try {
      const contentData = {
        section_key: formData.section_key,
        title: formData.title,
        subtitle: formData.subtitle,
        image_url: formData.image_url,
        is_active: true,
      };

      if (isEditing && currentContent) {
        // Check if section_key is being changed and if it conflicts with existing
        if (formData.section_key !== currentContent.section_key) {
          const { data: existing } = await supabase
            .from('landing_page_content')
            .select('id')
            .eq('section_key', formData.section_key)
            .single();

          if (existing) {
            alert('Section key sudah digunakan. Pilih section key lain.');
            setSaving(false);
            return;
          }
        }

        const { error } = await supabase
          .from('landing_page_content')
          .update(contentData)
          .eq('id', currentContent.id);

        if (error) throw error;
      } else {
        // Create new content
        const { error } = await supabase
          .from('landing_page_content')
          .insert(contentData);

        if (error) throw error;
      }

      // Refresh contents list
      await fetchContents();
      setIsDialogOpen(false);
      
      showSuccessToast(isEditing ? 'Konten berhasil diperbarui' : 'Konten baru berhasil ditambahkan');
    } catch (error: unknown) {
      console.error('Error saving landing page content:', error);
      showErrorToast(error, 'Gagal menyimpan konten');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Apakah Anda yakin ingin menghapus konten ini?')) return;

    try {
      const { error } = await supabase
        .from('landing_page_content')
        .delete()
        .eq('id', id);

      if (error) throw error;

      // Refresh contents list
      await fetchContents();
      showSuccessToast('Konten berhasil dihapus');
    } catch (error) {
      console.error('Error deleting content:', error);
      showErrorToast(error, 'Gagal menghapus konten');
    }
  };

  const handleToggleActive = async (content: LandingPageContent) => {
    try {
      const { error } = await supabase
        .from('landing_page_content')
        .update({ is_active: !content.is_active })
        .eq('id', content.id);

      if (error) throw error;

      // Refresh contents list
      await fetchContents();
      showSuccessToast(`Konten ${!content.is_active ? 'diaktifkan' : 'dinonaktifkan'}`);
    } catch (error) {
      console.error('Error toggling content active status:', error);
      showErrorToast(error, 'Gagal mengubah status konten');
    }
  };

  const getSectionLabel = (key: string) => {
    const section = SECTION_KEYS.find(s => s.value === key);
    return section ? section.label : key;
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Landing Page Editor</h1>
        <p className="text-gray-600">Kelola konten untuk berbagai section di halaman utama website.</p>
      </div>

      {/* Action Bar */}
      <div className="mb-6 flex justify-between items-center">
        <div className="text-sm text-gray-500">
          Total {contents.length} konten
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleOpenCreateDialog}>
              <Plus className="mr-2 h-4 w-4" />
              Tambah Konten Baru
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>{isEditing ? 'Edit Konten' : 'Tambah Konten Baru'}</DialogTitle>
              <DialogDescription>
                Isi detail konten landing page. Section key dan title wajib diisi.
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="section_key">Section Key</Label>
                <select
                  id="section_key"
                  name="section_key"
                  value={formData.section_key}
                  onChange={handleSelectChange}
                  className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {SECTION_KEYS.map(section => (
                    <option key={section.value} value={section.value}>
                      {section.label}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500">
                  Pilih section tempat konten akan ditampilkan
                </p>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder="Judul section"
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="subtitle">Content (Subtitle)</Label>
                <textarea
                  id="subtitle"
                  name="subtitle"
                  value={formData.subtitle}
                  onChange={handleInputChange}
                  className="flex min-h-[120px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  placeholder="Konten deskriptif untuk section..."
                />
                <p className="text-xs text-gray-500">
                  Gunakan textarea untuk konten yang lebih panjang
                </p>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="image_url">Image URL</Label>
                <Input
                  id="image_url"
                  name="image_url"
                  value={formData.image_url}
                  onChange={handleInputChange}
                  placeholder="https://example.com/image.jpg"
                />
                <p className="text-xs text-gray-500">
                  URL gambar untuk section (opsional)
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
                {isEditing ? 'Perbarui Konten' : 'Simpan Konten'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Contents List */}
      <Card>
        <CardHeader>
          <CardTitle>Daftar Konten Landing Page</CardTitle>
          <CardDescription>
            Semua konten yang ditampilkan di halaman utama. Klik edit untuk mengubah atau hapus untuk menghapus.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
          ) : contents.length === 0 ? (
            <div className="text-center py-8">
              <Globe className="h-12 w-12 mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Belum ada konten</h3>
              <p className="text-gray-500 mb-4">Mulai dengan menambahkan konten pertama Anda.</p>
              <Button onClick={handleOpenCreateDialog}>
                <Plus className="mr-2 h-4 w-4" />
                Tambah Konten Pertama
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Section</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Title</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Content Preview</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Image</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Status</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Terakhir Diperbarui</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {contents.map((content) => (
                    <tr key={content.id} className="border-b hover:bg-gray-50">
                      <td className="py-4 px-4">
                        <span className="font-medium text-gray-900">
                          {getSectionLabel(content.section_key)}
                        </span>
                        <p className="text-xs text-gray-500">{content.section_key}</p>
                      </td>
                      <td className="py-4 px-4">
                        <p className="font-medium">{content.title || '-'}</p>
                      </td>
                      <td className="py-4 px-4">
                        <p className="text-sm text-gray-600 truncate max-w-xs">
                          {content.subtitle || '-'}
                        </p>
                      </td>
                      <td className="py-4 px-4">
                        {content.image_url ? (
                          <div className="w-16 h-16 rounded overflow-hidden border">
                            <img
                              src={content.image_url}
                              alt={content.title || 'Section image'}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = 'https://via.placeholder.com/100x100?text=No+Image';
                              }}
                            />
                          </div>
                        ) : (
                          <div className="w-16 h-16 rounded border flex items-center justify-center bg-gray-100">
                            <Globe className="h-5 w-5 text-gray-400" />
                          </div>
                        )}
                      </td>
                      <td className="py-4 px-4">
                        <Button
                          variant="outline"
                          size="sm"
                          className={content.is_active ? 'bg-green-50 text-green-700 hover:bg-green-100' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}
                          onClick={() => handleToggleActive(content)}
                        >
                          {content.is_active ? (
                            <>
                              <Eye className="mr-1 h-3 w-3" />
                              Active
                            </>
                          ) : (
                            <>
                              <EyeOff className="mr-1 h-3 w-3" />
                              Inactive
                            </>
                          )}
                        </Button>
                      </td>
                      <td className="py-4 px-4">
                        <p className="text-sm text-gray-600">
                          {new Date(content.updated_at).toLocaleDateString('id-ID', {
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
                            onClick={() => handleOpenEditDialog(content)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={() => handleDelete(content.id)}
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

      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h3 className="text-sm font-medium text-blue-800 mb-2">Panduan Section Key</h3>
        <ul className="text-sm text-blue-700 space-y-1">
          <li><strong>HERO</strong>: Section utama di bagian atas halaman (biasanya berisi gambar besar dan judul)</li>
          <li><strong>ABOUT</strong>: Section tentang hotel (deskripsi, sejarah, visi misi)</li>
          <li><strong>PROMO</strong>: Section promo dan penawaran khusus</li>
        </ul>
        <p className="text-xs text-blue-600 mt-2">
          Setiap section key harus unik. Tidak boleh ada duplikat section key.
        </p>
      </div>
    </div>
  );
}