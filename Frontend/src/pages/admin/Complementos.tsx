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
  imageUrl?: string;
  isActive: boolean;
  categoryId?: number | null;
  category?: {
    id: number;
    name: string;
  } | null;
  createdAt: string;
  updatedAt: string;
}

interface ComplementCategory {
  id: number;
  name: string;
  complementsCount?: number;
}

interface ComplementFormData {
  name: string;
  isActive: boolean;
  categoryId?: number | null;
  image?: File;
}

const Complementos: React.FC = () => {
  const [complements, setComplements] = useState<Complement[]>([]);
  const [categories, setCategories] = useState<ComplementCategory[]>([]);
  const [filteredComplements, setFilteredComplements] = useState<Complement[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterActive, setFilterActive] = useState<'all' | 'active' | 'inactive'>('all');
  const [showModal, setShowModal] = useState(false);
  const [editingComplement, setEditingComplement] = useState<Complement | null>(null);
  const [formData, setFormData] = useState<ComplementFormData>({
    name: '',
    isActive: true,
    categoryId: null
  });
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  const [showInactive, setShowInactive] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  // Carregar categorias
  const loadCategories = async () => {
    try {
      const data = await apiService.getComplementCategories();
      setCategories(data);
    } catch (error) {
      console.error('Erro ao carregar categorias:', error);
    }
  };

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
    loadCategories();
  }, [showInactive]);

  // Reset do formulário
  const resetForm = () => {
    setFormData({ name: '', isActive: true, categoryId: null });
    setImagePreview(null);
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
      isActive: complement.isActive,
      categoryId: complement.categoryId || null
    });
    setImagePreview(complement.imageUrl ? complement.imageUrl : null);
    setShowModal(true);
  };

  // Manipular seleção de imagem
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData({ ...formData, image: file });
      
      // Criar preview da imagem
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Remover imagem
  const handleRemoveImage = () => {
    setFormData({ ...formData, image: undefined });
    setImagePreview(null);
    
    // Limpar o input de arquivo
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  };

  // Salvar complemento (criar ou editar) - envia como FormData para Cloudinary
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      alert('Nome do complemento é obrigatório!');
      return;
    }
    try {
      setFormLoading(true);
      const dataToSend = {
        name: formData.name,
        isActive: formData.isActive,
        categoryId: formData.categoryId,
        image: formData.image
      };
      
      if (editingComplement) {
        await apiService.updateComplement(editingComplement.id, dataToSend);
      } else {
        await apiService.createComplement(dataToSend);
      }
      await loadComplements();
      resetForm();
      alert(`Complemento ${editingComplement ? 'atualizado' : 'criado'} com sucesso!`);
    } catch (error: any) {
      console.error('Erro ao salvar complemento:', error);
      const message = error?.response?.data?.message || 'Erro ao salvar complemento';
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

  // Criar nova categoria
  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newCategoryName.trim()) {
      alert('Nome da categoria é obrigatório!');
      return;
    }

    try {
      await apiService.createComplementCategory(newCategoryName.trim());
      await loadCategories();
      setNewCategoryName('');
      setShowCategoryModal(false);
      setShowModal(true);
      alert('Categoria criada com sucesso!');
    } catch (error: any) {
      console.error('Erro ao criar categoria:', error);
      const message = error.response?.data?.message || 'Erro ao criar categoria';
      alert(message);
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
    <div className="p-3 sm:p-4">
      {/* Header */}
      <div className="mb-4 sm:mb-6">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-4">
          <div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-800">Complementos</h1>
            <p className="text-xs sm:text-sm text-gray-600">Gerencie os complementos disponíveis</p>
          </div>
          <button
            onClick={handleCreate}
            className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-xl font-semibold hover:from-purple-700 hover:to-pink-700 transition-all duration-300 shadow-lg hover:shadow-xl flex items-center justify-center gap-2 text-sm sm:text-base"
          >
            <Plus size={18} className="sm:w-5 sm:h-5" />
            <span>Novo Complemento</span>
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 mb-4 sm:mb-6">
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-3 sm:p-4 rounded-lg sm:rounded-xl shadow-lg">
            <div className="text-lg sm:text-xl md:text-2xl font-bold">{complements.length}</div>
            <div className="text-xs sm:text-sm text-blue-100">Total</div>
          </div>
          <div className="bg-gradient-to-r from-green-500 to-green-600 text-white p-3 sm:p-4 rounded-lg sm:rounded-xl shadow-lg">
            <div className="text-lg sm:text-xl md:text-2xl font-bold">{complements.filter(c => c.isActive).length}</div>
            <div className="text-xs sm:text-sm text-green-100">Ativos</div>
          </div>
          <div className="bg-gradient-to-r from-red-500 to-red-600 text-white p-3 sm:p-4 rounded-lg sm:rounded-xl shadow-lg">
            <div className="text-lg sm:text-xl md:text-2xl font-bold">{complements.filter(c => !c.isActive).length}</div>
            <div className="text-xs sm:text-sm text-red-100">Inativos</div>
          </div>
          <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white p-3 sm:p-4 rounded-lg sm:rounded-xl shadow-lg">
            <div className="text-lg sm:text-xl md:text-2xl font-bold">{filteredComplements.length}</div>
            <div className="text-xs sm:text-sm text-purple-100">Filtrados</div>
          </div>
        </div>

        {/* Filtros e Busca */}
        <div className="bg-white rounded-lg sm:rounded-xl shadow-lg p-3 sm:p-4 md:p-6 mb-4 sm:mb-6">
          <div className="flex flex-col gap-2 sm:gap-3">
            {/* Busca */}
            <div className="w-full">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  placeholder="Buscar..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 sm:py-2.5 text-sm border-2 border-gray-200 rounded-lg sm:rounded-xl focus:border-purple-500 focus:outline-none transition-colors"
                />
              </div>
            </div>

            {/* Linha de filtros */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {/* Filtro por Status */}
              <div className="flex items-center gap-2">
                <Filter className="text-gray-500 hidden sm:block" size={18} />
                <select
                  value={filterActive}
                  onChange={(e) => setFilterActive(e.target.value as 'all' | 'active' | 'inactive')}
                  className="w-full px-3 py-2 text-sm border-2 border-gray-200 rounded-lg sm:rounded-xl focus:border-purple-500 focus:outline-none"
                >
                  <option value="all">Todos</option>
                  <option value="active">Apenas Ativos</option>
                  <option value="inactive">Apenas Inativos</option>
                </select>
              </div>

              {/* Toggle Mostrar Inativos */}
              <button
                onClick={() => setShowInactive(!showInactive)}
                className={`flex items-center justify-center gap-2 px-3 py-2 rounded-lg sm:rounded-xl font-medium transition-all text-sm ${
                  showInactive 
                    ? 'bg-purple-100 text-purple-700 border-2 border-purple-300' 
                    : 'bg-gray-100 text-gray-600 border-2 border-gray-200'
                }`}
              >
                {showInactive ? <Eye size={16} /> : <EyeOff size={16} />}
                <span className="hidden sm:inline">Mostrar Inativos</span>
                <span className="sm:hidden">Inativos</span>
              </button>

              {/* Refresh */}
              <button
                onClick={loadComplements}
                className="px-3 py-2 bg-gray-100 text-gray-600 rounded-lg sm:rounded-xl hover:bg-gray-200 transition-colors flex items-center justify-center gap-2 text-sm"
                disabled={loading}
              >
                <RefreshCw className={loading ? 'animate-spin' : ''} size={16} />
                <span>Atualizar</span>
              </button>
            </div>
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
        <div className="bg-white rounded-lg sm:rounded-xl shadow-lg overflow-hidden">
          {filteredComplements.length === 0 ? (
            <div className="p-6 sm:p-12 text-center">
              <AlertCircle className="mx-auto text-gray-400 mb-3 sm:mb-4" size={36} />
              <h3 className="text-base sm:text-xl font-semibold text-gray-600 mb-2">Nenhum complemento encontrado</h3>
              <p className="text-xs sm:text-sm text-gray-500">
                {searchTerm || filterActive !== 'all' 
                  ? 'Tente ajustar os filtros de busca'
                  : 'Comece criando seu primeiro complemento'
                }
              </p>
            </div>
          ) : (
            <>
              {/* Versão Desktop - Tabela */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Imagem
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Nome
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Categoria
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Criado em
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Ações
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredComplements.map((complement) => (
                      <tr key={complement.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 whitespace-nowrap">
                          {complement.imageUrl ? (
                            <img 
                              src={complement.imageUrl}
                              alt={complement.name}
                              className="w-12 h-12 object-cover rounded-lg border border-gray-200"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.style.display = 'none';
                                target.parentElement!.innerHTML = '<div class="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center"><span class="text-gray-400 text-xs">Erro</span></div>';
                              }}
                            />
                          ) : (
                            <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center">
                              <span className="text-gray-400 text-xs">Sem img</span>
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{complement.name}</div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          {complement.category ? (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                              {complement.category.name}
                            </span>
                          ) : (
                            <span className="text-xs text-gray-400 italic">Sem categoria</span>
                          )}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
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
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(complement.createdAt)}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleEdit(complement)}
                              className="text-blue-600 hover:text-blue-900 p-1.5 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Editar"
                            >
                              <Edit size={16} />
                            </button>
                            <button
                              onClick={() => handleToggleStatus(complement)}
                              className={`p-1.5 rounded-lg transition-colors ${
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
                              className="text-red-600 hover:text-red-900 p-1.5 hover:bg-red-50 rounded-lg transition-colors"
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

              {/* Versão Mobile - Cards */}
              <div className="md:hidden divide-y divide-gray-200">
                {filteredComplements.map((complement) => (
                  <div key={complement.id} className="p-3 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start gap-3 mb-2">
                      {complement.imageUrl ? (
                        <img 
                          src={complement.imageUrl}
                          alt={complement.name}
                          className="w-16 h-16 object-cover rounded-lg flex-shrink-0 border border-gray-200"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                            target.parentElement!.innerHTML = '<div class="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center flex-shrink-0"><span class="text-gray-400 text-xs text-center">Erro ao carregar</span></div>';
                          }}
                        />
                      ) : (
                        <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center flex-shrink-0">
                          <span className="text-gray-400 text-xs text-center">Sem imagem</span>
                        </div>
                      )}
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900 text-sm mb-1">{complement.name}</h3>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                            complement.isActive 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {complement.isActive ? (
                              <>
                                <CheckCircle size={10} className="mr-1" />
                                Ativo
                              </>
                            ) : (
                              <>
                                <X size={10} className="mr-1" />
                                Inativo
                              </>
                            )}
                          </span>
                          {complement.category && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                              {complement.category.name}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-xs text-gray-500 space-y-1 mb-3">
                      <div>Criado: {formatDate(complement.createdAt)}</div>
                      {complement.category ? (
                        <div>Categoria: {complement.category.name}</div>
                      ) : (
                        <div className="italic text-gray-400">Sem categoria</div>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEdit(complement)}
                        className="flex-1 text-blue-600 hover:text-blue-900 p-2 hover:bg-blue-50 rounded-lg transition-colors flex items-center justify-center gap-1 text-xs font-medium"
                      >
                        <Edit size={14} />
                        <span>Editar</span>
                      </button>
                      <button
                        onClick={() => handleToggleStatus(complement)}
                        className={`flex-1 p-2 rounded-lg transition-colors flex items-center justify-center gap-1 text-xs font-medium ${
                          complement.isActive 
                            ? 'text-orange-600 hover:text-orange-900 hover:bg-orange-50' 
                            : 'text-green-600 hover:text-green-900 hover:bg-green-50'
                        }`}
                      >
                        {complement.isActive ? <ToggleRight size={14} /> : <ToggleLeft size={14} />}
                        <span>{complement.isActive ? 'Desativar' : 'Ativar'}</span>
                      </button>
                      <button
                        onClick={() => handleDelete(complement)}
                        className="flex-1 text-red-600 hover:text-red-900 p-2 hover:bg-red-50 rounded-lg transition-colors flex items-center justify-center gap-1 text-xs font-medium"
                      >
                        <Trash2 size={14} />
                        <span>Deletar</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* Modal de Nova Categoria */}
      {showCategoryModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-3 sm:p-4">
          <div className="bg-white rounded-xl sm:rounded-2xl shadow-2xl w-full max-w-md">
            <div className="p-4 sm:p-6">
              <div className="flex justify-between items-center mb-4 sm:mb-6">
                <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-800">
                  Nova Categoria de Complemento
                </h2>
                <button
                  onClick={() => {
                    setShowCategoryModal(false);
                    setShowModal(true);
                    setNewCategoryName('');
                  }}
                  className="text-gray-400 hover:text-gray-600 p-1.5 sm:p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X size={20} className="sm:w-6 sm:h-6" />
                </button>
              </div>

              <form onSubmit={handleCreateCategory} className="space-y-4 sm:space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nome da Categoria *
                  </label>
                  <input
                    type="text"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    placeholder="Ex: Frutas, Granolas, Cremes..."
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:outline-none transition-colors"
                    required
                    maxLength={100}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Máximo 100 caracteres ({newCategoryName.length}/100)
                  </p>
                </div>

                <div className="flex space-x-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCategoryModal(false);
                      setShowModal(true);
                      setNewCategoryName('');
                    }}
                    className="flex-1 px-4 py-3 border-2 border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all duration-300 font-semibold flex items-center justify-center space-x-2"
                  >
                    <Save size={16} />
                    <span>Criar</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Criação/Edição */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-3 sm:p-4">
          <div className="bg-white rounded-xl sm:rounded-2xl shadow-2xl w-full max-w-md">
            <div className="p-4 sm:p-6">
              <div className="flex justify-between items-center mb-4 sm:mb-6">
                <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-800">
                  {editingComplement ? 'Editar Complemento' : 'Novo Complemento'}
                </h2>
                <button
                  onClick={resetForm}
                  className="text-gray-400 hover:text-gray-600 p-1.5 sm:p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X size={20} className="sm:w-6 sm:h-6" />
                </button>
              </div>

              <form onSubmit={handleSave} className="space-y-4 sm:space-y-6">
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
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Categoria do Complemento
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setShowModal(false);
                        setShowCategoryModal(true);
                      }}
                      className="text-purple-600 hover:text-purple-700 text-xs font-medium flex items-center gap-1"
                    >
                      <Plus size={14} />
                      Nova Categoria
                    </button>
                  </div>
                  <select
                    value={formData.categoryId || ''}
                    onChange={(e) => setFormData({ ...formData, categoryId: e.target.value ? parseInt(e.target.value) : null })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:outline-none transition-colors bg-white"
                  >
                    <option value="">Sem categoria</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    Categorias ajudam a organizar os complementos
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Imagem do Complemento
                  </label>
                  {imagePreview && (
                    <div className="mb-3 relative group">
                      <img 
                        src={imagePreview} 
                        alt="Preview" 
                        className="w-full h-48 object-contain bg-gray-50 rounded-lg border-2 border-gray-200"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200"%3E%3Crect fill="%23ddd" width="200" height="200"/%3E%3Ctext fill="%23999" font-family="sans-serif" font-size="14" dy="105" font-weight="bold" x="50%25" y="50%25" text-anchor="middle"%3EImagem não encontrada%3C/text%3E%3C/svg%3E';
                        }}
                      />
                      <button
                        type="button"
                        onClick={handleRemoveImage}
                        className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition-colors shadow-lg opacity-0 group-hover:opacity-100"
                        title="Remover imagem"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  )}
                  <div className="relative">
                    <input
                      type="file"
                      accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                      onChange={handleImageChange}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:outline-none transition-colors file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Formatos aceitos: JPG, PNG, GIF, WEBP. Tamanho máximo: 5MB
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