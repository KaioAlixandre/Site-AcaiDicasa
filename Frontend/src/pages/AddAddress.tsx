import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import apiService from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../components/NotificationProvider';

const AddAddress: React.FC = () => {
  const [form, setForm] = useState({
    street: '',
    number: '',
    complement: '',
    neighborhood: '',
    reference: ''
  });
  const [hasNumber, setHasNumber] = useState(true);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { user, setUser } = useAuth();
  const { notify } = useNotification();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleHasNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const checked = e.target.checked;
    setHasNumber(checked);
    if (!checked) {
      setForm({ ...form, number: 'S/N' });
    } else {
      setForm({ ...form, number: '' });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Se for o primeiro endereço, definir como padrão automaticamente
      const isFirstAddress = !user?.enderecos || user.enderecos.length === 0;
      const addressData = {
        ...form,
        isDefault: isFirstAddress
      };
      const response = await apiService.addAddress(addressData);
      setUser(response.user); // Atualiza o contexto com o usuário atualizado
      notify('Endereço cadastrado com sucesso!', 'success');
      navigate('/checkout'); // Volta para o checkout, telefone já foi cadastrado no registro
    } catch (err) {
      notify('Erro ao cadastrar endereço!', 'error');
    }
    setLoading(false);
  };

  

  return (
    <div className="max-w-md mx-auto mt-10 bg-white p-8 rounded-xl shadow">
      <h2 className="text-2xl font-bold mb-6 text-center">Cadastrar Endereço</h2>
      <form className="space-y-4" onSubmit={handleSubmit}>
        <input name="street" value={form.street} onChange={handleChange} placeholder="Rua" required className="w-full px-3 py-2 border rounded" />
        <div>
          <div className="flex items-center gap-2 mb-2">
            <input
              type="checkbox"
              id="hasNumber"
              checked={hasNumber}
              onChange={handleHasNumberChange}
              className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
            />
            <label htmlFor="hasNumber" className="text-sm text-gray-700 cursor-pointer">
              Endereço possui número?
            </label>
          </div>
          <input
            name="number"
            value={form.number}
            onChange={handleChange}
            placeholder="Número"
            required={hasNumber}
            disabled={!hasNumber}
            className={`w-full px-3 py-2 border rounded ${!hasNumber ? 'bg-gray-100 cursor-not-allowed' : ''}`}
          />
        </div>
        <input name="complement" value={form.complement} onChange={handleChange} placeholder="Complemento" className="w-full px-3 py-2 border rounded" />
        <input name="neighborhood" value={form.neighborhood} onChange={handleChange} placeholder="Bairro" required className="w-full px-3 py-2 border rounded" />
        <input name="reference" value={form.reference} onChange={handleChange} placeholder="Ponto de Referência (opcional)" className="w-full px-3 py-2 border rounded" />
        <button type="submit" className="w-full bg-indigo-600 text-white py-3 rounded font-semibold hover:bg-indigo-700 transition-colors" disabled={loading}>
          {loading ? 'Salvando...' : 'Salvar Endereço'}
        </button>
      </form>
    </div>
  );
};

export default AddAddress;