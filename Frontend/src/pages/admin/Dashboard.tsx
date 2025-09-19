import React, { useEffect, useState } from 'react';
import apiService from '../../services/api';

const Dashboard: React.FC = () => {
  const [daily, setDaily] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [pendingOrders, setPendingOrders] = useState<number>(0);

  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10); // 'YYYY-MM-DD'
    apiService.getDailySales(today).then(setDaily);
    apiService.getProductSales(today).then(setProducts);
    apiService.getPendingOrders().then(setPendingOrders); // Crie esse método para contar pedidos pendentes
  }, []);

  return (
    <div id="dashboard" className="page">
      <header className="mb-8">
        <h2 className="text-3xl font-bold text-slate-800">Dashboard</h2>
      </header>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl shadow-md flex items-center gap-4">
          <div>
            <p className="text-slate-500 text-sm">Faturamento (Hoje)</p>
            <p className="text-2xl font-bold text-slate-800">
              R$ {daily ? Number(daily.totalSales).toFixed(2) : '--'}
            </p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-md flex items-center gap-4">
          <div>
            <p className="text-slate-500 text-sm">Total de Vendas (Hoje)</p>
            <p className="text-2xl font-bold text-slate-800">
              {daily ? daily.orderCount : '--'}
            </p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-md flex items-center gap-4">
          <div>
            <p className="text-slate-500 text-sm">Pedidos Pendentes</p>
            <p className="text-2xl font-bold text-slate-800">
              {pendingOrders}
            </p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-md flex items-center gap-4">
          <div>
            <p className="text-slate-500 text-sm">Ticket Médio</p>
            <p className="text-2xl font-bold text-slate-800">
              R$ {daily ? Number(daily.averageOrderValue).toFixed(2) : '--'}
            </p>
          </div>
        </div>
      </div>
      <div className="bg-white p-6 rounded-xl shadow-md">
        <h3 className="text-lg font-semibold text-slate-800 mb-4">Produtos Mais Vendidos (Hoje)</h3>
        <ul className="space-y-2">
          {products.map((prod) => (
            <li key={prod.productId} className="flex justify-between">
              <span>{prod.product.name}</span>
              <span>{prod.unitsSold} vendidos</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default Dashboard;