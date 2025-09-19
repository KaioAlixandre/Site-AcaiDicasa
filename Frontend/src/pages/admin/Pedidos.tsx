import React from 'react';
import { Printer, ArrowRightCircle, RotateCw } from 'lucide-react';
import { Order } from '../../types';

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
              <th className="p-4">Endereço</th>
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
                  {order.shippingStreet}, {order.shippingNumber}
                </td>
                <td className="p-4">
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full status-${order.status}`}>
                    {order.status}
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