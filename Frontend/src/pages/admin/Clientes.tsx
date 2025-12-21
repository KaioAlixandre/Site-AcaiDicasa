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

  // Ordenar clientes por número de pedidos (decrescente) e, em caso de empate, por valor gasto (decrescente)
  const clientesOrdenados = [...user].sort((a, b) => {
    const pedidosA = a.order?.length || 0;
    const pedidosB = b.order?.length || 0;
    
    // Calcular total gasto de cada cliente
    const totalGastoA = (a.order || []).reduce((acc, order) => {
      const valor = Number(order.totalPrice) || 0;
      return acc + (isNaN(valor) ? 0 : valor);
    }, 0);
    
    const totalGastoB = (b.order || []).reduce((acc, order) => {
      const valor = Number(order.totalPrice) || 0;
      return acc + (isNaN(valor) ? 0 : valor);
    }, 0);
    
    // Primeiro ordena por número de pedidos (decrescente)
    if (pedidosB !== pedidosA) {
      return pedidosB - pedidosA;
    }
    
    // Se o número de pedidos for igual, ordena por valor gasto (decrescente)
    return totalGastoB - totalGastoA;
  });

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
          <p className="text-lg sm:text-xl font-bold text-slate-800">R$ {isNaN(averageLTV) ? '0.00' : averageLTV.toFixed(2)}</p>
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
            {clientesOrdenados.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-8 text-center text-slate-500">
                  Nenhum cliente cadastrado
                </td>
              </tr>
            ) : (
              clientesOrdenados.map(cliente => {
                // Calcular total gasto e quantidade de pedidos
                const pedidos = cliente.order || [];
                const totalGasto = pedidos.reduce((acc, order) => {
                  const valor = Number(order.totalPrice) || 0;
                  return acc + (isNaN(valor) ? 0 : valor);
                }, 0);
                const totalPedidos = pedidos.length;
                
                // Calcular ticket médio
                const ticketMedio = totalPedidos > 0 ? totalGasto / totalPedidos : 0;
                
                return (
                  <tr key={cliente.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-2 sm:p-3">
                      <div className="font-medium text-slate-800 text-xs sm:text-sm">{cliente.nomeUsuario}</div>
                      <div className="text-xs text-slate-500 md:hidden">{cliente.telefone || '-'}</div>
                      {cliente.email && (
                        <div className="text-xs text-slate-400 mt-0.5">{cliente.email}</div>
                      )}
                    </td>
                    <td className="p-2 sm:p-3 text-slate-600 text-xs hidden md:table-cell">
                      <div>{cliente.telefone || '-'}</div>
                      {cliente.email && (
                        <div className="text-xs text-slate-400 mt-0.5">{cliente.email}</div>
                      )}
                    </td>
                    <td className="p-2 sm:p-3 text-center">
                      <div className="flex flex-col items-center">
                        <span className="text-slate-800 font-semibold text-sm sm:text-base">{totalPedidos}</span>
                        {totalPedidos > 0 && (
                          <span className="text-xs text-slate-500 mt-0.5">
                            Ticket médio: R$ {ticketMedio.toFixed(2)}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="p-2 sm:p-3 text-right">
                      <div className="font-medium text-slate-800 text-sm sm:text-base">
                        R$ {totalGasto.toFixed(2)}
                      </div>
                      {totalPedidos > 0 && (
                        <div className="text-xs text-slate-500 mt-0.5">
                          {totalPedidos} pedido{totalPedidos !== 1 ? 's' : ''}
                        </div>
                      )}
                    </td>
                    <td className="p-2 sm:p-3 text-center">
                      <button className="text-indigo-600 hover:text-indigo-800 text-xs font-medium hover:underline">
                        Detalhes
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  </div>
  );
}

export default Clientes;