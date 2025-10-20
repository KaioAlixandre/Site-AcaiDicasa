import React from 'react';
import { Users, TrendingUp } from 'lucide-react';
import { User } from '../../types';

const Clientes: React.FC<{ user: User[] }> = ({ user }) => {
  // Calcular LTV Médio baseado nos dados reais
  const calculateAverageLTV = () => {
    if (user.length === 0) return 0;
    
    const totalLTV = user.reduce((acc, cliente) => {
      const clienteLTV = cliente.order?.reduce((orderAcc, order) => orderAcc + Number(order.totalPrice), 0) || 0;
      return acc + clienteLTV;
    }, 0);
    
    return totalLTV / user.length;
  };

  const averageLTV = calculateAverageLTV();

  console.log('🔍 Debug - Dados dos usuários:', user);

  return (
  <div id="clientes" className="page">
    <header className="mb-8">
      <h2 className="text-3xl font-bold text-slate-800">Clientes</h2>
      <p className="text-slate-500">Visualize e gerencie sua base de clientes.</p>
    </header>
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
      <div className="bg-white p-6 rounded-xl shadow-md flex items-center gap-4">
        <div className="bg-indigo-100 p-3 rounded-full">
          <Users className="text-indigo-600" />
        </div>
        <div>
          <p className="text-slate-500 text-sm">Total de Clientes</p>
          <p className="text-2xl font-bold text-slate-800">{user.length}</p>
        </div>
      </div>
      <div className="bg-white p-6 rounded-xl shadow-md flex items-center gap-4">
        <div className="bg-green-100 p-3 rounded-full">
          <TrendingUp className="text-green-600" />
        </div>
        <div>
          <p className="text-slate-500 text-sm">LTV Médio</p>
          <p className="text-2xl font-bold text-slate-800">R$ {averageLTV.toFixed(2)}</p>
        </div>
      </div>
    </div>
    <div className="bg-white p-2 rounded-xl shadow-md">
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="border-b border-slate-200 text-slate-500">
            <tr>
              <th className="p-4">Nome do Cliente</th>
              <th className="p-4">Contato</th>
              <th className="p-4 text-center">Pedidos</th>
              <th className="p-4 text-right">Total Gasto (LTV)</th>
              <th className="p-4 text-center">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {user.map(cliente => {
              const totalGasto = cliente.order?.reduce((acc, order) => acc + Number(order.totalPrice), 0) || 0;
              const totalPedidos = cliente.order?.length || 0;
              
              return (
                <tr key={cliente.id} className="hover:bg-slate-50">
                  <td className="p-4 font-medium text-slate-800">{cliente.username}</td>
                  <td className="p-4 text-slate-600">{cliente.phone || '-'}</td>
                  <td className="p-4 text-center text-slate-600">{totalPedidos}</td>
                  <td className="p-4 text-right font-medium text-slate-800">
                    R$ {totalGasto.toFixed(2)}
                  </td>
                  <td className="p-4 text-center">
                    <button className="text-indigo-600 hover:text-indigo-800">Detalhes</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  </div>
  );
}

export default Clientes;