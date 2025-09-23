import React, { useState, useMemo } from 'react';
import { Printer, ArrowRightCircle, RotateCw, Truck, MapPin, Filter, Calendar, X } from 'lucide-react';
import { Order } from '../../types';

// Função para traduzir status para português
const getStatusInPortuguese = (status: string) => {
  const statusMap: { [key: string]: string } = {
    'pending_payment': 'Pagamento Pendente',
    'being_prepared': 'Preparando',
    'ready_for_pickup': 'Pronto para Retirada',
    'on_the_way': 'A Caminho',
    'delivered': 'Entregue',
    'canceled': 'Cancelado'
  };
  return statusMap[status] || status;
};

// Função para obter estilo do status
const getStatusStyle = (status: string) => {
  const statusStyles: { [key: string]: string } = {
    'pending_payment': 'bg-yellow-100 text-yellow-800 border border-yellow-200',
    'being_prepared': 'bg-blue-100 text-blue-800 border border-blue-200',
    'ready_for_pickup': 'bg-orange-100 text-orange-800 border border-orange-200',
    'on_the_way': 'bg-purple-100 text-purple-800 border border-purple-200',
    'delivered': 'bg-green-100 text-green-800 border border-green-200',
    'canceled': 'bg-red-100 text-red-800 border border-red-200'
  };
  return statusStyles[status] || 'bg-gray-100 text-gray-800 border border-gray-200';
};

