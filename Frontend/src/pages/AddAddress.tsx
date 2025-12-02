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
    neighborhood: ''
  });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { user, setUser } = useAuth();
  const { notify } = useNotification();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await apiService.addAddress(form);
      setUser(response.user); // Atualiza o contexto com o usuário atualizado
      notify('Endereço cadastrado com sucesso!', 'success');
      navigate('/add-phone'); // Redireciona para a página de adicionar telefone após adicionar endereço
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
        <input name="number" value={form.number} onChange={handleChange} placeholder="Número" required className="w-full px-3 py-2 border rounded" />
        <input name="complement" value={form.complement} onChange={handleChange} placeholder="Complemento" className="w-full px-3 py-2 border rounded" />
        <input name="neighborhood" value={form.neighborhood} onChange={handleChange} placeholder="Bairro" required className="w-full px-3 py-2 border rounded" />
        <button type="submit" className="w-full bg-indigo-600 text-white py-3 rounded font-semibold hover:bg-indigo-700 transition-colors" disabled={loading}>
          {loading ? 'Salvando...' : 'Salvar Endereço'}
        </button>
      </form>
    </div>
  );
};

export default AddAddress;