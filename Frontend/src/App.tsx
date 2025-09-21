import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { CartProvider } from './contexts/CartContext';
import Header from './components/Header';
import Footer from './components/Footer';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Products from './pages/Products';
import Cart from './pages/Cart';
import About from './pages/About';
import Contact from './pages/Contact';
import Profile from './pages/Profile';
import Orders from './pages/Orders';
import Admin from './pages/admin/Admin'; 
import AddAddress from './pages/AddAddress';
import AddPhone from './pages/AddPhone';
import Checkout from './pages/Checkout';

function AppContent() {
  const location = useLocation();
  const hideFooterOnAdmin = location.pathname === '/admin';

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/products" element={<Products />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/orders" element={<Orders />} />
          <Route path="/admin" element={<Admin />} /> 
          <Route path="/add-address" element={<AddAddress />} />
          <Route path="/add-phone" element={<AddPhone />} />
          <Route path="/checkout" element={<Checkout />} />
          {/* Rotas adicionais serão adicionadas aqui */}
        </Routes>
      </main>
      {!hideFooterOnAdmin && <Footer />}
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <Router>
          <AppContent />
        </Router>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;
