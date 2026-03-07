export default function Loading() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center">
        <div className="relative inline-block">
          <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
            <div className="w-8 h-8 bg-blue-600 rounded-full opacity-75 animate-ping"></div>
          </div>
        </div>
        <p className="mt-6 text-lg font-medium text-gray-700">Memuat halaman...</p>
        <p className="mt-2 text-sm text-gray-500">Mohon tunggu sebentar</p>
      </div>
    </div>
  );
}