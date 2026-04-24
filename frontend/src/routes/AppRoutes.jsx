/**
 * Application Routes
 */
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Layouts
import MainLayout from '../components/layout/MainLayout';
import AdminLayout from '../components/layout/AdminLayout';

// Public Pages
import Home from '../pages/Home';
import Products from '../pages/Products';
import ProductDetail from '../pages/ProductDetail';
import Login from '../pages/Login';
import Register from '../pages/Register';
import About from '../pages/About';
import Contact from '../pages/Contact';
import FAQ from '../pages/FAQ';
import Promotions from '../pages/Promotions';

// Customer Pages
import Cart from '../pages/Cart';
import Checkout from '../pages/Checkout';
import MyOrders from '../pages/MyOrders';
import OrderDetail from '../pages/OrderDetail';
import Profile from '../pages/Profile';

// Admin Pages
import Dashboard from '../pages/admin/Dashboard';
import ProductManagement from '../pages/admin/ProductManagement';
import OrderManagement from '../pages/admin/OrderManagement';
import InventoryManagement from '../pages/admin/InventoryManagement';
import UserManagement from '../pages/admin/UserManagement';
import CancellationRequests from '../pages/admin/CancellationRequests';

// Error Pages
import NotFound from '../pages/NotFound';
import Forbidden from '../pages/Forbidden';

// Route Guards
const PrivateRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  return isAuthenticated ? children : <Navigate to="/login" />;
};

const AdminRoute = ({ children }) => {
  const { isAuthenticated, isAdmin, loading, user } = useAuth();

  console.log('AdminRoute Debug:', { isAuthenticated, isAdmin, loading, user });

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  if (!isAuthenticated) {
    console.log('Not authenticated, redirecting to login');
    return <Navigate to="/login" />;
  }

  if (!isAdmin) {
    console.log('Not admin, redirecting to forbidden');
    return <Navigate to="/forbidden" />;
  }

  console.log('Is admin, rendering children');
  return children;
};

const AppRoutes = () => {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<MainLayout />}>
        <Route index element={<Home />} />
        <Route path="products" element={<Products />} />
        <Route path="products/:id" element={<ProductDetail />} />
        <Route path="promotions" element={<Promotions />} />
        <Route path="about" element={<About />} />
        <Route path="contact" element={<Contact />} />
        <Route path="faq" element={<FAQ />} />
        <Route path="login" element={<Login />} />
        <Route path="register" element={<Register />} />

        {/* Customer Routes */}
        <Route
          path="cart"
          element={
            <PrivateRoute>
              <Cart />
            </PrivateRoute>
          }
        />
        <Route
          path="checkout"
          element={
            <PrivateRoute>
              <Checkout />
            </PrivateRoute>
          }
        />
        <Route
          path="my-orders"
          element={
            <PrivateRoute>
              <MyOrders />
            </PrivateRoute>
          }
        />
        <Route
          path="orders/:id"
          element={
            <PrivateRoute>
              <OrderDetail />
            </PrivateRoute>
          }
        />
        <Route
          path="profile"
          element={
            <PrivateRoute>
              <Profile />
            </PrivateRoute>
          }
        />
      </Route>

      {/* Admin Routes */}
      <Route
        path="/admin"
        element={
          <AdminRoute>
            <AdminLayout />
          </AdminRoute>
        }
      >
        <Route index element={<Navigate to="/admin/dashboard" />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="products" element={<ProductManagement />} />
        <Route path="orders" element={<OrderManagement />} />
        <Route path="orders/:id" element={<OrderDetail />} />
        <Route path="inventory" element={<InventoryManagement />} />
        <Route path="users" element={<UserManagement />} />
        <Route path="cancellation-requests" element={<CancellationRequests />} />
      </Route>

      {/* Error Pages */}
      <Route path="/forbidden" element={<Forbidden />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default AppRoutes;
