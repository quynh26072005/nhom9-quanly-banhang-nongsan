/**
 * Shopping Cart Page
 */
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import api from '../services/api';
import { toast } from 'react-toastify';

const Cart = () => {
  const { user } = useAuth();
  const { refreshCart } = useCart();
  const navigate = useNavigate();
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState({});

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    fetchCart();
  }, [user]);

  const fetchCart = async () => {
    try {
      const response = await api.get('/cart');
      console.log('Cart data fetched:', response.data.data);
      setCart(response.data.data);
    } catch (error) {
      toast.error('Không thể tải giỏ hàng');
    } finally {
      setLoading(false);
    }
  };

  const updateQuantity = async (itemId, newQuantity) => {
    console.log('Updating quantity:', itemId, newQuantity);
    if (newQuantity < 1) {
      // If quantity becomes 0, remove item instead
      await removeItem(itemId);
      return;
    }

    setUpdating(prev => ({ ...prev, [itemId]: true }));
    try {
      const response = await api.put(`/cart/items/${itemId}`, { quantity: newQuantity });
      console.log('Update response:', response.data);
      await fetchCart(); // Wait for cart to reload
      refreshCart(); // Update badge
      toast.success('Đã cập nhật số lượng');
    } catch (error) {
      console.error('Update error:', error);
      toast.error('Không thể cập nhật số lượng');
    } finally {
      setUpdating(prev => ({ ...prev, [itemId]: false }));
    }
  };

  const removeItem = async (itemId) => {
    if (!confirm('Bạn có chắc muốn xóa sản phẩm này?')) return;

    try {
      await api.delete(`/cart/items/${itemId}`);
      await fetchCart();
      refreshCart(); // Update cart badge
      toast.success('Đã xóa sản phẩm khỏi giỏ hàng');
    } catch (error) {
      toast.error('Không thể xóa sản phẩm');
    }
  };

  const clearCart = async () => {
    if (!confirm('Bạn có chắc muốn xóa toàn bộ giỏ hàng?')) return;

    try {
      await api.delete('/cart/clear');
      await fetchCart();
      refreshCart(); // Update cart badge
      toast.success('Đã xóa toàn bộ giỏ hàng');
    } catch (error) {
      toast.error('Không thể xóa giỏ hàng');
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(price);
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        <p className="mt-4 text-gray-600">Đang tải giỏ hàng...</p>
      </div>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-md mx-auto text-center">
          <div className="text-6xl mb-4">🛒</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Giỏ hàng trống</h2>
          <p className="text-gray-600 mb-6">Bạn chưa có sản phẩm nào trong giỏ hàng</p>
          <Link
            to="/products"
            className="inline-block bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition-colors"
          >
            Tiếp tục mua sắm
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Giỏ hàng của bạn</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cart Items */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            {/* Header */}
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h2 className="font-semibold text-gray-900">
                Sản phẩm ({cart.items.length})
              </h2>
              <button
                onClick={clearCart}
                className="text-sm text-red-600 hover:text-red-700"
              >
                Xóa tất cả
              </button>
            </div>

            {/* Items */}
            <div className="divide-y divide-gray-200">
              {cart.items.map((item) => (
                <div key={item.cart_item_id} className="p-6">
                  <div className="flex gap-4">
                    {/* Product Image */}
                    <Link
                      to={`/products/${item.product.product_id}`}
                      className="flex-shrink-0 w-24 h-24 bg-gray-100 rounded-lg overflow-hidden"
                    >
                      {item.product.thumbnail_url ? (
                        <img
                          src={item.product.thumbnail_url}
                          alt={item.product.product_name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400 text-3xl">
                          📦
                        </div>
                      )}
                    </Link>

                    {/* Product Info */}
                    <div className="flex-1">
                      <Link
                        to={`/products/${item.product.product_id}`}
                        className="font-semibold text-gray-900 hover:text-primary-600 block mb-1"
                      >
                        {item.product.product_name}
                      </Link>
                      <p className="text-sm text-gray-600 mb-2">
                        Đơn vị: {item.product.unit}
                      </p>
                      <div className="flex items-center gap-4">
                        <div className="text-lg font-bold text-primary-600">
                          {formatPrice(item.unit_price)}
                        </div>
                        {item.product.discount_percent > 0 && (
                          <span className="text-sm text-gray-400 line-through">
                            {formatPrice(item.product.price)}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Quantity & Actions */}
                    <div className="flex flex-col items-end justify-between">
                      <button
                        onClick={() => removeItem(item.cart_item_id)}
                        className="text-red-600 hover:text-red-700 text-sm"
                      >
                        Xóa
                      </button>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => updateQuantity(item.cart_item_id, parseFloat(item.quantity) - 1)}
                          disabled={updating[item.cart_item_id]}
                          className="w-8 h-8 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50"
                        >
                          -
                        </button>
                        <span className="w-12 text-center font-medium">
                          {Math.round(parseFloat(item.quantity))}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.cart_item_id, parseFloat(item.quantity) + 1)}
                          disabled={updating[item.cart_item_id]}
                          className="w-8 h-8 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50"
                        >
                          +
                        </button>
                      </div>

                      <div className="text-lg font-bold text-gray-900 mt-2">
                        {formatPrice(item.subtotal)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Continue Shopping */}
          <div className="mt-6">
            <Link
              to="/products"
              className="inline-flex items-center text-primary-600 hover:text-primary-700"
            >
              ← Tiếp tục mua sắm
            </Link>
          </div>
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-md p-6 sticky top-4">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Tóm tắt đơn hàng</h2>

            <div className="space-y-3 mb-6">
              <div className="flex justify-between text-gray-600">
                <span>Tạm tính ({cart.total_items} sản phẩm)</span>
                <span className="font-medium">{formatPrice(cart.subtotal)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Giảm giá</span>
                <span className="font-medium text-red-600">
                  -{formatPrice(cart.discount_amount)}
                </span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Phí vận chuyển</span>
                <span className="font-medium">
                  {cart.shipping_fee > 0 ? formatPrice(cart.shipping_fee) : 'Miễn phí'}
                </span>
              </div>
              <div className="border-t border-gray-200 pt-3 flex justify-between text-lg font-bold text-gray-900">
                <span>Tổng cộng</span>
                <span className="text-primary-600">{formatPrice(cart.total)}</span>
              </div>
            </div>

            <button
              onClick={() => navigate('/checkout')}
              className="w-full bg-primary-600 text-white py-3 rounded-lg hover:bg-primary-700 transition-colors font-semibold"
            >
              Tiến hành thanh toán
            </button>

            <div className="mt-4 text-center text-sm text-gray-600">
              <p>🔒 Thanh toán an toàn & bảo mật</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;
