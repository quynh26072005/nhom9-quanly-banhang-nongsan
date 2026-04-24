/**
 * Home Page
 */
import { Link } from 'react-router-dom';

const Home = () => {
  const features = [
    {
      icon: '🌱',
      title: 'Tươi ngon',
      description: 'Sản phẩm được thu hoạch và giao hàng trong ngày',
      color: 'from-green-400 to-green-600'
    },
    {
      icon: '✓',
      title: 'An toàn',
      description: 'Đảm bảo chất lượng và nguồn gốc rõ ràng',
      color: 'from-blue-400 to-blue-600'
    },
    {
      icon: '🚚',
      title: 'Giao hàng nhanh',
      description: 'Giao hàng tận nơi trong 24h',
      color: 'from-orange-400 to-orange-600'
    }
  ];

  const categories = [
    { name: 'Rau củ quả', icon: '🥬', count: '50+ sản phẩm' },
    { name: 'Trái cây', icon: '🍎', count: '30+ sản phẩm' },
    { name: 'Thịt tươi', icon: '🥩', count: '20+ sản phẩm' },
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-green-500 via-green-600 to-green-700 text-white overflow-hidden">
        <div className="absolute inset-0 bg-black opacity-10"></div>
        <div className="absolute inset-0">
          <div className="absolute top-20 left-10 w-72 h-72 bg-white opacity-5 rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-white opacity-5 rounded-full blur-3xl"></div>
        </div>
        
        <div className="relative container mx-auto px-4 py-24 md:py-32">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6 animate-fade-in">
              Nông sản tươi ngon từ nông trại
            </h1>
            <p className="text-lg md:text-xl mb-8 text-green-50 animate-fade-in-delay">
              Cung cấp sản phẩm nông sản chất lượng cao, an toàn và tươi mới
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in-delay-2">
              <Link
                to="/products"
                className="px-8 py-4 bg-white text-green-600 rounded-full font-semibold hover:bg-green-50 transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl"
              >
                Xem sản phẩm
              </Link>
              <Link
                to="/register"
                className="px-8 py-4 bg-transparent border-2 border-white text-white rounded-full font-semibold hover:bg-white hover:text-green-600 transform hover:scale-105 transition-all duration-300"
              >
                Đăng ký ngay
              </Link>
            </div>
          </div>
        </div>

        {/* Wave decoration */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0 120L60 105C120 90 240 60 360 45C480 30 600 30 720 37.5C840 45 960 60 1080 67.5C1200 75 1320 75 1380 75L1440 75V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z" fill="white"/>
          </svg>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4 text-gray-900">
            Tại sao chọn chúng tôi?
          </h2>
          <p className="text-center text-gray-600 mb-12 max-w-2xl mx-auto">
            Chúng tôi cam kết mang đến cho bạn những sản phẩm nông sản tốt nhất
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {features.map((feature, index) => (
              <div
                key={index}
                className="group relative bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-100"
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-5 rounded-2xl transition-opacity duration-300`}></div>
                <div className="relative">
                  <div className={`w-16 h-16 bg-gradient-to-br ${feature.color} rounded-2xl flex items-center justify-center text-3xl mb-6 transform group-hover:scale-110 transition-transform duration-300 shadow-lg`}>
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-bold mb-3 text-gray-900">{feature.title}</h3>
                  <p className="text-gray-600 leading-relaxed">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-20 bg-gradient-to-b from-gray-50 to-white">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4 text-gray-900">
            Danh mục sản phẩm
          </h2>
          <p className="text-center text-gray-600 mb-12">
            Khám phá các sản phẩm nông sản chất lượng cao
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {categories.map((category, index) => (
              <Link
                key={index}
                to="/products"
                className="group relative bg-white rounded-2xl p-8 shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border border-gray-100 overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-green-100 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500"></div>
                <div className="relative">
                  <div className="text-5xl mb-4 transform group-hover:scale-110 transition-transform duration-300">
                    {category.icon}
                  </div>
                  <h3 className="text-xl font-bold mb-2 text-gray-900">{category.name}</h3>
                  <p className="text-green-600 font-medium">{category.count}</p>
                </div>
              </Link>
            ))}
          </div>

          <div className="text-center mt-12">
            <Link
              to="/products"
              className="inline-flex items-center px-8 py-4 bg-green-600 text-white rounded-full font-semibold hover:bg-green-700 transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl"
            >
              Xem tất cả sản phẩm
              <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* About Farm Section */}
      <section className="py-20 bg-gradient-to-br from-pink-50 via-orange-50 to-pink-100 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-0 left-0 w-96 h-96 bg-green-200 opacity-20 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-orange-200 opacity-20 rounded-full blur-3xl"></div>
        </div>

        <div className="relative container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center max-w-6xl mx-auto">
            {/* Image Side */}
            <div className="relative">
              <div className="absolute -top-6 -left-6 w-full h-full bg-gradient-to-br from-green-400 to-green-600 rounded-3xl opacity-20"></div>
              <div className="relative bg-white rounded-3xl shadow-2xl overflow-hidden transform hover:scale-105 transition-transform duration-500">
                <img 
                  src="https://images.unsplash.com/photo-1464226184884-fa280b87c399?w=800" 
                  alt="Trang trại" 
                  className="w-full h-96 object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
              </div>
            </div>

            {/* Content Side */}
            <div>
              <h2 className="text-3xl md:text-4xl font-bold mb-6 text-gray-900">
                Nông Sản Sạch: Từ Tâm Đến Bàn Ăn
              </h2>
              <p className="text-gray-700 leading-relaxed mb-6">
                Mỗi sản phẩm đều là kết quả của quy trình canh tác bền vững, tuân thủ nghiêm ngặt các tiêu chuẩn an toàn, từ giống, nguồn nước, quy trình chăm sóc cho đến khâu thu hoạch và bảo quản. Chúng tôi lựa chọn đối tác địa phương đáng tin cậy, thu hoạch trong ngày và giao nhanh để giữ trọn vị tươi ngon.
              </p>

              <div className="space-y-4 mb-8">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center mt-1">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <p className="text-gray-700">Canh tác theo tiêu chuẩn hữu cơ</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center mt-1">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <p className="text-gray-700">Truy xuất nguồn gốc 100%</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center mt-1">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <p className="text-gray-700">Bảo quản nghiêm ngặt, giữ trọn dưỡng chất</p>
                </div>
              </div>

              <Link
                to="/products"
                className="inline-flex items-center px-8 py-4 bg-green-600 text-white rounded-full font-semibold hover:bg-green-700 transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl"
              >
                Tìm hiểu thêm về trang trại
                <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-green-600 to-green-700 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-black opacity-10"></div>
        <div className="absolute inset-0">
          <div className="absolute top-10 left-20 w-64 h-64 bg-white opacity-5 rounded-full blur-3xl"></div>
          <div className="absolute bottom-10 right-20 w-80 h-80 bg-white opacity-5 rounded-full blur-3xl"></div>
        </div>
        
        <div className="relative container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Bắt đầu mua sắm ngay hôm nay
          </h2>
          <p className="text-lg text-green-50 mb-8 max-w-2xl mx-auto">
            Đăng ký tài khoản để nhận ưu đãi đặc biệt và trải nghiệm mua sắm tuyệt vời
          </p>
          <Link
            to="/register"
            className="inline-flex items-center px-8 py-4 bg-white text-green-600 rounded-full font-semibold hover:bg-green-50 transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl"
          >
            Đăng ký miễn phí
            <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </Link>
        </div>
      </section>
    </div>
  );
};

export default Home;
