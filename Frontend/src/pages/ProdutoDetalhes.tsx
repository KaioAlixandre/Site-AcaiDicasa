import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ShoppingCart, Plus, Minus, Check, Search, X } from 'lucide-react';
import { useCart } from '../contexts/CartContext';
import apiService from '../services/api';
import { Product, Complement } from '../types';
import Loading from '../components/Loading';

const ProdutoDetalhes: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addItem } = useCart();
  
  const [product, setProduct] = useState<Product | null>(null);
  const [complements, setComplements] = useState<Complement[]>([]);
  const [selectedImage, setSelectedImage] = useState<string>('');
  const [quantity, setQuantity] = useState(1);
  const [selectedComplements, setSelectedComplements] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [addingToCart, setAddingToCart] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  useEffect(() => {
    const loadProductDetails = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        const [productData, complementsData] = await Promise.all([
          apiService.getProductById(parseInt(id)),
          apiService.getComplements()
        ]);
        
        setProduct(productData);
        setComplements(complementsData);
        
        // Definir primeira imagem como selecionada
        if (productData.images && productData.images.length > 0) {
          setSelectedImage(productData.images[0].url);
        }
      } catch (error) {
        console.error('Erro ao carregar detalhes do produto:', error);
      } finally {
        setLoading(false);
      }
    };

    loadProductDetails();
  }, [id]);

  const handleQuantityChange = (delta: number) => {
    setQuantity(prev => Math.max(1, prev + delta));
  };

  const toggleComplement = (complementId: number) => {
    setSelectedComplements(prev => {
      if (prev.includes(complementId)) {
        return prev.filter(id => id !== complementId);
      } else {
        return [...prev, complementId];
      }
    });
  };

  const calculateTotal = () => {
    if (!product) return 0;
    
    let total = Number(product.price) * quantity;
    
    // Nota: Complementos não afetam o preço (campo price não existe no modelo)
    
    return total;
  };

  const handleAddToCart = async () => {
    if (!product) return;
    
    try {
      setAddingToCart(true);
      await addItem(product.id, quantity);
      
      // Feedback visual
      alert('Produto adicionado ao carrinho!');
      navigate('/cart');
    } catch (error) {
      console.error('Erro ao adicionar ao carrinho:', error);
      alert('Erro ao adicionar produto ao carrinho');
    } finally {
      setAddingToCart(false);
    }
  };

  if (loading) {
    return <Loading fullScreen text="Carregando produto..." />;
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-slate-900 mb-4">Produto não encontrado</h2>
          <button
            onClick={() => navigate('/products')}
            className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
          >
            Voltar para produtos
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 md:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
          {/* Coluna Esquerda - Imagens */}
          <div className="space-y-4">
              {/* Imagem Principal */}
              <div className="aspect-square rounded-xl overflow-hidden bg-slate-100 border border-slate-200">
                {selectedImage ? (
                  <img
                    src={`http://localhost:3001${selectedImage}`}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-6xl">
                    🥤
                  </div>
                )}
              </div>

              {/* Miniaturas */}
              {product.images && product.images.length > 1 && (
                <div className="grid grid-cols-4 gap-2 md:gap-3">
                  {product.images.map((image, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedImage(image.url)}
                      className={`aspect-square rounded-lg overflow-hidden bg-slate-100 border-2 transition-all ${
                        selectedImage === image.url
                          ? 'border-purple-600 ring-2 ring-purple-200'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <img
                        src={`http://localhost:3001${image.url}`}
                        alt={`${product.name} - ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Coluna Direita - Informações */}
            <div className="space-y-4 md:space-y-5">
              {/* Header */}
              <div>
                <h1 className="text-xl md:text-3xl font-bold text-slate-900 mb-2">
                  {product.name}
                </h1>
                {product.description && (
                  <p className="text-xs md:text-sm text-slate-600 leading-relaxed">
                    {product.description}
                  </p>
                )}
              </div>

              {/* Preço */}
              <div className="bg-purple-50 border border-purple-200 rounded-xl p-3 md:p-5">
                <p className="text-xs md:text-sm text-purple-700 font-medium mb-1">Preço</p>
                <p className="text-2xl md:text-4xl font-bold text-purple-600">
                  R$ {Number(product.price).toFixed(2)}
                </p>
              </div>

              {/* Quantidade */}
              <div>
                <label className="block text-xs md:text-sm font-semibold text-slate-900 mb-2">
                  Quantidade
                </label>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handleQuantityChange(-1)}
                    className="w-9 h-9 md:w-11 md:h-11 rounded-lg bg-slate-200 hover:bg-slate-300 flex items-center justify-center transition-colors"
                    disabled={quantity <= 1}
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="text-lg md:text-xl font-bold text-slate-900 min-w-[2.5rem] text-center">
                    {quantity}
                  </span>
                  <button
                    onClick={() => handleQuantityChange(1)}
                    className="w-9 h-9 md:w-11 md:h-11 rounded-lg bg-slate-200 hover:bg-slate-300 flex items-center justify-center transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Botão Adicionar ao Carrinho */}
              <button
                onClick={handleAddToCart}
                disabled={addingToCart}
                className="w-full py-3 md:py-4 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl disabled:bg-purple-400 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm md:text-base"
              >
                <ShoppingCart className="w-4 h-4 md:w-5 md:h-5" />
                {addingToCart ? 'Adicionando...' : 'Adicionar ao Carrinho'}
              </button>

              {/* Total */}
              <div className="bg-slate-100 rounded-xl p-3 md:p-5 border border-slate-200">
                <div className="flex items-center justify-between">
                  <span className="text-sm md:text-base font-semibold text-slate-700">
                    Total
                  </span>
                  <span className="text-xl md:text-2xl font-bold text-purple-600">
                    R$ {calculateTotal().toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </div>

            {/* Complementos */}
            {product.receiveComplements && complements.length > 0 && (
              <div className="mt-6 pt-4 border-t border-slate-200">
                <h2 className="text-base md:text-xl font-bold text-slate-900 mb-3 md:mb-5">
                  Complementos Disponíveis
                </h2>

                {/* Filtros de Busca */}
                <div className="mb-4 md:mb-6 space-y-3">
                  {/* Campo de Busca */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4 md:w-5 md:h-5" />
                    <input
                      type="text"
                      placeholder="Buscar complemento..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-9 md:pl-10 pr-10 py-2 md:py-3 text-sm md:text-base border-2 border-slate-200 rounded-lg md:rounded-xl focus:border-purple-500 focus:outline-none transition-colors"
                    />
                    {searchTerm && (
                      <button
                        onClick={() => setSearchTerm('')}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {/* Filtro por Categoria */}
                  <div className="flex items-center gap-2 overflow-x-auto pb-2">
                    <button
                      onClick={() => setSelectedCategory('all')}
                      className={`px-3 md:px-4 py-1.5 md:py-2 rounded-lg md:rounded-xl text-xs md:text-sm font-semibold whitespace-nowrap transition-all ${
                        selectedCategory === 'all'
                          ? 'bg-purple-600 text-white shadow-md'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      Todos
                    </button>
                    {(() => {
                      const categories = new Set<string>();
                      complements.forEach((complement) => {
                        if (complement.category?.name) {
                          categories.add(complement.category.name);
                        }
                      });
                      return Array.from(categories).map((categoryName) => (
                        <button
                          key={categoryName}
                          onClick={() => setSelectedCategory(categoryName)}
                          className={`px-3 md:px-4 py-1.5 md:py-2 rounded-lg md:rounded-xl text-xs md:text-sm font-semibold whitespace-nowrap transition-all ${
                            selectedCategory === categoryName
                              ? 'bg-purple-600 text-white shadow-md'
                              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                          }`}
                        >
                          {categoryName}
                        </button>
                      ));
                    })()}
                    {complements.some((c) => !c.category) && (
                      <button
                        onClick={() => setSelectedCategory('uncategorized')}
                        className={`px-3 md:px-4 py-1.5 md:py-2 rounded-lg md:rounded-xl text-xs md:text-sm font-semibold whitespace-nowrap transition-all ${
                          selectedCategory === 'uncategorized'
                            ? 'bg-purple-600 text-white shadow-md'
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        }`}
                      >
                        Outros
                      </button>
                    )}
                  </div>
                </div>
                
                {/* Agrupar complementos por categoria */}
                {(() => {
                  // Filtrar complementos por busca e categoria
                  const filteredComplements = complements.filter((complement) => {
                    // Filtro por nome
                    const matchesSearch = complement.name.toLowerCase().includes(searchTerm.toLowerCase());
                    
                    // Filtro por categoria
                    let matchesCategory = true;
                    if (selectedCategory !== 'all') {
                      if (selectedCategory === 'uncategorized') {
                        matchesCategory = !complement.category;
                      } else {
                        matchesCategory = complement.category?.name === selectedCategory;
                      }
                    }
                    
                    return matchesSearch && matchesCategory;
                  });

                  // Separar complementos filtrados por categoria
                  const complementsByCategory: { [key: string]: Complement[] } = {};
                  const uncategorized: Complement[] = [];
                  
                  filteredComplements.forEach((complement) => {
                    if (complement.category?.name) {
                      const categoryName = complement.category.name;
                      if (!complementsByCategory[categoryName]) {
                        complementsByCategory[categoryName] = [];
                      }
                      complementsByCategory[categoryName].push(complement);
                    } else {
                      uncategorized.push(complement);
                    }
                  });

                  // Se não houver resultados
                  if (filteredComplements.length === 0) {
                    return (
                      <div className="text-center py-8 md:py-12">
                        <div className="text-4xl md:text-6xl mb-3 md:mb-4">🔍</div>
                        <h3 className="text-base md:text-lg font-semibold text-slate-700 mb-1 md:mb-2">
                          Nenhum complemento encontrado
                        </h3>
                        <p className="text-xs md:text-sm text-slate-500">
                          Tente ajustar os filtros de busca
                        </p>
                      </div>
                    );
                  }

                  return (
                    <div className="space-y-4 md:space-y-6">
                      {/* Complementos com categoria */}
                      {Object.entries(complementsByCategory).map(([categoryName, categoryComplements]) => (
                        <div key={categoryName} className="space-y-2 md:space-y-3">
                          <h3 className="text-sm md:text-lg font-semibold text-purple-700 bg-purple-50 px-3 py-1.5 md:px-4 md:py-2 rounded-lg border border-purple-200">
                            {categoryName}
                          </h3>
                          <div className="space-y-1.5 md:space-y-3">
                            {categoryComplements.map((complement) => (
                              <button
                                key={complement.id}
                                onClick={() => toggleComplement(complement.id)}
                                className={`w-full p-2.5 md:p-4 rounded-lg md:rounded-xl border-2 transition-all duration-200 text-left ${
                                  selectedComplements.includes(complement.id)
                                    ? 'border-purple-600 bg-purple-50'
                                    : 'border-slate-200 bg-white hover:border-slate-300'
                                }`}
                              >
                                <div className="flex items-center gap-2.5 md:gap-4">
                                  {/* Imagem do complemento */}
                                  {complement.imageUrl ? (
                                    <img
                                      src={complement.imageUrl.startsWith('http') ? complement.imageUrl : `http://localhost:3001${complement.imageUrl}`}
                                      alt={complement.name}
                                      className="w-12 h-12 md:w-20 md:h-20 object-cover rounded-md md:rounded-lg flex-shrink-0 border border-slate-200"
                                      onError={(e) => {
                                        const target = e.target as HTMLImageElement;
                                        if (!target.dataset.errorHandled) {
                                          target.dataset.errorHandled = 'true';
                                          target.style.display = 'none';
                                          const parent = target.parentElement;
                                          if (parent) {
                                            parent.innerHTML = '<div class="w-12 h-12 md:w-20 md:h-20 bg-slate-100 rounded-md md:rounded-lg flex items-center justify-center flex-shrink-0"><span class="text-2xl md:text-3xl">🍓</span></div>';
                                          }
                                        }
                                      }}
                                    />
                                  ) : (
                                    <div className="w-12 h-12 md:w-20 md:h-20 bg-slate-100 rounded-md md:rounded-lg flex items-center justify-center flex-shrink-0">
                                      <span className="text-2xl md:text-3xl">🍓</span>
                                    </div>
                                  )}

                                  {/* Nome do complemento */}
                                  <div className="flex-1">
                                    <h3 className="text-xs md:text-base font-semibold text-slate-900">
                                      {complement.name}
                                    </h3>
                                  </div>

                                  {/* Checkbox */}
                                  <div className={`w-4 h-4 md:w-6 md:h-6 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                                    selectedComplements.includes(complement.id)
                                      ? 'bg-purple-600 border-purple-600'
                                      : 'border-slate-300 bg-white'
                                  }`}>
                                    {selectedComplements.includes(complement.id) && (
                                      <Check className="w-2.5 h-2.5 md:w-4 md:h-4 text-white" />
                                    )}
                                  </div>
                                </div>
                              </button>
                            ))}
                          </div>
                        </div>
                      ))}

                      {/* Complementos sem categoria */}
                      {uncategorized.length > 0 && (
                        <div className="space-y-2 md:space-y-3">
                          <h3 className="text-sm md:text-lg font-semibold text-slate-700 bg-slate-50 px-3 py-1.5 md:px-4 md:py-2 rounded-lg border border-slate-200">
                            Outros
                          </h3>
                          <div className="space-y-1.5 md:space-y-3">
                            {uncategorized.map((complement) => (
                              <button
                                key={complement.id}
                                onClick={() => toggleComplement(complement.id)}
                                className={`w-full p-2.5 md:p-4 rounded-lg md:rounded-xl border-2 transition-all duration-200 text-left ${
                                  selectedComplements.includes(complement.id)
                                    ? 'border-purple-600 bg-purple-50'
                                    : 'border-slate-200 bg-white hover:border-slate-300'
                                }`}
                              >
                                <div className="flex items-center gap-2.5 md:gap-4">
                                  {/* Imagem do complemento */}
                                  {complement.imageUrl ? (
                                    <img
                                      src={complement.imageUrl.startsWith('http') ? complement.imageUrl : `http://localhost:3001${complement.imageUrl}`}
                                      alt={complement.name}
                                      className="w-12 h-12 md:w-20 md:h-20 object-cover rounded-md md:rounded-lg flex-shrink-0 border border-slate-200"
                                      onError={(e) => {
                                        const target = e.target as HTMLImageElement;
                                        if (!target.dataset.errorHandled) {
                                          target.dataset.errorHandled = 'true';
                                          target.style.display = 'none';
                                          const parent = target.parentElement;
                                          if (parent) {
                                            parent.innerHTML = '<div class="w-12 h-12 md:w-20 md:h-20 bg-slate-100 rounded-md md:rounded-lg flex items-center justify-center flex-shrink-0"><span class="text-2xl md:text-3xl">🍓</span></div>';
                                          }
                                        }
                                      }}
                                    />
                                  ) : (
                                    <div className="w-12 h-12 md:w-20 md:h-20 bg-slate-100 rounded-md md:rounded-lg flex items-center justify-center flex-shrink-0">
                                      <span className="text-2xl md:text-3xl">🍓</span>
                                    </div>
                                  )}

                                  {/* Nome do complemento */}
                                  <div className="flex-1">
                                    <h3 className="text-xs md:text-base font-semibold text-slate-900">
                                      {complement.name}
                                    </h3>
                                  </div>

                                  {/* Checkbox */}
                                  <div className={`w-4 h-4 md:w-6 md:h-6 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                                    selectedComplements.includes(complement.id)
                                      ? 'bg-purple-600 border-purple-600'
                                      : 'border-slate-300 bg-white'
                                  }`}>
                                    {selectedComplements.includes(complement.id) && (
                                      <Check className="w-2.5 h-2.5 md:w-4 md:h-4 text-white" />
                                    )}
                                  </div>
                                </div>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>
            )}
          </div>
        </div>
    
  );
};

export default ProdutoDetalhes;
