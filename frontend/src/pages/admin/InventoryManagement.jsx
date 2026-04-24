/**
 * Inventory Management Page (Admin)
 */
import { useState, useEffect } from 'react';
import api from '../../services/api';
import { toast } from 'react-toastify';

const InventoryManagement = () => {
  const [inventory, setInventory] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [products, setProducts] = useState([]);
  const [lowStockItems, setLowStockItems] = useState([]);
  const [expiringItems, setExpiringItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('inventory'); // inventory, lowStock, expiring
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState(''); // stockIn, stockOut, adjust, addProduct
  const [selectedItem, setSelectedItem] = useState(null);
  const [formData, setFormData] = useState({
    product_id: '',
    warehouse_id: '',
    quantity: '',
    unit_price: '',
    supplier: '',
    batch_number: '',
    harvest_date: '',
    expiry_date: '',
    notes: '',
    reason: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [inventoryRes, warehousesRes, productsRes, lowStockRes, expiringRes] = await Promise.all([
        api.get('/admin/inventory?limit=100'),
        api.get('/admin/warehouses'),
        api.get('/products?limit=100'),
        api.get('/admin/inventory/low-stock'),
        api.get('/admin/inventory/expiring-soon'),
      ]);
      setInventory(inventoryRes.data.data || []);
      setWarehouses(warehousesRes.data.data || []);
      setProducts(productsRes.data.data || []);
      setLowStockItems(lowStockRes.data.data || []);
      setExpiringItems(expiringRes.data.data || []);
    } catch (error) {
      toast.error('Không thể tải dữ liệu kho');
    } finally {
      setLoading(false);
    }
  };

  const openModal = (type, item = null) => {
    setModalType(type);
    setSelectedItem(item);
    setFormData({
      product_id: item?.product_id || '',
      warehouse_id: item?.warehouse_id || (warehouses.length > 0 ? warehouses[0].warehouse_id : ''),
      quantity: '',
      unit_price: '',
      supplier: '',
      batch_number: '',
      harvest_date: '',
      expiry_date: '',
      notes: '',
      reason: '',
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (modalType === 'addProduct') {
        // Add new product to inventory
        const payload = {
          product_id: parseInt(formData.product_id),
          warehouse_id: parseInt(formData.warehouse_id),
          quantity: parseFloat(formData.quantity),
          unit_cost: formData.unit_price ? parseFloat(formData.unit_price) : null,
          batch_number: formData.batch_number || null,
          harvest_date: formData.harvest_date || null,
          expiry_date: formData.expiry_date || null,
          notes: formData.notes || null,
        };
        await api.post('/admin/inventory', payload);
        toast.success('Thêm sản phẩm vào kho thành công');
      } else if (modalType === 'stockIn') {
        // Stock In - add more quantity to existing inventory
        const payload = {
          product_id: selectedItem.product_id,
          warehouse_id: parseInt(formData.warehouse_id),
          quantity: parseFloat(formData.quantity),
          unit_cost: formData.unit_price ? parseFloat(formData.unit_price) : null,
          batch_number: formData.batch_number || null,
          harvest_date: formData.harvest_date || null,
          expiry_date: formData.expiry_date || null,
          notes: formData.notes || null,
        };
        await api.post('/admin/inventory/stock-in', payload);
        toast.success('Nhập kho thành công');
      } else if (modalType === 'stockOut') {
        // Stock Out - requires inventory_id
        const payload = {
          inventory_id: selectedItem.inventory_id,
          quantity: parseFloat(formData.quantity),
          reference_type: 'MANUAL',
          notes: formData.notes || '',
        };
        await api.post('/admin/inventory/stock-out', payload);
        toast.success('Xuất kho thành công');
      } else if (modalType === 'adjust') {
        // Adjust - requires inventory_id and new_quantity
        const currentQuantity = parseFloat(selectedItem.quantity_in_stock);
        const adjustmentQuantity = parseFloat(formData.quantity);
        const newQuantity = currentQuantity + adjustmentQuantity;
        
        if (newQuantity < 0) {
          toast.error('Số lượng sau điều chỉnh không thể âm');
          return;
        }
        
        const payload = {
          inventory_id: selectedItem.inventory_id,
          new_quantity: newQuantity,
          notes: formData.reason ? `${formData.reason}. ${formData.notes}` : formData.notes || '',
        };
        await api.post('/admin/inventory/adjust', payload);
        toast.success('Điều chỉnh kho thành công');
      }

      setShowModal(false);
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Có lỗi xảy ra');
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(price);
  };

  if (loading) {
    return <div className="text-center py-12">Đang tải...</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Quản lý kho</h1>
        <button
          onClick={() => openModal('addProduct')}
          className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
        >
          + Thêm sản phẩm vào kho
        </button>
      </div>

      {/* Tabs */}
      <div className="mb-6 border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('inventory')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'inventory'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Tồn kho ({inventory.length})
          </button>
          <button
            onClick={() => setActiveTab('lowStock')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'lowStock'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Sắp hết hàng ({lowStockItems.length})
          </button>
          <button
            onClick={() => setActiveTab('expiring')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'expiring'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Sắp hết hạn ({expiringItems.length})
          </button>
        </nav>
      </div>

      {/* Inventory Tab */}
      {activeTab === 'inventory' && (
        <div className="bg-white rounded-lg shadow overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sản phẩm</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Kho</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tồn kho</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Đã đặt</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Có thể bán</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Số lô</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Thao tác</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {inventory.map((item) => (
                <tr key={`${item.product_id}-${item.warehouse_id}`}>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {item.product_name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {item.warehouse_name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {item.quantity_in_stock} {item.unit}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {item.reserved_quantity} {item.unit}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {item.available_quantity} {item.unit}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {item.batch_number || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <button
                      onClick={() => openModal('stockIn', item)}
                      className="text-green-600 hover:text-green-900 mr-3"
                    >
                      Nhập
                    </button>
                    <button
                      onClick={() => openModal('stockOut', item)}
                      className="text-blue-600 hover:text-blue-900 mr-3"
                    >
                      Xuất
                    </button>
                    <button
                      onClick={() => openModal('adjust', item)}
                      className="text-orange-600 hover:text-orange-900"
                    >
                      Điều chỉnh
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Low Stock Tab */}
      {activeTab === 'lowStock' && (
        <div className="bg-white rounded-lg shadow overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sản phẩm</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Kho</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tồn kho</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Mức tối thiểu</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Trạng thái</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Thao tác</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {lowStockItems.map((item) => (
                <tr key={`${item.product_id}-${item.warehouse_id}`} className="bg-yellow-50">
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {item.product_name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {item.warehouse_name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-red-600">
                    {item.available_quantity} {item.unit}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {item.reorder_level} {item.unit}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-800">
                      Cần nhập hàng
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <button
                      onClick={() => openModal('stockIn', item)}
                      className="text-green-600 hover:text-green-900"
                    >
                      Nhập hàng
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Expiring Tab */}
      {activeTab === 'expiring' && (
        <div className="bg-white rounded-lg shadow overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sản phẩm</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Kho</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Số lượng</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ngày hết hạn</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Còn lại</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Thao tác</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {expiringItems.map((item, index) => (
                <tr key={index} className="bg-orange-50">
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {item.product_name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {item.warehouse_name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {item.quantity} {item.unit}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(item.expiry_date).toLocaleDateString('vi-VN')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-orange-600">
                    {item.days_until_expiry} ngày
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <button
                      onClick={() => openModal('stockOut', item)}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      Xuất kho
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="p-6">
              <h2 className="text-xl font-bold mb-4">
                {modalType === 'addProduct' && 'Thêm sản phẩm vào kho'}
                {modalType === 'stockIn' && 'Nhập kho'}
                {modalType === 'stockOut' && 'Xuất kho'}
                {modalType === 'adjust' && 'Điều chỉnh tồn kho'}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                {modalType === 'addProduct' ? (
                  <>
                    <div>
                      <label className="block text-sm font-medium mb-1">Sản phẩm *</label>
                      <select
                        value={formData.product_id}
                        onChange={(e) => setFormData({...formData, product_id: e.target.value})}
                        className="w-full px-3 py-2 border rounded-lg"
                        required
                      >
                        <option value="">Chọn sản phẩm</option>
                        {products.map(product => (
                          <option key={product.product_id} value={product.product_id}>
                            {product.product_name} ({product.unit})
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Kho *</label>
                      <select
                        value={formData.warehouse_id}
                        onChange={(e) => setFormData({...formData, warehouse_id: e.target.value})}
                        className="w-full px-3 py-2 border rounded-lg"
                        required
                      >
                        <option value="">Chọn kho</option>
                        {warehouses.map(wh => (
                          <option key={wh.warehouse_id} value={wh.warehouse_id}>
                            {wh.warehouse_name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Số lượng ban đầu *</label>
                      <input
                        type="number"
                        step="0.01"
                        value={formData.quantity}
                        onChange={(e) => setFormData({...formData, quantity: e.target.value})}
                        className="w-full px-3 py-2 border rounded-lg"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Giá nhập (tùy chọn)</label>
                      <input
                        type="number"
                        value={formData.unit_price}
                        onChange={(e) => setFormData({...formData, unit_price: e.target.value})}
                        placeholder="Nhập giá nhập nếu có"
                        className="w-full px-3 py-2 border rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Số lô</label>
                      <input
                        type="text"
                        value={formData.batch_number}
                        onChange={(e) => setFormData({...formData, batch_number: e.target.value})}
                        placeholder="VD: LOT-2024-001"
                        className="w-full px-3 py-2 border rounded-lg"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-1">Ngày thu hoạch</label>
                        <input
                          type="date"
                          value={formData.harvest_date}
                          onChange={(e) => setFormData({...formData, harvest_date: e.target.value})}
                          className="w-full px-3 py-2 border rounded-lg"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Ngày hết hạn</label>
                        <input
                          type="date"
                          value={formData.expiry_date}
                          onChange={(e) => setFormData({...formData, expiry_date: e.target.value})}
                          className="w-full px-3 py-2 border rounded-lg"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Ghi chú</label>
                      <textarea
                        value={formData.notes}
                        onChange={(e) => setFormData({...formData, notes: e.target.value})}
                        rows="2"
                        className="w-full px-3 py-2 border rounded-lg"
                      />
                    </div>
                  </>
                ) : (
                  <>
                <div>
                  <label className="block text-sm font-medium mb-1">Sản phẩm</label>
                  <input
                    type="text"
                    value={selectedItem?.product_name}
                    disabled
                    className="w-full px-3 py-2 border rounded-lg bg-gray-50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Kho *</label>
                  <select
                    value={formData.warehouse_id}
                    onChange={(e) => setFormData({...formData, warehouse_id: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg"
                    required
                  >
                    <option value="">Chọn kho</option>
                    {warehouses.map(wh => (
                      <option key={wh.warehouse_id} value={wh.warehouse_id}>
                        {wh.warehouse_name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Số lượng ({selectedItem?.unit}) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.quantity}
                    onChange={(e) => setFormData({...formData, quantity: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg"
                    required
                  />
                </div>
                {modalType === 'stockIn' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium mb-1">Giá nhập *</label>
                      <input
                        type="number"
                        value={formData.unit_price}
                        onChange={(e) => setFormData({...formData, unit_price: e.target.value})}
                        className="w-full px-3 py-2 border rounded-lg"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Số lô</label>
                      <input
                        type="text"
                        value={formData.batch_number}
                        onChange={(e) => setFormData({...formData, batch_number: e.target.value})}
                        placeholder="VD: LOT-2024-001"
                        className="w-full px-3 py-2 border rounded-lg"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-1">Ngày thu hoạch</label>
                        <input
                          type="date"
                          value={formData.harvest_date}
                          onChange={(e) => setFormData({...formData, harvest_date: e.target.value})}
                          className="w-full px-3 py-2 border rounded-lg"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Ngày hết hạn</label>
                        <input
                          type="date"
                          value={formData.expiry_date}
                          onChange={(e) => setFormData({...formData, expiry_date: e.target.value})}
                          className="w-full px-3 py-2 border rounded-lg"
                        />
                      </div>
                    </div>
                  </>
                )}
                {modalType === 'adjust' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium mb-1">Số lượng hiện tại</label>
                      <input
                        type="text"
                        value={`${selectedItem?.quantity_in_stock || 0} ${selectedItem?.unit || ''}`}
                        disabled
                        className="w-full px-3 py-2 border rounded-lg bg-gray-50"
                      />
                    </div>
                    <div className="bg-blue-50 p-3 rounded-lg text-sm text-blue-800">
                      <p className="font-medium mb-1">Hướng dẫn:</p>
                      <p>• Nhập số dương (+) để tăng tồn kho</p>
                      <p>• Nhập số âm (-) để giảm tồn kho</p>
                      <p>• VD: +10 hoặc -5</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Lý do điều chỉnh *</label>
                      <input
                        type="text"
                        value={formData.reason}
                        onChange={(e) => setFormData({...formData, reason: e.target.value})}
                        placeholder="Hỏng hóc, mất mát, kiểm kê, sai sót..."
                        className="w-full px-3 py-2 border rounded-lg"
                        required
                      />
                    </div>
                  </>
                )}
                <div>
                  <label className="block text-sm font-medium mb-1">Ghi chú</label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({...formData, notes: e.target.value})}
                    rows="2"
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                </>
                )}
                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                  >
                    Xác nhận
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Hủy
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InventoryManagement;
