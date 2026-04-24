/**
 * Product Detail Page
 */
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import api from '../services/api';
import { toast } from 'react-toastify';

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { refreshCart } = useCart();
  const [product, setProduct] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [addingToCart, setAddingToCart] = useState(false);

  useEffect(() => {
    fetchProduct();
    fetchReviews();
  }, [id]);

  const fetchProduct = async () => {
    try {
      const response = await api.get(`/products/${id}`);
      setProduct(response.data.data);
    } catch (error) {
      toast.error('Không thể tải thông tin sản phẩm');
      navigate('/products');
    } finally {
      setLoading(false);
    }
  };

  const fetchReviews = async () => {
    try {
      const response = await api.get(`/products/${id}/reviews`);
      setReviews(response.data.data?.reviews || []);
    } catch (error) {
      console.error('Error fetching reviews:', error);
    }
  };

  const handleAddToCart = async () => {
    if (!user) {
      toast.info('Vui lòng đăng nhập để thêm vào giỏ hàng');
      navigate('/login');
      return;
    }

    setAddingToCart(true);
    try {
      await api.post('/cart/items', {
        product_id: parseInt(id),
        quantity: quantity,
      });
      toast.success('Đã thêm vào giỏ hàng');
      refreshCart(); // Refresh cart count
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Không thể thêm vào giỏ hàng');
    } finally {
      setAddingToCart(false);
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(price);
  };

  const calculateDiscountedPrice = (price, discount) => {
    return price - (price * discount / 100);
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        <p className="mt-4 text-gray-600">Đang tải...</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <p className="text-gray-600">Không tìm thấy sản phẩm</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <nav className="mb-6 text-sm text-gray-600">
        <a href="/" className="hover:text-primary-600">Trang chủ</a>
        <span className="mx-2">/</span>
        <a href="/products" className="hover:text-primary-600">Sản phẩm</a>
        <span className="mx-2">/</span>
        <span className="text-gray-900">{product.product_name}</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
        {/* Product Image */}
        <div className="bg-gray-100 rounded-lg overflow-hidden aspect-square flex items-center justify-center">
          {product.thumbnail_url ? (
            <img
              src={product.thumbnail_url}
              alt={product.product_name}
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="text-gray-400 text-9xl">📦</span>
          )}
        </div>

        {/* Product Info */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            {product.product_name}
          </h1>

          {/* Price */}
          <div className="mb-6">
            {product.discount_percent > 0 ? (
              <div className="flex items-center gap-4">
                <span className="text-3xl font-bold text-primary-600">
                  {formatPrice(calculateDiscountedPrice(product.price, product.discount_percent))}
                </span>
                <span className="text-xl text-gray-400 line-through">
                  {formatPrice(product.price)}
                </span>
                <span className="bg-red-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
                  -{product.discount_percent}%
                </span>
              </div>
            ) : (
              <span className="text-3xl font-bold text-primary-600">
                {formatPrice(product.price)}
              </span>
            )}
            <p className="text-gray-600 mt-2">Đơn vị: {product.unit}</p>
          </div>

          {/* Product Details */}
          <div className="space-y-3 mb-6 border-t border-b border-gray-200 py-6">
            {product.origin && (
              <div className="flex">
                <span className="text-gray-600 w-32">Xuất xứ:</span>
                <span className="font-medium">{product.origin}</span>
              </div>
            )}
            {product.shelf_life_days && (
              <div className="flex">
                <span className="text-gray-600 w-32">Hạn sử dụng:</span>
                <span className="font-medium">{product.shelf_life_days} ngày</span>
              </div>
            )}
            {product.category && (
              <div className="flex">
                <span className="text-gray-600 w-32">Danh mục:</span>
                <span className="font-medium">{product.category.category_name}</span>
              </div>
            )}
          </div>

          {/* Quantity Selector */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Số lượng
            </label>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="w-10 h-10 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                -
              </button>
              <input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-20 text-center border border-gray-300 rounded-lg py-2"
                min="1"
              />
              <button
                onClick={() => setQuantity(quantity + 1)}
                className="w-10 h-10 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                +
              </button>
            </div>
          </div>

          {/* Add to Cart Button */}
          <div className="flex gap-4">
            <button
              onClick={handleAddToCart}
              disabled={addingToCart}
              className="flex-1 bg-primary-600 text-white py-3 rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-semibold"
            >
              {addingToCart ? 'Đang thêm...' : '🛒 Thêm vào giỏ hàng'}
            </button>
            <button
              onClick={() => navigate('/cart')}
              className="px-6 py-3 border-2 border-primary-600 text-primary-600 rounded-lg hover:bg-primary-50 transition-colors font-semibold"
            >
              Xem giỏ hàng
            </button>
          </div>
        </div>
      </div>

      {/* Description */}
      {product.description && (
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Mô tả sản phẩm</h2>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <p className="text-gray-700 whitespace-pre-line">{product.description}</p>
          </div>
        </div>
      )}

      {/* Storage Instructions */}
      {product.storage_instructions && (
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Hướng dẫn bảo quản</h2>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <p className="text-gray-700 whitespace-pre-line">{product.storage_instructions}</p>
          </div>
        </div>
      )}

      {/* Reviews */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Đánh giá sản phẩm</h2>
        <div className="bg-white p-6 rounded-lg shadow-md">
          {reviews.length === 0 ? (
            <p className="text-gray-600 text-center py-8">Chưa có đánh giá nào</p>
          ) : (
            <div className="space-y-6">
              {reviews.map((review) => (
                <div key={review.review_id} className="border-b border-gray-200 pb-6 last:border-0">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="font-semibold text-gray-900">{review.user_name}</p>
                      <div className="flex items-center gap-1 mt-1">
                        {[...Array(5)].map((_, i) => (
                          <span key={i} className={i < review.rating ? 'text-yellow-400' : 'text-gray-300'}>
                            ⭐
                          </span>
                        ))}
                      </div>
                    </div>
                    {review.is_verified_purchase && (
                      <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                        Đã mua hàng
                      </span>
                    )}
                  </div>
                  <p className="text-gray-700">{review.comment}</p>
                  <p className="text-xs text-gray-500 mt-2">
                    {new Date(review.created_at).toLocaleDateString('vi-VN')}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;
