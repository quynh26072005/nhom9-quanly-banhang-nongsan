/**
 * Cancellation Requests Management (Admin)
 */
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { toast } from 'react-toastify';

const CancellationRequests = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [adminNote, setAdminNote] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const response = await api.get('/admin/cancellation-requests');
      setRequests(response.data.data || []);
    } catch (error) {
      toast.error('Không thể tải danh sách yêu cầu');
    } finally {
      setLoading(false);
    }
  };

  const handleViewRequest = (request) => {
    setSelectedRequest(request);
    setAdminNote('');
    setShowModal(true);
  };

  const handleApprove = async () => {
    if (!selectedRequest) return;

    setProcessing(true);
    try {
      await api.put(`/admin/cancellation-requests/${selectedRequest.request_id}`, {
        status: 'APPROVED',
        admin_note: adminNote || 'Đã chấp nhận yêu cầu hủy đơn',
      });
      toast.success('Đã chấp nhận và hủy đơn hàng');
      setShowModal(false);
      fetchRequests();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Không thể xử lý yêu cầu');
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!selectedRequest) return;
    if (!adminNote.trim()) {
      toast.error('Vui lòng nhập lý do từ chối');
      return;
    }

    setProcessing(true);
    try {
      await api.put(`/admin/cancellation-requests/${selectedRequest.request_id}`, {
        status: 'REJECTED',
        admin_note: adminNote,
      });
      toast.success('Đã từ chối yêu cầu hủy đơn');
      setShowModal(false);
      fetchRequests();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Không thể xử lý yêu cầu');
    } finally {
      setProcessing(false);
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      PENDING: 'bg-yellow-100 text-yellow-800',
      APPROVED: 'bg-green-100 text-green-800',
      REJECTED: 'bg-red-100 text-red-800',
    };
    const texts = {
      PENDING: 'Chờ xử lý',
      APPROVED: 'Đã chấp nhận',
      REJECTED: 'Đã từ chối',
    };
    return (
      <span className={`px-2 py-1 text-xs rounded-full ${badges[status]}`}>
        {texts[status]}
      </span>
    );
  };

  if (loading) {
    return <div className="text-center py-12">Đang tải...</div>;
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Yêu cầu hủy đơn hàng</h1>
        <div className="text-sm text-gray-600">
          Tổng: {requests.length} yêu cầu
        </div>
      </div>

      {/* Requests Table */}
      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Mã đơn hàng</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Lý do</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Trạng thái</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ngày gửi</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Thao tác</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {requests.length === 0 ? (
              <tr>
                <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                  Không có yêu cầu hủy đơn nào
                </td>
              </tr>
            ) : (
              requests.map((request) => (
                <tr key={request.request_id} className={request.status === 'PENDING' ? 'bg-yellow-50' : ''}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    #{request.request_id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <Link
                      to={`/admin/orders/${request.order_id}`}
                      className="text-primary-600 hover:text-primary-900"
                    >
                      {request.order_code}
                    </Link>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
                    {request.reason}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(request.status)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(request.created_at).toLocaleString('vi-VN')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {request.status === 'PENDING' ? (
                      <button
                        onClick={() => handleViewRequest(request)}
                        className="text-primary-600 hover:text-primary-900"
                      >
                        Xử lý
                      </button>
                    ) : (
                      <button
                        onClick={() => handleViewRequest(request)}
                        className="text-gray-600 hover:text-gray-900"
                      >
                        Xem
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {showModal && selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Chi tiết yêu cầu hủy đơn #{selectedRequest.request_id}
            </h2>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mã đơn hàng
                </label>
                <p className="text-gray-900">{selectedRequest.order_code}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Lý do khách hàng
                </label>
                <p className="text-gray-900 bg-gray-50 p-3 rounded-lg">
                  {selectedRequest.reason}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Trạng thái
                </label>
                {getStatusBadge(selectedRequest.status)}
              </div>

              {selectedRequest.admin_note && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ghi chú của Admin
                  </label>
                  <p className="text-gray-900 bg-blue-50 p-3 rounded-lg">
                    {selectedRequest.admin_note}
                  </p>
                </div>
              )}

              {selectedRequest.status === 'PENDING' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ghi chú của bạn {selectedRequest.status === 'REJECTED' && '(Bắt buộc)'}
                  </label>
                  <textarea
                    value={adminNote}
                    onChange={(e) => setAdminNote(e.target.value)}
                    placeholder="Nhập ghi chú (tùy chọn nếu chấp nhận, bắt buộc nếu từ chối)"
                    rows="3"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              )}
            </div>

            <div className="flex gap-3">
              {selectedRequest.status === 'PENDING' && (
                <>
                  <button
                    onClick={handleApprove}
                    disabled={processing}
                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 font-semibold"
                  >
                    {processing ? 'Đang xử lý...' : '✓ Chấp nhận & Hủy đơn'}
                  </button>
                  <button
                    onClick={handleReject}
                    disabled={processing}
                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 font-semibold"
                  >
                    {processing ? 'Đang xử lý...' : '✗ Từ chối'}
                  </button>
                </>
              )}
              <button
                onClick={() => setShowModal(false)}
                disabled={processing}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CancellationRequests;
