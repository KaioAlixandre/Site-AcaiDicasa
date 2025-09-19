import React from 'react';
import { DollarSign, ShoppingBag, Loader, Users, Award } from 'lucide-react';

const Dashboard: React.FC<{ user: any[] }> = ({ user }) => (
  <div id="dashboard" className="page">
    <header className="mb-8">
      <h2 className="text-3xl font-bold text-slate-800">Dashboard</h2>
      <p className="text-slate-500">Visão geral das suas vendas e métricas.</p>
    </header>
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <div className="bg-white p-6 rounded-xl shadow-md flex items-center gap-4">
        <div className="bg-blue-100 p-3 rounded-full">
          <DollarSign className="text-blue-600" />
        </div>
        <div>
          <p className="text-slate-500 text-sm">Faturamento (Hoje)</p>
          <p className="text-2xl font-bold text-slate-800">R$ 457,80</p>
        </div>
      </div>
      <div className="bg-white p-6 rounded-xl shadow-md flex items-center gap-4">
        <div className="bg-green-100 p-3 rounded-full">
          <ShoppingBag className="text-green-600" />
        </div>
        <div>
          <p className="text-slate-500 text-sm">Pedidos (Hoje)</p>
          <p className="text-2xl font-bold text-slate-800">18</p>
        </div>
      </div>
      <div className="bg-white p-6 rounded-xl shadow-md flex items-center gap-4">
        <div className="bg-yellow-100 p-3 rounded-full">
          <Loader className="text-yellow-600" />
        </div>
        <div>
          <p className="text-slate-500 text-sm">Pedidos Pendentes</p>
          <p className="text-2xl font-bold text-slate-800">3</p>
        </div>
      </div>
      <div className="bg-white p-6 rounded-xl shadow-md flex items-center gap-4">
        <div className="bg-indigo-100 p-3 rounded-full">
          <Users className="text-indigo-600" />
        </div>
        <div>
          <p className="text-slate-500 text-sm">Total de Clientes</p>
          <p className="text-2xl font-bold text-slate-800">{user.length}</p>
        </div>
      </div>
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-md">
        <h3 className="text-lg font-semibold text-slate-800 mb-4">Vendas na Semana</h3>
        <div className="h-80 bg-slate-50 flex items-center justify-center rounded-lg">
          <p className="text-slate-400">[ Placeholder para o Gráfico de Vendas ]</p>
        </div>
      </div>
      <div className="bg-white p-6 rounded-xl shadow-md">
        <h3 className="text-lg font-semibold text-slate-800 mb-4">Produtos Mais Vendidos</h3>
        <ul className="space-y-4">
          <li className="flex items-center gap-4">
            <div className="bg-slate-100 rounded-lg p-2">
              <Award className="text-yellow-500" />
            </div>
            <div>
              <p className="font-semibold text-slate-700">Açaí Turbinado 500ml</p>
              <p className="text-sm text-slate-500">32 vendidos</p>
            </div>
          </li>
          <li className="flex items-center gap-4">
            <div className="bg-slate-100 rounded-lg p-2">
              <Award className="text-slate-400" />
            </div>
            <div>
              <p className="font-semibold text-slate-700">Creme de Ninho 300ml</p>
              <p className="text-sm text-slate-500">25 vendidos</p>
            </div>
          </li>
          <li className="flex items-center gap-4">
            <div className="bg-slate-100 rounded-lg p-2">
              <Award className="text-orange-400" />
            </div>
            <div>
              <p className="font-semibold text-slate-700">Suco de Laranja 500ml</p>
              <p className="text-sm text-slate-500">19 vendidos</p>
            </div>
          </li>
        </ul>
      </div>
    </div>
  </div>
);

export default Dashboard;