import React, { useState, useEffect } from 'react';
import { 
  Package, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Truck, 
  AlertCircle,
  MapPin,
  Phone,
  CreditCard,
  Calendar,
  Eye,
  EyeOff,
  Bike,
  Home,
  DollarSign,
  User
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Order } from '../types';
import { apiService } from '../services/api';
import Loading from '../components/Loading';

interface ToastMessage {
  id: number;
  message: string;
  type: 'success' | 'error';
}

const Orders: React.FC = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancelingOrders, setCancelingOrders] = useState<Set<number>>(new Set());
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [expandedOrders, setExpandedOrders] = useState<Set<number>>(new Set());
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    if (user) {
      loadOrders();
    }
  }, [user]);

  const showToast = (message: string, type: 'success' | 'error') => {
    const id = Date.now();
    const newToast = { id, message, type };
    setToasts(prev => [...prev, newToast]);
    
    // Remover toast após 5 segundos
    setTimeout(() => {
      setToasts(prev => prev.filter(toast => toast.id !== id));
    }, 5000);
  };

  const removeToast = (id: number) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  const toggleOrderExpansion = (orderId: number) => {
    setExpandedOrders(prev => {
      const newSet = new Set(prev);
      if (newSet.has(orderId)) {
        newSet.delete(orderId);
      } else {
        newSet.add(orderId);
      }
      return newSet;
    });
  };

  const getDeliveryTypeInfo = (deliveryType?: string) => {
    switch (deliveryType) {
      case 'pickup':
        return {
          label: 'Retirada no Local',
          icon: <Home className="w-4 h-4" />,
          color: 'text-blue-600',
          bgColor: 'bg-blue-100'
        };
      case 'delivery':
      default:
        return {
          label: 'Entrega',
          icon: <Bike className="w-4 h-4" />,
          color: 'text-green-600',
          bgColor: 'bg-green-100'
        };
    }
  };

  const getOrderSummary = (order: Order) => {
    const totalItems = order.orderitem.reduce((sum, item) => sum + item.quantity, 0);
    const deliveryInfo = getDeliveryTypeInfo(order.deliveryType);
    return { totalItems, deliveryInfo };
  };

  const filteredOrders = statusFilter === 'all' 
    ? orders 
    : orders.filter(order => order.status === statusFilter);

  const statusOptions = [
    { value: 'all', label: 'Todos os pedidos', count: orders.length },
    { value: 'pending_payment', label: 'Aguardando pagamento', count: orders.filter(o => o.status === 'pending_payment').length },
    { value: 'being_prepared', label: 'Sendo preparado', count: orders.filter(o => o.status === 'being_prepared').length },
    { value: 'ready_for_pickup', label: 'Pronto para retirada', count: orders.filter(o => o.status === 'ready_for_pickup').length },
    { value: 'on_the_way', label: 'A caminho', count: orders.filter(o => o.status === 'on_the_way').length },
    { value: 'delivered', label: 'Entregue', count: orders.filter(o => o.status === 'delivered').length }
  ];

  useEffect(() => {
    if (user) {
      loadOrders();
    }
  }, [user]);

  const loadOrders = async () => {
    try {
      const ordersData = await apiService.getOrderHistory();
      setOrders(ordersData);
    } catch (error) {
      console.error('Erro ao carregar pedidos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelOrder = async (orderId: number) => {
    // Confirmar cancelamento
    const confirmed = window.confirm(
      'Tem certeza que deseja cancelar este pedido? Esta ação não pode ser desfeita.'
    );
    
    if (!confirmed) return;

    try {
      // Adicionar pedido à lista de cancelamentos em progresso
      setCancelingOrders(prev => new Set([...prev, orderId]));
      
      // Chamar API para cancelar pedido
      await apiService.cancelOrder(orderId);
      
      // Atualizar lista de pedidos
      await loadOrders();
      
      // Mostrar mensagem de sucesso
      showToast('Pedido cancelado com sucesso!', 'success');
    } catch (error) {
      console.error('Erro ao cancelar pedido:', error);
      showToast('Erro ao cancelar pedido. Tente novamente.', 'error');
    } finally {
      // Remover pedido da lista de cancelamentos em progresso
      setCancelingOrders(prev => {
        const newSet = new Set(prev);
        newSet.delete(orderId);
        return newSet;
      });
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending_payment':
        return <Clock size={20} className="text-yellow-500" />;
      case 'being_prepared':
        return <Package size={20} className="text-blue-500" />;
      case 'ready_for_pickup':
        return <Package size={20} className="text-orange-500" />;
      case 'on_the_way':
        return <Truck size={20} className="text-purple-500" />;
      case 'delivered':
        return <CheckCircle size={20} className="text-green-500" />;
      case 'canceled':
        return <XCircle size={20} className="text-red-500" />;
      default:
        return <Clock size={20} className="text-gray-500" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending_payment':
        return 'Aguardando Pagamento';
      case 'being_prepared':
        return 'Preparando';
      case 'ready_for_pickup':
        return 'Pronto para Retirada';
      case 'on_the_way':
        return 'Saiu para Entrega';
      case 'delivered':
        return 'Entregue';
      case 'canceled':
        return 'Cancelado';
      default:
        return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending_payment':
        return 'bg-yellow-100 text-yellow-800';
      case 'being_prepared':
        return 'bg-blue-100 text-blue-800';
      case 'ready_for_pickup':
        return 'bg-orange-100 text-orange-800';
      case 'on_the_way':
        return 'bg-purple-100 text-purple-800';
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'canceled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return <Loading fullScreen text="Carregando pedidos..." />;
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">Meus Pedidos</h1>
              <p className="text-lg text-gray-600">
                Acompanhe o status e detalhes de todos os seus pedidos
              </p>
            </div>
            <div className="text-right">
              <div className="bg-white rounded-lg shadow-md p-4 border border-gray-200">
                <p className="text-sm text-gray-600">Total de pedidos</p>
                <p className="text-3xl font-bold text-purple-600">{orders.length}</p>
              </div>
            </div>
          </div>
          
          {orders.length > 0 && (
            <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
                <div className="flex items-center">
                  <Clock className="w-5 h-5 text-yellow-600 mr-2" />
                  <div>
                    <p className="text-sm text-yellow-700">Pendentes</p>
                    <p className="text-xl font-bold text-yellow-800">
                      {orders.filter(o => o.status === 'pending_payment').length}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <div className="flex items-center">
                  <Package className="w-5 h-5 text-blue-600 mr-2" />
                  <div>
                    <p className="text-sm text-blue-700">Preparando</p>
                    <p className="text-xl font-bold text-blue-800">
                      {orders.filter(o => ['being_prepared', 'ready_for_pickup'].includes(o.status)).length}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                <div className="flex items-center">
                  <Truck className="w-5 h-5 text-purple-600 mr-2" />
                  <div>
                    <p className="text-sm text-purple-700">Em Trânsito</p>
                    <p className="text-xl font-bold text-purple-800">
                      {orders.filter(o => o.status === 'on_the_way').length}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                <div className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                  <div>
                    <p className="text-sm text-green-700">Concluídos</p>
                    <p className="text-xl font-bold text-green-800">
                      {orders.filter(o => o.status === 'delivered').length}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Filtro de Status */}
        {orders.length > 0 && (
          <div className="mb-6">
            <div className="bg-white rounded-lg shadow-md border border-gray-200 p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Filtrar por status</h3>
              <div className="flex flex-wrap gap-2">
                {statusOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setStatusFilter(option.value)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                      statusFilter === option.value
                        ? 'bg-purple-600 text-white shadow-md'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    } ${option.count === 0 ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                    disabled={option.count === 0}
                  >
                    {option.label} ({option.count})
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {filteredOrders.length === 0 ? (
          <div className="text-center py-12">
            <Package size={64} className="text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {statusFilter === 'all' ? 'Nenhum pedido encontrado' : 'Nenhum pedido com este status'}
            </h2>
            <p className="text-gray-600 mb-8">
              {statusFilter === 'all' 
                ? 'Você ainda não fez nenhum pedido. Que tal começar agora?' 
                : 'Altere o filtro para ver pedidos com outros status.'
              }
            </p>
            {statusFilter === 'all' && (
              <a
                href="/products"
                className="inline-flex items-center px-6 py-3 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 transition-colors"
              >
                Ver Produtos
              </a>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {filteredOrders.map((order) => {
              const { totalItems, deliveryInfo } = getOrderSummary(order);
              const isExpanded = expandedOrders.has(order.id);
              
              return (
                <div key={order.id} className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200 hover:shadow-xl transition-shadow duration-300">
                  {/* Header do pedido com informações principais */}
                  <div className="px-6 py-5 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-pink-50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                            <Package className="w-6 h-6 text-white" />
                          </div>
                          <div>
                            <h3 className="text-xl font-bold text-gray-900">
                              Pedido #{order.id.toString().padStart(4, '0')}
                            </h3>
                            <div className="flex items-center space-x-3 mt-1">
                              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
                                {getStatusIcon(order.status)}
                                <span className="ml-1">{getStatusText(order.status)}</span>
                              </span>
                              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${deliveryInfo.bgColor} ${deliveryInfo.color}`}>
                                {deliveryInfo.icon}
                                <span className="ml-1">{deliveryInfo.label}</span>
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <p className="text-2xl font-bold text-gray-900">
                          R$ {order.totalPrice != null ? Number(order.totalPrice).toFixed(2) : '--'}
                        </p>
                        <p className="text-sm text-gray-600 flex items-center justify-end">
                          <Calendar className="w-4 h-4 mr-1" />
                          {formatDate(order.createdAt)}
                        </p>
                        <p className="text-xs text-gray-500">
                          {totalItems} {totalItems === 1 ? 'item' : 'itens'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Resumo rápido sempre visível */}
                  <div className="px-6 py-4 bg-gray-50">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="flex items-center space-x-2">
                        <DollarSign className="w-5 h-5 text-green-600" />
                        <div>
                          <p className="text-xs text-gray-500 uppercase tracking-wide">Total</p>
                          <p className="text-lg font-semibold text-gray-900">
                            R$ {Number(order.totalPrice).toFixed(2)}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <MapPin className="w-5 h-5 text-purple-600" />
                        <div>
                          <p className="text-xs text-gray-500 uppercase tracking-wide">Endereço</p>
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {order.shippingStreet}, {order.shippingNumber}
                          </p>
                          <p className="text-xs text-gray-600">{order.shippingNeighborhood}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        {order.shippingPhone && (
                          <>
                            <Phone className="w-5 h-5 text-blue-600" />
                            <div>
                              <p className="text-xs text-gray-500 uppercase tracking-wide">Contato</p>
                              <p className="text-sm font-medium text-gray-900">{order.shippingPhone}</p>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Prévia dos itens - sempre visível */}
                  <div className="px-6 py-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-lg font-semibold text-gray-900 flex items-center">
                        <Package className="w-5 h-5 mr-2" />
                        Itens do Pedido ({totalItems})
                      </h4>
                      <button
                        onClick={() => toggleOrderExpansion(order.id)}
                        className="flex items-center space-x-1 px-3 py-1 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
                      >
                        {isExpanded ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        <span className="text-sm">{isExpanded ? 'Ocultar' : 'Ver Mais'}</span>
                      </button>
                    </div>

                    {/* Lista de itens - limitada quando não expandida */}
                    <div className="space-y-3">
                      {(isExpanded ? order.orderitem : order.orderitem.slice(0, 2)).map((item) => {
                        // Verificar se é açaí personalizado
                        const isCustomAcai = item.selectedOptionsSnapshot?.customAcai;
                        
                        return (
                          <div key={item.id} className="flex items-start justify-between p-4 bg-gray-50 rounded-lg">
                            <div className="flex items-start space-x-4 flex-1">
                              <div className="w-16 h-16 bg-gradient-to-br from-purple-400 to-pink-400 rounded-xl flex items-center justify-center shadow-md flex-shrink-0">
                                <span className="text-2xl">{isCustomAcai ? '🍓' : '🥤'}</span>
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <p className="font-semibold text-gray-900 text-lg">{item.product.name}</p>
                                  {isCustomAcai && (
                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-purple-100 text-purple-800 font-medium">
                                      🎨 Personalizado
                                    </span>
                                  )}
                                </div>
                                <p className="text-sm text-gray-600 mb-1">Quantidade: {item.quantity}</p>
                                <p className="text-xs text-gray-500 mb-2">
                                  Preço unitário: R$ {Number(item.priceAtOrder ?? 0).toFixed(2)}
                                </p>
                                
                                {isCustomAcai && isCustomAcai.complementNames && isCustomAcai.complementNames.length > 0 && (
                                  <div className="mt-2">
                                    <p className="text-xs font-medium text-gray-600 mb-1">Complementos:</p>
                                    <div className="flex flex-wrap gap-1">
                                      {isCustomAcai.complementNames.map((complement: string, idx: number) => (
                                        <span 
                                          key={idx}
                                          className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-50 text-green-700 border border-green-200"
                                        >
                                          🍓 {complement}
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="text-right ml-4 flex-shrink-0">
                              <p className="text-lg font-bold text-gray-900">
                                R$ {(Number(item.priceAtOrder ?? 0) * item.quantity).toFixed(2)}
                              </p>
                              <p className="text-xs text-gray-500">Subtotal</p>
                            </div>
                          </div>
                        );
                      })}
                      
                      {!isExpanded && order.orderitem.length > 2 && (
                        <div className="text-center py-2">
                          <p className="text-sm text-gray-500">
                            + {order.orderitem.length - 2} item(s) adicional(is)
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Informações detalhadas - só quando expandido */}
                  {isExpanded && (
                    <>
                      {/* Informações de entrega detalhadas */}
                      <div className="px-6 py-4 bg-blue-50 border-t border-gray-200">
                        <h4 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                          <MapPin className="w-5 h-5 mr-2" />
                          Informações de Entrega
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <div className="flex items-start space-x-3">
                              <Home className="w-5 h-5 text-gray-600 mt-1" />
                              <div>
                                <p className="font-medium text-gray-900">Endereço Completo</p>
                                <p className="text-gray-700">
                                  {order.shippingStreet}, {order.shippingNumber}
                                  {order.shippingComplement && ` - ${order.shippingComplement}`}
                                </p>
                                <p className="text-gray-600">{order.shippingNeighborhood}</p>
                              </div>
                            </div>
                          </div>
                          
                          <div className="space-y-2">
                            {order.shippingPhone && (
                              <div className="flex items-center space-x-3">
                                <Phone className="w-5 h-5 text-gray-600" />
                                <div>
                                  <p className="font-medium text-gray-900">Telefone de Contato</p>
                                  <p className="text-gray-700">{order.shippingPhone}</p>
                                </div>
                              </div>
                            )}
                            
                            <div className="flex items-center space-x-3">
                              {deliveryInfo.icon}
                              <div>
                                <p className="font-medium text-gray-900">Tipo de Entrega</p>
                                <p className="text-gray-700">{deliveryInfo.label}</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Resumo financeiro detalhado */}
                      <div className="px-6 py-4 bg-green-50 border-t border-gray-200">
                        <h4 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                          <CreditCard className="w-5 h-5 mr-2" />
                          Resumo Financeiro
                        </h4>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-gray-700">Subtotal dos itens:</span>
                            <span className="text-gray-900">
                              R$ {order.orderitem.reduce((sum, item) => 
                                sum + (Number(item.priceAtOrder ?? 0) * item.quantity), 0
                              ).toFixed(2)}
                            </span>
                          </div>
                          {order.deliveryType === 'delivery' && (
                            <div className="flex justify-between">
                              <span className="text-gray-700">Taxa de entrega:</span>
                              <span className="text-gray-900">R$ 5,00</span>
                            </div>
                          )}
                          <div className="border-t border-gray-300 pt-2">
                            <div className="flex justify-between items-center">
                              <span className="text-xl font-bold text-gray-900">Total:</span>
                              <span className="text-2xl font-bold text-green-600">
                                R$ {Number(order.totalPrice).toFixed(2)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </>
                  )}

                  {/* Ações do pedido */}
                  <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center space-x-4">
                        <div className="text-sm text-gray-600">
                          Status: <span className="font-semibold">{getStatusText(order.status)}</span>
                        </div>
                        <div className="text-sm text-gray-600">
                          Pedido: <span className="font-mono">#{order.id.toString().padStart(4, '0')}</span>
                        </div>
                      </div>
                      
                      <div className="flex space-x-3">
                        {order.status === 'pending_payment' && (
                          <button 
                            onClick={() => handleCancelOrder(order.id)}
                            disabled={cancelingOrders.has(order.id)}
                            className="flex items-center px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors disabled:bg-red-400 disabled:cursor-not-allowed"
                          >
                            <XCircle className="w-4 h-4 mr-2" />
                            {cancelingOrders.has(order.id) ? 'Cancelando...' : 'Cancelar Pedido'}
                          </button>
                        )}
                        
                        <button 
                          onClick={() => toggleOrderExpansion(order.id)}
                          className="flex items-center px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          {isExpanded ? (
                            <>
                              <EyeOff className="w-4 h-4 mr-2" />
                              Ocultar Detalhes
                            </>
                          ) : (
                            <>
                              <Eye className="w-4 h-4 mr-2" />
                              Ver Detalhes
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      
      {/* Toast Messages */}
      <div className="fixed bottom-4 right-4 z-50 space-y-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`p-4 rounded-lg shadow-lg text-white max-w-sm ${
              toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                {toast.type === 'success' ? (
                  <CheckCircle size={16} />
                ) : (
                  <XCircle size={16} />
                )}
                <span className="text-sm font-medium">{toast.message}</span>
              </div>
              <button
                onClick={() => removeToast(toast.id)}
                className="text-white hover:text-gray-200"
              >
                <XCircle size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Orders;
