import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, ShoppingCart, Clock, Filter, Star, Heart, Package, Grid, List } from 'lucide-react';
import { Product, ProductCategory } from '../types';
import { apiService } from '../services/api';
import { useCart } from '../contexts/CartContext';
import { checkStoreStatus } from '../utils/storeUtils';
import Loading from '../components/Loading';
import CustomAcaiModal from '../components/CustomAcaiModal';
import CustomProductModal from '../components/CustomProductModal';

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
  const [showCustomAcaiModal, setShowCustomAcaiModal] = useState(false);
  const [showCustomSorveteModal, setShowCustomSorveteModal] = useState(false);
  const { addItem } = useCart();

  useEffect(() => {
    const loadData = async () => {
      try {
        const [productsData, config, categoriesApi] = await Promise.all([
          apiService.getProducts(),
          apiService.getStoreConfig(),
          apiService.getCategories()
        ]);
        
        setProducts(productsData);
        setFilteredProducts(productsData);
        
        // Verificar status da loja
        if (config) {
          const status = checkStoreStatus(config);
          setStoreStatus(status);
        }
        
        // Usar categorias reais do backend
        setCategories(categoriesApi || []);
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
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header no estilo marketplace */}
        <div className="mb-4">
          <h1 className="text-2xl font-bold text-slate-900">Cardápio</h1>
        {storeStatus && (
            <div className="mt-1 text-sm text-slate-600 flex items-center gap-2">
              <Clock className={`w-4 h-4 ${storeStatus.isOpen ? 'text-green-600' : 'text-red-600'}`} />
              {storeStatus.isOpen ? (
                <span>Aberto agora</span>
              ) : (
                <span>
                  Fechado. {storeStatus.nextOpenTime || storeStatus.reason}
                </span>
                    )}
                  </div>
                )}
              </div>

        {/* Busca + chips de categorias */}
        <div className="mb-4">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  type="text"
              placeholder="Buscar no cardápio"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-3 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
          <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
                <button
              onClick={() => setSelectedCategory(null)}
              className={`px-3 py-1.5 rounded-full border text-sm ${selectedCategory === null ? 'bg-purple-600 text-white border-purple-600' : 'bg-white text-slate-700 border-slate-300'}`}
            >
              Todos
                </button>
            {categories.map((cat) => (
                <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1.5 rounded-full border text-sm ${selectedCategory === cat.id ? 'bg-purple-600 text-white border-purple-600' : 'bg-white text-slate-700 border-slate-300'}`}
              >
                {cat.name}
                </button>
            ))}
          </div>
        </div>

        {/* Contador simples */}
        <div className="flex items-center gap-2 mb-4 text-slate-600">
          <Package className="w-5 h-5" />
          <span className="text-sm">
            {filteredProducts.length} {filteredProducts.length === 1 ? 'item' : 'itens'} disponíveis
          </span>
        </div>

        {/* Lista de produtos no estilo seções por categoria */}
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
          <div>
            {/* Seções por categoria */}
            {([selectedCategory] as (number | null)[]).filter(Boolean).length > 0
              ? categories.filter(c => c.id === selectedCategory).map(category => (
                  <CategorySection
                    key={category.id}
                    title={category.name}
                    products={filteredProducts.filter(p => p.categoryId === category.id)}
                    onAdd={handleAddToCart}
                    disabled={!storeStatus?.isOpen}
                  />
                ))
              : (
                categories.map(category => (
                  <CategorySection
                    key={category.id}
                    title={category.name}
                    products={filteredProducts.filter(p => p.categoryId === category.id)}
                    onAdd={handleAddToCart}
                    disabled={!storeStatus?.isOpen}
                  />
                ))
              )}

            {/* Produtos sem categoria */}
            <CategorySection
              title="Outros"
              products={filteredProducts.filter(p => !p.categoryId)}
              onAdd={handleAddToCart}
              disabled={!storeStatus?.isOpen}
            />
          </div>
        )}
      </div>

      {/* Modal do Açaí Personalizado */}
      <CustomAcaiModal 
        isOpen={showCustomAcaiModal} 
        onClose={() => setShowCustomAcaiModal(false)} 
      />

      {/* Modal do Sorvete Personalizado */}
      <CustomProductModal 
        isOpen={showCustomSorveteModal} 
        onClose={() => setShowCustomSorveteModal(false)} 
        productType="sorvete"
      />
    </div>
  );
};

// Seção por categoria no estilo lista
const CategorySection: React.FC<{
  title: string;
  products: Product[];
  onAdd: (id: number) => void;
  disabled?: boolean;
}> = ({ title, products, onAdd, disabled }) => {
  if (!products || products.length === 0) return null;
  return (
    <section className="mb-8">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
        <span className="text-xs text-slate-500">{products.length} itens</span>
      </div>
      <div className="divide-y divide-slate-200 rounded-lg border border-slate-200 bg-white">
        {products.map((product) => (
          <div key={product.id} className="p-4 flex items-center gap-4">
            <div className="w-16 h-16 rounded-md overflow-hidden bg-slate-100 flex items-center justify-center">
              {product.images?.[0]?.url ? (
                <img
                  src={`http://localhost:3001${product.images[0].url}`}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <Package className="w-6 h-6 text-slate-400" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <h3 className="font-medium text-slate-900 truncate">{product.name}</h3>
                <span className="whitespace-nowrap font-semibold text-slate-900">
                  R$ {Number(product.price ?? 0).toFixed(2)}
                </span>
              </div>
              <p className="text-sm text-slate-600 mt-1 line-clamp-2">
                {product.description || 'Produto delicioso e preparado na hora'}
              </p>
            </div>
            <button
              onClick={() => onAdd(product.id)}
              disabled={disabled}
              className={`px-4 py-2 rounded-md text-white text-sm font-semibold ${
                disabled ? 'bg-slate-300 cursor-not-allowed' : 'bg-purple-600 hover:bg-purple-700'
              }`}
              title={disabled ? 'Indisponível agora' : 'Adicionar ao carrinho'}
            >
              {disabled ? 'Indisponível' : 'Adicionar'}
            </button>
          </div>
        ))}
      </div>
    </section>
  );
};

export default Products;
