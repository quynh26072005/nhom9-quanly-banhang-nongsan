/**
 * User Management Page (Admin)
 */
import { useState, useEffect } from 'react';
import api from '../../services/api';
import { toast } from 'react-toastify';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterRole, setFilterRole] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [pagination, setPagination] = useState({});
  const [page, setPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  useEffect(() => {
    fetchUsers();
  }, [filterRole, filterStatus, page]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params = { page, limit: 20 };
      if (filterRole) params.role = filterRole;
      if (filterStatus) params.is_active = filterStatus === 'active';

      const response = await api.get('/users/admin/users', { params });
      setUsers(response.data.data || []);
      setPagination(response.data.pagination || {});
    } catch (error) {
      toast.error('Không thể tải danh sách người dùng');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateRole = async (userId, newRole) => {
    try {
      await api.put(`/users/admin/users/${userId}/role`, { role: newRole });
      toast.success('Cập nhật vai trò thành công');
      fetchUsers();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Không thể cập nhật vai trò');
    }
  };

  const handleToggleStatus = async (userId, currentStatus) => {
    try {
      await api.put(`/users/admin/users/${userId}/status`, { is_active: !currentStatus });
      toast.success(`${!currentStatus ? 'Kích hoạt' : 'Vô hiệu hóa'} tài khoản thành công`);
      fetchUsers();
    } catch (error) {
      toast.error('Không thể cập nhật trạng thái');
    }
  };

  const viewUserDetail = (user) => {
    setSelectedUser(user);
    setShowModal(true);
  };

  const getRoleBadge = (role) => {
    const badges = {
      ADMIN: 'bg-purple-100 text-purple-800',
      CUSTOMER: 'bg-blue-100 text-blue-800',
      WAREHOUSE_STAFF: 'bg-green-100 text-green-800',
    };
    return badges[role] || 'bg-gray-100 text-gray-800';
  };

  const getRoleText = (role) => {
    const texts = {
      ADMIN: 'Quản trị viên',
      CUSTOMER: 'Khách hàng',
      WAREHOUSE_STAFF: 'Nhân viên kho',
    };
    return texts[role] || role;
  };

  if (loading) {
    return <div className="text-center py-12">Đang tải...</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Quản lý người dùng</h1>
        <div className="flex gap-3">
          <select
            value={filterRole}
            onChange={(e) => {
              setFilterRole(e.target.value);
              setPage(1);
            }}
            className="px-4 py-2 border border-gray-300 rounded-lg"
          >
            <option value="">Tất cả vai trò</option>
            <option value="ADMIN">Quản trị viên</option>
            <option value="CUSTOMER">Khách hàng</option>
            <option value="WAREHOUSE_STAFF">Nhân viên kho</option>
          </select>
          <select
            value={filterStatus}
            onChange={(e) => {
              setFilterStatus(e.target.value);
              setPage(1);
            }}
            className="px-4 py-2 border border-gray-300 rounded-lg"
          >
            <option value="">Tất cả trạng thái</option>
            <option value="active">Đang hoạt động</option>
            <option value="inactive">Đã vô hiệu hóa</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Họ tên</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Số điện thoại</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vai trò</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Trạng thái</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ngày tạo</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Thao tác</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {users.map((user) => (
              <tr key={user.user_id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {user.user_id}
                </td>
                <td className="px-6 py-4 text-sm text-gray-900">
                  {user.full_name}
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  {user.email}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {user.phone_number || '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 text-xs rounded-full ${getRoleBadge(user.role?.role_name || 'CUSTOMER')}`}>
                    {getRoleText(user.role?.role_name || 'CUSTOMER')}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    user.is_active
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {user.is_active ? 'Hoạt động' : 'Vô hiệu hóa'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(user.created_at).toLocaleDateString('vi-VN')}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <button
                    onClick={() => viewUserDetail(user)}
                    className="text-primary-600 hover:text-primary-900 mr-3"
                  >
                    Chi tiết
                  </button>
                  <button
                    onClick={() => handleToggleStatus(user.user_id, user.is_active)}
                    className={`${
                      user.is_active
                        ? 'text-red-600 hover:text-red-900'
                        : 'text-green-600 hover:text-green-900'
                    }`}
                  >
                    {user.is_active ? 'Vô hiệu hóa' : 'Kích hoạt'}
                  </button>
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

      {/* User Detail Modal */}
      {showModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-xl font-bold mb-4">Chi tiết người dùng</h2>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-500">ID</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedUser.user_id}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Họ tên</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedUser.full_name}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Email</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedUser.email}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Số điện thoại</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedUser.phone_number || '-'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Vai trò</label>
                    <div className="mt-1">
                      <select
                        value={selectedUser.role?.role_name || 'CUSTOMER'}
                        onChange={(e) => handleUpdateRole(selectedUser.user_id, e.target.value)}
                        className="px-3 py-1 border rounded-lg text-sm"
                      >
                        <option value="CUSTOMER">Khách hàng</option>
                        <option value="WAREHOUSE_STAFF">Nhân viên kho</option>
                        <option value="ADMIN">Quản trị viên</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Trạng thái</label>
                    <p className="mt-1">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        selectedUser.is_active
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {selectedUser.is_active ? 'Hoạt động' : 'Vô hiệu hóa'}
                      </span>
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Ngày tạo</label>
                    <p className="mt-1 text-sm text-gray-900">
                      {new Date(selectedUser.created_at).toLocaleString('vi-VN')}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Cập nhật lần cuối</label>
                    <p className="mt-1 text-sm text-gray-900">
                      {new Date(selectedUser.updated_at).toLocaleString('vi-VN')}
                    </p>
                  </div>
                </div>

                {/* Addresses */}
                {selectedUser.addresses && selectedUser.addresses.length > 0 && (
                  <div className="mt-6">
                    <h3 className="text-sm font-medium text-gray-900 mb-2">Địa chỉ</h3>
                    <div className="space-y-2">
                      {selectedUser.addresses.map((addr) => (
                        <div key={addr.address_id} className="p-3 bg-gray-50 rounded-lg text-sm">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-medium">{addr.recipient_name} - {addr.phone_number}</p>
                              <p className="text-gray-600 mt-1">{addr.full_address}</p>
                            </div>
                            {addr.is_default && (
                              <span className="px-2 py-1 text-xs bg-primary-100 text-primary-800 rounded">
                                Mặc định
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
