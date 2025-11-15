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
    const totalItems = order.orderitem?.reduce((sum, item) => sum + item.quantity, 0) || 0;
    const deliveryInfo = getDeliveryTypeInfo(order.deliveryType);
    return { totalItems, deliveryInfo };
  };

  useEffect(() => {
    if (user) {
      loadOrders();
    }
  }, [user]);

  const loadOrders = async () => {
    try {
      const ordersData = await apiService.getOrderHistory();
      console.log('Pedidos carregados:', ordersData);
      setOrders(ordersData);
    } catch (error) {
      console.error('Erro ao carregar pedidos:', error);
      showToast('Erro ao carregar pedidos. Tente novamente.', 'error');
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
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 md:py-8">
        {/* Header */}
        <div className="mb-4 md:mb-6">
          <div>
            <h1 className="text-xl md:text-3xl font-bold text-slate-900 mb-1">Meus Pedidos</h1>
            <p className="text-xs md:text-base text-slate-600">
              Acompanhe o status de todos os seus pedidos
            </p>
          </div>
          
          {orders.length > 0 && (
            <div className="mt-3 md:mt-4 grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3">
              <div className="bg-white rounded-lg p-2 md:p-3 border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center gap-1.5 md:gap-2">
                  <div className="w-8 h-8 md:w-10 md:h-10 bg-yellow-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Clock className="w-4 h-4 md:w-5 md:h-5 text-yellow-600" />
                  </div>
                  <div>
                    <p className="text-[10px] md:text-xs text-slate-600 font-medium">Pendentes</p>
                    <p className="text-sm md:text-lg font-bold text-slate-900">
                      {orders.filter(o => o.status === 'pending_payment').length}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-lg p-2 md:p-3 border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center gap-1.5 md:gap-2">
                  <div className="w-8 h-8 md:w-10 md:h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Package className="w-4 h-4 md:w-5 md:h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-[10px] md:text-xs text-slate-600 font-medium">Preparando</p>
                    <p className="text-sm md:text-lg font-bold text-slate-900">
                      {orders.filter(o => ['being_prepared', 'ready_for_pickup'].includes(o.status)).length}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-lg p-2 md:p-3 border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center gap-1.5 md:gap-2">
                  <div className="w-8 h-8 md:w-10 md:h-10 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Truck className="w-4 h-4 md:w-5 md:h-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-[10px] md:text-xs text-slate-600 font-medium">Em Trânsito</p>
                    <p className="text-sm md:text-lg font-bold text-slate-900">
                      {orders.filter(o => o.status === 'on_the_way').length}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-lg p-2 md:p-3 border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center gap-1.5 md:gap-2">
                  <div className="w-8 h-8 md:w-10 md:h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <CheckCircle className="w-4 h-4 md:w-5 md:h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-[10px] md:text-xs text-slate-600 font-medium">Concluídos</p>
                    <p className="text-sm md:text-lg font-bold text-slate-900">
                      {orders.filter(o => o.status === 'delivered').length}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {orders.length === 0 ? (
          <div className="text-center py-8 md:py-12">
            <Package size={48} className="md:w-16 md:h-16 text-gray-400 mx-auto mb-3 md:mb-4" />
            <h2 className="text-lg md:text-2xl font-bold text-gray-900 mb-2">
              Nenhum pedido encontrado
            </h2>
            <p className="text-sm md:text-base text-gray-600 mb-5 md:mb-8 px-4">
              Você ainda não fez nenhum pedido. Que tal começar agora?
            </p>
            <a
              href="/products"
              className="inline-flex items-center px-5 py-2.5 md:px-6 md:py-3 bg-purple-600 text-white text-sm md:text-base font-semibold rounded-lg hover:bg-purple-700 transition-colors"
            >
              Ver Produtos
            </a>
          </div>
        ) : (
          <div className="space-y-3 md:space-y-6">
            {orders.map((order) => {
              const { totalItems, deliveryInfo } = getOrderSummary(order);
              const isExpanded = expandedOrders.has(order.id);
              
              return (
                <div key={order.id} className="bg-white rounded-lg shadow-md overflow-hidden border border-slate-200 hover:shadow-lg transition-all duration-200">
                  {/* Header do pedido com informações principais */}
                  <div className="px-3 md:px-4 py-2.5 md:py-3 border-b border-slate-200 bg-slate-50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 md:gap-3">
                        <div className="w-9 h-9 md:w-11 md:h-11 bg-purple-600 rounded-lg flex items-center justify-center shadow-sm flex-shrink-0">
                          <Package className="w-4 h-4 md:w-5 md:h-5 text-white" />
                        </div>
                        <div>
                          <h3 className="text-xs md:text-base font-bold text-slate-900">
                            Pedido #{order.id.toString().padStart(4, '0')}
                          </h3>
                          <div className="flex items-center flex-wrap gap-1.5 mt-0.5 md:mt-1">
                            <span className={`inline-flex items-center px-1.5 md:px-2 py-0.5 rounded-md text-[9px] md:text-xs font-semibold ${getStatusColor(order.status)}`}>
                              {getStatusIcon(order.status)}
                              <span className="ml-1">{getStatusText(order.status)}</span>
                            </span>
                            <span className={`inline-flex items-center px-1.5 md:px-2 py-0.5 rounded-md text-[9px] md:text-xs font-semibold ${deliveryInfo.bgColor} ${deliveryInfo.color}`}>
                              {deliveryInfo.icon}
                              <span className="ml-1">{deliveryInfo.label}</span>
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="text-right flex-shrink-0">
                        <p className="text-sm md:text-xl font-bold text-purple-600">
                          R$ {order.totalPrice != null ? Number(order.totalPrice).toFixed(2) : '--'}
                        </p>
                        <p className="text-[9px] md:text-xs text-slate-600 flex items-center justify-end mt-0.5">
                          <Calendar className="w-3 h-3 mr-0.5" />
                          {formatDate(order.createdAt)}
                        </p>
                        <p className="text-[9px] md:text-xs text-slate-500">
                          {totalItems} {totalItems === 1 ? 'item' : 'itens'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Resumo rápido sempre visível */}
                  <div className="px-3 md:px-4 py-2 md:py-3 bg-white border-b border-slate-100">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2 md:gap-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 md:w-8 md:h-8 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <DollarSign className="w-3.5 h-3.5 md:w-4 md:h-4 text-green-600" />
                        </div>
                        <div>
                          <p className="text-[9px] md:text-xs text-slate-500 font-medium">Total</p>
                          <p className="text-xs md:text-sm font-bold text-slate-900">
                            R$ {Number(order.totalPrice).toFixed(2)}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 md:w-8 md:h-8 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <MapPin className="w-3.5 h-3.5 md:w-4 md:h-4 text-purple-600" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-[9px] md:text-xs text-slate-500 font-medium">Endereço</p>
                          <p className="text-xs md:text-sm font-semibold text-slate-900 truncate">
                            {order.shippingStreet}, {order.shippingNumber}
                          </p>
                          <p className="text-[9px] md:text-xs text-slate-600">{order.shippingNeighborhood}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {order.shippingPhone && (
                          <>
                            <div className="w-7 h-7 md:w-8 md:h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                              <Phone className="w-3.5 h-3.5 md:w-4 md:h-4 text-blue-600" />
                            </div>
                            <div>
                              <p className="text-[9px] md:text-xs text-slate-500 font-medium">Contato</p>
                              <p className="text-xs md:text-sm font-semibold text-slate-900">{order.shippingPhone}</p>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Prévia dos itens - sempre visível */}
                  <div className="px-3 md:px-4 py-2 md:py-3">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-xs md:text-base font-bold text-slate-900 flex items-center">
                        <Package className="w-3.5 h-3.5 md:w-4 md:h-4 mr-1" />
                        Itens do Pedido ({totalItems})
                      </h4>
                      <button
                        onClick={() => toggleOrderExpansion(order.id)}
                        className="flex items-center gap-1 px-2 md:px-2.5 py-1 md:py-1.5 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 hover:border-slate-400 transition-all text-[10px] md:text-xs font-medium"
                      >
                        {isExpanded ? <EyeOff className="w-3 h-3 md:w-3.5 md:h-3.5" /> : <Eye className="w-3 h-3 md:w-3.5 md:h-3.5" />}
                        <span>{isExpanded ? 'Ocultar' : 'Ver Mais'}</span>
                      </button>
                    </div>

                    {/* Lista de itens - limitada quando não expandida */}
                    <div className="space-y-1.5 md:space-y-2">
                      {(isExpanded ? (order.orderitem || []) : (order.orderitem || []).slice(0, 2)).map((item) => {
                        // Verificar se é produto personalizado
                        const isCustomAcai = item.selectedOptionsSnapshot?.customAcai;
                        const isCustomSorvete = item.selectedOptionsSnapshot?.customSorvete;
                        const isCustomProduct = item.selectedOptionsSnapshot?.customProduct;
                        const customData = isCustomAcai || isCustomSorvete || isCustomProduct;
                        
                        // Verificar se o produto existe
                        if (!item.product) {
                          return null;
                        }
                        
                        return (
                          <div key={item.id} className="flex items-start justify-between p-2 md:p-3 bg-slate-50 rounded-lg border border-slate-200 hover:bg-slate-100 transition-colors">
                            <div className="flex items-start gap-2 md:gap-3 flex-1">
                              <div className="w-10 h-10 md:w-12 md:h-12 bg-purple-600 rounded-lg flex items-center justify-center shadow-sm flex-shrink-0">
                                <span className="text-base md:text-xl">
                                  {isCustomAcai ? '🍓' : isCustomSorvete ? '🍦' : customData ? '🎨' : '🥤'}
                                </span>
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1 md:gap-1.5 mb-0.5">
                                  <p className="font-bold text-slate-900 text-xs md:text-sm">{item.product.name}</p>
                                  {customData && (
                                    <span className={`inline-flex items-center px-1.5 py-0.5 rounded-md text-[9px] md:text-[10px] font-semibold ${
                                      isCustomAcai ? 'bg-purple-100 text-purple-700' :
                                      isCustomSorvete ? 'bg-blue-100 text-blue-700' : 
                                      'bg-green-100 text-green-700'
                                    }`}>
                                      {isCustomAcai ? '🍓' : isCustomSorvete ? '🍦' : '🎨'} Personalizado
                                    </span>
                                  )}
                                </div>
                                <p className="text-[9px] md:text-xs text-slate-600">Qtd: {item.quantity} × R$ {Number(item.priceAtOrder ?? 0).toFixed(2)}</p>
                                
                                {customData && customData.complementNames && Array.isArray(customData.complementNames) && customData.complementNames.length > 0 && (
                                  <div className="mt-1">
                                    <p className="text-[9px] md:text-xs font-semibold text-slate-600 mb-0.5">Complementos:</p>
                                    <div className="flex flex-wrap gap-0.5 md:gap-1">
                                      {customData.complementNames.map((complement: string, idx: number) => (
                                        <span 
                                          key={idx}
                                          className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[9px] md:text-[10px] font-medium bg-green-100 text-green-700 border border-green-200"
                                        >
                                          {complement}
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="text-right ml-2 flex-shrink-0">
                              <p className="text-xs md:text-sm font-bold text-purple-600">
                                R$ {(Number(item.priceAtOrder ?? 0) * item.quantity).toFixed(2)}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                      
                      {!isExpanded && (order.orderitem?.length || 0) > 2 && (
                        <div className="text-center py-1 md:py-2">
                          <p className="text-xs md:text-sm text-gray-500">
                            + {(order.orderitem?.length || 0) - 2} item(s) adicional(is)
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Informações detalhadas - só quando expandido */}
                  {isExpanded && (
                    <>
                      {/* Informações de entrega detalhadas */}
                      <div className="px-3 md:px-6 py-2 md:py-4 bg-blue-50 border-t border-gray-200">
                        <h4 className="text-sm md:text-lg font-semibold text-gray-900 mb-2 md:mb-3 flex items-center">
                          <MapPin className="w-4 h-4 md:w-5 md:h-5 mr-1 md:mr-2" />
                          Informações de Entrega
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-4">
                          <div className="space-y-1 md:space-y-2">
                            <div className="flex items-start space-x-2 md:space-x-3">
                              <Home className="w-4 h-4 md:w-5 md:h-5 text-gray-600 mt-1" />
                              <div>
                                <p className="text-xs md:text-base font-medium text-gray-900">Endereço Completo</p>
                                <p className="text-[10px] md:text-sm text-gray-700">
                                  {order.shippingStreet}, {order.shippingNumber}
                                  {order.shippingComplement && ` - ${order.shippingComplement}`}
                                </p>
                                <p className="text-[10px] md:text-sm text-gray-600">{order.shippingNeighborhood}</p>
                              </div>
                            </div>
                          </div>
                          
                          <div className="space-y-1 md:space-y-2">
                            {order.shippingPhone && (
                              <div className="flex items-center space-x-2 md:space-x-3">
                                <Phone className="w-4 h-4 md:w-5 md:h-5 text-gray-600" />
                                <div>
                                  <p className="text-xs md:text-base font-medium text-gray-900">Telefone de Contato</p>
                                  <p className="text-[10px] md:text-sm text-gray-700">{order.shippingPhone}</p>
                                </div>
                              </div>
                            )}
                            
                            <div className="flex items-center space-x-2 md:space-x-3">
                              {deliveryInfo.icon}
                              <div>
                                <p className="text-xs md:text-base font-medium text-gray-900">Tipo de Entrega</p>
                                <p className="text-[10px] md:text-sm text-gray-700">{deliveryInfo.label}</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Resumo financeiro detalhado */}
                      <div className="px-3 md:px-6 py-2 md:py-4 bg-green-50 border-t border-gray-200">
                        <h4 className="text-sm md:text-lg font-semibold text-gray-900 mb-2 md:mb-3 flex items-center">
                          <CreditCard className="w-4 h-4 md:w-5 md:h-5 mr-1 md:mr-2" />
                          Resumo Financeiro
                        </h4>
                        <div className="space-y-1 md:space-y-2">
                          <div className="flex justify-between text-xs md:text-base">
                            <span className="text-gray-700">Subtotal dos itens:</span>
                            <span className="text-gray-900">
                              R$ {(order.orderitem || []).reduce((sum, item) => 
                                sum + (Number(item.priceAtOrder ?? 0) * item.quantity), 0
                              ).toFixed(2)}
                            </span>
                          </div>
                          {order.deliveryType === 'delivery' && (
                            <div className="flex justify-between text-xs md:text-base">
                              <span className="text-gray-700">Taxa de entrega:</span>
                              <span className="text-gray-900">R$ 5,00</span>
                            </div>
                          )}
                          <div className="border-t border-gray-300 pt-1 md:pt-2">
                            <div className="flex justify-between items-center">
                              <span className="text-base md:text-xl font-bold text-gray-900">Total:</span>
                              <span className="text-lg md:text-2xl font-bold text-green-600">
                                R$ {Number(order.totalPrice).toFixed(2)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </>
                  )}

                  {/* Ações do pedido */}
                  <div className="px-3 md:px-4 py-2 md:py-2.5 border-t border-slate-200 bg-slate-50">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2">
                      <div className="flex items-center flex-wrap gap-2 md:gap-3">
                        <div className="text-[9px] md:text-xs text-slate-600">
                          Status: <span className="font-bold text-slate-900">{getStatusText(order.status)}</span>
                        </div>
                        <div className="text-[9px] md:text-xs text-slate-600">
                          ID: <span className="font-mono font-bold text-slate-900">#{order.id.toString().padStart(4, '0')}</span>
                        </div>
                      </div>
                      
                      <div className="flex flex-wrap gap-1.5 md:gap-2 w-full md:w-auto">
                        {order.status === 'pending_payment' && (
                          <button 
                            onClick={() => handleCancelOrder(order.id)}
                            disabled={cancelingOrders.has(order.id)}
                            className="flex items-center px-2.5 md:px-3 py-1.5 bg-red-600 text-white text-[10px] md:text-xs font-semibold rounded-lg hover:bg-red-700 transition-all disabled:bg-red-400 disabled:cursor-not-allowed shadow-sm"
                          >
                            <XCircle className="w-3 h-3 mr-1" />
                            {cancelingOrders.has(order.id) ? 'Cancelando...' : 'Cancelar'}
                          </button>
                        )}
                        
                        <button 
                          onClick={() => toggleOrderExpansion(order.id)}
                          className="flex items-center px-2.5 md:px-3 py-1.5 border border-slate-300 text-slate-700 text-[10px] md:text-xs font-semibold rounded-lg hover:bg-slate-100 hover:border-slate-400 transition-all shadow-sm"
                        >
                          {isExpanded ? (
                            <>
                              <EyeOff className="w-3 h-3 mr-1" />
                              Ocultar
                            </>
                          ) : (
                            <>
                              <Eye className="w-3 h-3 mr-1" />
                              Detalhes
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
