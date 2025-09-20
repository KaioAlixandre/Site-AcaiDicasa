import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Minus, Plus, Trash2, ShoppingBag, ArrowLeft } from 'lucide-react';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import Loading from '../components/Loading';

const Cart: React.FC = () => {
  const { items, total, updateItem, removeItem, clearCart, loading } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

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

    // Vai direto para o checkout - a verificação de endereço será feita lá
    navigate('/checkout');
  };

  if (loading) {
    return <Loading fullScreen text="Carregando carrinho..." />;
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-12">
            <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
              <ShoppingBag className="w-12 h-12 text-gray-400" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Seu carrinho está vazio
            </h2>
            <p className="text-gray-600 mb-8">
              Que tal adicionar alguns produtos deliciosos?
            </p>
            <Link
              to="/products"
              className="inline-flex items-center px-6 py-3 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 transition-colors"
            >
              <ArrowLeft size={20} className="mr-2" />
              Continuar Comprando
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Meu Carrinho</h1>
          <p className="text-lg text-gray-600">
            {items.length} item(s) no seu carrinho
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Lista de Itens */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-md">
              {items.map((item) => (
                <div key={item.id} className="p-6 border-b border-gray-200 last:border-b-0">
                  <div className="flex items-center space-x-4">
                    {/* Imagem do produto */}
                    <div className="w-20 h-20 bg-gradient-to-br from-purple-400 to-pink-400 rounded-lg flex items-center justify-center flex-shrink-0">
                      <span className="text-2xl">🥤</span>
                    </div>

                    {/* Informações do produto */}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {item.product.name}
                      </h3>
                      <p className="text-gray-600 text-sm">
                        {item.product.description || 'Açaí delicioso e refrescante'}
                      </p>
                      <p className="text-lg font-bold text-purple-600 mt-1">
                        R$ {Number(item.product.price ?? 0).toFixed(2)}

                      </p>
                    </div>

                    {/* Controles de quantidade */}
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                        className="p-1 rounded-full hover:bg-gray-100 transition-colors"
                      >
                        <Minus size={16} />
                      </button>
                      <span className="w-8 text-center font-semibold">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                        className="p-1 rounded-full hover:bg-gray-100 transition-colors"
                      >
                        <Plus size={16} />
                      </button>
                    </div>

                    {/* Preço total do item */}
                    <div className="text-right">
                      <p className="text-lg font-bold text-gray-900">
                        R$ {(item.quantity * item.product.price).toFixed(2)}
                      </p>
                    </div>

                    {/* Botão remover */}
                    <button
                      onClick={() => removeItem(item.id)}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-full transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Botão limpar carrinho */}
            <div className="mt-4 text-right">
              <button
                onClick={clearCart}
                className="text-red-600 hover:text-red-700 font-medium"
              >
                Limpar Carrinho
              </button>
            </div>
          </div>

          {/* Resumo do Pedido */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6 sticky top-8">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                Resumo do Pedido
              </h2>

              <div className="space-y-3 mb-6">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-semibold">
                    R$ {total.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Taxa de entrega</span>
                  <span className="font-semibold">
                    R$ 5,00
                  </span>
                </div>
                <div className="border-t pt-3">
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total</span>
                    <span className="text-purple-600">
                      R$ {(total + 3).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              <button
                onClick={handleCheckout}
                className="w-full bg-purple-600 text-white font-semibold py-3 px-4 rounded-lg hover:bg-purple-700 transition-colors"
              >
                Finalizar Pedido
              </button>

              <Link
                to="/products"
                className="block w-full text-center text-purple-600 font-medium py-3 px-4 rounded-lg hover:bg-purple-50 transition-colors mt-2"
              >
                Continuar Comprando
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;
