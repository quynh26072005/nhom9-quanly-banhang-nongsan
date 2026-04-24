/**
 * Promotions Page - Khuyến mãi
 */
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { toast } from 'react-toastify';

const Promotions = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchPromotionalProducts();
  }, []);

  const fetchPromotionalProducts = async () => {
    try {
      setLoading(true);
      const response = await api.get('/products', {
        params: {
          page: 1,
          limit: 100,
          sort_by: 'created_at',
          order: 'desc'
        }
      });
      
      const allProducts = response.data.data || [];
      const discountedProducts = allProducts.filter(p => p.discount_percent > 0);
      
      setProducts(discountedProducts);
    } catch (error) {
      console.error('Error fetching products:', error);
      toast.error('Không thể tải sản phẩm khuyến mãi');
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price);
  };

  const calculateDiscountedPrice = (price, discountPercent) => {
    return price * (1 - discountPercent / 100);
  };

  const getFilteredProducts = () => {
    if (filter === 'all') return products;
    if (filter === 'high') return products.filter(p => p.discount_percent >= 30);
    if (filter === 'medium') return products.filter(p => p.discount_percent >= 15 && p.discount_percent < 30);
    if (filter === 'low') return products.filter(p => p.discount_percent < 15);
    return products;
  };

  const filteredProducts = getFilteredProducts();

  const promotionBanners = [
    {
      title: 'Flash Sale Cuối Tuần',
      description: 'Giảm giá lên đến 50% cho các sản phẩm chọn lọc',
      color: 'from-red-500 to-pink-600',
      icon: '⚡'
    },
    {
      title: 'Mua 2 Tặng 1',
      description: 'Áp dụng cho các sản phẩm rau củ quả',
      color: 'from-green-500 to-teal-600',
      icon: '🎁'
    },
    {
      title: 'Miễn Phí Vận Chuyển',
      description: 'Cho đơn hàng từ 500.000đ',
      color: 'from-blue-500 to-indigo-600',
      icon: '🚚'
    }
  ];

  return (
    <div className="min-h-screen">
      <section className="relative bg-gradient-to-br from-red-600 via-pink-600 to-orange-600 text-white py-20 overflow-hidden">
        <div className="absolute inset-0 bg-black opacity-10"></div>
        <div className="relative container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <div className="text-6xl mb-6">🎉</div>
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Khuyến Mãi Đặc Biệt
            </h1>
            <p className="text-lg md:text-xl text-red-50">
              Tiết kiệm ngay hôm nay với các ưu đãi hấp dẫn
            </p>
          </div>
        </div>
      </section>

      <section className="py-12 bg-white">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {promotionBanners.map((banner, index) => (
              <div
                key={index}
                className={`bg-gradient-to-br ${banner.color} text-white rounded-xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2`}
              >
                <div className="text-5xl mb-4">{banner.icon}</div>
                <h3 className="text-xl font-bold mb-2">{banner.title}</h3>
                <p className="text-white/90">{banner.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-8 bg-gray-50 border-y">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <h2 className="text-2xl font-bold text-gray-900">
              Sản Phẩm Khuyến Mãi ({filteredProducts.length})
            </h2>
            <div className="flex gap-2">
              <button
                onClick={() => setFilter('all')}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  filter === 'all' ? 'bg-red-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
              >
                Tất cả
              </button>
              <button
                onClick={() => setFilter('high')}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  filter === 'high' ? 'bg-red-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
              >
                Giảm ≥30%
              </button>
              <button
                onClick={() => setFilter('medium')}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  filter === 'medium' ? 'bg-red-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
              >
                Giảm 15-30%
              </button>
              <button
                onClick={() => setFilter('low')}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  filter === 'low' ? 'bg-red-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
              >
                Giảm dưới 15%
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-red-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Đang tải sản phẩm...</p>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🎁</div>
              <h3 className="text-2xl font-bold mb-2 text-gray-900">Chưa có khuyến mãi</h3>
              <p className="text-gray-600 mb-6">Hiện tại chưa có sản phẩm khuyến mãi nào</p>
              <Link to="/products" className="inline-block px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700">
                Xem tất cả sản phẩm
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {filteredProducts.map((product) => {
                const discountedPrice = calculateDiscountedPrice(product.price, product.discount_percent);
                return (
                  <Link
                    key={product.product_id}
                    to={`/products/${product.product_id}`}
                    className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 overflow-hidden group relative"
                  >
                    <div className="absolute top-2 right-2 z-10">
                      <div className="bg-red-500 text-white px-3 py-1 rounded-full text-sm font-bold shadow-lg">
                        -{product.discount_percent}%
                      </div>
                    </div>
                    {product.discount_percent >= 30 && (
                      <div className="absolute top-2 left-2 z-10">
                        <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg">
                          🔥 HOT
                        </div>
                      </div>
                    )}
                    <div className="relative h-48 bg-gray-200 overflow-hidden">
                      {product.thumbnail_url ? (
                        <img
                          src={product.thumbnail_url}
                          alt={product.product_name}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-6xl">🥬</div>
                      )}
                    </div>
                    <div className="p-4">
                      <h3 className="font-bold text-lg mb-2 text-gray-900 line-clamp-2">
                        {product.product_name}
                      </h3>
                      <div className="mb-2">
                        <div className="flex items-center gap-2">
                          <div className="text-red-600 font-bold text-xl">
                            {formatPrice(discountedPrice)}
                          </div>
                          <div className="text-gray-400 text-sm line-through">
                            {formatPrice(product.price)}
                          </div>
                        </div>
                        <div className="text-gray-500 text-sm">/{product.unit}</div>
                      </div>
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        {product.origin && <div>📍 {product.origin}</div>}
                        <div className="text-green-600 font-medium">
                          Tiết kiệm {formatPrice(product.price - discountedPrice)}
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </section>

      <section className="py-16 bg-gradient-to-br from-red-600 to-pink-600 text-white">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto text-center">
            <div className="text-5xl mb-4">📧</div>
            <h2 className="text-3xl font-bold mb-4">Đăng Ký Nhận Ưu Đãi</h2>
            <p className="text-red-50 mb-8">
              Nhận thông báo về các chương trình khuyến mãi mới nhất
            </p>
            <div className="flex gap-2 max-w-md mx-auto">
              <input
                type="email"
                placeholder="Nhập email của bạn"
                className="flex-1 px-4 py-3 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-white"
              />
              <button className="px-6 py-3 bg-white text-red-600 rounded-lg font-semibold hover:bg-red-50 transition-colors">
                Đăng ký
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Promotions;
