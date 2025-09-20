import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import apiService from '../services/api';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { AddressForm } from '../types';

const paymentMethods = [
  { label: 'Cartão de Crédito', value: 'CREDIT_CARD' },
  { label: 'PIX', value: 'PIX' },
  { label: 'Dinheiro na Entrega', value: 'CASH_ON_DELIVERY' },
];

const PIX_KEY = 'chave-pix@seudominio.com'; // Troque pela sua chave PIX

function formatWhatsAppMessage(order: any, user: any) {
  const itens = (order.orderItems || []).map((item: any) =>
    `• ${item.product.name} x ${item.quantity}`
  ).join('\n');
  return (
    `Olá! Gostaria de confirmar meu pedido:\n\n` +
    `Pedido Nº: ${order.id}\n` +
    `Itens:\n${itens}\n\n` +
    `Total: R$ ${Number(order.totalPrice).toFixed(2)}\n` +
    `Forma de pagamento: PIX\n` +
    `Chave PIX: ${PIX_KEY}\n\n` +
    `Após o pagamento, envio o comprovante aqui.\n\n` +
    `Obrigado!`
  );
}

function getWhatsAppLink(phone: string, message: string) {
  // Remove caracteres não numéricos do telefone
  const cleanPhone = '99996458528';
  return `https://wa.me/55${cleanPhone}?text=${encodeURIComponent(message)}`;
}

const Checkout: React.FC = () => {
  const { items, total, clearCart } = useCart();
  const { user, refreshUserProfile } = useAuth();
  const [paymentMethod, setPaymentMethod] = useState('');
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
  const navigate = useNavigate();

  // Verificar se o usuário tem endereços cadastrados
  useEffect(() => {
    if (user && (!user.addresses || user.addresses.length === 0)) {
      setShowAddressForm(true);
    }
  }, [user]);

  const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAddressForm({ ...addressForm, [e.target.name]: e.target.value });
  };

  const handleAddressSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddressLoading(true);
    try {
      await apiService.addAddress(addressForm);
      await refreshUserProfile();
      setShowAddressForm(false);
      alert('Endereço cadastrado com sucesso!');
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
      const order = await apiService.createOrder({
        items,
        paymentMethod, // <-- este campo é obrigatório!
        addressId: user.addresses?.[0]?.id,
      });
      clearCart();
      alert('Pedido realizado com sucesso!');
      if (paymentMethod === 'PIX') {
        setPixInfo(order);
      } else {
        navigate('/orders');
      }
    } catch (err: any) {
      alert('Erro ao finalizar pedido!\n' + (err?.response?.data?.message || err.message));
      
    }
    setLoading(false);
  };

  if (pixInfo) {
    const message = formatWhatsAppMessage(pixInfo, user);
    const whatsappLink = user && user.phone ? getWhatsAppLink(user.phone, message) : '#';

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
          <div className="flex justify-between font-bold text-xl">
            <span>Total:</span>
            <span>R$ {Number(total).toFixed(2)}</span>
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