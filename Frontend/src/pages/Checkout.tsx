import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  CreditCard, 
  Smartphone, 
  DollarSign, 
  MapPin, 
  Package, 
  Truck, 
  Store, 
  CheckCircle, 
  ShoppingCart,
  Clock,
  Star
} from 'lucide-react';
import apiService from '../services/api';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { AddressForm } from '../types';
import { checkStoreStatus } from '../utils/storeUtils';

const paymentMethods = [
  { label: 'Cartão de Crédito', value: 'CREDIT_CARD', icon: <CreditCard size={20} />, color: 'blue' },
  { label: 'PIX', value: 'PIX', icon: <Smartphone size={20} />, color: 'green' },
  { label: 'Dinheiro na Entrega', value: 'CASH_ON_DELIVERY', icon: <DollarSign size={20} />, color: 'yellow' },
];




const Checkout: React.FC = () => {
  const { items, total, clearCart } = useCart();
  const { user, refreshUserProfile } = useAuth();
  const [paymentMethod, setPaymentMethod] = useState('');
  const [deliveryType, setDeliveryType] = useState('delivery'); // 'delivery' ou 'pickup'
  const [loading, setLoading] = useState(false);
  const [pixInfo, setPixInfo] = useState<any>(null);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [addressForm, setAddressForm] = useState<AddressForm>({
    street: '',
    number: '',
    complement: '',
    neighborhood: '',
    isDefault: true
  });
  const [addressLoading, setAddressLoading] = useState(false);
  const [storeConfig, setStoreConfig] = useState<any>(null);
  const navigate = useNavigate();

  const deliveryFee = 3.00; // Taxa de entrega atualizada para R$3
  const finalTotal = deliveryType === 'delivery' ? total + deliveryFee : total;

  // Verificar se a loja está aberta
  useEffect(() => {
    const loadStoreConfig = async () => {
      try {
        const config = await apiService.getStoreConfig();
        setStoreConfig(config);
        
        if (config) {
          const status = checkStoreStatus(config);
          if (!status.isOpen) {
            alert(`A loja está fechada: ${status.reason}\n${status.nextOpenTime || ''}`);
            navigate('/cart');
          }
        }
      } catch (error) {
        console.error('Erro ao carregar configurações da loja:', error);
      }
    };

    loadStoreConfig();
  }, [navigate]);

  // Verificar se o usuário tem endereços cadastrados (apenas para entrega)
  useEffect(() => {
    if (user && deliveryType === 'delivery') {
      // Verificar se o usuário não tem endereço
      if (!user.addresses || user.addresses.length === 0) {
        console.log('Usuário não tem endereço, redirecionando para AddAddress');
        navigate('/add-address');
        return;
      }
      
      // Verificar se o usuário não tem telefone
      if (!user.phone || user.phone.trim() === '') {
        console.log('Usuário não tem telefone, redirecionando para AddPhone');
        navigate('/add-phone');
        return;
      }
      
      // Se chegou aqui, o usuário tem endereço e telefone
      setShowAddressForm(false);
    } else if (deliveryType === 'pickup') {
      setShowAddressForm(false);
    }
  }, [user, deliveryType, navigate]);

  const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAddressForm({ ...addressForm, [e.target.name]: e.target.value });
  };

  const handleAddressSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddressLoading(true);
    try {
      await apiService.addAddress(addressForm);
      await refreshUserProfile();
      alert('Endereço cadastrado com sucesso!');
      // Redirecionar para adicionar telefone
      navigate('/add-phone');
    } catch (error) {
      alert('Erro ao cadastrar endereço!');
    }
    setAddressLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentMethod) {
      alert('Selecione uma forma de pagamento!');
      return;
    }
    setLoading(true);
    try {
      // Envie os dados do pedido para o backend
      if (!user) {
        alert('Usuário não autenticado!');
        setLoading(false);
        return;
      }
      await apiService.createOrder({
        items,
        paymentMethod, // <-- este campo é obrigatório!
        addressId: deliveryType === 'delivery' ? user.addresses?.[0]?.id : undefined,
        deliveryType,
        deliveryFee: deliveryType === 'delivery' ? deliveryFee : 0,
      });
      clearCart();
      alert('Pedido realizado com sucesso!');
      navigate('/orders');
    } catch (err: any) {
      alert('Erro ao finalizar pedido!\n' + (err?.response?.data?.message || err.message));
      
    }
    setLoading(false);
  };

  if (pixInfo) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-purple-100 py-8 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-green-600 to-emerald-600 p-8 text-center">
              <CheckCircle size={64} className="text-white mx-auto mb-4" />
              <h2 className="text-3xl font-bold text-white mb-2">Pedido Quase Finalizado!</h2>
              <p className="text-green-100 text-lg">Siga as instruções para concluir</p>
            </div>

            {/* Content */}
            <div className="p-8">
              <div className="text-center mb-8">
                <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-6 mb-6">
                  <div className="flex items-center justify-center mb-3">
                    <Smartphone size={24} className="text-yellow-600 mr-2" />
                    <span className="font-bold text-yellow-800 text-lg">IMPORTANTE!</span>
                  </div>
                  <p className="text-yellow-800 font-semibold">
                    Após o pagamento, envie a foto do comprovante para nosso WhatsApp!
                  </p>
                </div>

                <button
                  onClick={() => navigate('/orders')}
                  className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold rounded-2xl hover:from-purple-700 hover:to-pink-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
                >
                  <Package className="mr-3" size={24} />
                  Ver Meus Pedidos
                </button>

                <div className="mt-8 text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600">
                  Obrigado por comprar conosco! 💜
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Se não tem endereço, mostrar formulário de endereço
  if (showAddressForm) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-purple-100 py-8 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-8 text-center">
              <MapPin size={48} className="text-white mx-auto mb-4" />
              <h2 className="text-3xl font-bold text-white mb-2">Cadastrar Endereço</h2>
              <p className="text-purple-100">Para finalizar seu pedido, precisamos do seu endereço</p>
            </div>

            {/* Form */}
            <div className="p-8">
              <form className="space-y-6" onSubmit={handleAddressSubmit}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Rua / Avenida
                    </label>
                    <input
                      name="street"
                      value={addressForm.street}
                      onChange={handleAddressChange}
                      placeholder="Nome da rua"
                      required
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all duration-200"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Número
                    </label>
                    <input
                      name="number"
                      value={addressForm.number}
                      onChange={handleAddressChange}
                      placeholder="123"
                      required
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all duration-200"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Complemento (opcional)
                  </label>
                  <input
                    name="complement"
                    value={addressForm.complement}
                    onChange={handleAddressChange}
                    placeholder="Apartamento, bloco, etc."
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all duration-200"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Bairro
                  </label>
                  <input
                    name="neighborhood"
                    value={addressForm.neighborhood}
                    onChange={handleAddressChange}
                    placeholder="Nome do bairro"
                    required
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all duration-200"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-4 rounded-2xl font-bold hover:from-purple-700 hover:to-pink-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={addressLoading}
                >
                  {addressLoading ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2"></div>
                      Salvando Endereço...
                    </div>
                  ) : (
                    <div className="flex items-center justify-center">
                      <CheckCircle className="mr-2" size={20} />
                      Salvar Endereço
                    </div>
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-purple-100 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-8 text-center">
            <ShoppingCart size={48} className="text-white mx-auto mb-4" />
            <h2 className="text-3xl font-bold text-white mb-2">Finalizar Pedido</h2>
            <p className="text-purple-100">Revise seus itens e escolha as opções de entrega</p>
          </div>

          <div className="p-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Left Column - Options */}
              <div className="space-y-8">
                {/* Delivery Type */}
                <div className="bg-gray-50 rounded-2xl p-6">
                  <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
                    <Truck className="mr-3 text-purple-600" size={24} />
                    Tipo de Entrega
                  </h3>
                  <div className="space-y-3">
                    <label className="flex items-center p-4 border-2 border-gray-200 rounded-xl cursor-pointer hover:bg-white transition-all duration-200 has-[:checked]:border-purple-500 has-[:checked]:bg-purple-50">
                      <input
                        type="radio"
                        name="deliveryType"
                        value="delivery"
                        checked={deliveryType === 'delivery'}
                        onChange={() => setDeliveryType('delivery')}
                        className="w-5 h-5 text-purple-600 mr-4"
                      />
                      <div className="flex items-center flex-1">
                        <div className="bg-purple-100 p-2 rounded-lg mr-3">
                          <Truck size={20} className="text-purple-600" />
                        </div>
                        <div>
                          <div className="font-semibold text-gray-800">Entrega em casa</div>
                          <div className="text-sm text-gray-600">+ R$ {deliveryFee.toFixed(2)} taxa de entrega</div>
                        </div>
                      </div>
                    </label>

                    <label className="flex items-center p-4 border-2 border-gray-200 rounded-xl cursor-pointer hover:bg-white transition-all duration-200 has-[:checked]:border-green-500 has-[:checked]:bg-green-50">
                      <input
                        type="radio"
                        name="deliveryType"
                        value="pickup"
                        checked={deliveryType === 'pickup'}
                        onChange={() => setDeliveryType('pickup')}
                        className="w-5 h-5 text-green-600 mr-4"
                      />
                      <div className="flex items-center flex-1">
                        <div className="bg-green-100 p-2 rounded-lg mr-3">
                          <Store size={20} className="text-green-600" />
                        </div>
                        <div>
                          <div className="font-semibold text-gray-800">Retirada no local</div>
                          <div className="text-sm text-green-600">Sem taxa de entrega</div>
                        </div>
                      </div>
                    </label>
                  </div>
                </div>

                {/* Payment Method */}
                <div className="bg-gray-50 rounded-2xl p-6">
                  <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
                    <CreditCard className="mr-3 text-purple-600" size={24} />
                    Forma de Pagamento
                  </h3>
                  <div className="space-y-3">
                    {paymentMethods.map((method) => (
                      <label key={method.value} className="flex items-center p-4 border-2 border-gray-200 rounded-xl cursor-pointer hover:bg-white transition-all duration-200 has-[:checked]:border-purple-500 has-[:checked]:bg-purple-50">
                        <input
                          type="radio"
                          name="paymentMethod"
                          value={method.value}
                          checked={paymentMethod === method.value}
                          onChange={() => setPaymentMethod(method.value)}
                          className="w-5 h-5 text-purple-600 mr-4"
                        />
                        <div className={`bg-${method.color}-100 p-2 rounded-lg mr-3`}>
                          <div className={`text-${method.color}-600`}>
                            {method.icon}
                          </div>
                        </div>
                        <span className="font-semibold text-gray-800">{method.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right Column - Order Summary */}
              <div className="lg:sticky lg:top-8">
                <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-6 border border-gray-200">
                  <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center">
                    <Package className="mr-3 text-purple-600" size={24} />
                    Resumo do Pedido
                  </h3>

                  {/* Items List */}
                  <div className="space-y-3 mb-6">
                    {items.map((item) => (
                      <div key={item.id} className="flex justify-between items-center p-3 bg-white rounded-xl border border-gray-200">
                        <div className="flex items-center space-x-3">
                          <div className="bg-purple-100 text-purple-600 rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm">
                            {item.quantity}
                          </div>
                          <div>
                            <div className="font-semibold text-gray-800">{item.product.name}</div>
                            <div className="text-sm text-gray-500">R$ {Number(item.product.price).toFixed(2)} cada</div>
                          </div>
                        </div>
                        <div className="font-bold text-gray-800">
                          R$ {(Number(item.product.price) * item.quantity).toFixed(2)}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Totals */}
                  <div className="border-t border-gray-300 pt-4 space-y-3">
                    <div className="flex justify-between text-gray-700">
                      <span className="font-semibold">Subtotal:</span>
                      <span className="font-bold">R$ {Number(total).toFixed(2)}</span>
                    </div>
                    
                    {deliveryType === 'delivery' && (
                      <div className="flex justify-between text-gray-700">
                        <span className="font-semibold">Taxa de entrega:</span>
                        <span className="font-bold">R$ {deliveryFee.toFixed(2)}</span>
                      </div>
                    )}
                    
                    <div className="border-t border-gray-300 pt-3">
                      <div className="flex justify-between items-center">
                        <span className="text-xl font-bold text-gray-800">Total:</span>
                        <span className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600">
                          R$ {finalTotal.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    onClick={handleSubmit}
                    className="w-full mt-6 bg-gradient-to-r from-purple-600 to-pink-600 text-white py-4 rounded-2xl font-bold hover:from-purple-700 hover:to-pink-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                    disabled={loading || !paymentMethod}
                  >
                    {loading ? (
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-6 w-6 border-2 border-white border-t-transparent mr-3"></div>
                        Finalizando Pedido...
                      </div>
                    ) : (
                      <div className="flex items-center justify-center">
                        <CheckCircle className="mr-3" size={24} />
                        Finalizar Pedido - R$ {finalTotal.toFixed(2)}
                      </div>
                    )}
                  </button>

                  {!paymentMethod && (
                    <p className="text-sm text-red-600 text-center mt-2 font-medium">
                      ⚠️ Selecione uma forma de pagamento
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;