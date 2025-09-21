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
  Heart,
  Gift,
  Tag,
  CreditCard,
  Sparkles
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
  const [storeConfig, setStoreConfig] = useState<any>(null);
  const [storeStatus, setStoreStatus] = useState<any>(null);

  useEffect(() => {
    const loadStoreConfig = async () => {
      try {
        const config = await apiService.getStoreConfig();
        setStoreConfig(config);
        
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
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-purple-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center py-16">
            <div className="relative">
              {/* Background decoration */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-48 h-48 bg-gradient-to-br from-purple-100 to-pink-100 rounded-full opacity-50"></div>
              </div>
              
              {/* Main icon */}
              <div className="relative w-32 h-32 bg-gradient-to-br from-purple-200 to-pink-200 rounded-full flex items-center justify-center mx-auto mb-8 shadow-lg">
                <ShoppingBag className="w-16 h-16 text-purple-600" />
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-br from-yellow-400 to-orange-400 rounded-full flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
              </div>
            </div>

            <h2 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600 mb-4">
              Seu carrinho está vazio
            </h2>
            <p className="text-xl text-gray-600 mb-8 max-w-md mx-auto">
              Que tal adicionar alguns açaís deliciosos e refrescantes?
            </p>

            {/* Benefits */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12 max-w-3xl mx-auto">
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-gray-100">
                <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-emerald-500 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <Star className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-bold text-gray-800 mb-2">Qualidade Premium</h3>
                <p className="text-gray-600 text-sm">Açaí 100% natural e fresquinho</p>
              </div>

              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-gray-100">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-500 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <Clock className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-bold text-gray-800 mb-2">Entrega Rápida</h3>
                <p className="text-gray-600 text-sm">Receba em casa rapidinho</p>
              </div>

              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-gray-100">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-pink-500 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <Heart className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-bold text-gray-800 mb-2">Feito com Amor</h3>
                <p className="text-gray-600 text-sm">Preparado com muito carinho</p>
              </div>
            </div>

            <Link
              to="/products"
              className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold rounded-2xl hover:from-purple-700 hover:to-pink-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
            >
              <ArrowLeft size={24} className="mr-3" />
              Explorar Produtos
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-purple-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-purple-600 to-pink-600 rounded-2xl shadow-lg mb-4">
            <ShoppingBag className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600 mb-2">
            Meu Carrinho
          </h1>
          <p className="text-lg text-gray-600">
            {items.length} {items.length === 1 ? 'item' : 'itens'} selecionado{items.length !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Status da Loja */}
        {storeStatus && (
          <div className={`mb-8 mx-auto max-w-2xl`}>
            <div className={`p-6 rounded-2xl shadow-lg border-2 transition-all duration-300 ${
              storeStatus.isOpen 
                ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-200 hover:shadow-xl' 
                : 'bg-gradient-to-r from-red-50 to-pink-50 border-red-200 hover:shadow-xl'
            }`}>
              <div className="flex items-center justify-center">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center mr-4 ${
                  storeStatus.isOpen ? 'bg-green-100' : 'bg-red-100'
                }`}>
                  <Clock className={`w-6 h-6 ${storeStatus.isOpen ? 'text-green-600' : 'text-red-600'}`} />
                </div>
                <div className="text-center">
                  <span className={`text-xl font-bold ${storeStatus.isOpen ? 'text-green-800' : 'text-red-800'}`}>
                    {storeStatus.isOpen ? '🟢 Loja Aberta - Pedidos Disponíveis!' : '🔴 Loja Fechada'}
                  </span>
                  {!storeStatus.isOpen && (
                    <div className="mt-2">
                      <p className="text-red-700 font-medium">{storeStatus.reason}</p>
                      {storeStatus.nextOpenTime && (
                        <p className="text-red-600 font-semibold mt-1">{storeStatus.nextOpenTime}</p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
          {/* Lista de Itens */}
          <div className="xl:col-span-3">
            <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl border border-gray-200 overflow-hidden">
              {items.map((item, index) => (
                <div key={item.id} className={`p-6 ${index !== items.length - 1 ? 'border-b border-gray-200' : ''} hover:bg-purple-50/50 transition-all duration-200`}>
                  <div className="flex items-center space-x-6">
                    {/* Imagem do produto */}
                    <div className="relative">
                      <div className="w-24 h-24 bg-gradient-to-br from-purple-400 via-pink-400 to-purple-500 rounded-2xl flex items-center justify-center shadow-lg">
                        <span className="text-3xl">🥤</span>
                      </div>
                      <div className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
                        <Star className="w-3 h-3 text-white" />
                      </div>
                    </div>

                    {/* Informações do produto */}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-xl font-bold text-gray-900 mb-1">
                        {item.product.name}
                      </h3>
                      <p className="text-gray-600 mb-2">
                        {item.product.description || 'Açaí delicioso e refrescante feito com ingredientes selecionados'}
                      </p>
                      <div className="flex items-center space-x-2">
                        <Tag className="w-4 h-4 text-purple-600" />
                        <span className="text-lg font-bold text-purple-600">
                          R$ {Number(item.product.price ?? 0).toFixed(2)}
                        </span>
                      </div>
                    </div>

                    {/* Controles de quantidade */}
                    <div className="flex items-center space-x-3 bg-gray-100 rounded-2xl p-2">
                      <button
                        onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                        className="w-10 h-10 rounded-xl bg-white shadow-md hover:bg-red-50 hover:shadow-lg transition-all duration-200 flex items-center justify-center group"
                      >
                        <Minus size={18} className="text-gray-600 group-hover:text-red-600" />
                      </button>
                      <span className="w-12 text-center font-bold text-xl text-gray-800">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                        className="w-10 h-10 rounded-xl bg-white shadow-md hover:bg-green-50 hover:shadow-lg transition-all duration-200 flex items-center justify-center group"
                      >
                        <Plus size={18} className="text-gray-600 group-hover:text-green-600" />
                      </button>
                    </div>

                    {/* Preço total do item */}
                    <div className="text-right">
                      <p className="text-2xl font-bold text-gray-900">
                        R$ {(item.quantity * item.product.price).toFixed(2)}
                      </p>
                      <p className="text-sm text-gray-500">
                        {item.quantity} × R$ {Number(item.product.price).toFixed(2)}
                      </p>
                    </div>

                    {/* Botão remover */}
                    <button
                      onClick={() => removeItem(item.id)}
                      className="w-12 h-12 text-red-500 hover:bg-red-50 rounded-2xl transition-all duration-200 flex items-center justify-center hover:shadow-lg group"
                      title="Remover item"
                    >
                      <Trash2 size={20} className="group-hover:scale-110 transition-transform" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Botão limpar carrinho */}
            <div className="mt-6 text-center">
              <button
                onClick={clearCart}
                className="inline-flex items-center px-6 py-3 text-red-600 hover:text-red-700 font-bold hover:bg-red-50 rounded-2xl transition-all duration-200"
              >
                <Trash2 className="mr-2" size={18} />
                Limpar Carrinho
              </button>
            </div>
          </div>

          {/* Resumo do Pedido */}
          <div className="xl:col-span-1">
            <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl border border-gray-200 p-8 sticky top-8">
              {/* Header do resumo */}
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-br from-purple-600 to-pink-600 rounded-2xl shadow-lg mb-4">
                  <CreditCard className="w-7 h-7 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">
                  Resumo do Pedido
                </h2>
              </div>

              {/* Detalhes do pedido */}
              <div className="space-y-4 mb-8">
                <div className="bg-gray-50 rounded-2xl p-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-700 font-medium">Subtotal ({items.length} {items.length === 1 ? 'item' : 'itens'})</span>
                    <span className="text-xl font-bold text-gray-900">
                      R$ {total.toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Benefícios */}
                <div className="space-y-3">
                  <div className="flex items-center text-green-600 text-sm font-medium">
                    <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center mr-3">
                      <span className="text-green-600 text-xs">✓</span>
                    </div>
                    Frete calculado no checkout
                  </div>
                  <div className="flex items-center text-blue-600 text-sm font-medium">
                    <div className="w-5 h-5 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                      <Gift className="w-3 h-3" />
                    </div>
                    Embalagem especial grátis
                  </div>
                  <div className="flex items-center text-purple-600 text-sm font-medium">
                    <div className="w-5 h-5 bg-purple-100 rounded-full flex items-center justify-center mr-3">
                      <Heart className="w-3 h-3" />
                    </div>
                    Feito com muito carinho
                  </div>
                </div>

                <div className="border-t border-gray-200 pt-6">
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-xl font-bold text-gray-800">Total</span>
                    <div className="text-right">
                      <span className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600">
                        R$ {total.toFixed(2)}
                      </span>
                      <p className="text-sm text-gray-500 mt-1">
                        + taxa de entrega
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Botões de ação */}
              <div className="space-y-4">
                <button
                  onClick={handleCheckout}
                  disabled={storeStatus && !storeStatus.isOpen}
                  className={`w-full font-bold py-4 px-6 rounded-2xl transition-all duration-300 shadow-lg transform ${
                    storeStatus && !storeStatus.isOpen
                      ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                      : 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700 hover:shadow-xl hover:-translate-y-1'
                  }`}
                >
                  {storeStatus && !storeStatus.isOpen ? (
                    <div className="flex items-center justify-center">
                      <Clock className="mr-2" size={20} />
                      Loja Fechada
                    </div>
                  ) : (
                    <div className="flex items-center justify-center">
                      <CreditCard className="mr-3" size={20} />
                      Finalizar Pedido
                    </div>
                  )}
                </button>

                <Link
                  to="/products"
                  className="block w-full text-center text-purple-600 font-bold py-4 px-6 rounded-2xl hover:bg-purple-50 transition-all duration-200 border-2 border-purple-200 hover:border-purple-300"
                >
                  <div className="flex items-center justify-center">
                    <ArrowLeft className="mr-3" size={20} />
                    Continuar Comprando
                  </div>
                </Link>
              </div>

              {/* Métodos de pagamento aceitos */}
              <div className="mt-8 pt-6 border-t border-gray-200">
                <p className="text-sm text-gray-600 text-center mb-3 font-medium">
                  Métodos de pagamento aceitos:
                </p>
                <div className="flex justify-center space-x-3">
                  <div className="w-10 h-7 bg-blue-600 rounded flex items-center justify-center">
                    <span className="text-white text-xs font-bold">PIX</span>
                  </div>
                  <div className="w-10 h-7 bg-gray-800 rounded flex items-center justify-center">
                    <CreditCard className="w-4 h-4 text-white" />
                  </div>
                  <div className="w-10 h-7 bg-green-600 rounded flex items-center justify-center">
                    <span className="text-white text-xs">💰</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;