const Pedidos: React.FC<{ orders: Order[], handleAdvanceStatus: (order: Order) => void }> = ({ orders, handleAdvanceStatus }) => {
  // Estados para os filtros
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);

  // Função para verificar se uma data é hoje
  const isToday = (date: string) => {
    const orderDate = new Date(date);
    const today = new Date();
    return orderDate.toDateString() === today.toDateString();
  };

  // Função para verificar se uma data é esta semana
  const isThisWeek = (date: string) => {
    const orderDate = new Date(date);
    const today = new Date();
    const startOfWeek = new Date(today.setDate(today.getDate() - today.getDay()));
    const endOfWeek = new Date(today.setDate(today.getDate() - today.getDay() + 6));
    return orderDate >= startOfWeek && orderDate <= endOfWeek;
  };

  // Pedidos filtrados
  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      // Filtro por status
      const statusMatch = statusFilter === 'all' || order.status === statusFilter;

      // Filtro por data
      let dateMatch = true;
      if (dateFilter === 'today') {
        dateMatch = isToday(order.createdAt);
      } else if (dateFilter === 'week') {
        dateMatch = isThisWeek(order.createdAt);
      }

      return statusMatch && dateMatch;
    });
  }, [orders, statusFilter, dateFilter]);

  // Limpar todos os filtros
  const clearFilters = () => {
    setStatusFilter('all');
    setDateFilter('all');
  };

  // Contar filtros ativos
  const activeFiltersCount = (statusFilter !== 'all' ? 1 : 0) + (dateFilter !== 'all' ? 1 : 0);

  return (
    <div id="pedidos" className="page">
      <header className="mb-8 flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-slate-800">Pedidos</h2>
          <p className="text-slate-500">
            Gerencie os pedidos recebidos. 
            {filteredOrders.length !== orders.length && (
              <span className="ml-2 text-indigo-600 font-medium">
                {filteredOrders.length} de {orders.length} pedidos
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setShowFilters(!showFilters)}
            className={`px-4 py-2 rounded-lg font-semibold flex items-center gap-2 transition-colors relative ${
              showFilters ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Filter className="w-4 h-4" />
            Filtros
            {activeFiltersCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {activeFiltersCount}
              </span>
            )}
          </button>
          <button className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-semibold flex items-center gap-2 hover:bg-indigo-700 transition-colors">
            <RotateCw className="w-4 h-4" />
            Atualizar
          </button>
        </div>
      </header>

      {/* Painel de Filtros */}
      {showFilters && (
        <div className="bg-white p-6 rounded-xl shadow-md mb-6 border border-slate-200">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
              <Filter className="w-5 h-5" />
              Filtros
            </h3>
            {activeFiltersCount > 0 && (
              <button 
                onClick={clearFilters}
                className="text-red-600 hover:text-red-700 flex items-center gap-1 text-sm font-medium"
              >
                <X className="w-4 h-4" />
                Limpar Filtros
              </button>
            )}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Filtro por Status */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-3">
                Status do Pedido
              </label>
              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="status"
                    value="all"
                    checked={statusFilter === 'all'}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="mr-2 text-indigo-600"
                  />
                  <span className="text-sm text-slate-600">Todos os status</span>
                </label>
                {[
                  { value: 'pending_payment', label: 'Pagamento Pendente', color: 'text-yellow-600' },
                  { value: 'being_prepared', label: 'Preparando', color: 'text-blue-600' },
                  { value: 'ready_for_pickup', label: 'Pronto para Retirada', color: 'text-orange-600' },
                  { value: 'on_the_way', label: 'A Caminho', color: 'text-purple-600' },
                  { value: 'delivered', label: 'Entregue', color: 'text-green-600' },
                  { value: 'canceled', label: 'Cancelado', color: 'text-red-600' }
                ].map((status) => (
                  <label key={status.value} className="flex items-center">
                    <input
                      type="radio"
                      name="status"
                      value={status.value}
                      checked={statusFilter === status.value}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="mr-2 text-indigo-600"
                    />
                    <span className={`text-sm ${status.color} font-medium`}>{status.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Filtro por Data */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-3">
                <Calendar className="w-4 h-4 inline mr-1" />
                Período
              </label>
              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="date"
                    value="all"
                    checked={dateFilter === 'all'}
                    onChange={(e) => setDateFilter(e.target.value)}
                    className="mr-2 text-indigo-600"
                  />
                  <span className="text-sm text-slate-600">Todos os períodos</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="date"
                    value="today"
                    checked={dateFilter === 'today'}
                    onChange={(e) => setDateFilter(e.target.value)}
                    className="mr-2 text-indigo-600"
                  />
                  <span className="text-sm text-indigo-600 font-medium">Hoje</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="date"
                    value="week"
                    checked={dateFilter === 'week'}
                    onChange={(e) => setDateFilter(e.target.value)}
                    className="mr-2 text-indigo-600"
                  />
                  <span className="text-sm text-indigo-600 font-medium">Esta semana</span>
                </label>
              </div>
            </div>
          </div>

          {/* Resumo dos filtros ativos */}
          {activeFiltersCount > 0 && (
            <div className="mt-4 pt-4 border-t border-slate-200">
              <p className="text-sm text-slate-600">
                <span className="font-medium">Filtros ativos:</span>
                {statusFilter !== 'all' && (
                  <span className="ml-2 bg-indigo-100 text-indigo-800 px-2 py-1 rounded text-xs">
                    Status: {getStatusInPortuguese(statusFilter)}
                  </span>
                )}
                {dateFilter !== 'all' && (
                  <span className="ml-2 bg-green-100 text-green-800 px-2 py-1 rounded text-xs">
                    Período: {dateFilter === 'today' ? 'Hoje' : 'Esta semana'}
                  </span>
                )}
              </p>
            </div>
          )}
        </div>
      )}

      <div className="bg-white p-2 rounded-xl shadow-md">
        {filteredOrders.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-slate-400 mb-4">
              <Filter className="w-16 h-16 mx-auto" />
            </div>
            <h3 className="text-xl font-semibold text-slate-800 mb-2">Nenhum pedido encontrado</h3>
            <p className="text-slate-500 mb-4">
              {activeFiltersCount > 0 
                ? 'Não há pedidos que correspondam aos filtros selecionados.'
                : 'Não há pedidos para exibir.'
              }
            </p>
            {activeFiltersCount > 0 && (
              <button 
                onClick={clearFilters}
                className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
              >
                Limpar Filtros
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="border-b border-slate-200 text-slate-500">
                <tr>
                  <th className="p-4">Cliente</th>
                  <th className="p-4">Itens</th>
                  <th className="p-4">Tipo</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Total</th>
                  <th className="p-4 text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredOrders.map(order => (
                  <tr key={order.id} className="hover:bg-slate-50">
                    <td className="p-4">
                      <div className="font-medium text-slate-800">{order.user?.username || '-'}</div>
                      <div className="text-sm text-slate-500">
                        {new Date(order.createdAt).toLocaleString('pt-BR')}
                      </div>
                    </td>
                    <td className="p-4 text-slate-600">
                      {order.orderitem.map(item => {
                        // Verificar se é açaí personalizado
                        const isCustomAcai = item.selectedOptionsSnapshot?.customAcai;
                        
                        return (
                          <div key={item.id} className="mb-2 last:mb-0">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">
                                {item.product?.name || 'Produto'} x {item.quantity}
                              </span>
                              {isCustomAcai && (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-purple-100 text-purple-800 font-medium">
                                  🎨 Personalizado R$ {Number(isCustomAcai.value).toFixed(2)}
                                </span>
                              )}
                            </div>
                            {isCustomAcai && isCustomAcai.complementNames && isCustomAcai.complementNames.length > 0 && (
                              <div className="mt-1 ml-4">
                                <span className="text-xs text-slate-500">Complementos: </span>
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {isCustomAcai.complementNames.map((complement: string, idx: number) => (
                                    <span 
                                      key={idx}
                                      className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-green-50 text-green-700 border border-green-200"
                                    >
                                      🍓 {complement}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        {order.deliveryType === 'delivery' ? (
                          <>
                            <Truck className="w-4 h-4 text-blue-600" />
                            <span className="text-sm font-medium text-blue-600">Entrega</span>
                          </>
                        ) : (
                          <>
                            <MapPin className="w-4 h-4 text-green-600" />
                            <span className="text-sm font-medium text-green-600">Retirada</span>
                          </>
                        )}
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getStatusStyle(order.status)}`}>
                        {getStatusInPortuguese(order.status)}
                      </span>
                    </td>
                    <td className="p-4 text-right font-medium text-slate-800">
                      R$ {Number(order.totalPrice).toFixed(2)}
                    </td>
                    <td className="p-4 text-center space-x-2">
                      <button title="Imprimir Pedido" className="p-2 text-slate-500 rounded-md hover:bg-slate-200 hover:text-blue-600">
                        <Printer className="w-5 h-5" />
                      </button>
                      <button title="Avançar Status" onClick={() => handleAdvanceStatus(order)} className="p-2 text-slate-500 rounded-md hover:bg-slate-200 hover:text-green-600">
                        <ArrowRightCircle className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Pedidos;