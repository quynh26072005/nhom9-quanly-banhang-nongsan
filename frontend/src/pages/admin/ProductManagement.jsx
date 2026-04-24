/**
 * Product Management Page (Admin)
 */
import { useState, useEffect } from 'react';
import api from '../../services/api';
import { toast } from 'react-toastify';

const ProductManagement = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [filterDiscount, setFilterDiscount] = useState('all'); // all, discount, no-discount
  const [formData, setFormData] = useState({
    product_name: '',
    category_id: '',
    description: '',
    unit: '',
    price: '',
    discount_percent: 0,
    origin: '',
    shelf_life_days: '',
    storage_instructions: '',
    thumbnail_url: '',
    imageUploadMethod: 'file', // 'file' or 'url'
    is_active: true,
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [productsRes, categoriesRes] = await Promise.all([
        api.get('/products?limit=100'),
        api.get('/categories'),
      ]);
      setProducts(productsRes.data.data || []);
      setCategories(categoriesRes.data.data || []);
    } catch (error) {
      toast.error('Không thể tải dữ liệu');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Remove imageUploadMethod before sending to backend
      const { imageUploadMethod, ...dataToSend } = formData;
      
      // Convert empty strings to null for optional integer fields
      if (dataToSend.shelf_life_days === '') dataToSend.shelf_life_days = null;
      
      // Convert numeric strings to numbers
      if (dataToSend.price) dataToSend.price = parseFloat(dataToSend.price);
      if (dataToSend.discount_percent) dataToSend.discount_percent = parseFloat(dataToSend.discount_percent);
      if (dataToSend.shelf_life_days) dataToSend.shelf_life_days = parseInt(dataToSend.shelf_life_days);
      
      if (editingProduct) {
        await api.put(`/products/admin/products/${editingProduct.product_id}`, dataToSend);
        toast.success('Cập nhật sản phẩm thành công');
      } else {
        await api.post('/products/admin/products', dataToSend);
        toast.success('Thêm sản phẩm thành công');
      }
      setShowModal(false);
      resetForm();
      fetchData();
    } catch (error) {
      console.error('Error:', error);
      toast.error(error.response?.data?.detail || 'Có lỗi xảy ra');
    }
  };

  const handleEdit = (product) => {
    setEditingProduct(product);
    setFormData({
      product_name: product.product_name,
      category_id: product.category_id,
      description: product.description || '',
      unit: product.unit,
      price: product.price,
      discount_percent: product.discount_percent,
      origin: product.origin || '',
      shelf_life_days: product.shelf_life_days || '',
      storage_instructions: product.storage_instructions || '',
      thumbnail_url: product.thumbnail_url || '',
      imageUploadMethod: product.thumbnail_url?.startsWith('data:') ? 'file' : 'url',
      is_active: product.is_active,
    });
    setShowModal(true);
  };

  const handleDelete = async (productId) => {
    if (!confirm('Bạn có chắc muốn xóa sản phẩm này?')) return;
    try {
      await api.delete(`/products/admin/products/${productId}`);
      toast.success('Xóa sản phẩm thành công');
      fetchData();
    } catch (error) {
      toast.error('Không thể xóa sản phẩm');
    }
  };

  const resetForm = () => {
    setEditingProduct(null);
    setFormData({
      product_name: '',
      category_id: '',
      description: '',
      unit: '',
      price: '',
      discount_percent: 0,
      origin: '',
      shelf_life_days: '',
      storage_instructions: '',
      thumbnail_url: '',
      imageUploadMethod: 'file',
      is_active: true,
    });
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(price);
  };

  if (loading) {
    return <div className="text-center py-12">Đang tải...</div>;
  }

  // Filter products based on discount
  const filteredProducts = products.filter(product => {
    const discountValue = parseFloat(product.discount_percent) || 0;
    if (filterDiscount === 'discount') return discountValue > 0;
    if (filterDiscount === 'no-discount') return discountValue === 0;
    return true; // 'all'
  });

  const discountCount = products.filter(p => p.discount_percent > 0).length;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quản lý sản phẩm</h1>
          <p className="text-sm text-gray-600 mt-1">
            Tổng: {products.length} sản phẩm | 
            <span className="text-red-600 font-semibold"> {discountCount} đang giảm giá</span>
          </p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setShowModal(true);
          }}
          className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
        >
          + Thêm sản phẩm
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="mb-4 flex gap-2">
        <button
          onClick={() => setFilterDiscount('all')}
          className={`px-4 py-2 rounded-lg font-medium transition-all ${
            filterDiscount === 'all'
              ? 'bg-primary-600 text-white'
              : 'bg-white text-gray-700 hover:bg-gray-50 border'
          }`}
        >
          Tất cả ({products.length})
        </button>
        <button
          onClick={() => setFilterDiscount('discount')}
          className={`px-4 py-2 rounded-lg font-medium transition-all ${
            filterDiscount === 'discount'
              ? 'bg-red-600 text-white'
              : 'bg-white text-gray-700 hover:bg-gray-50 border'
          }`}
        >
          🔥 Đang giảm giá ({discountCount})
        </button>
        <button
          onClick={() => setFilterDiscount('no-discount')}
          className={`px-4 py-2 rounded-lg font-medium transition-all ${
            filterDiscount === 'no-discount'
              ? 'bg-gray-600 text-white'
              : 'bg-white text-gray-700 hover:bg-gray-50 border'
          }`}
        >
          Giá gốc ({products.length - discountCount})
        </button>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Hình ảnh</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tên sản phẩm</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Danh mục</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Giá gốc</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Giảm giá</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Giá bán</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Trạng thái</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Thao tác</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredProducts.length === 0 ? (
              <tr>
                <td colSpan="9" className="px-6 py-12 text-center text-gray-500">
                  Không tìm thấy sản phẩm nào
                </td>
              </tr>
            ) : (
              filteredProducts.map((product) => {
                const hasDiscount = product.discount_percent > 0;
                const discountedPrice = hasDiscount 
                  ? product.price * (1 - product.discount_percent / 100)
                  : product.price;
                
                return (
                  <tr key={product.product_id} className={hasDiscount ? 'bg-red-50' : ''}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {product.product_id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap relative">
                      {hasDiscount && (
                        <div className="absolute top-2 left-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full font-bold z-10">
                          -{product.discount_percent}%
                        </div>
                      )}
                      {product.thumbnail_url ? (
                        <img
                          src={product.thumbnail_url}
                          alt={product.product_name}
                          className="w-16 h-16 object-cover rounded-lg"
                          onError={(e) => {
                            e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="64" height="64"%3E%3Crect width="64" height="64" fill="%23f3f4f6"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-size="24"%3E📦%3C/text%3E%3C/svg%3E';
                          }}
                        />
                      ) : (
                        <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center text-2xl">
                          📦
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      <div className="flex items-center gap-2">
                        {product.product_name}
                        {hasDiscount && (
                          <span className="text-red-600 text-xs font-bold">🔥 SALE</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {categories.find(c => c.category_id === product.category_id)?.category_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className={hasDiscount ? 'line-through text-gray-400' : 'text-gray-900 font-semibold'}>
                        {formatPrice(product.price)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {hasDiscount ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-800">
                          -{product.discount_percent}%
                        </span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className={hasDiscount ? 'text-red-600 font-bold' : 'text-gray-900 font-semibold'}>
                        {formatPrice(discountedPrice)}
                      </div>
                      {hasDiscount && (
                        <div className="text-xs text-green-600">
                          Tiết kiệm {formatPrice(product.price - discountedPrice)}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        product.is_active
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {product.is_active ? 'Hoạt động' : 'Ngừng bán'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <button
                        onClick={() => handleEdit(product)}
                        className="text-primary-600 hover:text-primary-900 mr-3"
                      >
                        Sửa
                      </button>
                      <button
                        onClick={() => handleDelete(product.product_id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Xóa
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-xl font-bold mb-4">
                {editingProduct ? 'Sửa sản phẩm' : 'Thêm sản phẩm mới'}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  {/* Hình ảnh sản phẩm */}
                  <div className="col-span-2">
                    <label className="block text-sm font-medium mb-1">Hình ảnh sản phẩm</label>
                    
                    {/* Tab chọn cách upload */}
                    <div className="flex gap-2 mb-3">
                      <button
                        type="button"
                        onClick={() => setFormData({...formData, imageUploadMethod: 'file'})}
                        className={`px-3 py-1 text-sm rounded ${
                          formData.imageUploadMethod === 'file'
                            ? 'bg-primary-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        📁 Chọn file
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormData({...formData, imageUploadMethod: 'url'})}
                        className={`px-3 py-1 text-sm rounded ${
                          formData.imageUploadMethod === 'url'
                            ? 'bg-primary-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        🔗 Nhập URL
                      </button>
                    </div>

                    {/* Upload file */}
                    {formData.imageUploadMethod === 'file' && (
                      <div>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files[0];
                            if (file) {
                              // Check file size (max 2MB)
                              if (file.size > 2 * 1024 * 1024) {
                                alert('Kích thước file không được vượt quá 2MB');
                                e.target.value = '';
                                return;
                              }
                              
                              // Convert to base64
                              const reader = new FileReader();
                              reader.onloadend = () => {
                                setFormData({...formData, thumbnail_url: reader.result});
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                          className="w-full px-3 py-2 border rounded-lg"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Chọn file ảnh từ máy tính (JPG, PNG, GIF - tối đa 2MB)
                        </p>
                      </div>
                    )}

                    {/* Nhập URL */}
                    {formData.imageUploadMethod === 'url' && (
                      <div>
                        <input
                          type="text"
                          value={formData.thumbnail_url?.startsWith('data:') ? '' : formData.thumbnail_url}
                          onChange={(e) => setFormData({...formData, thumbnail_url: e.target.value})}
                          placeholder="Nhập URL hình ảnh (ví dụ: https://example.com/image.jpg)"
                          className="w-full px-3 py-2 border rounded-lg"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          💡 Mẹo: Bạn có thể upload hình lên <a href="https://imgur.com" target="_blank" className="text-primary-600 hover:underline">Imgur</a> hoặc <a href="https://imgbb.com" target="_blank" className="text-primary-600 hover:underline">ImgBB</a> rồi copy link vào đây
                        </p>
                      </div>
                    )}
                    
                    {/* Preview */}
                    {formData.thumbnail_url && (
                      <div className="mt-3">
                        <p className="text-xs text-gray-500 mb-2">Xem trước:</p>
                        <div className="relative inline-block">
                          <img
                            src={formData.thumbnail_url}
                            alt="Preview"
                            className="w-32 h-32 object-cover rounded-lg border"
                            onError={(e) => {
                              e.target.style.display = 'none';
                            }}
                          />
                          <button
                            type="button"
                            onClick={() => setFormData({...formData, thumbnail_url: ''})}
                            className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full hover:bg-red-600 flex items-center justify-center text-xs"
                            title="Xóa hình"
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="col-span-2">
                    <label className="block text-sm font-medium mb-1">Tên sản phẩm *</label>
                    <input
                      type="text"
                      value={formData.product_name}
                      onChange={(e) => setFormData({...formData, product_name: e.target.value})}
                      className="w-full px-3 py-2 border rounded-lg"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Danh mục *</label>
                    <select
                      value={formData.category_id}
                      onChange={(e) => setFormData({...formData, category_id: e.target.value})}
                      className="w-full px-3 py-2 border rounded-lg"
                      required
                    >
                      <option value="">Chọn danh mục</option>
                      {categories.map(cat => (
                        <option key={cat.category_id} value={cat.category_id}>
                          {cat.category_name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Đơn vị *</label>
                    <input
                      type="text"
                      value={formData.unit}
                      onChange={(e) => setFormData({...formData, unit: e.target.value})}
                      placeholder="kg, bó, quả..."
                      className="w-full px-3 py-2 border rounded-lg"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Giá *</label>
                    <input
                      type="number"
                      value={formData.price}
                      onChange={(e) => setFormData({...formData, price: e.target.value})}
                      className="w-full px-3 py-2 border rounded-lg"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Giảm giá (%)</label>
                    <input
                      type="number"
                      value={formData.discount_percent}
                      onChange={(e) => setFormData({...formData, discount_percent: e.target.value})}
                      min="0"
                      max="100"
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      💡 Nhập 0 để không giảm giá. Sản phẩm có giảm giá sẽ hiển thị trong trang Khuyến mãi
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Xuất xứ</label>
                    <input
                      type="text"
                      value={formData.origin}
                      onChange={(e) => setFormData({...formData, origin: e.target.value})}
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Hạn sử dụng (ngày)</label>
                    <input
                      type="number"
                      value={formData.shelf_life_days}
                      onChange={(e) => setFormData({...formData, shelf_life_days: e.target.value})}
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-medium mb-1">Mô tả</label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({...formData, description: e.target.value})}
                      rows="3"
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-medium mb-1">Hướng dẫn bảo quản</label>
                    <textarea
                      value={formData.storage_instructions}
                      onChange={(e) => setFormData({...formData, storage_instructions: e.target.value})}
                      rows="2"
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.is_active}
                        onChange={(e) => setFormData({...formData, is_active: e.target.checked})}
                        className="mr-2"
                      />
                      <span className="text-sm font-medium">Đang hoạt động</span>
                    </label>
                  </div>
                </div>
                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                  >
                    {editingProduct ? 'Cập nhật' : 'Thêm mới'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      resetForm();
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Hủy
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductManagement;
