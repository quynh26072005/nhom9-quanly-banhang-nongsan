/**
 * User Profile Page
 */
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { toast } from 'react-toastify';

const Profile = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('profile');
  const [profile, setProfile] = useState(null);
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [addressForm, setAddressForm] = useState({
    recipient_name: '',
    phone: '',
    address_line: '',
    ward: '',
    district: '',
    city: '',
    is_default: false,
  });

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    fetchData();
  }, [user]);

  const fetchData = async () => {
    try {
      const [profileRes, addressesRes] = await Promise.all([
        api.get('/users/me'),
        api.get('/users/me/addresses'),
      ]);
      setProfile(profileRes.data.data);
      setAddresses(addressesRes.data.data || []);
    } catch (error) {
      toast.error('Không thể tải thông tin');
    } finally {
      setLoading(false);
    }
  };

  const handleAddressSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/users/me/addresses', addressForm);
      toast.success('Đã thêm địa chỉ mới');
      setShowAddressForm(false);
      setAddressForm({
        recipient_name: '',
        phone: '',
        address_line: '',
        ward: '',
        district: '',
        city: '',
        is_default: false,
      });
      fetchData();
    } catch (error) {
      toast.error('Không thể thêm địa chỉ');
    }
  };

  const handleDeleteAddress = async (addressId) => {
    if (!confirm('Bạn có chắc muốn xóa địa chỉ này?')) return;

    try {
      await api.delete(`/users/me/addresses/${addressId}`);
      toast.success('Đã xóa địa chỉ');
      fetchData();
    } catch (error) {
      toast.error('Không thể xóa địa chỉ');
    }
  };

  const handleSetDefaultAddress = async (addressId) => {
    try {
      await api.put(`/users/me/addresses/${addressId}`, { is_default: true });
      toast.success('Đã đặt làm địa chỉ mặc định');
      fetchData();
    } catch (error) {
      toast.error('Không thể cập nhật địa chỉ');
    }
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
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Tài khoản của tôi</h1>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-md p-4">
            <button
              onClick={() => setActiveTab('profile')}
              className={`w-full text-left px-4 py-3 rounded-lg mb-2 transition-colors ${
                activeTab === 'profile'
                  ? 'bg-primary-600 text-white'
                  : 'hover:bg-gray-100'
              }`}
            >
              👤 Thông tin cá nhân
            </button>
            <button
              onClick={() => setActiveTab('addresses')}
              className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
                activeTab === 'addresses'
                  ? 'bg-primary-600 text-white'
                  : 'hover:bg-gray-100'
              }`}
            >
              📍 Địa chỉ giao hàng
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="lg:col-span-3">
          {activeTab === 'profile' && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Thông tin cá nhân</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Họ và tên
                  </label>
                  <p className="text-gray-900 font-medium">{profile?.full_name}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <p className="text-gray-900 font-medium">{profile?.email}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Số điện thoại
                  </label>
                  <p className="text-gray-900 font-medium">{profile?.phone || 'Chưa cập nhật'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Vai trò
                  </label>
                  <p className="text-gray-900 font-medium">
                    {profile?.role?.role_name === 'ADMIN' ? 'Quản trị viên' : 'Khách hàng'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'addresses' && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">Địa chỉ giao hàng</h2>
                <button
                  onClick={() => setShowAddressForm(!showAddressForm)}
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                >
                  {showAddressForm ? 'Hủy' : '+ Thêm địa chỉ mới'}
                </button>
              </div>

              {/* Add Address Form */}
              {showAddressForm && (
                <form onSubmit={handleAddressSubmit} className="mb-6 p-4 border border-gray-200 rounded-lg">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Họ và tên <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={addressForm.recipient_name}
                        onChange={(e) => setAddressForm({ ...addressForm, recipient_name: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Số điện thoại <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="tel"
                        value={addressForm.phone}
                        onChange={(e) => setAddressForm({ ...addressForm, phone: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                        required
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Địa chỉ <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={addressForm.address_line}
                        onChange={(e) => setAddressForm({ ...addressForm, address_line: e.target.value })}
                        placeholder="Số nhà, tên đường"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Phường/Xã
                      </label>
                      <input
                        type="text"
                        value={addressForm.ward}
                        onChange={(e) => setAddressForm({ ...addressForm, ward: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Quận/Huyện
                      </label>
                      <input
                        type="text"
                        value={addressForm.district}
                        onChange={(e) => setAddressForm({ ...addressForm, district: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Tỉnh/Thành phố <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={addressForm.city}
                        onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                        required
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={addressForm.is_default}
                          onChange={(e) => setAddressForm({ ...addressForm, is_default: e.target.checked })}
                          className="mr-2"
                        />
                        <span className="text-sm text-gray-700">Đặt làm địa chỉ mặc định</span>
                      </label>
                    </div>
                  </div>
                  <div className="mt-4 flex gap-3">
                    <button
                      type="submit"
                      className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                    >
                      Lưu địa chỉ
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowAddressForm(false)}
                      className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Hủy
                    </button>
                  </div>
                </form>
              )}

              {/* Address List */}
              {addresses.length === 0 ? (
                <p className="text-center text-gray-600 py-8">Chưa có địa chỉ giao hàng</p>
              ) : (
                <div className="space-y-4">
                  {addresses.map((address) => (
                    <div
                      key={address.address_id}
                      className="p-4 border border-gray-200 rounded-lg"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <p className="font-semibold text-gray-900">
                              {address.recipient_name}
                            </p>
                            {address.is_default && (
                              <span className="text-xs bg-primary-100 text-primary-800 px-2 py-1 rounded">
                                Mặc định
                              </span>
                            )}
                          </div>
                          <p className="text-gray-600 text-sm mb-1">{address.phone}</p>
                          <p className="text-gray-600 text-sm">
                            {address.address_line}, {address.ward}, {address.district}, {address.city}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          {!address.is_default && (
                            <button
                              onClick={() => handleSetDefaultAddress(address.address_id)}
                              className="text-sm text-primary-600 hover:text-primary-700"
                            >
                              Đặt mặc định
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteAddress(address.address_id)}
                            className="text-sm text-red-600 hover:text-red-700"
                          >
                            Xóa
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;
