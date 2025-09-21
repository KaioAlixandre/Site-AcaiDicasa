import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, ShoppingCart, Clock, Filter, Star, Heart, Package, Grid, List } from 'lucide-react';
import { Product, ProductCategory } from '../types';
import { apiService } from '../services/api';
import { useCart } from '../contexts/CartContext';
import { checkStoreStatus } from '../utils/storeUtils';
import Loading from '../components/Loading';

const Products: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [addingToCart, setAddingToCart] = useState<number | null>(null);
  const [storeStatus, setStoreStatus] = useState<any>(null);
  const [viewType, setViewType] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(false);
  const { addItem } = useCart();

  useEffect(() => {
    const loadData = async () => {
      try {
        const [productsData, config] = await Promise.all([
          apiService.getProducts(),
          apiService.getStoreConfig()
        ]);
        
        setProducts(productsData);
        setFilteredProducts(productsData);
        
        // Verificar status da loja
        if (config) {
          const status = checkStoreStatus(config);
          setStoreStatus(status);
        }
        
        // Criar categorias fictícias baseadas nos produtos
        const uniqueCategories = Array.from(
          new Set(productsData.map(p => p.categoryId).filter(Boolean))
        ).map((id, index) => ({
          id: id || index + 1,
          name: `Categoria ${id || index + 1}`
        }));
        setCategories(uniqueCategories);
      } catch (error) {
        console.error('Erro ao carregar dados:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  useEffect(() => {
    let filtered = products;

    // Filtrar por termo de busca
    if (searchTerm) {
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (product.description && product.description.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Filtrar por categoria
    if (selectedCategory) {
      filtered = filtered.filter(product => product.categoryId === selectedCategory);
    }

    setFilteredProducts(filtered);
  }, [products, searchTerm, selectedCategory]);

  const handleAddToCart = async (productId: number) => {
    // Verificar se a loja está aberta antes de adicionar ao carrinho
    if (storeStatus && !storeStatus.isOpen) {
      alert(`Não é possível adicionar produtos: ${storeStatus.reason}\n${storeStatus.nextOpenTime || ''}`);
      return;
    }

    try {
      setAddingToCart(productId);
      await addItem(productId, 1);
    } catch (error) {
      console.error('Erro ao adicionar ao carrinho:', error);
    } finally {
      setAddingToCart(null);
    }
  };

  if (loading) {
    return <Loading fullScreen text="Carregando produtos..." />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-indigo-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Moderno */}
        <div className="text-center mb-12">
          <div className="relative inline-block">
            <h1 className="text-5xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-indigo-600 bg-clip-text text-transparent mb-4">
              Nossos Produtos
            </h1>
            <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-24 h-1 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"></div>
          </div>
          <p className="text-xl text-gray-600 mt-6 max-w-2xl mx-auto leading-relaxed">
            🍇 Descubra nossa incrível variedade de açaí artesanal e acompanhamentos deliciosos, 
            feitos com muito carinho especialmente para você!
          </p>
        </div>

        {/* Status da Loja Melhorado */}
        {storeStatus && (
          <div className={`mb-8 p-6 rounded-2xl shadow-lg border-2 ${
            storeStatus.isOpen 
              ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-200' 
              : 'bg-gradient-to-r from-red-50 to-pink-50 border-red-200'
          }`}>
            <div className="flex items-center justify-center">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center mr-4 ${
                storeStatus.isOpen ? 'bg-green-500' : 'bg-red-500'
              }`}>
                <Clock className="h-6 w-6 text-white" />
              </div>
              <div className="text-center">
                <span className={`text-xl font-bold ${storeStatus.isOpen ? 'text-green-800' : 'text-red-800'}`}>
                  {storeStatus.isOpen ? '🟢 Loja Aberta - Faça seu pedido!' : '🔴 Loja Fechada - Voltamos em breve'}
                </span>
                {!storeStatus.isOpen && (
                  <div className="mt-2">
                    <p className="text-red-700">{storeStatus.reason}</p>
                    {storeStatus.nextOpenTime && (
                      <p className="text-red-600 font-medium mt-1">{storeStatus.nextOpenTime}</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Barra de Pesquisa e Filtros Aprimorada */}
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-white/20 p-8 mb-8">
          <div className="flex flex-col lg:flex-row items-center gap-6">
            {/* Busca Moderna */}
            <div className="flex-1 w-full">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none">
                  <Search className="h-6 w-6 text-purple-400" />
                </div>
                <input
                  type="text"
                  placeholder="🔍 Buscar produtos incríveis..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-16 pr-6 py-4 text-lg border-2 border-gray-200 rounded-2xl bg-gray-50 
                           focus:outline-none focus:ring-4 focus:ring-purple-300 focus:border-purple-400 
                           transition-all duration-300 placeholder-gray-500"
                />
              </div>
            </div>

            {/* Controles */}
            <div className="flex items-center gap-4">
              {/* Filtro por categoria */}
              <div className="relative">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="flex items-center gap-2 px-6 py-4 bg-gradient-to-r from-purple-500 to-pink-500 
                           text-white rounded-2xl hover:from-purple-600 hover:to-pink-600 
                           transition-all duration-300 shadow-lg hover:shadow-xl"
                >
                  <Filter className="w-5 h-5" />
                  Filtros
                </button>
              </div>

              {/* Seletor de visualização */}
              <div className="flex bg-gray-100 rounded-2xl p-1">
                <button
                  onClick={() => setViewType('grid')}
                  className={`p-3 rounded-xl transition-all duration-300 ${
                    viewType === 'grid' 
                      ? 'bg-purple-500 text-white shadow-md' 
                      : 'text-gray-600 hover:bg-white hover:shadow-sm'
                  }`}
                >
                  <Grid className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setViewType('list')}
                  className={`p-3 rounded-xl transition-all duration-300 ${
                    viewType === 'list' 
                      ? 'bg-purple-500 text-white shadow-md' 
                      : 'text-gray-600 hover:bg-white hover:shadow-sm'
                  }`}
                >
                  <List className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>

          {/* Painel de Filtros Expandível */}
          {showFilters && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="flex flex-wrap gap-4">
                <select
                  value={selectedCategory || ''}
                  onChange={(e) => setSelectedCategory(e.target.value ? Number(e.target.value) : null)}
                  className="px-4 py-3 border-2 border-gray-200 rounded-xl bg-gray-50 
                           focus:outline-none focus:ring-2 focus:ring-purple-300 focus:border-purple-400 
                           transition-all duration-300"
                >
                  <option value="">🍽️ Todas as categorias</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Resultados com contador melhorado */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <Package className="w-6 h-6 text-purple-500" />
            <p className="text-lg font-semibold text-gray-700">
              <span className="text-purple-600 font-bold">{filteredProducts.length}</span> 
              {filteredProducts.length === 1 ? ' produto encontrado' : ' produtos encontrados'}
            </p>
          </div>
        </div>

        {/* Grid de Produtos Modernizado */}
        {filteredProducts.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-32 h-32 bg-gradient-to-br from-purple-100 to-pink-100 rounded-full flex items-center justify-center mx-auto mb-8">
              <Search className="w-16 h-16 text-purple-400" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              🔍 Nenhum produto encontrado
            </h3>
            <p className="text-lg text-gray-600 mb-8 max-w-md mx-auto">
              Que tal tentar uma busca diferente? Nossos produtos deliciosos estão esperando por você!
            </p>
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedCategory(null);
              }}
              className="px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-2xl 
                       hover:from-purple-600 hover:to-pink-600 transition-all duration-300 
                       shadow-lg hover:shadow-xl font-semibold"
            >
              Limpar Filtros
            </button>
          </div>
        ) : (
          <div className={`${
            viewType === 'grid' 
              ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8' 
              : 'space-y-6'
          }`}>
            {filteredProducts.map((product) => (
              <div 
                key={product.id} 
                className={`group bg-white rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-500 overflow-hidden border border-gray-100 ${
                  viewType === 'list' ? 'flex items-center' : ''
                }`}
              >
                {/* Container da Imagem */}
                <div className={`relative overflow-hidden ${
                  viewType === 'list' ? 'w-48 h-32 flex-shrink-0' : 'h-64'
                }`}>
                  {product.images?.[0]?.url ? (
                    <img
                      src={`http://localhost:3001${product.images[0].url}`}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center">
                      <Package className="w-16 h-16 text-purple-300" />
                    </div>
                  )}
                  
                  {/* Overlay com botão de favoritar */}
                  <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <button className="w-10 h-10 bg-white/90 rounded-full flex items-center justify-center shadow-lg hover:bg-white transition-colors">
                      <Heart className="w-5 h-5 text-red-400" />
                    </button>
                  </div>

                  {/* Badge de Disponível */}
                  <div className="absolute top-4 left-4">
                    <span className="bg-green-500 text-white px-3 py-1 rounded-full text-sm font-semibold shadow-lg">
                      ✅ Disponível
                    </span>
                  </div>
                </div>

                {/* Conteúdo do produto */}
                <div className={`p-6 ${viewType === 'list' ? 'flex-1' : ''}`}>
                  <div className={`${viewType === 'list' ? 'flex justify-between items-center' : ''}`}>
                    <div className={`${viewType === 'list' ? 'flex-1 pr-6' : ''}`}>
                      <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-purple-600 transition-colors">
                        {product.name}
                      </h3>
                      <p className="text-gray-600 mb-4 leading-relaxed">
                        {product.description || '🍇 Açaí delicioso e refrescante, preparado com muito carinho'}
                      </p>
                      
                      {/* Avaliação fictícia */}
                      <div className="flex items-center mb-4">
                        <div className="flex text-yellow-400">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} className="w-4 h-4 fill-current" />
                          ))}
                        </div>
                        <span className="ml-2 text-sm text-gray-500">(4.9) • 127 avaliações</span>
                      </div>
                    </div>

                    <div className={`${viewType === 'list' ? 'text-right' : ''}`}>
                      {/* Preço */}
                      <div className="mb-6">
                        <span className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                          R$ {Number(product.price ?? 0).toFixed(2)}
                        </span>
                      </div>

                      {/* Ações */}
                      <div className={`flex gap-3 ${viewType === 'list' ? 'flex-col w-40' : ''}`}>
                        <Link
                          to={`/products/${product.id}`}
                          className="flex-1 px-6 py-3 border-2 border-purple-300 text-purple-600 rounded-2xl 
                                   hover:bg-purple-50 transition-all duration-300 text-center font-semibold
                                   hover:border-purple-400 hover:shadow-lg"
                        >
                          👁️ Ver Detalhes
                        </Link>
                        <button
                          onClick={() => handleAddToCart(product.id)}
                          disabled={addingToCart === product.id || (storeStatus && !storeStatus.isOpen)}
                          className={`px-6 py-3 rounded-2xl transition-all duration-300 font-semibold
                                   shadow-lg hover:shadow-xl disabled:cursor-not-allowed flex items-center justify-center gap-2 ${
                            storeStatus && !storeStatus.isOpen
                              ? 'bg-gray-400 text-gray-200'
                              : 'bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600 disabled:opacity-50'
                          }`}
                          title={storeStatus && !storeStatus.isOpen ? 'Loja fechada' : 'Adicionar ao carrinho'}
                        >
                          {addingToCart === product.id ? (
                            <>
                              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                              Adicionando...
                            </>
                          ) : storeStatus && !storeStatus.isOpen ? (
                            <>🔒 Fechado</>
                          ) : (
                            <>
                              <ShoppingCart className="w-5 h-5" />
                              Comprar
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Products;
