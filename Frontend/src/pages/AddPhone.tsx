import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import apiService from '../services/api';

const AddPhone: React.FC = () => {
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await apiService.updatePhone(phone); // Implemente esse método no seu serviço API
      alert('Telefone cadastrado com sucesso!');
      navigate('/checkout'); // Ou para onde desejar após cadastro
    } catch (err) {
      alert('Erro ao cadastrar telefone!');
    }
    setLoading(false);
  };

  return (
    <div className="max-w-md mx-auto mt-10 bg-white p-8 rounded-xl shadow">
      <h2 className="text-2xl font-bold mb-6 text-center">Cadastrar Telefone</h2>
      <form className="space-y-4" onSubmit={handleSubmit}>
        <input
          name="phone"
          value={phone}
          onChange={e => setPhone(e.target.value)}
          placeholder="Telefone (ex: (99) 99999-9999)"
          required
          className="w-full px-3 py-2 border rounded"
        />
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
};

export default AddPhone;

// Removido exemplo de uso de 'user' pois não está definido neste arquivo.
// Se necessário, obtenha o usuário do contexto ou props antes de acessar seus endereços.

