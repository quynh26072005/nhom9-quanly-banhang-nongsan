/**
 * Checkout Page
 */
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { toast } from 'react-toastify';
import QRDisplayComponent from '../components/payment/QRDisplayComponent';

const Checkout = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [cart, setCart] = useState(null);
  const [addresses, setAddresses] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('COD');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    fetchData();
  }, [user]);

  const fetchData = async () => {
    try {
      const [cartRes, addressesRes] = await Promise.all([
        api.get('/cart'),
        api.get('/users/me/addresses'),
      ]);

      const cartData = cartRes.data.data;
      if (!cartData || cartData.items.length === 0) {
        toast.info('Giỏ hàng trống');
        navigate('/cart');
        return;
      }

      setCart(cartData);
      setAddresses(addressesRes.data.data || []);

      // Select default address
      const defaultAddr = addressesRes.data.data?.find(a => a.is_default);
      if (defaultAddr) {
        setSelectedAddress(defaultAddr.address_id);
      } else if (addressesRes.data.data?.length > 0) {
        setSelectedAddress(addressesRes.data.data[0].address_id);
      }
    } catch (error) {
      toast.error('Không thể tải thông tin');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedAddress) {
      toast.error('Vui lòng chọn địa chỉ giao hàng');
      return;
    }

    setSubmitting(true);
    try {
      const orderData = {
        address_id: selectedAddress,
        items: cart.items.map(item => ({
          product_id: item.product.product_id,
          quantity: item.quantity,
        })),
        payment_method: paymentMethod,
        notes: notes,
      };

      const response = await api.post('/orders', orderData);
      const order = response.data.data;

      toast.success('Đặt hàng thành công!');
      navigate(`/orders/${order.order_id}`);
    } catch (error) {
      const errorMsg = error.response?.data?.detail || 'Đặt hàng thất bại';
      toast.error(errorMsg);
    } finally {
      setSubmitting(false);
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
        <p className="mt-4 text-gray-600">Đang tải...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Thanh toán</h1>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Shipping & Payment */}
          <div className="lg:col-span-2 space-y-6">
            {/* Shipping Address */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                Địa chỉ giao hàng
              </h2>

              {addresses.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-600 mb-4">Bạn chưa có địa chỉ giao hàng</p>
                  <button
                    type="button"
                    onClick={() => navigate('/profile')}
                    className="text-primary-600 hover:text-primary-700 font-medium"
                  >
                    Thêm địa chỉ mới
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {addresses.map((address) => (
                    <label
                      key={address.address_id}
                      className={`block p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                        selectedAddress === address.address_id
                          ? 'border-primary-600 bg-primary-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name="address"
                        value={address.address_id}
                        checked={selectedAddress === address.address_id}
                        onChange={(e) => setSelectedAddress(parseInt(e.target.value))}
                        className="mr-3"
                      />
                      <div className="inline-block">
                        <div className="font-semibold text-gray-900">
                          {address.recipient_name} - {address.phone}
                        </div>
                        <div className="text-gray-600 text-sm mt-1">
                          {address.address_line}, {address.ward}, {address.district}, {address.city}
                        </div>
                        {address.is_default && (
                          <span className="inline-block mt-2 text-xs bg-primary-100 text-primary-800 px-2 py-1 rounded">
                            Mặc định
                          </span>
                        )}
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* Payment Method */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                Phương thức thanh toán
              </h2>

              <div className="space-y-3">
                <label className="flex items-center p-4 border-2 border-gray-200 rounded-lg cursor-pointer hover:border-gray-300">
                  <input
                    type="radio"
                    name="payment"
                    value="COD"
                    checked={paymentMethod === 'COD'}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="mr-3"
                  />
                  <div>
                    <div className="font-semibold text-gray-900">
                      💵 Thanh toán khi nhận hàng (COD)
                    </div>
                    <div className="text-sm text-gray-600 mt-1">
                      Thanh toán bằng tiền mặt khi nhận hàng
                    </div>
                  </div>
                </label>

                <label className={`block p-4 border-2 rounded-lg cursor-pointer hover:border-gray-300 ${
                  paymentMethod === 'BANK_TRANSFER' ? 'border-primary-600 bg-primary-50' : 'border-gray-200'
                }`}>
                  <div className="flex items-center">
                    <input
                      type="radio"
                      name="payment"
                      value="BANK_TRANSFER"
                      checked={paymentMethod === 'BANK_TRANSFER'}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="mr-3"
                    />
                    <div>
                      <div className="font-semibold text-gray-900">
                        🏦 Chuyển khoản ngân hàng
                      </div>
                      <div className="text-sm text-gray-600 mt-1">
                        Chuyển khoản trước khi nhận hàng
                      </div>
                    </div>
                  </div>
                </label>
              </div>
              
              {/* QR Display Component */}
              {paymentMethod === 'BANK_TRANSFER' && cart && user && (
                <div className="mt-4">
                  <QRDisplayComponent
                    customerName={user.full_name || 'Khách hàng'}
                    totalAmount={cart.total}
                    showInstructions={true}
                  />
                </div>
              )}
            </div>

            {/* Notes */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                Ghi chú đơn hàng
              </h2>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ghi chú về đơn hàng, ví dụ: thời gian hay chỉ dẫn địa điểm giao hàng chi tiết hơn"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                rows="4"
              />
            </div>
          </div>

          {/* Right Column - Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6 sticky top-4">
              <h2 className="text-xl font-bold text-gray-900 mb-6">
                Đơn hàng ({cart.total_items} sản phẩm)
              </h2>

              {/* Products */}
              <div className="space-y-3 mb-6 max-h-64 overflow-y-auto">
                {cart.items.map((item) => (
                  <div key={item.cart_item_id} className="flex gap-3">
                    <div className="w-16 h-16 bg-gray-100 rounded flex-shrink-0">
                      {item.product.thumbnail_url ? (
                        <img
                          src={item.product.thumbnail_url}
                          alt={item.product.product_name}
                          className="w-full h-full object-cover rounded"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                          📦
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {item.product.product_name}
                      </p>
                      <p className="text-sm text-gray-600">
                        {item.quantity} x {formatPrice(item.unit_price)}
                      </p>
                    </div>
                    <div className="text-sm font-medium text-gray-900">
                      {formatPrice(item.subtotal)}
                    </div>
                  </div>
                ))}
              </div>

              {/* Summary */}
              <div className="space-y-3 border-t border-gray-200 pt-4">
                <div className="flex justify-between text-gray-600">
                  <span>Tạm tính</span>
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
                  <span className="text-primary-600">
                    {formatPrice(cart.total)}
                  </span>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={submitting || !selectedAddress}
                className="w-full mt-6 bg-primary-600 text-white py-3 rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-semibold"
              >
                {submitting ? 'Đang xử lý...' : 'Đặt hàng'}
              </button>

              <p className="mt-4 text-center text-xs text-gray-600">
                Bằng việc đặt hàng, bạn đồng ý với{' '}
                <a href="#" className="text-primary-600 hover:text-primary-700">
                  Điều khoản sử dụng
                </a>
              </p>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default Checkout;
