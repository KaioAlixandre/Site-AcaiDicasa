import React from 'react';
import { OrderStatusCount } from '../types';
import { Clock, Package, Truck, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';

interface OrderStatusOverviewProps {
  statusData: OrderStatusCount[];
  pendingOrders: number;
}

const OrderStatusOverview: React.FC<OrderStatusOverviewProps> = ({ statusData, pendingOrders }) => {
  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'pending_payment':
        return {
          label: 'Aguardando Pagamento',
          icon: <Clock className="w-5 h-5" />,
          color: 'text-yellow-600',
          bgColor: 'bg-yellow-100'
        };
      case 'being_prepared':
        return {
          label: 'Preparando',
          icon: <Package className="w-5 h-5" />,
          color: 'text-blue-600',
          bgColor: 'bg-blue-100'
        };
      case 'ready_for_pickup':
        return {
          label: 'Pronto para Retirada',
          icon: <AlertTriangle className="w-5 h-5" />,
          color: 'text-orange-600',
          bgColor: 'bg-orange-100'
        };
      case 'on_the_way':
        return {
          label: 'A Caminho',
          icon: <Truck className="w-5 h-5" />,
          color: 'text-purple-600',
          bgColor: 'bg-purple-100'
        };
      case 'delivered':
        return {
          label: 'Entregue',
          icon: <CheckCircle className="w-5 h-5" />,
          color: 'text-green-600',
          bgColor: 'bg-green-100'
        };
      case 'canceled':
        return {
          label: 'Cancelado',
          icon: <XCircle className="w-5 h-5" />,
          color: 'text-red-600',
          bgColor: 'bg-red-100'
        };
      default:
        return {
          label: status,
          icon: <Clock className="w-5 h-5" />,
          color: 'text-gray-600',
          bgColor: 'bg-gray-100'
        };
    }
  };

  const totalOrders = statusData.reduce((sum, item) => sum + item.count, 0);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Status dos Pedidos de Hoje */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Pedidos de Hoje</h3>
        <div className="space-y-3">
          {statusData.length > 0 ? (
            statusData.map((status) => {
              const info = getStatusInfo(status.status);
              const percentage = totalOrders > 0 ? (status.count / totalOrders) * 100 : 0;
              
              return (
                <div key={status.status} className="flex items-center justify-between p-3 rounded-lg border border-gray-100">
                  <div className="flex items-center">
                    <div className={`p-2 rounded-lg ${info.bgColor} ${info.color}`}>
                      {info.icon}
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-900">{info.label}</p>
                      <p className="text-xs text-gray-500">{percentage.toFixed(1)}% do total</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold text-gray-900">{status.count}</p>
                  </div>
                </div>
              );
            })
          ) : (
            <p className="text-gray-500 text-center py-4">Nenhum pedido hoje</p>
          )}
          
          {totalOrders > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Total de Pedidos</span>
                <span className="text-lg font-bold text-gray-900">{totalOrders}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Resumo de Ações Necessárias */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Ações Necessárias</h3>
        <div className="space-y-4">
          <div className="flex items-center p-4 bg-yellow-50 rounded-lg border border-yellow-200">
            <AlertTriangle className="w-6 h-6 text-yellow-600 mr-3" />
            <div>
              <p className="font-medium text-yellow-800">Pedidos Pendentes</p>
              <p className="text-sm text-yellow-600">
                {pendingOrders} pedidos aguardando ação
              </p>
            </div>
            <div className="ml-auto">
              <span className="text-2xl font-bold text-yellow-800">{pendingOrders}</span>
            </div>
          </div>

          {/* Sugestões baseadas nos status */}
          {statusData.find(s => s.status === 'being_prepared' && s.count > 0) && (
            <div className="flex items-center p-4 bg-blue-50 rounded-lg border border-blue-200">
              <Package className="w-6 h-6 text-blue-600 mr-3" />
              <div>
                <p className="font-medium text-blue-800">Preparar Pedidos</p>
                <p className="text-sm text-blue-600">
                  {statusData.find(s => s.status === 'being_prepared')?.count} pedidos em preparação
                </p>
              </div>
            </div>
          )}

          {statusData.find(s => s.status === 'ready_for_pickup' && s.count > 0) && (
            <div className="flex items-center p-4 bg-orange-50 rounded-lg border border-orange-200">
              <AlertTriangle className="w-6 h-6 text-orange-600 mr-3" />
              <div>
                <p className="font-medium text-orange-800">Prontos para Retirada</p>
                <p className="text-sm text-orange-600">
                  {statusData.find(s => s.status === 'ready_for_pickup')?.count} pedidos aguardando
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OrderStatusOverview;