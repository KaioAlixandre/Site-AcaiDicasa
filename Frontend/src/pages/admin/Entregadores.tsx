import React, { useEffect, useState } from 'react';
import apiService from '../../services/api';
import { Deliverer } from '../../types';
import { Plus, Edit, Trash2, User, Phone, Mail, ToggleLeft, ToggleRight, X } from 'lucide-react';

const Entregadores: React.FC = () => {
  const [deliverers, setDeliverers] = useState<Deliverer[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingDeliverer, setEditingDeliverer] = useState<Deliverer | null>(null);
  const [form, setForm] = useState({
    name: '',
    phone: '',
    email: ''
  });

  useEffect(() => {
    loadDeliverers();
  }, []);

  const loadDeliverers = async () => {
    try {
      setLoading(true);
      const deliverersData = await apiService.getDeliverers();
      setDeliverers(deliverersData);
    } catch (error) {
      console.error('Erro ao carregar entregadores:', error);
      alert('Erro ao carregar entregadores');
    } finally {
      setLoading(false);
    }
  };

  const openModal = (deliverer?: Deliverer) => {
    if (deliverer) {
      setEditingDeliverer(deliverer);
      setForm({
        name: deliverer.name,
        phone: deliverer.phone,
        email: deliverer.email || ''
      });
    } else {
      setEditingDeliverer(null);
      setForm({ name: '', phone: '', email: '' });
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingDeliverer(null);
    setForm({ name: '', phone: '', email: '' });
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.phone) {
      alert('Nome e telefone são obrigatórios');
      return;
    }

    try {
      if (editingDeliverer) {
        await apiService.updateDeliverer(editingDeliverer.id, form);
        alert('Entregador atualizado com sucesso!');
      } else {
        await apiService.createDeliverer(form);
        alert('Entregador cadastrado com sucesso!');
      }
      closeModal();
      loadDeliverers();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Erro ao salvar entregador');
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Tem certeza que deseja remover este entregador?')) {
      try {
        await apiService.deleteDeliverer(id);
        alert('Entregador removido com sucesso!');
        loadDeliverers();
      } catch (error: any) {
        alert(error.response?.data?.message || 'Erro ao remover entregador');
      }
    }
  };

  const handleToggleStatus = async (id: number) => {
    try {
      await apiService.toggleDelivererStatus(id);
      loadDeliverers();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Erro ao alterar status do entregador');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-gray-600">Carregando entregadores...</div>
      </div>
    );
  }

  return (
    <div id="entregadores" className="page">
      <header className="mb-8 flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-slate-800">Entregadores</h2>
          <p className="text-slate-500">Gerencie os entregadores cadastrados.</p>
        </div>
        <button 
          onClick={() => openModal()}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-semibold flex items-center gap-2 hover:bg-indigo-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Novo Entregador
        </button>
      </header>

      <div className="bg-white p-6 rounded-xl shadow-md">
        {deliverers.length === 0 ? (
          <div className="text-center py-12">
            <User className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum entregador cadastrado</h3>
            <p className="text-gray-500 mb-6">Comece adicionando o primeiro entregador ao sistema</p>
            <button 
              onClick={() => openModal()}
              className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-semibold flex items-center gap-2 hover:bg-indigo-700 transition-colors mx-auto"
            >
              <Plus className="w-4 h-4" />
              Adicionar Entregador
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="border-b border-slate-200 text-slate-500">
                <tr>
                  <th className="p-4">Nome</th>
                  <th className="p-4">Telefone</th>
                  <th className="p-4">Email</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Data de Cadastro</th>
                  <th className="p-4 text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {deliverers.map(deliverer => (
                  <tr key={deliverer.id} className="hover:bg-slate-50">
                    <td className="p-4">
                      <div className="font-medium text-slate-800">{deliverer.name}</div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-slate-400" />
                        <span className="text-slate-600">{deliverer.phone}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      {deliverer.email ? (
                        <div className="flex items-center gap-2">
                          <Mail className="w-4 h-4 text-slate-400" />
                          <span className="text-slate-600">{deliverer.email}</span>
                        </div>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>
                    <td className="p-4">
                      <button
                        onClick={() => handleToggleStatus(deliverer.id)}
                        className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                          deliverer.isActive 
                            ? 'bg-green-100 text-green-800 hover:bg-green-200' 
                            : 'bg-red-100 text-red-800 hover:bg-red-200'
                        }`}
                      >
                        {deliverer.isActive ? (
                          <>
                            <ToggleRight className="w-4 h-4" />
                            Ativo
                          </>
                        ) : (
                          <>
                            <ToggleLeft className="w-4 h-4" />
                            Inativo
                          </>
                        )}
                      </button>
                    </td>
                    <td className="p-4 text-slate-600">
                      {new Date(deliverer.createdAt).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="p-4 text-center space-x-2">
                      <button 
                        onClick={() => openModal(deliverer)}
                        className="p-2 text-slate-500 rounded-md hover:bg-slate-200 hover:text-indigo-600 transition-colors"
                        title="Editar entregador"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDelete(deliverer.id)}
                        className="p-2 text-slate-500 rounded-md hover:bg-slate-200 hover:text-red-600 transition-colors"
                        title="Remover entregador"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-slate-800">
                {editingDeliverer ? 'Editar Entregador' : 'Novo Entregador'}
              </h3>
              <button 
                onClick={closeModal}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Nome *
                </label>
                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleFormChange}
                  className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Digite o nome do entregador"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Telefone *
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={form.phone}
                  onChange={handleFormChange}
                  className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="(00) 00000-0000"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleFormChange}
                  className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="email@exemplo.com"
                />
              </div>
              
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  {editingDeliverer ? 'Salvar' : 'Cadastrar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Entregadores;