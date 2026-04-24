/**
 * 404 Not Found Page
 */
import { Link } from 'react-router-dom';

const NotFound = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        {/* 404 Icon */}
        <div className="mb-8">
          <h1 className="text-9xl font-bold text-primary-600">404</h1>
        </div>

        {/* Message */}
        <h2 className="text-3xl font-bold text-gray-900 mb-4">
          Không tìm thấy trang
        </h2>
        <p className="text-gray-600 mb-8">
          Xin lỗi, trang bạn đang tìm kiếm không tồn tại hoặc đã bị di chuyển.
        </p>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            to="/"
            className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition"
          >
            Về trang chủ
          </Link>
          <button
            onClick={() => window.history.back()}
            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
          >
            Quay lại
          </button>
        </div>

        {/* Suggestions */}
        <div className="mt-12 text-left">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">
            Có thể bạn đang tìm:
          </h3>
          <ul className="space-y-2 text-sm text-gray-600">
            <li>
              <Link to="/products" className="hover:text-primary-600">
                → Danh sách sản phẩm
              </Link>
            </li>
            <li>
              <Link to="/cart" className="hover:text-primary-600">
                → Giỏ hàng
              </Link>
            </li>
            <li>
              <Link to="/orders" className="hover:text-primary-600">
                → Đơn hàng của tôi
              </Link>
            </li>
            <li>
              <Link to="/profile" className="hover:text-primary-600">
                → Trang cá nhân
              </Link>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
