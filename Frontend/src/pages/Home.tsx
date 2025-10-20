import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Star, Clock, Truck, Heart, ShoppingCart, Plus, Instagram, MessageCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import apiService from '../services/api';
import { Product, ProductCategory } from '../types';
import Loading from '../components/Loading';

const Home: React.FC = () => {
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [storeConfig, setStoreConfig] = useState<any>(null);
  const { user } = useAuth();
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
      alert('Produto adicionado ao carrinho!');
    } catch (error) {
      alert('Erro ao adicionar produto ao carrinho');
    }
  };

  if (loading) {
    return <Loading fullScreen text="Carregando produtos..." />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 to-pink-100">
      {/* Top Banner */}
      <div className="relative bg-gradient-to-r from-purple-600 to-pink-500 h-52 md:h-64 flex items-center justify-center">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-500 opacity-95"></div>
        <div className="relative z-10 text-center text-white">
          <h1 className="text-4xl md:text-6xl font-bold mb-4">Açaí DiCasa</h1>
          <p className="text-xl text-pink-100">O melhor açaí da região</p>
        </div>
      </div>

      {/* Card de informações, colado no banner */}
      <div className="flex flex-col items-center bg-white w-full mx-auto -mt-16 z-10 relative shadow-2xl rounded-t-[30%] px-6 pb-6 pt-8">
        <div className="w-28 h-28 rounded-full border-4 border-pink-400 shadow-lg bg-white -mt-16 flex items-center justify-center">
          <span className="text-4xl">🥤</span>
        </div>
        <h1 className="text-3xl font-extrabold mt-2 text-purple-800 tracking-tight">Açaí DiCasa</h1>
        <div className="flex gap-4 mt-2">
          <a href="#" aria-label="Instagram" className="hover:text-purple-600 transition">
            <Instagram className="text-xl" />
          </a>
          <a href="#" aria-label="WhatsApp" className="hover:text-green-600 transition">
            <MessageCircle className="text-xl" />
          </a>
        </div>
        <div className="mt-2 text-sm text-gray-600">
          <span>Pedido Mínimo <span className="font-semibold text-pink-600">R$ 10,00</span></span> • 
          <span>30-50 min</span>  
        </div>
        <div className="flex items-center gap-1 mt-1">
          <span className="text-yellow-400 text-lg">★</span>
          <span className="text-gray-700 font-medium">4,8 <span className="text-xs text-gray-400">(136 avaliações)</span></span>
        </div>
        <span className="bg-green-100 text-green-700 px-4 py-1 rounded-full text-xs mt-2 font-semibold shadow">
          {storeConfig?.isOpen ? 'ABERTO' : 'FECHADO'}
        </span>
      </div>

      {/* Botões de categorias, colados no card */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-500 py-3 shadow-md">
        <div className="flex justify-center gap-6 flex-wrap px-4">
          {categories.slice(0, 4).map((category, index) => {
            const icons = ['🥤', '🥞', '🍦', '🥟'];
            return (
              <Link
                key={category.id}
                to="/products"
                className="flex flex-col items-center bg-white/20 hover:bg-white/40 transition rounded-xl shadow border border-purple-200 hover:border-yellow-400 py-2 px-4 text-white font-bold focus:outline-none focus:ring-2 focus:ring-yellow-400"
              >
                <div className="w-14 h-14 rounded-full mb-1 border-2 border-white shadow bg-white/20 flex items-center justify-center">
                  <span className="text-2xl">{icons[index] || '🥤'}</span>
                </div>
                <span className="text-xs">{category.name}</span>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Avisos */}
      <div className="max-w-2xl mx-auto mt-6">
        <div className="border border-pink-300 bg-pink-50 text-pink-800 px-6 py-3 rounded-xl mb-6 text-center shadow">
          Aproveite nossa <span className="font-bold">promoção com preços irresistíveis</span> igual Açaí 💜
        </div>
      </div>

      {/* Produtos em Destaque */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-6">
        <h2 className="text-2xl font-bold text-pink-700 mb-6">Produtos em Destaque</h2>
        <div className="flex flex-col md:flex-row gap-6">
          {featuredProducts.map((product) => (
            <div key={product.id} className="bg-white rounded-2xl shadow-lg p-5 flex items-center flex-1 hover:shadow-xl transition">
              <div className="flex-1">
                <h3 className="font-semibold text-lg text-pink-800">{product.name}</h3>
                <p className="text-sm text-gray-500">{product.description || '9 Complementos Grátis'}</p>
                <div className="flex items-center gap-1 text-yellow-400 text-base mt-1">
                  <span>★★★★</span>
                </div>
                <p className="text-green-600 font-bold text-xl mt-2">R$ {Number(product.price).toFixed(2)}</p>
              </div>
              <div className="w-24 h-24 bg-gradient-to-br from-pink-400 to-purple-400 rounded-2xl ml-6 shadow flex items-center justify-center">
                <span className="text-3xl">🥤</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Features Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center p-6 bg-pink-50 rounded-xl">
              <div className="w-16 h-16 bg-pink-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Truck className="w-8 h-8 text-pink-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Entrega Rápida</h3>
              <p className="text-gray-600">
                Entregamos em até 30 minutos na sua casa
              </p>
            </div>
            <div className="text-center p-6 bg-pink-50 rounded-xl">
              <div className="w-16 h-16 bg-pink-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Heart className="w-8 h-8 text-pink-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Feito com Amor</h3>
              <p className="text-gray-600">
                Ingredientes frescos e preparados com carinho
              </p>
            </div>
            <div className="text-center p-6 bg-pink-50 rounded-xl">
              <div className="w-16 h-16 bg-pink-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Star className="w-8 h-8 text-pink-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Qualidade Premium</h3>
              <p className="text-gray-600">
                Açaí 100% natural e complementos selecionados
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-pink-500 to-purple-600 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-4">
            Pronto para pedir seu açaí?
          </h2>
          <p className="text-xl mb-8 text-pink-100">
            Faça seu pedido agora e receba em casa rapidinho!
          </p>
          <Link
            to="/products"
            className="inline-flex items-center px-8 py-4 bg-white text-pink-600 font-semibold rounded-lg hover:bg-gray-100 transition-colors"
          >
            <ShoppingCart className="mr-2" size={20} />
            Fazer Pedido Agora
          </Link>
        </div>
      </section>
    </div>
  );
};

export default Home;