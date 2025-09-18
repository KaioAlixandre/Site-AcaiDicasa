import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, Plus, ShoppingCart } from 'lucide-react';
import { Product, ProductCategory } from '../types';
import { apiService } from '../services/api';
import { useCart } from '../contexts/CartContext';
import Loading from '../components/Loading';

const Products: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [addingToCart, setAddingToCart] = useState<number | null>(null);
  const { addItem } = useCart();

  useEffect(() => {
    const loadData = async () => {
      try {
        const productsData = await apiService.getProducts();
        
        setProducts(productsData);
        setFilteredProducts(productsData);
        
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
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Nossos Produtos</h1>
          <p className="text-lg text-gray-600">
            Descubra nossa variedade de açaí e acompanhamentos deliciosos
          </p>
        </div>

        {/* Filtros e Busca */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Busca */}
            <div className="flex-1">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Buscar produtos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                />
              </div>
            </div>

            {/* Filtro por categoria */}
            <div className="lg:w-64">
              <select
                value={selectedCategory || ''}
                onChange={(e) => setSelectedCategory(e.target.value ? Number(e.target.value) : null)}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
              >
                <option value="">Todas as categorias</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Resultados */}
        <div className="mb-4">
          <p className="text-gray-600">
            {filteredProducts.length} produto(s) encontrado(s)
          </p>
        </div>

        {/* Grid de Produtos */}
        {filteredProducts.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Nenhum produto encontrado
            </h3>
            <p className="text-gray-600">
              Tente ajustar seus filtros de busca
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map((product) => (
              <div key={product.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                {/* Imagem do produto */}
                <div className="h-48 bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center">
                  <span className="text-6xl">🥤</span>
                </div>

                {/* Conteúdo do produto */}
                <div className="p-6">
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {product.name}
                  </h3>
                  <p className="text-gray-600 mb-4 line-clamp-2">
                    {product.description || 'Açaí delicioso e refrescante'}
                  </p>
                  
                  {/* Preço */}
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-2xl font-bold text-purple-600">
                      R$ {Number(product.price ?? 0).toFixed(2)}
                    </span>
                    <span className="text-sm text-gray-500">
                      Disponível
                    </span>
                  </div>

                  {/* Ações */}
                  <div className="flex space-x-2">
                    <Link
                      to={`/products/${product.id}`}
                      className="flex-1 px-4 py-2 border border-purple-600 text-purple-600 rounded-lg hover:bg-purple-50 transition-colors text-center"
                    >
                      Ver Detalhes
                    </Link>
                    <button
                      onClick={() => handleAddToCart(product.id)}
                      disabled={addingToCart === product.id}
                      className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                    >
                      {addingToCart === product.id ? (
                        <div className="spinner w-4 h-4"></div>
                      ) : (
                        <ShoppingCart size={16} />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Botão para adicionar mais produtos (admin) */}
        <div className="mt-8 text-center">
          <button className="inline-flex items-center px-6 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors">
            <Plus size={20} className="mr-2" />
            Adicionar Novo Produto
          </button>
        </div>
      </div>
    </div>
  );
};

export default Products;
