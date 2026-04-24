import React, { useMemo } from 'react';
import qrImage from '../../assets/qr_nganhang.jpg';

/**
 * QRDisplayComponent - Reusable component to display VietQR payment information
 * 
 * @param {string} orderCode - Order code (optional, for order detail page)
 * @param {string} customerName - Customer name
 * @param {number} totalAmount - Total amount to pay
 * @param {boolean} showInstructions - Show instructions (default: true)
 */
const QRDisplayComponent = ({ 
  orderCode, 
  customerName, 
  totalAmount, 
  showInstructions = true 
}) => {
  // Generate transfer content
  const transferContent = useMemo(() => {
    if (orderCode) {
      // For order detail page - use existing order code
      return `${orderCode} ${customerName}`;
    } else {
      // For checkout page - generate temporary code with timestamp
      const timestamp = Date.now().toString().slice(-6);
      return `DH${timestamp} ${customerName}`;
    }
  }, [orderCode, customerName]);

  // Format amount to VND
  const formatAmount = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-6 border-2 border-blue-200 shadow-lg">
      <div className="text-center mb-4">
        <h3 className="text-2xl font-bold text-gray-800 mb-2">
          💳 Thanh toán chuyển khoản
        </h3>
        <p className="text-gray-600">Quét mã QR để chuyển khoản</p>
      </div>

      <div className="flex flex-col md:flex-row gap-6 items-center md:items-start">
        {/* QR Code */}
        <div className="flex-shrink-0">
          <div className="bg-white p-4 rounded-lg shadow-md">
            <img 
              src={qrImage} 
              alt="VietQR Code" 
              className="w-64 h-64 object-contain"
            />
            <div className="mt-2 text-center">
              <span className="inline-flex items-center gap-2 text-sm text-gray-600">
                <span className="text-red-600 font-semibold">VietQR</span>
                <span>•</span>
                <span>MB Bank</span>
              </span>
            </div>
          </div>
        </div>

        {/* Bank Information */}
        <div className="flex-1 w-full">
          <div className="bg-white rounded-lg p-5 shadow-md space-y-4">
            <div>
              <label className="text-sm font-semibold text-gray-600 uppercase tracking-wide">
                Ngân hàng
              </label>
              <p className="text-lg font-bold text-gray-800 mt-1">
                MB Bank (Ngân hàng Quân Đội)
              </p>
            </div>

            <div>
              <label className="text-sm font-semibold text-gray-600 uppercase tracking-wide">
                Số tài khoản
              </label>
              <p className="text-lg font-bold text-gray-800 mt-1 font-mono">
                0779902117
              </p>
            </div>

            <div>
              <label className="text-sm font-semibold text-gray-600 uppercase tracking-wide">
                Chủ tài khoản
              </label>
              <p className="text-lg font-bold text-gray-800 mt-1">
                NGUYEN SI QUYNH
              </p>
            </div>

            <div className="border-t pt-4">
              <label className="text-sm font-semibold text-gray-600 uppercase tracking-wide">
                Số tiền
              </label>
              <p className="text-2xl font-bold text-red-600 mt-1">
                {formatAmount(totalAmount)}
              </p>
            </div>

            <div className="border-t pt-4">
              <label className="text-sm font-semibold text-gray-600 uppercase tracking-wide">
                Nội dung chuyển khoản
              </label>
              <div className="mt-2 bg-yellow-50 border-2 border-yellow-300 rounded-lg p-3">
                <p className="text-lg font-bold text-gray-800 font-mono break-all">
                  {transferContent}
                </p>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(transferContent);
                    alert('Đã sao chép nội dung chuyển khoản!');
                  }}
                  className="mt-2 text-sm text-blue-600 hover:text-blue-800 font-semibold"
                >
                  📋 Sao chép
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Instructions */}
      {showInstructions && (
        <div className="mt-6 space-y-4">
          <div className="bg-blue-100 border-l-4 border-blue-500 p-4 rounded">
            <h4 className="font-bold text-blue-800 mb-2">📱 Hướng dẫn thanh toán:</h4>
            <ol className="list-decimal list-inside space-y-1 text-sm text-blue-900">
              <li>Mở ứng dụng ngân hàng của bạn (MB Bank, VietinBank, Techcombank, v.v.)</li>
              <li>Chọn chức năng "Quét mã QR" hoặc "Chuyển khoản"</li>
              <li>Quét mã QR bên trên hoặc nhập thông tin tài khoản</li>
              <li><strong>Quan trọng:</strong> Nhập đúng nội dung chuyển khoản như trên</li>
              <li>Xác nhận và hoàn tất giao dịch</li>
            </ol>
          </div>

          <div className="bg-yellow-100 border-l-4 border-yellow-500 p-4 rounded">
            <h4 className="font-bold text-yellow-800 mb-2">⚠️ Lưu ý quan trọng:</h4>
            <ul className="list-disc list-inside space-y-1 text-sm text-yellow-900">
              <li>Vui lòng ghi <strong>ĐÚNG</strong> nội dung chuyển khoản để đơn hàng được xử lý nhanh chóng</li>
              <li>Đơn hàng sẽ được xác nhận sau khi chúng tôi kiểm tra giao dịch ngân hàng</li>
              <li>Thời gian xác nhận: trong vòng 1-2 giờ (giờ hành chính)</li>
              <li>Nếu có thắc mắc, vui lòng liên hệ hotline: 1900-xxxx</li>
            </ul>
          </div>
        </div>
      )}

      {/* Supported Payment Methods */}
      <div className="mt-4 text-center">
        <p className="text-xs text-gray-500 mb-2">Hỗ trợ thanh toán qua:</p>
        <div className="flex justify-center gap-3 flex-wrap">
          <span className="px-3 py-1 bg-white rounded-full text-xs font-semibold text-gray-700 shadow-sm">
            VietQR Pay
          </span>
          <span className="px-3 py-1 bg-white rounded-full text-xs font-semibold text-gray-700 shadow-sm">
            VietQR Global
          </span>
          <span className="px-3 py-1 bg-white rounded-full text-xs font-semibold text-gray-700 shadow-sm">
            napas 24/7
          </span>
        </div>
      </div>
    </div>
  );
};

export default QRDisplayComponent;
