import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Star, Truck, Heart, ShoppingCart, Instagram, MessageCircle, Package } from 'lucide-react';
import apiService from '../services/api';
import { Product, ProductCategory } from '../types';
import Loading from '../components/Loading';
import { checkStoreStatus, StoreConfig } from '../utils/storeUtils';

const Home: React.FC = () => {
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [storeConfig, setStoreConfig] = useState<StoreConfig | null>(null);
  const [isStoreOpen, setIsStoreOpen] = useState(false);
  const [storeStatusMessage, setStoreStatusMessage] = useState<string>('');
  const [promoFreteAtiva, setPromoFreteAtiva] = useState(false);
  const [promoFreteMensagem, setPromoFreteMensagem] = useState<string>('');

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [productsData, categoriesData, storeData, promoCheck] = await Promise.all([
          apiService.getProducts(),
          apiService.getCategories(),
          apiService.getStoreConfig(),
              fetch('/api/store-config/promo-frete-check').then(r => r.json()).catch(() => ({ ativa: false }))
        ]);
        
        // Filtrar apenas produtos ativos E em destaque
        const activeProducts = productsData.filter(product => product.isActive && product.isFeatured).slice(0, 4);
        setFeaturedProducts(activeProducts);
        
        // Todos os produtos ativos
        const active = productsData.filter(product => product.isActive);
        setAllProducts(active);
        
        setCategories(categoriesData);
        setStoreConfig(storeData);
        
        // Verificar se há promoção ativa
        if (promoCheck.ativa) {
          setPromoFreteAtiva(true);
          setPromoFreteMensagem(promoCheck.mensagem);
        }
        
        // Verificar se a loja está aberta com base no horário
        if (storeData) {
          const status = checkStoreStatus(storeData);
          setIsStoreOpen(status.isOpen);
          if (!status.isOpen && status.reason) {
            setStoreStatusMessage(status.reason);
          }
        }
      } catch (error) {
       
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Atualizar status da loja a cada minuto
  useEffect(() => {
    if (!storeConfig) return;

    const interval = setInterval(() => {
      const status = checkStoreStatus(storeConfig);
      setIsStoreOpen(status.isOpen);
      if (!status.isOpen && status.reason) {
        setStoreStatusMessage(status.reason);
      }
    }, 60000); // Verificar a cada 1 minuto

    return () => clearInterval(interval);
  }, [storeConfig]);

  if (loading) {
    return <Loading fullScreen text="Carregando produtos..." />;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="relative h-56 md:h-64 flex items-center justify-center text-white" style={{ backgroundColor: '#740e93' }}>
        <div className="text-center">
          <h1 className="text-2xl md:text-5xl font-extrabold tracking-tight">Açaí DiCasa</h1>
          <p className="mt-1 text-xs md:text-base text-pink-100">O melhor açaí da região</p>
        </div>
      </div>

      {/* Banner de Promoção de Frete Grátis */}
      {promoFreteAtiva && (
        <div className="relative z-20 max-w-7xl mx-auto px-4 md:px-8 -mt-6">
          <div className="bg-gradient-to-r from-emerald-500 to-green-600 rounded-xl shadow-lg p-4 text-white">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-2 rounded-lg">
                <Truck className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-base md:text-lg">Promoção Especial Hoje!</h3>
                <p className="text-sm text-emerald-50">
                  {promoFreteMensagem}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Card de informações */}
      <div className={`relative z-10 ${promoFreteAtiva ? '-mt-4' : '-mt-10'}`}>
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
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] md:text-xs font-semibold ${isStoreOpen ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                {isStoreOpen ? 'ABERTO' : 'FECHADO'}
              </span>
              <a href="https://www.instagram.com/acaiteria_acaidicasa/" target='_blank' aria-label="Instagram" className="inline-flex items-center justify-center w-9 h-9 rounded-full border border-slate-200 text-slate-600 hover:bg-slate-50">
                <Instagram className="w-5 h-5" />
              </a>
              <a href="#" aria-label="WhatsApp" className="inline-flex items-center justify-center w-9 h-9 rounded-full border border-slate-200 text-slate-600 hover:bg-slate-50">
                <MessageCircle className="w-5 h-5" />
              </a>
            </div>
          </div>
          
          {/* Mensagem quando a loja estiver fechada */}
          {!isStoreOpen && storeStatusMessage && (
            <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-sm text-amber-800 text-center">
                <span className="font-semibold">Loja fechada no momento.</span>
                <br />
                {storeStatusMessage}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Produtos em Destaque */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-8">
        <h2 className="text-xl md:text-2xl font-bold text-slate-900 mb-3 md:mb-4">Destaques</h2>
        <div className="flex gap-4 sm:gap-6 overflow-x-auto pb-2 snap-x snap-mandatory">
          {featuredProducts.map((product) => (
            <Link
              key={product.id}
              to={`/products/${product.id}`}
              className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden min-w-[48%] sm:min-w-[240px] snap-start hover:shadow-md transition-shadow duration-200"
            >
              <div className="h-28 sm:h-32 bg-slate-100 flex items-center justify-center text-3xl overflow-hidden">
                {product.images && product.images[0]?.url ? (
                  <img
                    src={product.images[0].url}
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
                  <div
                    className="p-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-all duration-200 hover:shadow-md cursor-pointer"
                    aria-label="Ver detalhes"
                  >
                    <ShoppingCart size={18} />
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Todos os Produtos */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-8">
        <h2 className="text-xl md:text-2xl font-bold text-slate-900 mb-3 md:mb-4">Produtos</h2>
        
        {/* Filtro de Categorias */}
        <div className="mb-6 flex gap-2 overflow-x-auto pb-2">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${
              selectedCategory === null
                ? 'bg-purple-600 text-white'
                : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50'
            }`}
          >
            Todos
          </button>
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${
                selectedCategory === category.id
                  ? 'bg-purple-600 text-white'
                  : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50'
              }`}
            >
              {category.name}
            </button>
          ))}
        </div>

        {/* Grid de Produtos - Estilo Lista */}
        <div className="grid grid-cols-1 gap-3 sm:gap-4">
          {allProducts
            .filter(product => selectedCategory === null || product.categoryId === selectedCategory)
            .map((product) => (
              <Link 
                key={product.id} 
                to={`/products/${product.id}`}
                className="bg-white rounded-xl sm:rounded-2xl border border-slate-200 shadow-sm hover:shadow-md p-3 sm:p-4 flex items-center gap-3 sm:gap-4 transition-all duration-200 group cursor-pointer"
              >
                <div className="w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 rounded-lg sm:rounded-xl overflow-hidden bg-slate-100 flex items-center justify-center flex-shrink-0">
                  {product.images && product.images[0]?.url ? (
                    <img
                      src={product.images[0].url}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Package className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-slate-400" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-sm sm:text-base text-slate-900 mb-1 sm:mb-2 leading-tight">{product.name}</h3>
                  <p className="text-xs sm:text-sm text-slate-600 line-clamp-2 mb-2 sm:mb-3 leading-relaxed">
                    {product.description || 'Produto delicioso e preparado na hora'}
                  </p>
                  <div className="flex items-center gap-2 sm:gap-3">
                    <span className="font-bold text-base sm:text-lg text-slate-900">
                      R$ {Number(product.price ?? 0).toFixed(2)}
                    </span>
                    <div
                      className="w-9 h-9 sm:w-10 sm:h-10 rounded-md sm:rounded-lg bg-purple-600 hover:bg-purple-700 active:scale-95 text-white font-semibold transition-all duration-200 flex items-center justify-center ml-auto cursor-pointer"
                      title="Ver detalhes"
                    >
                      <ShoppingCart className="w-4 h-4 sm:w-5 sm:h-5" />
                    </div>
                  </div>
                </div>
              </Link>
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