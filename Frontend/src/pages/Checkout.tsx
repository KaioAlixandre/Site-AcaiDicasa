import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import apiService from '../services/api';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { AddressForm } from '../types';
import { checkStoreStatus } from '../utils/storeUtils';

const paymentMethods = [
  { label: 'Cartão de Crédito', value: 'CREDIT_CARD' },
  { label: 'PIX', value: 'PIX' },
  { label: 'Dinheiro na Entrega', value: 'CASH_ON_DELIVERY' },
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

  const deliveryFee = 5.00; // Taxa de entrega
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
    if (user && deliveryType === 'delivery' && (!user.addresses || user.addresses.length === 0)) {
      setShowAddressForm(true);
    } else if (deliveryType === 'pickup') {
      setShowAddressForm(false);
    }
  }, [user, deliveryType]);

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
      <div className="max-w-lg mx-auto mt-10 bg-white p-8 rounded-xl shadow text-center">
        <h2 className="text-2xl font-bold mb-6">Finalize seu Pedido</h2>
        <p className="mb-4">
          Para concluir sua compra, siga as instruções abaixo:
        </p>
        <div className="mb-4">
          <span className="font-semibold text-red-600">
            Após o pagamento, envie a foto do comprovante para nosso WhatsApp!
          </span>
        </div>
        <button
                onClick={() => navigate('/orders')}
                className="inline-flex items-center px-6 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors mt-4"
                >
                Ver meus pedidos
                </button>
        <div className="mt-6 text-lg font-semibold text-green-700">
          Obrigado por comprar conosco! 💜
        </div>
      </div>
    );
  }

  // Se não tem endereço, mostrar formulário de endereço
  if (showAddressForm) {
    return (
      <div className="max-w-lg mx-auto mt-10 bg-white p-8 rounded-xl shadow">
        <h2 className="text-2xl font-bold mb-6 text-center">Cadastrar Endereço</h2>
        <p className="text-gray-600 mb-6 text-center">
          Para finalizar seu pedido, precisamos do seu endereço de entrega.
        </p>
        <form className="space-y-4" onSubmit={handleAddressSubmit}>
          <input
            name="street"
            value={addressForm.street}
            onChange={handleAddressChange}
            placeholder="Rua"
            required
            className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <input
            name="number"
            value={addressForm.number}
            onChange={handleAddressChange}
            placeholder="Número"
            required
            className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <input
            name="complement"
            value={addressForm.complement}
            onChange={handleAddressChange}
            placeholder="Complemento (opcional)"
            className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <input
            name="neighborhood"
            value={addressForm.neighborhood}
            onChange={handleAddressChange}
            placeholder="Bairro"
            required
            className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <button
            type="submit"
            className="w-full bg-indigo-600 text-white py-3 rounded font-semibold hover:bg-indigo-700 transition-colors"
            disabled={addressLoading}
          >
            {addressLoading ? 'Salvando...' : 'Salvar Endereço'}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto mt-10 bg-white p-8 rounded-xl shadow">
      <h2 className="text-2xl font-bold mb-6 text-center">Finalizar Pedido</h2>
      <form className="space-y-6" onSubmit={handleSubmit}>
        <div>
          <label className="block text-lg font-semibold mb-2">Tipo de Entrega</label>
          <div className="space-y-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="deliveryType"
                value="delivery"
                checked={deliveryType === 'delivery'}
                onChange={() => setDeliveryType('delivery')}
                className="h-4 w-4"
              />
              <span>Entrega em casa</span>
              <span className="text-sm text-gray-600">(+ R$ {deliveryFee.toFixed(2)} taxa de entrega)</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="deliveryType"
                value="pickup"
                checked={deliveryType === 'pickup'}
                onChange={() => setDeliveryType('pickup')}
                className="h-4 w-4"
              />
              <span>Retirada no local</span>
              <span className="text-sm text-green-600">(sem taxa)</span>
            </label>
          </div>
        </div>

        <div>
          <label className="block text-lg font-semibold mb-2">Forma de Pagamento</label>
          <div className="space-y-2">
            {paymentMethods.map((method) => (
              <label key={method.value} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="paymentMethod"
                  value={method.value}
                  checked={paymentMethod === method.value}
                  onChange={() => setPaymentMethod(method.value)}
                  className="h-4 w-4"
                />
                {method.label}
              </label>
            ))}
          </div>
        </div>
        <div>
          <p className="text-lg font-semibold mb-2">Resumo do Pedido</p>
          <ul className="mb-2">
            {items.map(item => (
              <li key={item.id} className="flex justify-between">
                <span>{item.product.name} x {item.quantity}</span>
                <span>R$ {(Number(item.product.price) * item.quantity).toFixed(2)}</span>
              </li>
            ))}
          </ul>
          <div className="border-t pt-2">
            <div className="flex justify-between text-sm">
              <span>Subtotal:</span>
              <span>R$ {Number(total).toFixed(2)}</span>
            </div>
            {deliveryType === 'delivery' && (
              <div className="flex justify-between text-sm">
                <span>Taxa de entrega:</span>
                <span>R$ {deliveryFee.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-xl mt-2 border-t pt-2">
              <span>Total:</span>
              <span>R$ {finalTotal.toFixed(2)}</span>
            </div>
          </div>
        </div>
        <button
          type="submit"
          className="w-full bg-indigo-600 text-white py-3 rounded font-semibold hover:bg-indigo-700 transition-colors"
          disabled={loading}
        >
          {loading ? 'Finalizando...' : 'Finalizar Pedido'}
        </button>
      </form>
    </div>
  );
};

export default Checkout;