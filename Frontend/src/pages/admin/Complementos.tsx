import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Edit, 
  Trash2, 
  ToggleLeft, 
  ToggleRight, 
  Search, 
  Filter,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  X,
  Save,
  Eye,
  EyeOff
} from 'lucide-react';
import apiService from '../../services/api';

interface Complement {
  id: number;
  name: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface ComplementFormData {
  name: string;
  isActive: boolean;
}

const Complementos: React.FC = () => {
  const [complements, setComplements] = useState<Complement[]>([]);
  const [filteredComplements, setFilteredComplements] = useState<Complement[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterActive, setFilterActive] = useState<'all' | 'active' | 'inactive'>('all');
  const [showModal, setShowModal] = useState(false);
  const [editingComplement, setEditingComplement] = useState<Complement | null>(null);
  const [formData, setFormData] = useState<ComplementFormData>({
    name: '',
    isActive: true
  });
  const [formLoading, setFormLoading] = useState(false);
  const [showInactive, setShowInactive] = useState(false);

  // Carregar complementos
  const loadComplements = async () => {
    try {
      setLoading(true);
      const data = await apiService.getComplements(showInactive);
      setComplements(data);
    } catch (error) {
      console.error('Erro ao carregar complementos:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filtrar complementos
  useEffect(() => {
    let filtered = complements;

    // Filtro por busca
    if (searchTerm.trim()) {
      filtered = filtered.filter(complement =>
        complement.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filtro por status
    if (filterActive !== 'all') {
      filtered = filtered.filter(complement =>
        filterActive === 'active' ? complement.isActive : !complement.isActive
      );
    }

    setFilteredComplements(filtered);
  }, [complements, searchTerm, filterActive]);

  // Carregar dados ao montar o componente
  useEffect(() => {
    loadComplements();
  }, [showInactive]);

  // Reset do formulário
  const resetForm = () => {
    setFormData({ name: '', isActive: true });
    setEditingComplement(null);
    setShowModal(false);
  };

  // Abrir modal para criar
  const handleCreate = () => {
    resetForm();
    setShowModal(true);
  };

  // Abrir modal para editar
  const handleEdit = (complement: Complement) => {
    setEditingComplement(complement);
    setFormData({
      name: complement.name,
      isActive: complement.isActive
    });
    setShowModal(true);
  };

  // Salvar complemento (criar ou editar)
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      alert('Nome do complemento é obrigatório!');
      return;
    }

    try {
      setFormLoading(true);
      
      if (editingComplement) {
        // Atualizar
        await apiService.updateComplement(editingComplement.id, formData);
      } else {
        // Criar
        await apiService.createComplement(formData);
      }

      await loadComplements();
      resetForm();
      alert(`Complemento ${editingComplement ? 'atualizado' : 'criado'} com sucesso!`);
    } catch (error: any) {
      console.error('Erro ao salvar complemento:', error);
      const message = error.response?.data?.message || 'Erro ao salvar complemento';
      alert(message);
    } finally {
      setFormLoading(false);
    }
  };

  // Alternar status ativo/inativo
  const handleToggleStatus = async (complement: Complement) => {
    try {
      await apiService.toggleComplementStatus(complement.id);
      await loadComplements();
    } catch (error) {
      console.error('Erro ao alterar status:', error);
      alert('Erro ao alterar status do complemento');
    }
  };

  // Deletar complemento
  const handleDelete = async (complement: Complement) => {
    if (!window.confirm(`Tem certeza que deseja deletar o complemento "${complement.name}"? Esta ação não pode ser desfeita.`)) {
      return;
    }

    try {
      await apiService.deleteComplement(complement.id);
      await loadComplements();
      alert('Complemento deletado com sucesso!');
    } catch (error) {
      console.error('Erro ao deletar complemento:', error);
      alert('Erro ao deletar complemento');
    }
  };

  // Formatar data
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Complementos</h1>
            <p className="text-gray-600">Gerencie os complementos disponíveis para os açaís</p>
          </div>
          <button
            onClick={handleCreate}
            className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-xl font-semibold hover:from-purple-700 hover:to-pink-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1 flex items-center space-x-2"
          >
            <Plus size={20} />
            <span>Novo Complemento</span>
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-4 rounded-xl shadow-lg">
            <div className="text-2xl font-bold">{complements.length}</div>
            <div className="text-blue-100">Total</div>
          </div>
          <div className="bg-gradient-to-r from-green-500 to-green-600 text-white p-4 rounded-xl shadow-lg">
            <div className="text-2xl font-bold">{complements.filter(c => c.isActive).length}</div>
            <div className="text-green-100">Ativos</div>
          </div>
          <div className="bg-gradient-to-r from-red-500 to-red-600 text-white p-4 rounded-xl shadow-lg">
            <div className="text-2xl font-bold">{complements.filter(c => !c.isActive).length}</div>
            <div className="text-red-100">Inativos</div>
          </div>
          <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white p-4 rounded-xl shadow-lg">
            <div className="text-2xl font-bold">{filteredComplements.length}</div>
            <div className="text-purple-100">Filtrados</div>
          </div>
        </div>

        {/* Filtros e Busca */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Busca */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Buscar complementos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:outline-none transition-colors"
                />
              </div>
            </div>

            {/* Filtro por Status */}
            <div className="flex items-center space-x-2">
              <Filter className="text-gray-500" size={20} />
              <select
                value={filterActive}
                onChange={(e) => setFilterActive(e.target.value as 'all' | 'active' | 'inactive')}
                className="px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:outline-none"
              >
                <option value="all">Todos</option>
                <option value="active">Apenas Ativos</option>
                <option value="inactive">Apenas Inativos</option>
              </select>
            </div>

            {/* Toggle Mostrar Inativos */}
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowInactive(!showInactive)}
                className={`flex items-center space-x-2 px-4 py-3 rounded-xl font-medium transition-all ${
                  showInactive 
                    ? 'bg-purple-100 text-purple-700 border-2 border-purple-300' 
                    : 'bg-gray-100 text-gray-600 border-2 border-gray-200'
                }`}
              >
                {showInactive ? <Eye size={20} /> : <EyeOff size={20} />}
                <span>Mostrar Inativos</span>
              </button>
            </div>

            {/* Refresh */}
            <button
              onClick={loadComplements}
              className="px-4 py-3 bg-gray-100 text-gray-600 rounded-xl hover:bg-gray-200 transition-colors flex items-center space-x-2"
              disabled={loading}
            >
              <RefreshCw className={loading ? 'animate-spin' : ''} size={20} />
              <span>Atualizar</span>
            </button>
          </div>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-500 border-t-transparent"></div>
        </div>
      )}

      {/* Lista de Complementos */}
      {!loading && (
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          {filteredComplements.length === 0 ? (
            <div className="p-12 text-center">
              <AlertCircle className="mx-auto text-gray-400 mb-4" size={48} />
              <h3 className="text-xl font-semibold text-gray-600 mb-2">Nenhum complemento encontrado</h3>
              <p className="text-gray-500">
                {searchTerm || filterActive !== 'all' 
                  ? 'Tente ajustar os filtros de busca'
                  : 'Comece criando seu primeiro complemento'
                }
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Nome
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Criado em
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Atualizado em
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredComplements.map((complement) => (
                    <tr key={complement.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{complement.name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                          complement.isActive 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {complement.isActive ? (
                            <>
                              <CheckCircle size={12} className="mr-1" />
                              Ativo
                            </>
                          ) : (
                            <>
                              <X size={12} className="mr-1" />
                              Inativo
                            </>
                          )}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(complement.createdAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(complement.updatedAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleEdit(complement)}
                            className="text-blue-600 hover:text-blue-900 p-2 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Editar"
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            onClick={() => handleToggleStatus(complement)}
                            className={`p-2 rounded-lg transition-colors ${
                              complement.isActive 
                                ? 'text-orange-600 hover:text-orange-900 hover:bg-orange-50' 
                                : 'text-green-600 hover:text-green-900 hover:bg-green-50'
                            }`}
                            title={complement.isActive ? 'Desativar' : 'Ativar'}
                          >
                            {complement.isActive ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
                          </button>
                          <button
                            onClick={() => handleDelete(complement)}
                            className="text-red-600 hover:text-red-900 p-2 hover:bg-red-50 rounded-lg transition-colors"
                            title="Deletar"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Modal de Criação/Edição */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">
                  {editingComplement ? 'Editar Complemento' : 'Novo Complemento'}
                </h2>
                <button
                  onClick={resetForm}
                  className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleSave} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nome do Complemento *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Ex: Morango, Banana, Granola..."
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:outline-none transition-colors"
                    required
                    maxLength={100}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Máximo 100 caracteres ({formData.name.length}/100)
                  </p>
                </div>

                <div>
                  <label className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={formData.isActive}
                      onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                      className="w-5 h-5 text-purple-600 rounded focus:ring-purple-500"
                    />
                    <span className="text-sm font-medium text-gray-700">Complemento ativo</span>
                  </label>
                  <p className="text-xs text-gray-500 mt-1">
                    Complementos inativos não aparecerão para os clientes
                  </p>
                </div>

                <div className="flex space-x-4">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="flex-1 px-4 py-3 border-2 border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={formLoading}
                    className="flex-1 px-4 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all duration-300 font-semibold flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {formLoading ? (
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                    ) : (
                      <>
                        <Save size={16} />
                        <span>{editingComplement ? 'Atualizar' : 'Criar'}</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Complementos;