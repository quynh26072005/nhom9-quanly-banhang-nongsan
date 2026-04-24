/**
 * Order Management Page (Admin)
 */
import { useState, useEffect } from 'react';
import api from '../../services/api';
import { toast } from 'react-toastify';

const OrderManagement = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('');
  const [filterPaymentMethod, setFilterPaymentMethod] = useState('');
  const [filterPaymentStatus, setFilterPaymentStatus] = useState('');
  const [pagination, setPagination] = useState({});
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [statistics, setStatistics] = useState({
    total: 0,
    pending: 0,
    confirmed: 0,
    processing: 0,
    shipping: 0,
    delivered: 0,
    cancelled: 0,
    pendingPayments: 0,
  });

  useEffect(() => {
    fetchOrders();
  }, [filterStatus, filterPaymentMethod, filterPaymentStatus, page]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const params = { page, limit: 20 };
      if (filterStatus) params.status = filterStatus;
      if (filterPaymentMethod) params.payment_method = filterPaymentMethod;
      if (filterPaymentStatus) params.payment_status = filterPaymentStatus;

      const response = await api.get('/orders/admin/orders', { params });
      const ordersData = response.data.data || [];
      setOrders(ordersData);
      setPagination(response.data.pagination || {});
      
      // Tính thống kê
      const stats = {
        total: ordersData.length,
        pending: ordersData.filter(o => o.status === 'PENDING').length,
        confirmed: ordersData.filter(o => o.status === 'CONFIRMED').length,
        processing: ordersData.filter(o => o.status === 'PROCESSING').length,
        shipping: ordersData.filter(o => o.status === 'SHIPPING').length,
        delivered: ordersData.filter(o => o.status === 'DELIVERED').length,
        cancelled: ordersData.filter(o => o.status === 'CANCELLED').length,
        pendingPayments: ordersData.filter(o => o.payment_method === 'BANK_TRANSFER' && o.payment_status === 'UNPAID').length,
      };
      setStatistics(stats);
    } catch (error) {
      toast.error('Không thể tải danh sách đơn hàng');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (orderId, newStatus) => {
    try {
      await api.put(`/orders/admin/orders/${orderId}/status`, {
        status: newStatus,
        notes: `Admin cập nhật trạng thái thành ${newStatus}`,
      });
      toast.success('Cập nhật trạng thái thành công');
      fetchOrders();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Không thể cập nhật trạng thái');
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

  const getNextStatus = (currentStatus) => {
    const flow = {
      PENDING: 'CONFIRMED',
      CONFIRMED: 'PROCESSING',
      PROCESSING: 'SHIPPING',
      SHIPPING: 'DELIVERED',
    };
    return flow[currentStatus];
  };

  if (loading) {
    return <div className="text-center py-12">Đang tải...</div>;
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Quản lý đơn hàng</h1>
        
        {/* Statistics Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3 mb-6">
          <div className="bg-white p-4 rounded-lg shadow border-l-4 border-gray-500">
            <div className="text-xs text-gray-500 mb-1">Tổng đơn</div>
            <div className="text-2xl font-bold text-gray-900">{pagination.total || 0}</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow border-l-4 border-yellow-500">
            <div className="text-xs text-gray-500 mb-1">Chờ xác nhận</div>
            <div className="text-2xl font-bold text-yellow-600">{statistics.pending}</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow border-l-4 border-blue-500">
            <div className="text-xs text-gray-500 mb-1">Đã xác nhận</div>
            <div className="text-2xl font-bold text-blue-600">{statistics.confirmed}</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow border-l-4 border-purple-500">
            <div className="text-xs text-gray-500 mb-1">Đang xử lý</div>
            <div className="text-2xl font-bold text-purple-600">{statistics.processing}</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow border-l-4 border-indigo-500">
            <div className="text-xs text-gray-500 mb-1">Đang giao</div>
            <div className="text-2xl font-bold text-indigo-600">{statistics.shipping}</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow border-l-4 border-green-500">
            <div className="text-xs text-gray-500 mb-1">Đã giao</div>
            <div className="text-2xl font-bold text-green-600">{statistics.delivered}</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow border-l-4 border-red-500">
            <div className="text-xs text-gray-500 mb-1">Đã hủy</div>
            <div className="text-2xl font-bold text-red-600">{statistics.cancelled}</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow border-l-4 border-orange-500">
            <div className="text-xs text-gray-500 mb-1">Chờ thanh toán</div>
            <div className="text-2xl font-bold text-orange-600">{statistics.pendingPayments}</div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-3">
          <input
            type="text"
            placeholder="Tìm theo mã đơn, tên khách hàng, SĐT..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
          />
          <select
            value={filterStatus}
            onChange={(e) => {
              setFilterStatus(e.target.value);
              setPage(1);
            }}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <option value="">Tất cả trạng thái</option>
            <option value="PENDING">Chờ xác nhận</option>
            <option value="CONFIRMED">Đã xác nhận</option>
            <option value="PROCESSING">Đang xử lý</option>
            <option value="SHIPPING">Đang giao hàng</option>
            <option value="DELIVERED">Đã giao hàng</option>
            <option value="CANCELLED">Đã hủy</option>
          </select>
          <select
            value={filterPaymentMethod}
            onChange={(e) => {
              setFilterPaymentMethod(e.target.value);
              setPage(1);
            }}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <option value="">Tất cả phương thức</option>
            <option value="COD">COD</option>
            <option value="BANK_TRANSFER">Chuyển khoản</option>
            <option value="MOMO">MoMo</option>
            <option value="VNPAY">VNPay</option>
          </select>
          <select
            value={filterPaymentStatus}
            onChange={(e) => {
              setFilterPaymentStatus(e.target.value);
              setPage(1);
            }}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <option value="">Tất cả TT thanh toán</option>
            <option value="UNPAID">Chưa thanh toán</option>
            <option value="PAID">Đã thanh toán</option>
            <option value="REFUNDED">Đã hoàn tiền</option>
          </select>
          <button
            onClick={fetchOrders}
            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            🔄 Làm mới
          </button>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Mã đơn</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Khách hàng</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tổng tiền</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">PT Thanh toán</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">TT Thanh toán</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Trạng thái</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ngày đặt</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Thao tác</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {orders
              .filter(order => {
                if (!searchTerm) return true;
                const search = searchTerm.toLowerCase();
                return (
                  order.order_code?.toLowerCase().includes(search) ||
                  order.recipient_name?.toLowerCase().includes(search) ||
                  order.recipient_phone?.includes(search)
                );
              })
              .map((order) => (
              <tr key={order.order_id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {order.order_code}
                </td>
                <td className="px-6 py-4 text-sm text-gray-900">
                  <div>{order.recipient_name}</div>
                  <div className="text-gray-500 text-xs">{order.recipient_phone}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {formatPrice(order.total_amount)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-xs">
                  <span className={`px-2 py-1 rounded-full ${
                    order.payment_method === 'COD' ? 'bg-gray-100 text-gray-800' :
                    order.payment_method === 'BANK_TRANSFER' ? 'bg-blue-100 text-blue-800' :
                    'bg-purple-100 text-purple-800'
                  }`}>
                    {order.payment_method === 'COD' ? '💵 COD' :
                     order.payment_method === 'BANK_TRANSFER' ? '🏦 CK' :
                     order.payment_method}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-xs">
                  <span className={`px-2 py-1 rounded-full ${
                    order.payment_status === 'PAID' ? 'bg-green-100 text-green-800' :
                    order.payment_status === 'REFUNDED' ? 'bg-purple-100 text-purple-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {order.payment_status === 'PAID' ? '✓ Đã TT' :
                     order.payment_status === 'REFUNDED' ? '↩ Hoàn' :
                     '⏳ Chưa TT'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(order.status)}`}>
                    {getStatusText(order.status)}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(order.created_at).toLocaleDateString('vi-VN')}
                </td>
                <td className="px-6 py-4 text-sm">
                  <div className="flex flex-col gap-2">
                    {/* Dropdown cập nhật trạng thái */}
                    {order.status !== 'DELIVERED' && order.status !== 'CANCELLED' ? (
                      <select
                        value=""
                        onChange={(e) => {
                          if (e.target.value) {
                            handleUpdateStatus(order.order_id, e.target.value);
                          }
                        }}
                        className="w-full px-3 py-2 border-2 border-green-500 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-600 bg-white font-medium"
                      >
                        <option value="">
                          {getStatusText(order.status)} - Chọn hành động
                        </option>
                        {order.status === 'PENDING' && (
                          <>
                            <option value="CONFIRMED">✓ Xác nhận đơn hàng</option>
                            <option value="CANCELLED">✗ Hủy đơn hàng</option>
                          </>
                        )}
                        {order.status === 'CONFIRMED' && (
                          <>
                            <option value="PROCESSING">→ Bắt đầu xử lý</option>
                            <option value="CANCELLED">✗ Hủy đơn hàng</option>
                          </>
                        )}
                        {order.status === 'PROCESSING' && (
                          <>
                            <option value="SHIPPING">🚚 Bắt đầu giao hàng</option>
                            <option value="CANCELLED">✗ Hủy đơn hàng</option>
                          </>
                        )}
                        {order.status === 'SHIPPING' && (
                          <>
                            <option value="DELIVERED">✓ Đã giao thành công</option>
                            <option value="CANCELLED">✗ Giao hàng thất bại</option>
                          </>
                        )}
                      </select>
                    ) : (
                      <span className="px-3 py-2 text-xs font-medium text-gray-700 bg-gray-100 rounded-lg text-center block">
                        {getStatusText(order.status)} - Hoàn tất
                      </span>
                    )}
                    
                    {/* Các nút thao tác nhanh */}
                    <div className="flex gap-1">
                      {/* Nút hành động nhanh theo trạng thái */}
                      {order.status === 'PENDING' && (
                        <>
                          <button
                            onClick={() => handleUpdateStatus(order.order_id, 'CONFIRMED')}
                            className="flex-1 px-2 py-1.5 text-xs text-white bg-green-600 hover:bg-green-700 rounded transition-colors font-medium"
                            title="Xác nhận đơn"
                          >
                            ✓ Xác nhận
                          </button>
                          <button
                            onClick={() => handleUpdateStatus(order.order_id, 'CANCELLED')}
                            className="flex-1 px-2 py-1.5 text-xs text-white bg-red-600 hover:bg-red-700 rounded transition-colors font-medium"
                            title="Hủy đơn"
                          >
                            ✗ Hủy
                          </button>
                        </>
                      )}
                      
                      {order.status === 'CONFIRMED' && (
                        <button
                          onClick={() => handleUpdateStatus(order.order_id, 'PROCESSING')}
                          className="flex-1 px-2 py-1.5 text-xs text-white bg-purple-600 hover:bg-purple-700 rounded transition-colors font-medium"
                          title="Bắt đầu xử lý"
                        >
                          → Xử lý
                        </button>
                      )}
                      
                      {order.status === 'PROCESSING' && (
                        <button
                          onClick={() => handleUpdateStatus(order.order_id, 'SHIPPING')}
                          className="flex-1 px-2 py-1.5 text-xs text-white bg-indigo-600 hover:bg-indigo-700 rounded transition-colors font-medium"
                          title="Bắt đầu giao hàng"
                        >
                          🚚 Giao hàng
                        </button>
                      )}
                      
                      {order.status === 'SHIPPING' && (
                        <button
                          onClick={() => handleUpdateStatus(order.order_id, 'DELIVERED')}
                          className="flex-1 px-2 py-1.5 text-xs text-white bg-green-600 hover:bg-green-700 rounded transition-colors font-medium"
                          title="Đánh dấu đã giao"
                        >
                          ✓ Đã giao
                        </button>
                      )}
                    </div>
                    
                    {/* Các nút thao tác khác */}
                    <div className="flex gap-1">
                      <button
                        onClick={() => window.location.href = `/admin/orders/${order.order_id}`}
                        className="flex-1 px-2 py-1 text-xs text-white bg-blue-600 hover:bg-blue-700 rounded transition-colors"
                        title="Xem chi tiết"
                      >
                        📄 Chi tiết
                      </button>
                      
                      <button
                        onClick={() => window.print()}
                        className="flex-1 px-2 py-1 text-xs text-white bg-gray-600 hover:bg-gray-700 rounded transition-colors"
                        title="In đơn hàng"
                      >
                        🖨️ In
                      </button>
                    </div>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination.total_pages > 1 && (
        <div className="mt-6 flex justify-center gap-2">
          <button
            onClick={() => setPage(page - 1)}
            disabled={page === 1}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            Trước
          </button>
          <span className="px-4 py-2">
            Trang {page} / {pagination.total_pages}
          </span>
          <button
            onClick={() => setPage(page + 1)}
            disabled={page === pagination.total_pages}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            Sau
          </button>
        </div>
      )}
    </div>
  );
};

export default OrderManagement;
