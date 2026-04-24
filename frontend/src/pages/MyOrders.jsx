/**
 * My Orders Page
 */
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { toast } from 'react-toastify';

const MyOrders = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    fetchOrders();
  }, [user]);

  const fetchOrders = async () => {
    try {
      const response = await api.get('/orders/my-orders');
      setOrders(response.data.data || []);
    } catch (error) {
      toast.error('Không thể tải danh sách đơn hàng');
    } finally {
      setLoading(false);
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

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Đơn hàng của tôi</h1>

      {orders.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">📦</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Chưa có đơn hàng nào</h2>
          <p className="text-gray-600 mb-6">Bạn chưa có đơn hàng nào</p>
          <Link
            to="/products"
            className="inline-block bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition-colors"
          >
            Mua sắm ngay
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div key={order.order_id} className="bg-white rounded-lg shadow-md overflow-hidden">
              {/* Order Header */}
              <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Mã đơn hàng</p>
                    <p className="font-semibold text-gray-900">{order.order_code}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Ngày đặt</p>
                    <p className="font-medium text-gray-900">
                      {new Date(order.created_at).toLocaleDateString('vi-VN')}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Tổng tiền</p>
                    <p className="font-bold text-primary-600">
                      {formatPrice(order.total_amount)}
                    </p>
                  </div>
                  <div>
                    <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
                      {getStatusText(order.status)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Order Body */}
              <div className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Giao đến</p>
                    <p className="font-medium text-gray-900">{order.recipient_name}</p>
                    <p className="text-sm text-gray-600">{order.shipping_address}</p>
                  </div>
                  <div className="flex gap-3">
                    <Link
                      to={`/orders/${order.order_id}`}
                      className="px-4 py-2 border border-primary-600 text-primary-600 rounded-lg hover:bg-primary-50 transition-colors"
                    >
                      Xem chi tiết
                    </Link>
                    {order.status === 'PENDING' && (
                      <button
                        onClick={async () => {
                          if (confirm('Bạn có chắc muốn hủy đơn hàng này?')) {
                            try {
                              await api.put(`/orders/${order.order_id}/cancel`, {
                                cancellation_reason: 'Khách hàng hủy đơn',
                              });
                              toast.success('Đã hủy đơn hàng');
                              fetchOrders();
                            } catch (error) {
                              toast.error('Không thể hủy đơn hàng');
                            }
                          }
                        }}
                        className="px-4 py-2 border border-red-600 text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                      >
                        Hủy đơn
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyOrders;
