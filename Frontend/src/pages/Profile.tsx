import React, { useState, useEffect } from 'react';
import { 
  User, 
  MapPin, 
  Phone, 
  Mail, 
  Edit, 
  Save, 
  X, 
  Plus,
  Star,
  Shield,
  Calendar,
  CheckCircle,
  Home,
  Trash2,
  Eye,
  Settings
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Address } from '../types';
import { apiService } from '../services/api';
import Loading from '../components/Loading';

const Profile: React.FC = () => {
  const { user, loading: authLoading, refreshUserProfile } = useAuth();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingPhone, setEditingPhone] = useState(false);
  const [newPhone, setNewPhone] = useState('');
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [newAddress, setNewAddress] = useState({
    street: '',
    number: '',
    complement: '',
    neighborhood: '',
    isDefault: false
  });

  useEffect(() => {
    if (user) {
      loadAddresses();
    }
  }, [user]);

  const loadAddresses = async () => {
    try {
      const addressesData = await apiService.getAddresses();
      setAddresses(addressesData);
    } catch (error) {
      console.error('Erro ao carregar endereços:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePhone = async () => {
    try {
      await apiService.updatePhone(newPhone);
      setEditingPhone(false);
      // Recarregar dados do usuário
      window.location.reload();
    } catch (error) {
      console.error('Erro ao atualizar telefone:', error);
    }
  };

  const handleAddAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiService.addAddress(newAddress);
      setShowAddressForm(false);
      setNewAddress({
        street: '',
        number: '',
        complement: '',
        neighborhood: '',
        isDefault: false
      });
      // Atualizar o perfil do usuário com os novos endereços
      await refreshUserProfile();
      loadAddresses();
    } catch (error) {
      console.error('Erro ao adicionar endereço:', error);
    }
  };

  if (authLoading || loading) {
    return <Loading fullScreen text="Carregando perfil..." />;
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Acesso Negado
          </h2>
          <p className="text-gray-600">
            Você precisa estar logado para acessar esta página.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header com Avatar e Informações do Usuário */}
        <div className="relative bg-white rounded-2xl shadow-xl overflow-hidden mb-8">
          {/* Background Pattern */}
          <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 opacity-10">
            <div className="absolute inset-0" style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='4'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            }}></div>
          </div>
          
          <div className="relative p-8">
            <div className="flex items-center space-x-6">
              {/* Avatar */}
              <div className="relative">
                <div className="w-24 h-24 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center shadow-lg">
                  <User className="w-12 h-12 text-white" />
                </div>
                <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center shadow-lg">
                  <CheckCircle className="w-5 h-5 text-white" />
                </div>
              </div>
              
              {/* Informações do Usuário */}
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  Olá, {user.username}! 👋
                </h1>
                <p className="text-lg text-gray-600 mb-4">
                  Gerencie suas informações pessoais e preferências
                </p>
                
                {/* Stats Cards */}
                <div className="flex flex-wrap gap-4">
                  <div className="bg-white/80 backdrop-blur-sm rounded-lg px-4 py-2 shadow-md border border-gray-100">
                    <div className="flex items-center space-x-2">
                      <Mail className="w-4 h-4 text-purple-600" />
                      <span className="text-sm font-medium text-gray-700">Email verificado</span>
                    </div>
                  </div>
                  
                  <div className="bg-white/80 backdrop-blur-sm rounded-lg px-4 py-2 shadow-md border border-gray-100">
                    <div className="flex items-center space-x-2">
                      <Shield className="w-4 h-4 text-green-600" />
                      <span className="text-sm font-medium text-gray-700">
                        {user.role === 'admin' ? 'Administrador' : 'Cliente'}
                      </span>
                    </div>
                  </div>
                  
                  <div className="bg-white/80 backdrop-blur-sm rounded-lg px-4 py-2 shadow-md border border-gray-100">
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-4 h-4 text-blue-600" />
                      <span className="text-sm font-medium text-gray-700">Membro desde 2024</span>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Settings Button */}
              <div className="flex flex-col items-center space-y-2">
                <button className="p-3 bg-white/80 backdrop-blur-sm rounded-xl shadow-md hover:shadow-lg transition-all duration-200 border border-gray-100 hover:bg-white">
                  <Settings className="w-6 h-6 text-gray-600" />
                </button>
                <span className="text-xs text-gray-500 font-medium">Configurações</span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* Informações Pessoais */}
          <div className="xl:col-span-1">
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
              {/* Header da Seção */}
              <div className="bg-gradient-to-r from-purple-500 to-pink-500 px-6 py-4">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                    <User className="w-5 h-5 text-white" />
                  </div>
                  <h2 className="text-xl font-bold text-white">
                    Informações Pessoais
                  </h2>
                </div>
              </div>
              
              <div className="p-6 space-y-6">
                {/* Campo Username */}
                <div className="group">
                  <label className="text-sm font-semibold text-gray-700 mb-2 flex items-center">
                    <User className="w-4 h-4 mr-2 text-gray-500" />
                    Nome de usuário
                  </label>
                  <div className="bg-gray-50 rounded-lg p-3 border-2 border-transparent group-hover:border-purple-200 transition-all duration-200">
                    <p className="text-gray-900 font-medium">{user.username}</p>
                  </div>
                </div>

                {/* Campo Email */}
                <div className="group">
                  <label className="text-sm font-semibold text-gray-700 mb-2 flex items-center">
                    <Mail className="w-4 h-4 mr-2 text-gray-500" />
                    Email
                  </label>
                  <div className="bg-gray-50 rounded-lg p-3 border-2 border-transparent group-hover:border-purple-200 transition-all duration-200">
                    <p className="text-gray-900 font-medium">{user.email}</p>
                  </div>
                </div>

                {/* Campo Telefone */}
                <div className="group">
                  <label className="text-sm font-semibold text-gray-700 mb-2 flex items-center">
                    <Phone className="w-4 h-4 mr-2 text-gray-500" />
                    Telefone
                  </label>
                  {editingPhone ? (
                    <div className="space-y-3">
                      <input
                        type="tel"
                        value={newPhone}
                        onChange={(e) => setNewPhone(e.target.value)}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200"
                        placeholder="(00) 00000-0000"
                      />
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={handleUpdatePhone}
                          className="flex-1 bg-green-500 hover:bg-green-600 text-white font-semibold py-2 px-4 rounded-lg transition-all duration-200 flex items-center justify-center space-x-2"
                        >
                          <Save className="w-4 h-4" />
                          <span>Salvar</span>
                        </button>
                        <button
                          onClick={() => setEditingPhone(false)}
                          className="flex-1 bg-gray-500 hover:bg-gray-600 text-white font-semibold py-2 px-4 rounded-lg transition-all duration-200 flex items-center justify-center space-x-2"
                        >
                          <X className="w-4 h-4" />
                          <span>Cancelar</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-gray-50 rounded-lg p-3 border-2 border-transparent group-hover:border-purple-200 transition-all duration-200">
                      <div className="flex items-center justify-between">
                        <p className="text-gray-900 font-medium">
                          {user.phone || 'Não informado'}
                        </p>
                        <button
                          onClick={() => {
                            setNewPhone(user.phone || '');
                            setEditingPhone(true);
                          }}
                          className="p-2 text-purple-600 hover:bg-purple-100 rounded-lg transition-all duration-200"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Campo Tipo de Conta */}
                <div className="group">
                  <label className="text-sm font-semibold text-gray-700 mb-2 flex items-center">
                    <Shield className="w-4 h-4 mr-2 text-gray-500" />
                    Tipo de conta
                  </label>
                  <div className="bg-gray-50 rounded-lg p-3 border-2 border-transparent group-hover:border-purple-200 transition-all duration-200">
                    <div className="flex items-center space-x-2">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${
                        user.role === 'admin' 
                          ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white' 
                          : 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white'
                      }`}>
                        {user.role === 'admin' ? '👑 Administrador' : '🌟 Cliente Premium'}
                      </span>
                      {user.role === 'admin' && (
                        <Star className="w-4 h-4 text-yellow-500" />
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Endereços */}
          <div className="xl:col-span-2">
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
              {/* Header da Seção */}
              <div className="bg-gradient-to-r from-blue-500 to-cyan-500 px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                      <MapPin className="w-5 h-5 text-white" />
                    </div>
                    <h2 className="text-xl font-bold text-white">
                      Meus Endereços
                    </h2>
                  </div>
                  <button
                    onClick={() => setShowAddressForm(true)}
                    className="bg-white/20 hover:bg-white/30 text-white font-semibold py-2 px-4 rounded-lg transition-all duration-200 flex items-center space-x-2 backdrop-blur-sm border border-white/20"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Novo Endereço</span>
                  </button>
                </div>
              </div>

              <div className="p-6">
                {/* Formulário de novo endereço */}
                {showAddressForm && (
                  <div className="mb-6 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl border-2 border-blue-200/50 overflow-hidden">
                    <div className="bg-gradient-to-r from-blue-500 to-cyan-500 px-6 py-3">
                      <h3 className="text-lg font-bold text-white flex items-center">
                        <Plus className="w-5 h-5 mr-2" />
                        Adicionar Novo Endereço
                      </h3>
                    </div>
                    
                    <form onSubmit={handleAddAddress} className="p-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                        <div className="md:col-span-2">
                          <label className="text-sm font-semibold text-gray-700 mb-2 flex items-center">
                            <Home className="w-4 h-4 mr-2 text-gray-500" />
                            Rua
                          </label>
                          <input
                            type="text"
                            value={newAddress.street}
                            onChange={(e) => setNewAddress({...newAddress, street: e.target.value})}
                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                            placeholder="Ex: Rua das Flores"
                            required
                          />
                        </div>
                        
                        <div>
                          <label className="text-sm font-semibold text-gray-700 mb-2 flex items-center">
                            Número
                          </label>
                          <input
                            type="text"
                            value={newAddress.number}
                            onChange={(e) => setNewAddress({...newAddress, number: e.target.value})}
                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                            placeholder="123"
                            required
                          />
                        </div>
                        
                        <div>
                          <label className="text-sm font-semibold text-gray-700 mb-2 flex items-center">
                            Complemento
                          </label>
                          <input
                            type="text"
                            value={newAddress.complement}
                            onChange={(e) => setNewAddress({...newAddress, complement: e.target.value})}
                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                            placeholder="Apto 101"
                          />
                        </div>
                        
                        <div className="md:col-span-2">
                          <label className="text-sm font-semibold text-gray-700 mb-2 flex items-center">
                            Bairro
                          </label>
                          <input
                            type="text"
                            value={newAddress.neighborhood}
                            onChange={(e) => setNewAddress({...newAddress, neighborhood: e.target.value})}
                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                            placeholder="Ex: Centro"
                            required
                          />
                        </div>
                        
                        <div className="md:col-span-2">
                          <label className="flex items-center space-x-3 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={newAddress.isDefault}
                              onChange={(e) => setNewAddress({...newAddress, isDefault: e.target.checked})}
                              className="w-5 h-5 text-blue-600 focus:ring-blue-500 border-2 border-gray-300 rounded transition-all duration-200"
                            />
                            <span className="text-sm font-medium text-gray-700 flex items-center">
                              <Star className="w-4 h-4 mr-2 text-yellow-500" />
                              Definir como endereço padrão
                            </span>
                          </label>
                        </div>
                      </div>
                      
                      <div className="flex justify-end space-x-3">
                        <button
                          type="button"
                          onClick={() => setShowAddressForm(false)}
                          className="px-6 py-3 text-gray-600 hover:bg-gray-100 rounded-lg font-semibold transition-all duration-200 border border-gray-200"
                        >
                          Cancelar
                        </button>
                        <button
                          type="submit"
                          className="px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-lg hover:from-blue-600 hover:to-cyan-600 font-semibold transition-all duration-200 shadow-lg flex items-center space-x-2"
                        >
                          <Plus className="w-4 h-4" />
                          <span>Salvar Endereço</span>
                        </button>
                      </div>
                    </form>
                  </div>
                )}

                {/* Lista de endereços */}
                <div className="space-y-4">
                  {addresses.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                        <MapPin className="w-10 h-10 text-gray-400" />
                      </div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">Nenhum endereço cadastrado</h3>
                      <p className="text-gray-600 mb-6">Adicione um endereço para facilitar suas compras</p>
                      <button
                        onClick={() => setShowAddressForm(true)}
                        className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-semibold py-3 px-6 rounded-lg hover:from-blue-600 hover:to-cyan-600 transition-all duration-200 shadow-lg flex items-center space-x-2 mx-auto"
                      >
                        <Plus className="w-5 h-5" />
                        <span>Adicionar Primeiro Endereço</span>
                      </button>
                    </div>
                  ) : (
                    addresses.map((address) => (
                      <div key={address.id} className="group relative bg-gradient-to-br from-gray-50 to-white rounded-xl border-2 border-gray-200 hover:border-blue-300 p-6 transition-all duration-300 hover:shadow-lg">
                        {/* Badge de Endereço Padrão */}
                        {address.isDefault && (
                          <div className="absolute -top-3 -right-3">
                            <div className="bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-full px-3 py-1 text-xs font-bold shadow-lg flex items-center space-x-1">
                              <Star className="w-3 h-3" />
                              <span>PADRÃO</span>
                            </div>
                          </div>
                        )}
                        
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            {/* Endereço Principal */}
                            <div className="flex items-center space-x-3 mb-3">
                              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center shadow-md">
                                <Home className="w-5 h-5 text-white" />
                              </div>
                              <div>
                                <h4 className="font-bold text-gray-900 text-lg">
                                  {address.street}, {address.number}
                                </h4>
                                <p className="text-sm text-gray-600">
                                  {address.neighborhood}
                                </p>
                              </div>
                            </div>
                            
                            {/* Complemento */}
                            {address.complement && (
                              <div className="ml-13 mb-3">
                                <p className="text-sm text-gray-700 bg-gray-100 rounded-lg px-3 py-1 inline-block">
                                  📍 {address.complement}
                                </p>
                              </div>
                            )}
                            
                            {/* Endereço Completo */}
                            <div className="ml-13 text-sm text-gray-600">
                              <p className="font-medium">Endereço completo:</p>
                              <p className="bg-gray-50 rounded-lg px-3 py-2 mt-1">
                                {address.street}, {address.number}
                                {address.complement && `, ${address.complement}`}
                                <br />
                                {address.neighborhood}
                              </p>
                            </div>
                          </div>
                          
                          {/* Ações */}
                          <div className="flex flex-col space-y-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                            <button className="p-3 text-blue-600 hover:bg-blue-100 rounded-lg transition-all duration-200 shadow-sm border border-blue-200 hover:border-blue-300">
                              <Edit className="w-4 h-4" />
                            </button>
                            <button className="p-3 text-red-600 hover:bg-red-100 rounded-lg transition-all duration-200 shadow-sm border border-red-200 hover:border-red-300">
                              <Trash2 className="w-4 h-4" />
                            </button>
                            <button className="p-3 text-purple-600 hover:bg-purple-100 rounded-lg transition-all duration-200 shadow-sm border border-purple-200 hover:border-purple-300">
                              <Eye className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
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

export default Profile;
