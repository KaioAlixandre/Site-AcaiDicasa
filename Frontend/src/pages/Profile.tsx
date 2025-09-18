import React, { useState, useEffect } from 'react';
import { User, MapPin, Phone, Mail, Edit, Save, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Address } from '../types';
import { apiService } from '../services/api';
import Loading from '../components/Loading';

const Profile: React.FC = () => {
  const { user, loading: authLoading } = useAuth();
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
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Meu Perfil</h1>
          <p className="text-lg text-gray-600">
            Gerencie suas informações pessoais e endereços
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Informações Pessoais */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">
                Informações Pessoais
              </h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nome de usuário
                  </label>
                  <p className="text-gray-900">{user.username}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <p className="text-gray-900">{user.email}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Telefone
                  </label>
                  {editingPhone ? (
                    <div className="flex items-center space-x-2">
                      <input
                        type="tel"
                        value={newPhone}
                        onChange={(e) => setNewPhone(e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                        placeholder="Seu telefone"
                      />
                      <button
                        onClick={handleUpdatePhone}
                        className="p-2 text-green-600 hover:bg-green-50 rounded-md"
                      >
                        <Save size={16} />
                      </button>
                      <button
                        onClick={() => setEditingPhone(false)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-md"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <p className="text-gray-900">{user.phone || 'Não informado'}</p>
                      <button
                        onClick={() => {
                          setNewPhone(user.phone || '');
                          setEditingPhone(true);
                        }}
                        className="p-1 text-purple-600 hover:bg-purple-50 rounded-md"
                      >
                        <Edit size={16} />
                      </button>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tipo de conta
                  </label>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                    {user.role === 'admin' ? 'Administrador' : 'Usuário'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Endereços */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-gray-900">
                  Meus Endereços
                </h2>
                <button
                  onClick={() => setShowAddressForm(true)}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  Adicionar Endereço
                </button>
              </div>

              {/* Formulário de novo endereço */}
              {showAddressForm && (
                <form onSubmit={handleAddAddress} className="mb-6 p-4 border border-gray-200 rounded-lg">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    Novo Endereço
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Rua
                      </label>
                      <input
                        type="text"
                        value={newAddress.street}
                        onChange={(e) => setNewAddress({...newAddress, street: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Número
                      </label>
                      <input
                        type="text"
                        value={newAddress.number}
                        onChange={(e) => setNewAddress({...newAddress, number: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Complemento
                      </label>
                      <input
                        type="text"
                        value={newAddress.complement}
                        onChange={(e) => setNewAddress({...newAddress, complement: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Bairro
                      </label>
                      <input
                        type="text"
                        value={newAddress.neighborhood}
                        onChange={(e) => setNewAddress({...newAddress, neighborhood: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                        required
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={newAddress.isDefault}
                          onChange={(e) => setNewAddress({...newAddress, isDefault: e.target.checked})}
                          className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                        />
                        <span className="ml-2 text-sm text-gray-700">
                          Definir como endereço padrão
                        </span>
                      </label>
                    </div>
                  </div>
                  <div className="flex justify-end space-x-2 mt-4">
                    <button
                      type="button"
                      onClick={() => setShowAddressForm(false)}
                      className="px-4 py-2 text-gray-600 hover:bg-gray-50 rounded-lg"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                    >
                      Salvar Endereço
                    </button>
                  </div>
                </form>
              )}

              {/* Lista de endereços */}
              <div className="space-y-4">
                {addresses.length === 0 ? (
                  <div className="text-center py-8">
                    <MapPin size={48} className="text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">Nenhum endereço cadastrado</p>
                  </div>
                ) : (
                  addresses.map((address) => (
                    <div key={address.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <MapPin size={16} className="text-gray-400" />
                            <span className="font-medium text-gray-900">
                              {address.street}, {address.number}
                            </span>
                            {address.isDefault && (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                Padrão
                              </span>
                            )}
                          </div>
                          {address.complement && (
                            <p className="text-sm text-gray-600 mb-1">
                              {address.complement}
                            </p>
                          )}
                          <p className="text-sm text-gray-600">
                            {address.neighborhood}
                          </p>
                        </div>
                        <div className="flex space-x-2">
                          <button className="p-2 text-purple-600 hover:bg-purple-50 rounded-md">
                            <Edit size={16} />
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
  );
};

export default Profile;
