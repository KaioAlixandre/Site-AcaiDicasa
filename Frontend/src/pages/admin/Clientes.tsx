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
    <header className="mb-4 sm:mb-6">
      <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-slate-800">Clientes</h2>
      <p className="text-xs sm:text-sm text-slate-500">Visualize e gerencie sua base de clientes.</p>
    </header>
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 mb-4 sm:mb-6">
      <div className="bg-white p-3 sm:p-4 rounded-xl shadow-md flex items-center gap-2 sm:gap-3">
        <div className="bg-indigo-100 p-2 rounded-full">
          <Users className="text-indigo-600 w-4 h-4 sm:w-5 sm:h-5" />
        </div>
        <div>
          <p className="text-slate-500 text-xs">Total de Clientes</p>
          <p className="text-lg sm:text-xl font-bold text-slate-800">{user.length}</p>
        </div>
      </div>
      <div className="bg-white p-3 sm:p-4 rounded-xl shadow-md flex items-center gap-2 sm:gap-3">
        <div className="bg-green-100 p-2 rounded-full">
          <TrendingUp className="text-green-600 w-4 h-4 sm:w-5 sm:h-5" />
        </div>
        <div>
          <p className="text-slate-500 text-xs">LTV Médio</p>
          <p className="text-lg sm:text-xl font-bold text-slate-800">R$ {averageLTV.toFixed(2)}</p>
        </div>
      </div>
    </div>
    <div className="bg-white p-2 sm:p-3 rounded-xl shadow-md">
      <div className="overflow-x-auto">
        <table className="w-full text-left min-w-[600px]">
          <thead className="border-b border-slate-200 text-slate-500">
            <tr>
              <th className="p-2 sm:p-3 text-xs">Nome do Cliente</th>
              <th className="p-2 sm:p-3 text-xs hidden md:table-cell">Contato</th>
              <th className="p-2 sm:p-3 text-center text-xs">Pedidos</th>
              <th className="p-2 sm:p-3 text-right text-xs">Total Gasto</th>
              <th className="p-2 sm:p-3 text-center text-xs">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {user.map(cliente => {
              const totalGasto = cliente.order?.reduce((acc, order) => acc + Number(order.totalPrice), 0) || 0;
              const totalPedidos = cliente.order?.length || 0;
              
              return (
                <tr key={cliente.id} className="hover:bg-slate-50">
                  <td className="p-2 sm:p-3">
                    <div className="font-medium text-slate-800 text-xs sm:text-sm">{cliente.nomeUsuario}</div>
                    <div className="text-xs text-slate-500 md:hidden">{cliente.telefone || '-'}</div>
                  </td>
                  <td className="p-2 sm:p-3 text-slate-600 text-xs hidden md:table-cell">{cliente.telefone || '-'}</td>
                  <td className="p-2 sm:p-3 text-center text-slate-600 text-xs sm:text-sm">{totalPedidos}</td>
                  <td className="p-2 sm:p-3 text-right font-medium text-slate-800 text-xs sm:text-sm">
                    R$ {totalGasto.toFixed(2)}
                  </td>
                  <td className="p-2 sm:p-3 text-center">
                    <button className="text-indigo-600 hover:text-indigo-800 text-xs">Detalhes</button>
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