import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import apiService from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../components/NotificationProvider';

function AddPhone() {
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { refreshUserProfile } = useAuth();
  const { notify } = useNotification();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await apiService.updatePhone(phone);
      await refreshUserProfile(); // Atualizar perfil do usuário
      notify('Telefone cadastrado com sucesso!', 'success');
      navigate('/checkout'); // Voltar para o checkout
    } catch (err) {
      notify('Erro ao cadastrar telefone!', 'error');
    }
    setLoading(false);
  };

  return (
    <div className="max-w-md mx-auto mt-10 bg-white p-8 rounded-xl shadow">
      <h2 className="text-2xl font-bold mb-6 text-center">Cadastrar Telefone</h2>
      <p className="text-gray-600 mb-6 text-center">
        Para finalizar seu pedido, precisamos do seu número de telefone para contato.
      </p>
      <form className="space-y-4" onSubmit={handleSubmit}>
        <input
          name="phone"
          value={phone}
          onChange={e => setPhone(e.target.value)}
          placeholder="Telefone (ex: (99) 99999-9999)"
          required
          className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-indigo-500" />
        <button
          type="submit"
          className="w-full bg-indigo-600 text-white py-3 rounded font-semibold hover:bg-indigo-700 transition-colors"
          disabled={loading}
        >
          {loading ? 'Salvando...' : 'Salvar Telefone'}
        </button>
      </form>
    </div>
  );
}

export default AddPhone;

