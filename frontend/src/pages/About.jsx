/**
 * About Us Page - Giới thiệu về công ty
 */
import { Link } from 'react-router-dom';

const About = () => {
  const values = [
    {
      icon: '🌱',
      title: 'Chất lượng',
      description: 'Cam kết cung cấp sản phẩm nông sản chất lượng cao nhất'
    },
    {
      icon: '🤝',
      title: 'Uy tín',
      description: 'Xây dựng niềm tin với khách hàng qua từng sản phẩm'
    },
    {
      icon: '💚',
      title: 'Bền vững',
      description: 'Canh tác bền vững, thân thiện với môi trường'
    },
    {
      icon: '⚡',
      title: 'Nhanh chóng',
      description: 'Giao hàng nhanh, đảm bảo độ tươi ngon'
    }
  ];

  const team = [
    {
      name: 'Nguyễn Văn A',
      role: 'Giám đốc điều hành',
      image: 'https://ui-avatars.com/api/?name=Nguyen+Van+A&background=10b981&color=fff&size=200'
    },
    {
      name: 'Trần Thị B',
      role: 'Trưởng phòng Sản xuất',
      image: 'https://ui-avatars.com/api/?name=Tran+Thi+B&background=3b82f6&color=fff&size=200'
    },
    {
      name: 'Lê Văn C',
      role: 'Trưởng phòng Kinh doanh',
      image: 'https://ui-avatars.com/api/?name=Le+Van+C&background=f59e0b&color=fff&size=200'
    }
  ];

  const milestones = [
    { year: '2020', event: 'Thành lập công ty' },
    { year: '2021', event: 'Mở rộng trang trại lên 50 hecta' },
    { year: '2022', event: 'Đạt chứng nhận VietGAP' },
    { year: '2023', event: 'Ra mắt nền tảng thương mại điện tử' },
    { year: '2024', event: 'Phục vụ hơn 10,000 khách hàng' }
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-green-600 to-green-800 text-white py-20">
        <div className="absolute inset-0 bg-black opacity-10"></div>
        <div className="relative container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Về Chúng Tôi
            </h1>
            <p className="text-lg md:text-xl text-green-50">
              Mang nông sản sạch, tươi ngon từ trang trại đến bàn ăn của bạn
            </p>
          </div>
        </div>
      </section>

      {/* Story Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-8 text-gray-900">
              Câu Chuyện Của Chúng Tôi
            </h2>
            <div className="prose prose-lg max-w-none text-gray-700">
              <p className="mb-4">
                Được thành lập vào năm 2020, chúng tôi bắt đầu với một trang trại nhỏ và 
                niềm đam mê mang đến cho người tiêu dùng những sản phẩm nông sản sạch, 
                an toàn và chất lượng cao nhất.
              </p>
              <p className="mb-4">
                Qua 4 năm phát triển, chúng tôi đã mở rộng quy mô lên 50 hecta với đa dạng 
                các loại rau củ quả, trái cây và sản phẩm nông sản khác. Tất cả đều được 
                canh tác theo tiêu chuẩn VietGAP, đảm bảo an toàn thực phẩm và thân thiện 
                với môi trường.
              </p>
              <p>
                Sứ mệnh của chúng tôi là kết nối nông dân với người tiêu dùng, mang đến 
                những sản phẩm tươi ngon nhất với giá cả hợp lý, đồng thời góp phần phát 
                triển nông nghiệp bền vững tại Việt Nam.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12 text-gray-900">
            Giá Trị Cốt Lõi
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
            {values.map((value, index) => (
              <div
                key={index}
                className="bg-white rounded-xl p-6 shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2"
              >
                <div className="text-5xl mb-4">{value.icon}</div>
                <h3 className="text-xl font-bold mb-3 text-gray-900">{value.title}</h3>
                <p className="text-gray-600">{value.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Timeline Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12 text-gray-900">
            Hành Trình Phát Triển
          </h2>
          <div className="max-w-3xl mx-auto">
            <div className="relative">
              {/* Timeline line */}
              <div className="absolute left-1/2 transform -translate-x-1/2 h-full w-1 bg-green-200"></div>
              
              {milestones.map((milestone, index) => (
                <div key={index} className="relative mb-8">
                  <div className={`flex items-center ${index % 2 === 0 ? 'flex-row' : 'flex-row-reverse'}`}>
                    <div className={`w-5/12 ${index % 2 === 0 ? 'text-right pr-8' : 'text-left pl-8'}`}>
                      <div className="bg-white p-4 rounded-lg shadow-md hover:shadow-lg transition-shadow">
                        <div className="text-2xl font-bold text-green-600 mb-2">{milestone.year}</div>
                        <p className="text-gray-700">{milestone.event}</p>
                      </div>
                    </div>
                    <div className="w-2/12 flex justify-center">
                      <div className="w-4 h-4 bg-green-600 rounded-full border-4 border-white shadow-lg z-10"></div>
                    </div>
                    <div className="w-5/12"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-4 text-gray-900">
            Đội Ngũ Của Chúng Tôi
          </h2>
          <p className="text-center text-gray-600 mb-12 max-w-2xl mx-auto">
            Những con người tận tâm đằng sau sự thành công
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {team.map((member, index) => (
              <div
                key={index}
                className="bg-white rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2"
              >
                <img
                  src={member.image}
                  alt={member.name}
                  className="w-full h-64 object-cover"
                />
                <div className="p-6 text-center">
                  <h3 className="text-xl font-bold mb-2 text-gray-900">{member.name}</h3>
                  <p className="text-green-600 font-medium">{member.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-br from-green-600 to-green-700 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">
            Sẵn Sàng Trải Nghiệm?
          </h2>
          <p className="text-lg text-green-50 mb-8 max-w-2xl mx-auto">
            Khám phá các sản phẩm nông sản tươi ngon của chúng tôi ngay hôm nay
          </p>
          <Link
            to="/products"
            className="inline-flex items-center px-8 py-4 bg-white text-green-600 rounded-full font-semibold hover:bg-green-50 transform hover:scale-105 transition-all duration-300 shadow-lg"
          >
            Xem Sản Phẩm
            <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </Link>
        </div>
      </section>
    </div>
  );
};

export default About;
