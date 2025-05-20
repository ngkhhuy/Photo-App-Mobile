import { useState, useEffect } from 'react';
import { API_URL } from '../constants/config';

// Định nghĩa kiểu dữ liệu cho một ảnh
interface Photo {
  id: string;
  imageUrl: string;
  description: string;
  keywords: string[];
  user: {
    _id: string;
    name: string;
    email: string;
  };
  likes: number;
  createdAt: string;
  updatedAt: string;
}

export const usePhotos = (page: number = 1, limit: number = 10) => {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPhotos = async () => {
    // Tạo controller để có thể hủy request nếu cần
    const controller = new AbortController();
    // Thiết lập timeout thủ công
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/v1/photos?page=${page}&limit=${limit}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: controller.signal // Sử dụng signal từ controller
      });

      // Xóa timeout nếu request thành công
      clearTimeout(timeoutId);

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Không tìm thấy ảnh. Vui lòng kiểm tra API.');
        } else {
          throw new Error(`Lỗi khi lấy dữ liệu ảnh: ${response.statusText}`);
        }
      }

      // Parse response JSON with photos array
      const json = await response.json();
      if (!json.photos || !Array.isArray(json.photos)) {
        throw new Error('Dữ liệu trả về không chứa danh sách ảnh.');
      }
      // Map API response to Photo interface
      const mappedPhotos: Photo[] = json.photos.map((p: any) => ({
        id: p._id,
        imageUrl: p.imageUrl,
        description: p.description,
        keywords: p.keywords,
        user: { _id: p.user._id, name: p.user.name, email: p.user.email },
        likes: p.likes,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
      }));
      setPhotos(mappedPhotos);
      setError(null);
    } catch (err: any) {
      // Xóa timeout nếu có lỗi
      clearTimeout(timeoutId);
      
      console.error('Lỗi trong usePhotos:', err);
      setError(err.message || 'Có lỗi xảy ra khi lấy dữ liệu ảnh');
      setPhotos([]);
    } finally {
      setLoading(false);
    }
  };

  const refetch = () => {
    return fetchPhotos();
  };

  useEffect(() => {
    fetchPhotos();
    
    // Cleanup function để tránh memory leak
    return () => {
      // Không cần làm gì nếu đã xử lý cleanup trong fetchPhotos
    };
  }, [page, limit]);

  return { photos, loading, error, refetch };
};