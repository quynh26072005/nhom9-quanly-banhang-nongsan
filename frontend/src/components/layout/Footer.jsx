/**
 * Footer Component
 */
const Footer = () => {
  return (
    <footer className="bg-gray-800 text-white mt-12">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* About */}
          <div>
            <h3 className="text-lg font-bold mb-4">Về chúng tôi</h3>
            <p className="text-gray-400">
              Hệ thống quản lý và bán nông sản trực tuyến, cung cấp sản phẩm tươi ngon từ nông trại.
            </p>
          </div>

          {/* Links */}
          <div>
            <h3 className="text-lg font-bold mb-4">Liên kết</h3>
            <ul className="space-y-2">
              <li>
                <a href="/" className="text-gray-400 hover:text-white">
                  Trang chủ
                </a>
              </li>
              <li>
                <a href="/products" className="text-gray-400 hover:text-white">
                  Sản phẩm
                </a>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-lg font-bold mb-4">Liên hệ</h3>
            <ul className="space-y-2 text-gray-400">
              <li>Email: 1250080157@sv.hcmunre.edu.vn</li>
              <li>Phone: 0779902117</li>
              <li>Address: Thành phố Hồ Chí Minh</li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-700 mt-8 pt-8 text-center text-gray-400">
          <p>&copy; 2026 Nhóm 9. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
