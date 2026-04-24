/**
 * Header Component
 */
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { FiShoppingCart, FiUser, FiLogOut, FiChevronDown } from 'react-icons/fi';
import { useState, useEffect, useRef } from 'react';

const Header = () => {
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const { cartCount } = useCart();
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="bg-white shadow-md">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="text-2xl font-bold text-primary-600">
            🌾 Nông Sản
          </Link>

          {/* Navigation */}
          <nav className="hidden md:flex space-x-6">
            <Link to="/" className="text-gray-700 hover:text-primary-600 py-2">
              Trang chủ
            </Link>
            
            {/* Products Dropdown */}
            <div className="relative group">
              <button className="text-gray-700 hover:text-primary-600 py-2 flex items-center">
                Sản phẩm
                <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              <div className="absolute left-0 mt-2 w-48 bg-white rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                <Link to="/products" className="block px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-t-lg">
                  Tất cả sản phẩm
                </Link>
                <Link to="/promotions" className="block px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-b-lg">
                  🎉 Khuyến mãi
                </Link>
              </div>
            </div>

            <Link to="/about" className="text-gray-700 hover:text-primary-600 py-2">
              Về chúng tôi
            </Link>
            <Link to="/contact" className="text-gray-700 hover:text-primary-600 py-2">
              Liên hệ
            </Link>
            <Link to="/faq" className="text-gray-700 hover:text-primary-600 py-2">
              FAQ
            </Link>
          </nav>

          {/* Right side */}
          <div className="flex items-center space-x-4">
            {isAuthenticated ? (
              <>
                <Link
                  to="/cart"
                  className="text-gray-700 hover:text-primary-600 relative"
                >
                  <FiShoppingCart size={24} />
                  {/* Cart badge */}
                  {cartCount > 0 && (
                    <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                      {cartCount}
                    </span>
                  )}
                </Link>

                <div className="relative" ref={dropdownRef}>
                  <button 
                    onClick={() => setShowDropdown(!showDropdown)}
                    className="flex items-center space-x-2 text-gray-700 hover:text-primary-600"
                  >
                    <FiUser size={24} />
                    <span>{user?.full_name}</span>
                    <FiChevronDown size={16} />
                  </button>

                  {/* Dropdown */}
                  {showDropdown && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50">
                      <Link
                        to="/profile"
                        onClick={() => setShowDropdown(false)}
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        Tài khoản
                      </Link>
                      <Link
                        to="/my-orders"
                        onClick={() => setShowDropdown(false)}
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        Đơn hàng của tôi
                      </Link>
                      {isAdmin && (
                        <Link
                          to="/admin"
                          onClick={() => setShowDropdown(false)}
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
                          Quản trị
                        </Link>
                      )}
                      <button
                        onClick={() => {
                          setShowDropdown(false);
                          logout();
                        }}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        <FiLogOut className="inline mr-2" />
                        Đăng xuất
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="text-gray-700 hover:text-primary-600"
                >
                  Đăng nhập
                </Link>
                <Link
                  to="/register"
                  className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700"
                >
                  Đăng ký
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
