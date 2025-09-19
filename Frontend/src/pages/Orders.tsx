import React, { useState, useEffect } from 'react';
import { Package, Clock, CheckCircle, XCircle, Truck } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Order } from '../types';
import { apiService } from '../services/api';
import Loading from '../components/Loading';

const Orders: React.FC = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending_payment':
        return <Clock size={20} className="text-yellow-500" />;
      case 'being_prepared':
        return <Package size={20} className="text-blue-500" />;
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
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Meus Pedidos</h1>
          <p className="text-lg text-gray-600">
            Acompanhe o status dos seus pedidos
          </p>
        </div>

        {orders.length === 0 ? (
          <div className="text-center py-12">
            <Package size={64} className="text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Nenhum pedido encontrado
            </h2>
            <p className="text-gray-600 mb-8">
              Você ainda não fez nenhum pedido. Que tal começar agora?
            </p>
            <a
              href="/products"
              className="inline-flex items-center px-6 py-3 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 transition-colors"
            >
              Ver Produtos
            </a>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => (
              <div key={order.id} className="bg-white rounded-lg shadow-md overflow-hidden">
                {/* Header do pedido */}
                <div className="px-6 py-4 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <h3 className="text-lg font-semibold text-gray-900">
                        Pedido #{order.id}
                      </h3>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                        {getStatusIcon(order.status)}
                        <span className="ml-1">{getStatusText(order.status)}</span>
                      </span>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600">
                        {formatDate(order.createdAt)}
                      </p>
                      <p className="text-lg font-semibold text-gray-900">
                       R$ {order.totalPrice != null ? Number(order.totalPrice).toFixed(2) : '--'}

                      </p>
                    </div>
                  </div>
                </div>

                {/* Itens do pedido */}
                <div className="px-6 py-4">
                  <h4 className="text-sm font-medium text-gray-900 mb-3">
                    Itens do Pedido
                  </h4>
                  <div className="space-y-2">
                    {order.orderItems.map((item) => (
                      <div key={item.id} className="flex items-center justify-between py-2">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-pink-400 rounded-lg flex items-center justify-center">
                            <span className="text-lg">🥤</span>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {item.product.name}
                            </p>
                            <p className="text-xs text-gray-600">
                              Quantidade: {item.quantity}
                            </p>
                          </div>
                        </div>
                        <p className="text-sm font-medium text-gray-900">
                          R$ {Number(item.priceAtOrder ?? 0).toFixed(2)}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Endereço de entrega */}
                <div className="px-6 py-4 bg-gray-50">
                  <h4 className="text-sm font-medium text-gray-900 mb-2">
                    Endereço de Entrega
                  </h4>
                  <p className="text-sm text-gray-600">
                    {order.shippingStreet}, {order.shippingNumber}
                    {order.shippingComplement && ` - ${order.shippingComplement}`}
                  </p>
                  <p className="text-sm text-gray-600">
                    {order.shippingNeighborhood}
                  </p>
                  {order.shippingPhone && (
                    <p className="text-sm text-gray-600">
                      Telefone: {order.shippingPhone}
                    </p>
                  )}
                </div>

                {/* Ações do pedido */}
                <div className="px-6 py-4 border-t border-gray-200">
                  <div className="flex justify-between items-center">
                    <div className="text-sm text-gray-600">
                      Total: <span className="font-semibold">R$ {order.totalPrice != null ? Number(order.totalPrice).toFixed(2) : '--'}</span>
                    </div>
                    <div className="flex space-x-2">
                      {order.status === 'pending_payment' && (
                        <button className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors">
                          Cancelar Pedido
                        </button>
                      )}
                      <button className="px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors">
                        Ver Detalhes
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Orders;
