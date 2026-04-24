/**
 * 403 Forbidden Page
 */
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Forbidden = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        {/* 403 Icon */}
        <div className="mb-8">
          <div className="mx-auto w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <svg
              className="w-12 h-12 text-red-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 15v2m0 0v2m0-2h2m-2 0H10m4-6V7a2 2 0 10-4 0v4m-2 4h8a2 2 0 002-2V9a2 2 0 00-2-2h-8a2 2 0 00-2 2v6a2 2 0 002 2z"
              />
            </svg>
          </div>
          <h1 className="text-6xl font-bold text-red-600">403</h1>
        </div>

        {/* Message */}
        <h2 className="text-3xl font-bold text-gray-900 mb-4">
          Truy cập bị từ chối
        </h2>
        <p className="text-gray-600 mb-8">
          Bạn không có quyền truy cập vào trang này. Vui lòng liên hệ quản trị viên nếu bạn cho rằng đây là lỗi.
        </p>

        {/* User Info */}
        {user && (
          <div className="mb-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-gray-700">
              Đang đăng nhập với tài khoản:{' '}
              <span className="font-semibold">{user.email}</span>
            </p>
            <p className="text-sm text-gray-600 mt-1">
              Vai trò: <span className="font-semibold">{user.role?.role_name || 'CUSTOMER'}</span>
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            to="/"
            className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
          >
            Về trang chủ
          </Link>
          {user ? (
            <button
              onClick={handleLogout}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
            >
              Đăng xuất
            </button>
          ) : (
            <Link
              to="/login"
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
            >
              Đăng nhập
            </Link>
          )}
        </div>

        {/* Help Text */}
        <div className="mt-12 text-sm text-gray-500">
          <p>Nếu bạn cần truy cập trang quản trị, vui lòng:</p>
          <ul className="mt-2 space-y-1">
            <li>• Đăng nhập với tài khoản Admin</li>
            <li>• Liên hệ quản trị viên để được cấp quyền</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Forbidden;
