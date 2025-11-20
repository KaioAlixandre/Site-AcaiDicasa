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
  CheckCircle
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
  const [pixInfo] = useState<any>(null);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [addressForm, setAddressForm] = useState<AddressForm>({
    street: '',
    number: '',
    complement: '',
    neighborhood: '',
    isDefault: true
  });
  const [addressLoading, setAddressLoading] = useState(false);
  const [orderNotes, setOrderNotes] = useState('');
  const [promoFreteAtiva, setPromoFreteAtiva] = useState(false);
  const [promoFreteValorMinimo, setPromoFreteValorMinimo] = useState(0);
  const navigate = useNavigate();

  const deliveryFee = 3.00; // Taxa de entrega base
  
  // Calcular se tem direito ao frete grátis
  const temFreteGratis = promoFreteAtiva && total >= promoFreteValorMinimo && deliveryType === 'delivery';
  const finalTotal = deliveryType === 'delivery' ? total + (temFreteGratis ? 0 : deliveryFee) : total;

  // Verificar se a loja está aberta e se há promoção ativa
  useEffect(() => {
    const loadStoreConfig = async () => {
      try {
        const [config, promoCheck] = await Promise.all([
          apiService.getStoreConfig(),
          fetch('http://localhost:3001/api/store-config/promo-frete-check').then(r => r.json())
        ]);
        
        if (promoCheck.ativa) {
          setPromoFreteAtiva(true);
          setPromoFreteValorMinimo(promoCheck.valorMinimo);
        }
        
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
      if (!user.enderecos || user.enderecos.length === 0) {
        console.log('Usuário não tem endereço, redirecionando para AddAddress');
        navigate('/add-address');
        return;
      }
      
      // Verificar se o usuário não tem telefone
      if (!user.telefone || user.telefone.trim() === '') {
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
        addressId: deliveryType === 'delivery' ? user.enderecos?.[0]?.id : undefined,
        deliveryType,
        deliveryFee: deliveryType === 'delivery' ? deliveryFee : 0,
        notes: orderNotes.trim() || undefined, // Adiciona observações se houver
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
      <div className="min-h-screen bg-slate-50">
        <div className="max-w-2xl mx-auto px-3 sm:px-6 py-4 md:py-8">
          <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-slate-200">
            {/* Header */}
            <div className="bg-gradient-to-r from-green-600 to-emerald-600 p-4 md:p-6 text-center">
              <CheckCircle size={48} className="md:w-16 md:h-16 text-white mx-auto mb-3 md:mb-4" />
              <h2 className="text-xl md:text-3xl font-bold text-white mb-1 md:mb-2">Pedido Quase Finalizado!</h2>
              <p className="text-green-100 text-sm md:text-lg">Siga as instruções para concluir</p>
            </div>

            {/* Content */}
            <div className="p-4 md:p-6">
              <div className="text-center">
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 md:p-4 mb-4 md:mb-6">
                  <div className="flex items-center justify-center mb-2">
                    <Smartphone size={20} className="text-yellow-600 mr-2" />
                    <span className="font-bold text-yellow-800 text-sm md:text-base">IMPORTANTE!</span>
                  </div>
                  <p className="text-yellow-800 text-xs md:text-sm font-medium">
                    Após o pagamento, envie a foto do comprovante para nosso WhatsApp!
                  </p>
                </div>

                <button
                  onClick={() => navigate('/orders')}
                  className="inline-flex items-center px-5 py-2.5 md:px-6 md:py-3 bg-purple-600 text-white text-sm md:text-base font-semibold rounded-lg hover:bg-purple-700 transition-all duration-200 shadow-md hover:shadow-lg"
                >
                  <Package className="mr-2" size={18} />
                  Ver Meus Pedidos
                </button>

                <div className="mt-6 md:mt-8 text-base md:text-xl font-bold text-purple-600">
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
      <div className="min-h-screen bg-slate-50">
        <div className="max-w-2xl mx-auto px-3 sm:px-6 py-4 md:py-8">
          <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-slate-200">
            {/* Header */}
            <div className="bg-purple-600 p-4 md:p-6 text-center">
              <MapPin size={40} className="md:w-12 md:h-12 text-white mx-auto mb-2 md:mb-3" />
              <h2 className="text-xl md:text-2xl font-bold text-white mb-1">Cadastrar Endereço</h2>
              <p className="text-purple-100 text-xs md:text-sm">Para finalizar seu pedido, precisamos do seu endereço</p>
            </div>

            {/* Form */}
            <div className="p-4 md:p-6">
              <form className="space-y-3 md:space-y-4" onSubmit={handleAddressSubmit}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                  <div>
                    <label className="block text-xs md:text-sm font-semibold text-slate-700 mb-1.5">
                      Rua / Avenida
                    </label>
                    <input
                      name="street"
                      value={addressForm.street}
                      onChange={handleAddressChange}
                      placeholder="Nome da rua"
                      required
                      className="w-full px-3 py-2 md:px-4 md:py-2.5 text-sm border-2 border-slate-200 rounded-lg focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all duration-200"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-xs md:text-sm font-semibold text-slate-700 mb-1.5">
                      Número
                    </label>
                    <input
                      name="number"
                      value={addressForm.number}
                      onChange={handleAddressChange}
                      placeholder="123"
                      required
                      className="w-full px-3 py-2 md:px-4 md:py-2.5 text-sm border-2 border-slate-200 rounded-lg focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all duration-200"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs md:text-sm font-semibold text-slate-700 mb-1.5">
                    Complemento (opcional)
                  </label>
                  <input
                    name="complement"
                    value={addressForm.complement}
                    onChange={handleAddressChange}
                    placeholder="Apartamento, bloco, etc."
                    className="w-full px-3 py-2 md:px-4 md:py-2.5 text-sm border-2 border-slate-200 rounded-lg focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all duration-200"
                  />
                </div>

                <div>
                  <label className="block text-xs md:text-sm font-semibold text-slate-700 mb-1.5">
                    Bairro
                  </label>
                  <input
                    name="neighborhood"
                    value={addressForm.neighborhood}
                    onChange={handleAddressChange}
                    placeholder="Nome do bairro"
                    required
                    className="w-full px-3 py-2 md:px-4 md:py-2.5 text-sm border-2 border-slate-200 rounded-lg focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all duration-200"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-purple-600 text-white py-2.5 md:py-3 rounded-lg text-sm md:text-base font-semibold hover:bg-purple-700 transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={addressLoading}
                >
                  {addressLoading ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                      Salvando...
                    </div>
                  ) : (
                    <div className="flex items-center justify-center">
                      <CheckCircle className="mr-2" size={16} />
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
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-4xl mx-auto px-3 sm:px-6 py-4 md:py-8">
        {/* Banner de Promoção */}
        {promoFreteAtiva && deliveryType === 'delivery' && (
          <div className="mb-4 bg-gradient-to-r from-emerald-500 to-green-600 rounded-xl shadow-lg p-4 text-white">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-2 rounded-lg">
                <Truck className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-lg">Promoção de Frete Grátis Hoje!</h3>
                <p className="text-sm text-emerald-50">
                  Pedidos acima de <strong>R$ {promoFreteValorMinimo.toFixed(2)}</strong> ganham frete grátis!
                  {total >= promoFreteValorMinimo ? (
                    <span className="ml-2 bg-white/30 px-2 py-0.5 rounded-full text-xs font-semibold">
                      ✓ Você conseguiu!
                    </span>
                  ) : (
                    <span className="ml-2 text-xs">
                      Faltam apenas R$ {(promoFreteValorMinimo - total).toFixed(2)}
                    </span>
                  )}
                </p>
              </div>
            </div>
          </div>
        )}
        
        <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-slate-200">
          <div className="p-4 md:p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
              {/* Left Column - Options */}
              <div className="space-y-4 md:space-y-6">
                {/* Delivery Type */}
                <div className="bg-slate-50 rounded-lg border border-slate-200 p-3 md:p-4">
                  <h3 className="text-base md:text-lg font-bold text-slate-900 mb-3 flex items-center">
                    <Truck className="mr-2 text-purple-600" size={20} />
                    Tipo de Entrega
                  </h3>
                  <div className="space-y-2">
                    <label className="flex items-center p-2.5 md:p-3 border-2 border-slate-200 rounded-lg cursor-pointer hover:bg-white transition-all duration-200 has-[:checked]:border-purple-500 has-[:checked]:bg-purple-50">
                      <input
                        type="radio"
                        name="deliveryType"
                        value="delivery"
                        checked={deliveryType === 'delivery'}
                        onChange={() => setDeliveryType('delivery')}
                        className="w-4 h-4 text-purple-600 mr-2 md:mr-3"
                      />
                      <div className="flex items-center flex-1">
                        <div className="bg-purple-100 p-1.5 md:p-2 rounded-lg mr-2 md:mr-3">
                          <Truck size={16} className="md:w-5 md:h-5 text-purple-600" />
                        </div>
                        <div className="flex-1">
                          <div className="text-sm md:text-base font-semibold text-slate-900">Entrega em casa</div>
                          <div className="text-xs md:text-sm text-slate-600">+ R$ {deliveryFee.toFixed(2)} taxa de entrega</div>
                        </div>
                      </div>
                    </label>

                    <label className="flex items-center p-2.5 md:p-3 border-2 border-slate-200 rounded-lg cursor-pointer hover:bg-white transition-all duration-200 has-[:checked]:border-green-500 has-[:checked]:bg-green-50">
                      <input
                        type="radio"
                        name="deliveryType"
                        value="pickup"
                        checked={deliveryType === 'pickup'}
                        onChange={() => setDeliveryType('pickup')}
                        className="w-4 h-4 text-green-600 mr-2 md:mr-3"
                      />
                      <div className="flex items-center flex-1">
                        <div className="bg-green-100 p-1.5 md:p-2 rounded-lg mr-2 md:mr-3">
                          <Store size={16} className="md:w-5 md:h-5 text-green-600" />
                        </div>
                        <div className="flex-1">
                          <div className="text-sm md:text-base font-semibold text-slate-900">Retirada no local</div>
                          <div className="text-xs md:text-sm text-green-600">Sem taxa de entrega</div>
                        </div>
                      </div>
                    </label>
                  </div>
                </div>

                {/* Payment Method */}
                <div className="bg-slate-50 rounded-lg border border-slate-200 p-3 md:p-4">
                  <h3 className="text-base md:text-lg font-bold text-slate-900 mb-3 flex items-center">
                    <CreditCard className="mr-2 text-purple-600" size={20} />
                    Forma de Pagamento
                  </h3>
                  <div className="space-y-2">
                    {paymentMethods.map((method) => (
                      <label key={method.value} className="flex items-center p-2.5 md:p-3 border-2 border-slate-200 rounded-lg cursor-pointer hover:bg-white transition-all duration-200 has-[:checked]:border-purple-500 has-[:checked]:bg-purple-50">
                        <input
                          type="radio"
                          name="paymentMethod"
                          value={method.value}
                          checked={paymentMethod === method.value}
                          onChange={() => setPaymentMethod(method.value)}
                          className="w-4 h-4 text-purple-600 mr-2 md:mr-3"
                        />
                        <div className="text-purple-600 mr-2">{method.icon}</div>
                        <span className="text-sm md:text-base font-semibold text-slate-900">{method.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right Column - Order Summary */}
              <div className="lg:sticky lg:top-8">
                <div className="bg-slate-50 rounded-lg p-3 md:p-4 border border-slate-200">
                  <h3 className="text-base md:text-lg font-bold text-slate-900 mb-3 md:mb-4 flex items-center">
                    <Package className="mr-2 text-purple-600" size={20} />
                    Resumo do Pedido
                  </h3>

                  {/* Items List */}
                  <div className="space-y-2 mb-3 md:mb-4">
                    {items.map((item) => (
                      <div key={item.id} className="flex justify-between items-center p-2 md:p-2.5 bg-white rounded-lg border border-slate-200">
                        <div className="flex items-center space-x-2">
                          <div className="bg-purple-100 text-purple-600 rounded-full w-6 h-6 md:w-7 md:h-7 flex items-center justify-center font-bold text-xs">
                            {item.quantity}
                          </div>
                          <div>
                            <div className="text-xs md:text-sm font-semibold text-slate-900">{item.product.name}</div>
                            <div className="text-[10px] md:text-xs text-slate-600">R$ {Number(item.product.price).toFixed(2)} cada</div>
                          </div>
                        </div>
                        <div className="text-xs md:text-sm font-bold text-slate-900">
                          R$ {(Number(item.product.price) * item.quantity).toFixed(2)}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Totals */}
                  <div className="border-t border-slate-300 pt-2 md:pt-3 space-y-1.5 md:space-y-2">
                    <div className="flex justify-between text-slate-700 text-xs md:text-sm">
                      <span className="font-semibold">Subtotal:</span>
                      <span className="font-bold">R$ {Number(total).toFixed(2)}</span>
                    </div>
                    
                    {deliveryType === 'delivery' && (
                      <div className="flex justify-between text-slate-700 text-xs md:text-sm">
                        <span className="font-semibold">Taxa de entrega:</span>
                        {temFreteGratis ? (
                          <span className="font-bold text-emerald-600">
                            <span className="line-through text-slate-400 text-xs mr-1">R$ {deliveryFee.toFixed(2)}</span>
                            GRÁTIS!
                          </span>
                        ) : (
                          <span className="font-bold">R$ {deliveryFee.toFixed(2)}</span>
                        )}
                      </div>
                    )}
                    
                    <div className="border-t border-slate-300 pt-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm md:text-base font-bold text-slate-900">Total:</span>
                        <span className="text-base md:text-xl font-bold text-purple-600">
                          R$ {finalTotal.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Observações do Pedido */}
                  <div className="border-t border-slate-300 pt-3 md:pt-4">
                    <label className="block text-xs md:text-sm font-semibold text-slate-700 mb-2">
                      Observações do Pedido (opcional)
                    </label>
                    <textarea
                      value={orderNotes}
                      onChange={(e) => setOrderNotes(e.target.value)}
                      placeholder="Ex: Remover algum ingrediente, preferências, etc."
                      maxLength={500}
                      rows={3}
                      className="w-full px-3 py-2 md:px-4 md:py-2.5 text-xs md:text-sm border-2 border-slate-200 rounded-lg focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all duration-200 resize-none"
                    />
                    <div className="text-[10px] md:text-xs text-slate-500 mt-1 text-right">
                      {orderNotes.length}/500 caracteres
                    </div>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    onClick={handleSubmit}
                    className="w-full mt-3 md:mt-4 bg-purple-600 text-white py-2.5 md:py-3 rounded-lg text-sm md:text-base font-semibold hover:bg-purple-700 transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={loading || !paymentMethod}
                  >
                    {loading ? (
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-4 w-4 md:h-5 md:w-5 border-2 border-white border-t-transparent mr-2"></div>
                        Finalizando...
                      </div>
                    ) : (
                      <div className="flex items-center justify-center">
                        <CheckCircle className="mr-2" size={18} />
                        Finalizar Pedido - R$ {finalTotal.toFixed(2)}
                      </div>
                    )}
                  </button>

                  {!paymentMethod && (
                    <p className="text-xs md:text-sm text-red-600 text-center mt-2 font-medium">
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