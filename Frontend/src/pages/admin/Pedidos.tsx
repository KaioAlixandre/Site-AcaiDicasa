import React from 'react';
import { Printer, ArrowRightCircle, RotateCw, Truck, MapPin } from 'lucide-react';
import { Order } from '../../types';

// Função para traduzir status para português
const getStatusInPortuguese = (status: string) => {
  const statusMap: { [key: string]: string } = {
    'pending_payment': 'Pagamento Pendente',
    'being_prepared': 'Sendo Preparado',
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
    'on_the_way': 'bg-purple-100 text-purple-800 border border-purple-200',
    'delivered': 'bg-green-100 text-green-800 border border-green-200',
    'canceled': 'bg-red-100 text-red-800 border border-red-200'
  };
  return statusStyles[status] || 'bg-gray-100 text-gray-800 border border-gray-200';
};

const Pedidos: React.FC<{ orders: Order[], handleAdvanceStatus: (order: Order) => void }> = ({ orders, handleAdvanceStatus }) => (
  <div id="pedidos" className="page">
    <header className="mb-8 flex justify-between items-center">
      <div>
        <h2 className="text-3xl font-bold text-slate-800">Pedidos</h2>
        <p className="text-slate-500">Gerencie os pedidos recebidos.</p>
      </div>
      <button className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-semibold flex items-center gap-2 hover:bg-indigo-700 transition-colors">
        <RotateCw className="w-4 h-4" />
        Atualizar
      </button>
    </header>
    <div className="bg-white p-2 rounded-xl shadow-md">
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
            {orders.map(order => (
              <tr key={order.id} className="hover:bg-slate-50">
                <td className="p-4">
                  <div className="font-medium text-slate-800">{order.user?.username || '-'}</div>
                  <div className="text-sm text-slate-500">{new Date(order.createdAt).toLocaleTimeString()}</div>
                </td>
                <td className="p-4 text-slate-600">
                {order.orderItems.map(item => (
                  <div key={item.id}>
                    {item.product?.name || 'Produto'} x {item.quantity}
                  </div>
                ))}
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
                  <button title="Imprimir Pedido" className="p-2 text-slate-500 rounded-md hover:bg-slate-200 hover:text-blue-600"><Printer className="w-5 h-5" /></button>
                  <button title="Avançar Status" onClick={() => handleAdvanceStatus(order)} className="p-2 text-slate-500 rounded-md hover:bg-slate-200 hover:text-green-600"><ArrowRightCircle className="w-5 h-5" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  </div>
);

export default Pedidos;