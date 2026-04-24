/**
 * Admin Layout
 */
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  FiHome,
  FiPackage,
  FiShoppingBag,
  FiUsers,
  FiDatabase,
  FiLogOut,
  FiAlertCircle,
} from 'react-icons/fi';

const AdminLayout = () => {
  const { user, logout } = useAuth();
  const location = useLocation();

  const menuItems = [
    { path: '/admin/dashboard', icon: FiHome, label: 'Dashboard' },
    { path: '/admin/products', icon: FiPackage, label: 'Sản phẩm' },
    { path: '/admin/orders', icon: FiShoppingBag, label: 'Đơn hàng' },
    { path: '/admin/cancellation-requests', icon: FiAlertCircle, label: 'Yêu cầu hủy đơn' },
    { path: '/admin/inventory', icon: FiDatabase, label: 'Kho' },
    { path: '/admin/users', icon: FiUsers, label: 'Người dùng' },
  ];

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className="w-64 bg-white shadow-md">
        <div className="p-4 border-b">
          <h1 className="text-xl font-bold text-primary-600">🌾 Admin Panel</h1>
          <p className="text-sm text-gray-600">{user?.full_name}</p>
        </div>

        <nav className="p-4">
          <ul className="space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;

              return (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                      isActive
                        ? 'bg-primary-600 text-white'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <Icon size={20} />
                    <span>{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>

          <div className="mt-8 pt-8 border-t">
            <Link
              to="/"
              className="flex items-center space-x-3 px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-lg"
            >
              <FiHome size={20} />
              <span>Về trang chủ</span>
            </Link>
            <button
              onClick={logout}
              className="flex items-center space-x-3 px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-lg w-full"
            >
              <FiLogOut size={20} />
              <span>Đăng xuất</span>
            </button>
          </div>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;
