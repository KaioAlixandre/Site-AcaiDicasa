import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Star, Clock, Truck, Heart, ShoppingCart, Plus, Instagram, MessageCircle } from 'lucide-react';
import { useCart } from '../contexts/CartContext';
import apiService from '../services/api';
import { Product, ProductCategory } from '../types';
import Loading from '../components/Loading';

const Home: React.FC = () => {
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [storeConfig, setStoreConfig] = useState<any>(null);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const { addItem } = useCart();

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [productsData, categoriesData, storeData] = await Promise.all([
          apiService.getProducts(),
          apiService.getCategories(),
          apiService.getStoreConfig()
        ]);
        
        // Filtrar apenas produtos ativos e pegar os primeiros 4
        const activeProducts = productsData.filter(product => product.isActive).slice(0, 4);
        setFeaturedProducts(activeProducts);
        setCategories(categoriesData);
        setStoreConfig(storeData);
      } catch (error) {
        console.error('Erro ao carregar dados:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const handleAddToCart = async (productId: number) => {
    try {
      await addItem(productId, 1);
      setToastMessage('Produto adicionado ao carrinho!');
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    } catch (error) {
      setToastMessage('Erro ao adicionar produto ao carrinho');
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    }
  };

  if (loading) {
    return <Loading fullScreen text="Carregando produtos..." />;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Toast Notification */}
      {showToast && (
        <div className="fixed top-20 right-4 z-50 animate-in slide-in-from-top-5 duration-300">
          <div className="bg-emerald-500 text-white px-6 py-4 rounded-lg shadow-2xl flex items-center gap-3 max-w-md">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
              <ShoppingCart className="w-5 h-5" />
            </div>
            <div>
              <p className="font-semibold">{toastMessage}</p>
              <p className="text-xs text-emerald-100">Veja seu carrinho no menu superior</p>
            </div>
          </div>
        </div>
      )}

      {/* Top Banner */}
      <div className="relative h-56 md:h-64 flex items-center justify-center text-white" style={{ backgroundColor: '#740e93' }}>
        <div className="text-center">
          <h1 className="text-2xl md:text-5xl font-extrabold tracking-tight">Açaí DiCasa</h1>
          <p className="mt-1 text-xs md:text-base text-pink-100">O melhor açaí da região</p>
        </div>
      </div>

      {/* Card de informações */}
      <div className="relative z-10 -mt-10">
        <div className="max-w-5xl mx-auto bg-white rounded-xl shadow-md px-4 py-4 md:px-6 md:py-5">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h2 className="text-lg md:text-2xl font-bold text-slate-900">Açaí DiCasa</h2>
              <div className="mt-1 text-xs md:text-sm text-slate-600 flex items-center gap-2">
                <span>Pedido mínimo</span>
                <span className="font-semibold text-emerald-700">R$ 10,00</span>
                <span className="text-slate-400">•</span>
                <span>30-50 min</span>
              </div>
              <div className="mt-1 flex items-center gap-2 text-xs md:text-sm">
                <span className="text-yellow-500">★★★★★</span>
                <span className="text-slate-600">4,8 <span className="text-xs text-slate-400">(136 avaliações)</span></span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] md:text-xs font-semibold ${storeConfig?.isOpen ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                {storeConfig?.isOpen ? 'ABERTO' : 'FECHADO'}
              </span>
              <a href="#" aria-label="Instagram" className="inline-flex items-center justify-center w-9 h-9 rounded-full border border-slate-200 text-slate-600 hover:bg-slate-50">
                <Instagram className="w-5 h-5" />
              </a>
              <a href="#" aria-label="WhatsApp" className="inline-flex items-center justify-center w-9 h-9 rounded-full border border-slate-200 text-slate-600 hover:bg-slate-50">
                <MessageCircle className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Categorias */}
      <div className="bg-white border-t border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 py-3 flex gap-2 overflow-x-auto">
          {categories.slice(0, 8).map((category) => (
            <Link
              key={category.id}
              to="/products"
              className="px-3 py-1.5 rounded-full border border-slate-300 text-slate-700 text-xs md:text-sm hover:bg-slate-50"
            >
              {category.name}
            </Link>
          ))}
        </div>
      </div>

      

      {/* Produtos em Destaque */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-8">
        <h2 className="text-xl md:text-2xl font-bold text-slate-900 mb-3 md:mb-4">Destaques</h2>
        <div className="flex gap-4 sm:gap-6 overflow-x-auto pb-2 snap-x snap-mandatory">
          {featuredProducts.map((product) => (
            <div key={product.id} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden min-w-[48%] sm:min-w-[240px] snap-start">
              <div className="h-28 sm:h-32 bg-slate-100 flex items-center justify-center text-3xl overflow-hidden">
                {product.images && product.images[0]?.url ? (
                  <img
                    src={`http://localhost:3001${product.images[0].url}`}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span>🥤</span>
                )}
              </div>
              <div className="p-3 md:p-4">
                <h3 className="font-semibold text-slate-900 truncate text-sm md:text-base">{product.name}</h3>
                <p className="mt-1 text-xs md:text-sm text-slate-600 line-clamp-2">{product.description || 'Açaí delicioso e refrescante'}</p>
                <div className="mt-2 md:mt-3 flex items-center justify-between">
                  <span className="text-base md:text-lg font-bold text-emerald-700">R$ {Number(product.price).toFixed(2)}</span>
                  <button
                    onClick={() => handleAddToCart(product.id)}
                    className="p-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-all duration-200 hover:shadow-md"
                    aria-label="Adicionar ao carrinho"
                  >
                    <ShoppingCart size={18} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Features Section */}
      <section className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
            <div className="text-center p-5 md:p-6 bg-slate-50 rounded-lg border border-slate-200">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-2 md:mb-3">
                <Truck className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="text-sm md:text-base font-semibold text-slate-900 mb-1">Entrega Rápida</h3>
              <p className="text-slate-600 text-xs md:text-sm">
                Entregamos em até 30 minutos na sua casa
              </p>
            </div>
            <div className="text-center p-5 md:p-6 bg-slate-50 rounded-lg border border-slate-200">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-2 md:mb-3">
                <Heart className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="text-sm md:text-base font-semibold text-slate-900 mb-1">Feito com Amor</h3>
              <p className="text-slate-600 text-xs md:text-sm">
                Ingredientes frescos e preparados com carinho
              </p>
            </div>
            <div className="text-center p-5 md:p-6 bg-slate-50 rounded-lg border border-slate-200">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-2 md:mb-3">
                <Star className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="text-sm md:text-base font-semibold text-slate-900 mb-1">Qualidade Premium</h3>
              <p className="text-slate-600 text-xs md:text-sm">
                Açaí 100% natural e complementos selecionados
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-14 text-white" style={{ backgroundColor: '#740e93' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-2">Pronto para pedir seu açaí?</h2>
          <p className="text-sm md:text-base mb-6 text-pink-100">Faça seu pedido agora e receba em casa rapidinho!</p>
          <Link
            to="/products"
            className="inline-flex items-center px-6 py-3 bg-white text-purple-700 font-semibold rounded-md hover:bg-slate-100"
          >
            <ShoppingCart className="mr-2" size={18} />
            Fazer Pedido Agora
          </Link>
        </div>
      </section>
    </div>
  );
};

export default Home;