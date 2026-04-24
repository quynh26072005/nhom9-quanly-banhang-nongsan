/**
 * FAQ Page - Câu hỏi thường gặp
 */
import { useState } from 'react';

const FAQ = () => {
  const [openIndex, setOpenIndex] = useState(null);

  const toggleFAQ = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  const faqCategories = [
    {
      category: 'Đặt hàng & Thanh toán',
      icon: '🛒',
      questions: [
        {
          question: 'Làm thế nào để đặt hàng?',
          answer: 'Bạn có thể đặt hàng bằng cách: 1) Chọn sản phẩm và thêm vào giỏ hàng, 2) Xem giỏ hàng và điều chỉnh số lượng, 3) Tiến hành thanh toán và điền thông tin giao hàng, 4) Xác nhận đơn hàng.'
        },
        {
          question: 'Có những phương thức thanh toán nào?',
          answer: 'Chúng tôi hỗ trợ nhiều phương thức thanh toán: COD (thanh toán khi nhận hàng), chuyển khoản ngân hàng, ví điện tử MoMo, VNPay.'
        },
        {
          question: 'Tôi có thể hủy đơn hàng không?',
          answer: 'Bạn có thể hủy đơn hàng khi đơn hàng còn ở trạng thái "Chờ xác nhận". Sau khi đơn hàng đã được xác nhận, vui lòng liên hệ với chúng tôi để được hỗ trợ.'
        },
        {
          question: 'Làm sao để theo dõi đơn hàng?',
          answer: 'Sau khi đăng nhập, bạn vào mục "Đơn hàng của tôi" để xem chi tiết và trạng thái của tất cả các đơn hàng.'
        }
      ]
    },
    {
      category: 'Giao hàng',
      icon: '🚚',
      questions: [
        {
          question: 'Thời gian giao hàng là bao lâu?',
          answer: 'Thời gian giao hàng tiêu chuẩn là 1-2 ngày làm việc trong nội thành và 2-3 ngày cho các tỉnh thành khác. Đơn hàng đặt trước 14h sẽ được giao trong ngày.'
        },
        {
          question: 'Phí giao hàng là bao nhiêu?',
          answer: 'Phí giao hàng được tính dựa trên khoảng cách và trọng lượng đơn hàng. Miễn phí giao hàng cho đơn hàng từ 500.000đ trong nội thành.'
        },
        {
          question: 'Tôi có thể thay đổi địa chỉ giao hàng không?',
          answer: 'Bạn có thể thay đổi địa chỉ giao hàng khi đơn hàng chưa được xác nhận. Sau khi xác nhận, vui lòng liên hệ hotline để được hỗ trợ.'
        },
        {
          question: 'Điều gì xảy ra nếu tôi không có nhà khi giao hàng?',
          answer: 'Shipper sẽ liên hệ với bạn trước khi giao. Nếu không liên lạc được, đơn hàng sẽ được giao lại vào ngày hôm sau hoặc theo thời gian bạn yêu cầu.'
        }
      ]
    },
    {
      category: 'Sản phẩm',
      icon: '🥬',
      questions: [
        {
          question: 'Sản phẩm có tươi không?',
          answer: 'Tất cả sản phẩm đều được thu hoạch trong ngày và giao hàng ngay để đảm bảo độ tươi ngon tối đa. Chúng tôi cam kết 100% sản phẩm tươi mới.'
        },
        {
          question: 'Sản phẩm có an toàn không?',
          answer: 'Tất cả sản phẩm đều được canh tác theo tiêu chuẩn VietGAP, có chứng nhận an toàn thực phẩm và truy xuất nguồn gốc rõ ràng.'
        },
        {
          question: 'Làm thế nào để bảo quản sản phẩm?',
          answer: 'Mỗi sản phẩm đều có hướng dẫn bảo quản cụ thể. Nhìn chung, rau củ nên bảo quản trong ngăn mát tủ lạnh và sử dụng trong 2-3 ngày.'
        },
        {
          question: 'Tôi có thể đặt hàng số lượng lớn không?',
          answer: 'Có, chúng tôi hỗ trợ đặt hàng số lượng lớn cho nhà hàng, khách sạn, căng tin. Vui lòng liên hệ để được tư vấn và báo giá.'
        }
      ]
    },
    {
      category: 'Đổi trả & Hoàn tiền',
      icon: '↩️',
      questions: [
        {
          question: 'Chính sách đổi trả như thế nào?',
          answer: 'Chúng tôi chấp nhận đổi trả trong vòng 24h nếu sản phẩm không đúng chất lượng, bị hư hỏng hoặc không đúng như mô tả.'
        },
        {
          question: 'Làm thế nào để yêu cầu đổi trả?',
          answer: 'Bạn liên hệ hotline hoặc gửi yêu cầu qua trang "Đơn hàng của tôi". Chúng tôi sẽ xác nhận và thu hồi sản phẩm trong 24h.'
        },
        {
          question: 'Khi nào tôi nhận được tiền hoàn?',
          answer: 'Sau khi xác nhận đổi trả, tiền sẽ được hoàn lại trong 3-5 ngày làm việc tùy theo phương thức thanh toán ban đầu.'
        },
        {
          question: 'Chi phí đổi trả do ai chịu?',
          answer: 'Nếu lỗi từ phía chúng tôi (sản phẩm lỗi, giao sai), chúng tôi sẽ chịu toàn bộ chi phí. Nếu do khách hàng đổi ý, khách hàng sẽ chịu phí vận chuyển.'
        }
      ]
    },
    {
      category: 'Tài khoản',
      icon: '👤',
      questions: [
        {
          question: 'Làm thế nào để đăng ký tài khoản?',
          answer: 'Click vào nút "Đăng ký" ở góc trên bên phải, điền thông tin cá nhân và xác nhận email. Bạn sẽ nhận được email kích hoạt tài khoản.'
        },
        {
          question: 'Tôi quên mật khẩu, phải làm sao?',
          answer: 'Click vào "Quên mật khẩu" ở trang đăng nhập, nhập email đã đăng ký. Chúng tôi sẽ gửi link đặt lại mật khẩu đến email của bạn.'
        },
        {
          question: 'Làm thế nào để cập nhật thông tin cá nhân?',
          answer: 'Sau khi đăng nhập, vào mục "Tài khoản" để cập nhật thông tin cá nhân, địa chỉ giao hàng và thay đổi mật khẩu.'
        },
        {
          question: 'Thông tin của tôi có được bảo mật không?',
          answer: 'Chúng tôi cam kết bảo mật 100% thông tin khách hàng theo chính sách bảo mật. Thông tin chỉ được sử dụng cho mục đích giao dịch.'
        }
      ]
    }
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-green-600 to-green-800 text-white py-20">
        <div className="absolute inset-0 bg-black opacity-10"></div>
        <div className="relative container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Câu Hỏi Thường Gặp
            </h1>
            <p className="text-lg md:text-xl text-green-50">
              Tìm câu trả lời cho các thắc mắc của bạn
            </p>
          </div>
        </div>
      </section>

      {/* Search Box */}
      <section className="py-8 bg-white border-b">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto">
            <div className="relative">
              <input
                type="text"
                placeholder="Tìm kiếm câu hỏi..."
                className="w-full px-6 py-4 pr-12 border-2 border-gray-300 rounded-full focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
              <button className="absolute right-2 top-1/2 transform -translate-y-1/2 p-3 bg-green-600 text-white rounded-full hover:bg-green-700">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Categories */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            {faqCategories.map((category, categoryIndex) => (
              <div key={categoryIndex} className="mb-12">
                <div className="flex items-center mb-6">
                  <span className="text-4xl mr-4">{category.icon}</span>
                  <h2 className="text-2xl font-bold text-gray-900">{category.category}</h2>
                </div>

                <div className="space-y-4">
                  {category.questions.map((faq, faqIndex) => {
                    const globalIndex = `${categoryIndex}-${faqIndex}`;
                    const isOpen = openIndex === globalIndex;

                    return (
                      <div
                        key={faqIndex}
                        className="bg-white rounded-lg shadow-md overflow-hidden"
                      >
                        <button
                          onClick={() => toggleFAQ(globalIndex)}
                          className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-gray-50 transition-colors"
                        >
                          <span className="font-semibold text-gray-900 pr-4">
                            {faq.question}
                          </span>
                          <svg
                            className={`w-6 h-6 text-green-600 flex-shrink-0 transform transition-transform ${
                              isOpen ? 'rotate-180' : ''
                            }`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 9l-7 7-7-7"
                            />
                          </svg>
                        </button>

                        {isOpen && (
                          <div className="px-6 py-4 bg-gray-50 border-t">
                            <p className="text-gray-700 leading-relaxed">{faq.answer}</p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact CTA */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-4 text-gray-900">
              Không tìm thấy câu trả lời?
            </h2>
            <p className="text-gray-600 mb-8">
              Đừng lo lắng! Đội ngũ hỗ trợ của chúng tôi luôn sẵn sàng giúp đỡ bạn
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="/contact"
                className="px-8 py-4 bg-green-600 text-white rounded-full font-semibold hover:bg-green-700 transform hover:scale-105 transition-all duration-300 shadow-lg"
              >
                Liên hệ với chúng tôi
              </a>
              <a
                href="tel:02812345678"
                className="px-8 py-4 bg-white border-2 border-green-600 text-green-600 rounded-full font-semibold hover:bg-green-50 transform hover:scale-105 transition-all duration-300"
              >
                Gọi: (028) 1234 5678
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Links */}
      <section className="py-16 bg-gradient-to-br from-green-50 to-green-100">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl font-bold text-center mb-8 text-gray-900">
            Liên Kết Hữu Ích
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <a
              href="/about"
              className="bg-white rounded-lg p-6 shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
            >
              <div className="text-3xl mb-3">ℹ️</div>
              <h3 className="font-bold text-lg mb-2 text-gray-900">Về chúng tôi</h3>
              <p className="text-gray-600 text-sm">Tìm hiểu thêm về công ty</p>
            </a>
            <a
              href="/products"
              className="bg-white rounded-lg p-6 shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
            >
              <div className="text-3xl mb-3">🛍️</div>
              <h3 className="font-bold text-lg mb-2 text-gray-900">Sản phẩm</h3>
              <p className="text-gray-600 text-sm">Xem tất cả sản phẩm</p>
            </a>
            <a
              href="/contact"
              className="bg-white rounded-lg p-6 shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
            >
              <div className="text-3xl mb-3">📞</div>
              <h3 className="font-bold text-lg mb-2 text-gray-900">Liên hệ</h3>
              <p className="text-gray-600 text-sm">Liên hệ hỗ trợ</p>
            </a>
          </div>
        </div>
      </section>
    </div>
  );
};

export default FAQ;
