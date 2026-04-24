/**
 * Order Detail Page
 */
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { toast } from 'react-toastify';
import QRDisplayComponent from '../components/payment/QRDisplayComponent';

const OrderDetail = () => {
  const { id } = useParams();
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    fetchOrder();
  }, [id, user]);

  const fetchOrder = async () => {
    try {
      // Admin dùng endpoint khác
      const endpoint = isAdmin ? `/orders/admin/orders/${id}` : `/orders/${id}`;
      const response = await api.get(endpoint);
      setOrder(response.data.data);
    } catch (error) {
      toast.error('Không thể tải thông tin đơn hàng');
      navigate(isAdmin ? '/admin/orders' : '/my-orders');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelOrder = async () => {
    if (!confirm('Bạn có chắc muốn hủy đơn hàng này?')) return;

    try {
      await api.put(`/orders/${id}/cancel`, {
        cancellation_reason: 'Khách hàng hủy đơn',
      });
      toast.success('Đã hủy đơn hàng');
      fetchOrder();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Không thể hủy đơn hàng');
    }
  };

  const handleRequestCancellation = async () => {
    if (!cancelReason.trim()) {
      toast.error('Vui lòng nhập lý do hủy đơn');
      return;
    }

    setSubmitting(true);
    try {
      await api.post(`/orders/${id}/cancellation-request`, {
        reason: cancelReason,
      });
      toast.success('Đã gửi yêu cầu hủy đơn. Admin sẽ xem xét và phản hồi sớm.');
      setShowCancelModal(false);
      setCancelReason('');
      fetchOrder();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Không thể gửi yêu cầu');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAdminUpdateStatus = async (newStatus) => {
    if (!confirm(`Xác nhận cập nhật trạng thái đơn hàng thành "${getStatusText(newStatus)}"?`)) {
      return;
    }

    try {
      await api.put(`/orders/admin/orders/${id}/status`, {
        status: newStatus,
        notes: `Admin cập nhật trạng thái thành ${newStatus}`,
      });
      toast.success('Cập nhật trạng thái thành công');
      fetchOrder();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Không thể cập nhật trạng thái');
    }
  };

  const handleConfirmPayment = async () => {
    if (!confirm('Xác nhận đã nhận được tiền chuyển khoản?')) {
      return;
    }

    try {
      await api.put(`/orders/admin/orders/${id}/payment-status`, {
        payment_status: 'PAID',
      });
      toast.success('Đã xác nhận thanh toán');
      fetchOrder();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Không thể cập nhật trạng thái thanh toán');
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(price);
  };

  const getStatusColor = (status) => {
    const colors = {
      PENDING: 'bg-yellow-100 text-yellow-800',
      CONFIRMED: 'bg-blue-100 text-blue-800',
      PROCESSING: 'bg-purple-100 text-purple-800',
      SHIPPING: 'bg-indigo-100 text-indigo-800',
      DELIVERED: 'bg-green-100 text-green-800',
      CANCELLED: 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusText = (status) => {
    const texts = {
      PENDING: 'Chờ xác nhận',
      CONFIRMED: 'Đã xác nhận',
      PROCESSING: 'Đang xử lý',
      SHIPPING: 'Đang giao hàng',
      DELIVERED: 'Đã giao hàng',
      CANCELLED: 'Đã hủy',
    };
    return texts[status] || status;
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        <p className="mt-4 text-gray-600">Đang tải...</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <p className="text-gray-600">Không tìm thấy đơn hàng</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => navigate(isAdmin ? '/admin/orders' : '/my-orders')}
          className="text-primary-600 hover:text-primary-700 mb-4"
        >
          ← Quay lại danh sách đơn hàng
        </button>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {isAdmin ? '🔧 Chi tiết đơn hàng (Admin)' : 'Chi tiết đơn hàng'}
            </h1>
            <p className="text-gray-600 mt-1">Mã đơn hàng: {order.order_code}</p>
          </div>
          <span className={`px-4 py-2 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
            {getStatusText(order.status)}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Order Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order Items */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
              <h2 className="font-semibold text-gray-900">Sản phẩm đã đặt</h2>
            </div>
            <div className="divide-y divide-gray-200">
              {order.order_items.map((item) => (
                <div key={item.order_item_id} className="p-6 flex gap-4">
                  <div className="w-20 h-20 bg-gray-100 rounded flex-shrink-0 flex items-center justify-center text-gray-400 text-2xl">
                    📦
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 mb-1">
                      {item.product_name}
                    </h3>
                    <p className="text-sm text-gray-600">
                      Đơn vị: {item.unit}
                    </p>
                    <p className="text-sm text-gray-600">
                      Số lượng: {item.quantity}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-gray-900">
                      {formatPrice(item.subtotal)}
                    </p>
                    {item.discount_percent > 0 && (
                      <p className="text-sm text-gray-400 line-through">
                        {formatPrice(item.unit_price * item.quantity)}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Shipping Info */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="font-semibold text-gray-900 mb-4">Thông tin giao hàng</h2>
            <div className="space-y-2">
              <div className="flex">
                <span className="text-gray-600 w-32">Người nhận:</span>
                <span className="font-medium">{order.recipient_name}</span>
              </div>
              <div className="flex">
                <span className="text-gray-600 w-32">Số điện thoại:</span>
                <span className="font-medium">{order.recipient_phone}</span>
              </div>
              <div className="flex">
                <span className="text-gray-600 w-32">Địa chỉ:</span>
                <span className="font-medium">{order.shipping_address}</span>
              </div>
            </div>
          </div>

          {/* Payment Info */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="font-semibold text-gray-900 mb-4">Thông tin thanh toán</h2>
            <div className="space-y-2">
              <div className="flex">
                <span className="text-gray-600 w-48">Phương thức thanh toán:</span>
                <span className="font-medium">
                  {order.payment_method === 'COD' ? 'Thanh toán khi nhận hàng' : 
                   order.payment_method === 'BANK_TRANSFER' ? 'Chuyển khoản ngân hàng' : 
                   order.payment_method}
                </span>
              </div>
              <div className="flex">
                <span className="text-gray-600 w-48">Trạng thái thanh toán:</span>
                <span className={`font-medium ${
                  order.payment_status === 'PAID' ? 'text-green-600' : 
                  order.payment_status === 'REFUNDED' ? 'text-purple-600' :
                  'text-yellow-600'
                }`}>
                  {order.payment_status === 'PAID' ? '✓ Đã thanh toán' : 
                   order.payment_status === 'REFUNDED' ? '↩ Đã hoàn tiền' :
                   '⏳ Chưa thanh toán'}
                </span>
              </div>
            </div>
          </div>

          {/* QR Code for Unpaid Bank Transfer Orders */}
          {order.payment_method === 'BANK_TRANSFER' && order.payment_status === 'UNPAID' && !isAdmin && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="font-semibold text-gray-900 mb-4">
                💳 Thông tin chuyển khoản
              </h2>
              <QRDisplayComponent
                orderCode={order.order_code}
                customerName={order.recipient_name}
                totalAmount={order.total_amount}
                showInstructions={true}
              />
            </div>
          )}

          {/* Notes */}
          {order.notes && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="font-semibold text-gray-900 mb-4">Ghi chú</h2>
              <p className="text-gray-700">{order.notes}</p>
            </div>
          )}
        </div>

        {/* Right Column - Summary & Actions */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-md p-6 sticky top-4">
            <h2 className="font-semibold text-gray-900 mb-4">Tóm tắt đơn hàng</h2>

            <div className="space-y-3 mb-6">
              <div className="flex justify-between text-gray-600">
                <span>Tạm tính</span>
                <span className="font-medium">{formatPrice(order.subtotal)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Giảm giá</span>
                <span className="font-medium text-red-600">
                  -{formatPrice(order.discount_amount)}
                </span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Phí vận chuyển</span>
                <span className="font-medium">{formatPrice(order.shipping_fee)}</span>
              </div>
              <div className="border-t border-gray-200 pt-3 flex justify-between text-lg font-bold text-gray-900">
                <span>Tổng cộng</span>
                <span className="text-primary-600">{formatPrice(order.total_amount)}</span>
              </div>
            </div>

            {/* Order Timeline */}
            <div className="border-t border-gray-200 pt-6 mb-6">
              <h3 className="font-semibold text-gray-900 mb-3">Trạng thái đơn hàng</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Đặt hàng:</span>
                  <span className="font-medium">
                    {new Date(order.created_at).toLocaleString('vi-VN')}
                  </span>
                </div>
                {order.confirmed_at && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Xác nhận:</span>
                    <span className="font-medium">
                      {new Date(order.confirmed_at).toLocaleString('vi-VN')}
                    </span>
                  </div>
                )}
                {order.delivered_at && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Giao hàng:</span>
                    <span className="font-medium">
                      {new Date(order.delivered_at).toLocaleString('vi-VN')}
                    </span>
                  </div>
                )}
                {order.cancelled_at && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Hủy đơn:</span>
                    <span className="font-medium">
                      {new Date(order.cancelled_at).toLocaleString('vi-VN')}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            {isAdmin ? (
              /* Admin Actions */
              <div className="space-y-3">
                <h3 className="font-semibold text-gray-900 mb-3">Thao tác Admin</h3>
                
                {/* Payment Confirmation - Show if BANK_TRANSFER and not paid */}
                {order.payment_method === 'BANK_TRANSFER' && order.payment_status === 'UNPAID' && (
                  <div className="bg-yellow-50 border-2 border-yellow-400 rounded-lg p-4 mb-3">
                    <p className="text-sm text-yellow-800 font-medium mb-2">
                      ⚠️ Đơn hàng chưa thanh toán
                    </p>
                    <button
                      onClick={handleConfirmPayment}
                      className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold"
                    >
                      💰 Xác nhận đã nhận tiền
                    </button>
                  </div>
                )}
                
                {order.status === 'PENDING' && (
                  <>
                    <button
                      onClick={() => handleAdminUpdateStatus('CONFIRMED')}
                      disabled={order.payment_method === 'BANK_TRANSFER' && order.payment_status !== 'PAID'}
                      className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                      title={order.payment_method === 'BANK_TRANSFER' && order.payment_status !== 'PAID' ? 'Vui lòng xác nhận thanh toán trước' : ''}
                    >
                      ✓ Xác nhận đơn hàng
                    </button>
                    {order.payment_method === 'BANK_TRANSFER' && order.payment_status !== 'PAID' && (
                      <p className="text-xs text-yellow-700 text-center">
                        ⚠️ Cần xác nhận thanh toán trước khi xác nhận đơn
                      </p>
                    )}
                    <button
                      onClick={() => handleAdminUpdateStatus('CANCELLED')}
                      className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-semibold"
                    >
                      ✗ Hủy đơn hàng
                    </button>
                  </>
                )}
                
                {order.status === 'CONFIRMED' && (
                  <button
                    onClick={() => handleAdminUpdateStatus('PROCESSING')}
                    className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-semibold"
                  >
                    → Bắt đầu xử lý
                  </button>
                )}
                
                {order.status === 'PROCESSING' && (
                  <button
                    onClick={() => handleAdminUpdateStatus('SHIPPING')}
                    className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-semibold"
                  >
                    🚚 Bắt đầu giao hàng
                  </button>
                )}
                
                {order.status === 'SHIPPING' && (
                  <button
                    onClick={() => handleAdminUpdateStatus('DELIVERED')}
                    className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold"
                  >
                    ✓ Đã giao thành công
                  </button>
                )}
                
                {(order.status === 'DELIVERED' || order.status === 'CANCELLED') && (
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-sm text-gray-700">
                    <p className="font-medium">Đơn hàng đã hoàn tất</p>
                    <p className="text-xs mt-1">Không thể thay đổi trạng thái</p>
                  </div>
                )}
              </div>
            ) : (
              /* Customer Actions */
              <>
                {order.status === 'PENDING' && order.payment_status !== 'PAID' && (
                  <button
                    onClick={handleCancelOrder}
                    className="w-full px-4 py-2 border-2 border-red-600 text-red-600 rounded-lg hover:bg-red-50 transition-colors font-semibold"
                  >
                    Hủy đơn hàng
                  </button>
                )}

                {order.status === 'PENDING' && order.payment_status === 'PAID' && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
                    <p className="font-medium mb-1">ℹ️ Không thể hủy đơn</p>
                    <p>Đơn hàng đã thanh toán. Vui lòng liên hệ admin để được hỗ trợ.</p>
                  </div>
                )}

                {(order.status === 'CONFIRMED' || order.status === 'PROCESSING' || order.status === 'SHIPPING') && (
                  <div className="space-y-3">
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-sm text-yellow-800">
                      <p className="font-medium mb-1">⚠️ Không thể hủy đơn trực tiếp</p>
                      <p>Đơn hàng đang được xử lý. Vui lòng gửi yêu cầu hủy đơn cho Admin.</p>
                    </div>
                    <button
                      onClick={() => setShowCancelModal(true)}
                      className="w-full px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors font-semibold"
                    >
                      📝 Gửi yêu cầu hủy đơn
                    </button>
                  </div>
                )}

                {order.status === 'DELIVERED' && (
                  <button
                    onClick={() => navigate(`/products/${order.order_items[0]?.product_id}`)}
                    className="w-full px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-semibold"
                  >
                    Mua lại
                  </button>
                )}

                {order.status === 'CANCELLED' && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-800">
                    <p className="font-medium mb-1">❌ Đơn hàng đã bị hủy</p>
                    {order.cancellation_reason && (
                      <p className="text-xs mt-2">Lý do: {order.cancellation_reason}</p>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Cancel Request Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Yêu cầu hủy đơn hàng
            </h2>
            <p className="text-sm text-gray-600 mb-4">
              Vui lòng cho Admin biết lý do bạn muốn hủy đơn hàng này. Admin sẽ xem xét và phản hồi sớm nhất.
            </p>
            <textarea
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="Nhập lý do hủy đơn (ví dụ: Đặt nhầm sản phẩm, Không cần nữa, Tìm được giá tốt hơn...)"
              rows="4"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
            <div className="flex gap-3 mt-6">
              <button
                onClick={handleRequestCancellation}
                disabled={submitting || !cancelReason.trim()}
                className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
              >
                {submitting ? 'Đang gửi...' : 'Gửi yêu cầu'}
              </button>
              <button
                onClick={() => {
                  setShowCancelModal(false);
                  setCancelReason('');
                }}
                disabled={submitting}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50"
              >
                Hủy
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderDetail;
