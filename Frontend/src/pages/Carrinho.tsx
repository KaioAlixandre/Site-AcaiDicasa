import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Minus, 
  Plus, 
  Trash2, 
  ShoppingBag, 
  ArrowLeft, 
  Clock, 
  Star, 
  Heart
} from 'lucide-react';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { apiService } from '../services/api';
import { checkStoreStatus } from '../utils/storeUtils';
import Loading from '../components/Loading';

const Cart: React.FC = () => {
  const { items, total, updateItem, removeItem, clearCart, loading } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [storeStatus, setStoreStatus] = useState<any>(null);

  useEffect(() => {
    const loadStoreConfig = async () => {
      try {
        const config = await apiService.getStoreConfig();
        
        if (config) {
          const status = checkStoreStatus(config);
          setStoreStatus(status);
        }
      } catch (error) {
        console.error('Erro ao carregar configurações da loja:', error);
      }
    };

    loadStoreConfig();
  }, []);

  const handleQuantityChange = async (cartItemId: number, newQuantity: number) => {
    if (newQuantity <= 0) {
      await removeItem(cartItemId);
    } else {
      await updateItem(cartItemId, newQuantity);
    }
  };

  const handleCheckout = () => {
    if (!user) {
      navigate('/login');
      return;
    }

    // Verificar se a loja está aberta
    if (storeStatus && !storeStatus.isOpen) {
      alert(`Não é possível finalizar o pedido: ${storeStatus.reason}\n${storeStatus.nextOpenTime || ''}`);
      return;
    }

    // Vai direto para o checkout - a verificação de endereço será feita lá
    navigate('/checkout');
  };

  if (loading) {
    return <Loading fullScreen text="Carregando carrinho..." />;
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-16">
          <div className="text-center py-8 md:py-16">
            {/* Main icon */}
            <div className="w-20 h-20 md:w-32 md:h-32 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6 md:mb-8">
              <ShoppingBag className="w-10 h-10 md:w-16 md:h-16 text-purple-600" />
            </div>

            <h2 className="text-2xl md:text-4xl font-bold text-slate-900 mb-3 md:mb-4">
              Seu carrinho está vazio
            </h2>
            <p className="text-base md:text-xl text-slate-600 mb-6 md:mb-8 max-w-md mx-auto">
              Que tal adicionar alguns açaís deliciosos e refrescantes?
            </p>

            {/* Benefits */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-8 md:mb-12 max-w-3xl mx-auto">
              <div className="bg-white rounded-lg p-4 md:p-6 shadow-sm border border-slate-200">
                <div className="w-10 h-10 md:w-12 md:h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3 md:mb-4">
                  <Star className="w-5 h-5 md:w-6 md:h-6 text-purple-600" />
                </div>
                <h3 className="font-semibold text-slate-900 mb-1 md:mb-2 text-sm md:text-base">Qualidade Premium</h3>
                <p className="text-slate-600 text-xs md:text-sm">Açaí 100% natural e fresquinho</p>
              </div>

              <div className="bg-white rounded-lg p-4 md:p-6 shadow-sm border border-slate-200">
                <div className="w-10 h-10 md:w-12 md:h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3 md:mb-4">
                  <Clock className="w-5 h-5 md:w-6 md:h-6 text-purple-600" />
                </div>
                <h3 className="font-semibold text-slate-900 mb-1 md:mb-2 text-sm md:text-base">Entrega Rápida</h3>
                <p className="text-slate-600 text-xs md:text-sm">Receba em casa rapidinho</p>
              </div>

              <div className="bg-white rounded-lg p-4 md:p-6 shadow-sm border border-slate-200">
                <div className="w-10 h-10 md:w-12 md:h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3 md:mb-4">
                  <Heart className="w-5 h-5 md:w-6 md:h-6 text-purple-600" />
                </div>
                <h3 className="font-semibold text-slate-900 mb-1 md:mb-2 text-sm md:text-base">Feito com Amor</h3>
                <p className="text-slate-600 text-xs md:text-sm">Preparado com muito carinho</p>
              </div>
            </div>

            <Link
              to="/products"
              className="inline-flex items-center px-6 py-3 md:px-8 md:py-4 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 transition-all duration-200 shadow-md hover:shadow-lg"
            >
              <ArrowLeft size={20} className="mr-2 md:mr-3" />
              Explorar Produtos
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">
        {/* Header */}
        <div className="mb-6 md:mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 mb-2">
            Meu Carrinho
          </h1>
          <p className="text-sm md:text-base text-slate-600">
            {items.length} {items.length === 1 ? 'item' : 'itens'} selecionado{items.length !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Status da Loja */}
        {storeStatus && (
          <div className="mb-6 md:mb-8">
            <div className={`p-4 md:p-6 rounded-lg border transition-all duration-200 ${
              storeStatus.isOpen 
                ? 'bg-emerald-50 border-emerald-200' 
                : 'bg-rose-50 border-rose-200'
            }`}>
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center ${
                  storeStatus.isOpen ? 'bg-emerald-100' : 'bg-rose-100'
                }`}>
                  <Clock className={`w-5 h-5 md:w-6 md:h-6 ${storeStatus.isOpen ? 'text-emerald-600' : 'text-rose-600'}`} />
                </div>
                <div className="flex-1">
                  <span className={`text-sm md:text-base font-semibold block ${
                    storeStatus.isOpen ? 'text-emerald-800' : 'text-rose-800'
                  }`}>
                    {storeStatus.isOpen ? 'Loja Aberta - Pedidos Disponíveis!' : 'Loja Fechada'}
                  </span>
                  {!storeStatus.isOpen && (
                    <div className="mt-1">
                      <p className="text-xs md:text-sm text-rose-700">{storeStatus.reason}</p>
                      {storeStatus.nextOpenTime && (
                        <p className="text-xs md:text-sm text-rose-600 font-medium mt-0.5">{storeStatus.nextOpenTime}</p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
          {/* Lista de Itens */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              {items.map((item, index) => {
                // Verificar se o produto existe
                if (!item.product) {
                  console.warn('Item sem produto:', item);
                  return null;
                }

                // Log para debug
                console.log('Item do carrinho:', item);
                console.log('Produto:', item.product);
                
                // Obter dados do produto
                const product = item.product;
                const productImage = product.images && product.images.length > 0 && product.images[0]?.url
                  ? `http://localhost:3001${product.images[0].url}`
                  : null;
                
                return (
                <div key={item.id} className={`p-4 md:p-6 ${index !== items.length - 1 ? 'border-b border-slate-200' : ''}`}>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                    {/* Imagem do produto */}
                    <div className="w-20 h-20 sm:w-24 sm:h-24 bg-slate-100 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
                      {productImage ? (
                        <img 
                          src={productImage} 
                          alt={product.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            console.error('Erro ao carregar imagem:', productImage);
                            e.currentTarget.style.display = 'none';
                            e.currentTarget.parentElement!.innerHTML = '<span class="text-2xl sm:text-3xl">🥤</span>';
                          }}
                        />
                      ) : (
                        <span className="text-2xl sm:text-3xl">🥤</span>
                      )}
                    </div>

                    {/* Informações do produto */}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-base md:text-lg font-semibold text-slate-900 mb-1">
                        {product.name}
                      </h3>
                      <p className="text-xs md:text-sm text-slate-600 mb-2 line-clamp-1">
                        {product.description || 'Açaí delicioso e refrescante'}
                      </p>
                      <div className="flex items-center gap-1">
                        <span className="text-sm md:text-base font-bold text-emerald-700">
                          R$ {Number(product.price).toFixed(2)}
                        </span>
                        <span className="text-xs text-slate-500">un.</span>
                      </div>
                    </div>

                    {/* Controles de quantidade e preço */}
                    <div className="flex items-center gap-4 sm:gap-6 sm:ml-auto">
                      <div className="flex items-center gap-2 bg-slate-100 rounded-lg p-1">
                        <button
                          onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                          className="w-8 h-8 rounded-md bg-white hover:bg-slate-50 transition-colors flex items-center justify-center"
                        >
                          <Minus size={16} className="text-slate-600" />
                        </button>
                        <span className="w-8 text-center font-semibold text-sm text-slate-900">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                          className="w-8 h-8 rounded-md bg-white hover:bg-slate-50 transition-colors flex items-center justify-center"
                        >
                          <Plus size={16} className="text-slate-600" />
                        </button>
                      </div>

                      {/* Preço total */}
                      <div className="text-right hidden sm:block">
                        <p className="text-base md:text-lg font-bold text-slate-900">
                          R$ {(item.quantity * product.price).toFixed(2)}
                        </p>
                      </div>

                      {/* Botão remover */}
                      <button
                        onClick={() => removeItem(item.id)}
                        className="w-8 h-8 text-slate-400 hover:text-red-600 transition-colors flex items-center justify-center"
                        title="Remover item"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>

                    {/* Preço total mobile */}
                    <div className="sm:hidden w-full mt-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-slate-600">Total:</span>
                        <p className="text-base font-bold text-slate-900">
                          R$ {(item.quantity * product.price).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              );
              })}
            </div>

            {/* Botão limpar carrinho */}
            <div className="mt-4 text-center">
              <button
                onClick={clearCart}
                className="inline-flex items-center px-4 py-2 text-sm text-slate-600 hover:text-red-600 font-medium transition-colors"
              >
                <Trash2 className="mr-2" size={16} />
                Limpar Carrinho
              </button>
            </div>
          </div>

          {/* Resumo do Pedido */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 md:p-6 sticky top-4">
              <h2 className="text-lg md:text-xl font-bold text-slate-900 mb-4 md:mb-6">
                Resumo do Pedido
              </h2>

              {/* Detalhes do pedido */}
              <div className="space-y-3 md:space-y-4 mb-4 md:mb-6">
                <div className="flex justify-between items-center py-2 border-b border-slate-200">
                  <span className="text-sm md:text-base text-slate-600">Subtotal</span>
                  <span className="text-base md:text-lg font-semibold text-slate-900">
                    R$ {total.toFixed(2)}
                  </span>
                </div>

                <div className="flex justify-between items-center py-2 border-b border-slate-200">
                  <span className="text-sm md:text-base text-slate-600">Taxa de entrega</span>
                  <span className="text-sm md:text-base text-slate-600">
                    Calculado no checkout
                  </span>
                </div>

                <div className="flex justify-between items-center pt-2">
                  <span className="text-base md:text-lg font-bold text-slate-900">Total</span>
                  <span className="text-lg md:text-xl font-bold text-emerald-700">
                    R$ {total.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Botões de ação */}
              <div className="space-y-3">
                <button
                  onClick={handleCheckout}
                  disabled={storeStatus && !storeStatus.isOpen}
                  className={`w-full font-semibold py-3 px-4 rounded-lg transition-all duration-200 ${
                    storeStatus && !storeStatus.isOpen
                      ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                      : 'bg-purple-600 text-white hover:bg-purple-700 shadow-md hover:shadow-lg'
                  }`}
                >
                  {storeStatus && !storeStatus.isOpen ? (
                    <span className="flex items-center justify-center">
                      <Clock className="mr-2" size={18} />
                      Loja Fechada
                    </span>
                  ) : (
                    'Finalizar Pedido'
                  )}
                </button>

                <Link
                  to="/products"
                  className="block w-full text-center text-purple-600 font-semibold py-3 px-4 rounded-lg hover:bg-slate-50 transition-all duration-200 border border-slate-200"
                >
                  <span className="flex items-center justify-center">
                    <ArrowLeft className="mr-2" size={18} />
                    Continuar Comprando
                  </span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;
