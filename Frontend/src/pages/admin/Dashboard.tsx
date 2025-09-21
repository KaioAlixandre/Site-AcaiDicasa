import React, { useState, useEffect } from 'react';
import { 
  DollarSign, 
  ShoppingCart, 
  TrendingUp, 
  RefreshCw,
  Calendar,
  Target
} from 'lucide-react';
import { apiService } from '../../services/api';
import { DashboardMetrics } from '../../types';
import MetricCard from '../../components/MetricCard';
import TopProductsTable from '../../components/TopProductsTable';
import WeeklyChart from '../../components/WeeklyChart';
import OrderStatusOverview from '../../components/OrderStatusOverview';

const Dashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  const fetchMetrics = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiService.getDashboardMetrics();
      setMetrics(data);
      setLastUpdate(new Date());
    } catch (err) {
      setError('Erro ao carregar métricas do dashboard');
      console.error('Erro ao buscar métricas:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, []);

  const formatLastUpdate = () => {
    return new Intl.DateTimeFormat('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }).format(lastUpdate);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-gray-600">Carregando dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
          <button 
            onClick={fetchMetrics}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Tentar Novamente
          </button>
        </div>
      </div>
    );
  }

  if (!metrics) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
              <p className="text-gray-600 mt-1">
                Visão geral do desempenho da sua loja
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-500">
                Última atualização: {formatLastUpdate()}
              </div>
              <button
                onClick={fetchMetrics}
                disabled={loading}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Atualizar
              </button>
            </div>
          </div>
        </div>

        {/* Cards de Métricas Principais */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <MetricCard
            title="Faturamento Hoje"
            value={metrics.daily.revenue}
            change={metrics.daily.revenueChange}
            icon={<DollarSign className="w-6 h-6" />}
            color="text-green-600"
            format="currency"
          />
          
          <MetricCard
            title="Vendas Hoje"
            value={metrics.daily.sales}
            change={metrics.daily.ordersChange}
            icon={<ShoppingCart className="w-6 h-6" />}
            color="text-blue-600"
            format="number"
          />
          
          <MetricCard
            title="Ticket Médio"
            value={metrics.daily.ticketAverage}
            icon={<Target className="w-6 h-6" />}
            color="text-purple-600"
            format="currency"
          />
          
          <MetricCard
            title="Pedidos Pendentes"
            value={metrics.pendingOrders}
            icon={<Calendar className="w-6 h-6" />}
            color="text-orange-600"
            format="number"
          />
        </div>

        {/* Status dos Pedidos e Ações */}
        <div className="mb-8">
          <OrderStatusOverview 
            statusData={metrics.todayOrdersStatus}
            pendingOrders={metrics.pendingOrders}
          />
        </div>

        {/* Gráficos e Tabelas */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Vendas da Semana */}
          <WeeklyChart 
            data={metrics.weekly.data}
            title="Vendas da Semana"
          />

          {/* Faturamento Semanal */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Resumo Semanal</h3>
              <TrendingUp className="w-5 h-5 text-green-500" />
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                <div>
                  <p className="text-sm text-green-700">Faturamento Total da Semana</p>
                  <p className="text-2xl font-bold text-green-900">
                    {new Intl.NumberFormat('pt-BR', {
                      style: 'currency',
                      currency: 'BRL'
                    }).format(metrics.weekly.revenue)}
                  </p>
                </div>
                <DollarSign className="w-8 h-8 text-green-600" />
              </div>

              <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                <div>
                  <p className="text-sm text-blue-700">Total de Pedidos na Semana</p>
                  <p className="text-2xl font-bold text-blue-900">
                    {metrics.weekly.data.reduce((sum, day) => sum + day.orders, 0)}
                  </p>
                </div>
                <ShoppingCart className="w-8 h-8 text-blue-600" />
              </div>

              <div className="flex items-center justify-between p-4 bg-purple-50 rounded-lg">
                <div>
                  <p className="text-sm text-purple-700">Ticket Médio da Semana</p>
                  <p className="text-2xl font-bold text-purple-900">
                    {new Intl.NumberFormat('pt-BR', {
                      style: 'currency',
                      currency: 'BRL'
                    }).format(
                      metrics.weekly.data.reduce((sum, day) => sum + day.orders, 0) > 0
                        ? metrics.weekly.revenue / metrics.weekly.data.reduce((sum, day) => sum + day.orders, 0)
                        : 0
                    )}
                  </p>
                </div>
                <Target className="w-8 h-8 text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Produtos Mais Vendidos */}
        <div className="mb-8">
          <TopProductsTable products={metrics.topProducts} />
        </div>

        {/* Insights e Dicas */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">💡 Insights</h3>
            <div className="space-y-3">
              {metrics.daily.revenueChange > 10 && (
                <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                  <p className="text-green-800 text-sm">
                    🚀 Excelente! O faturamento de hoje está {metrics.daily.revenueChange.toFixed(1)}% maior que ontem!
                  </p>
                </div>
              )}
              
              {metrics.topProducts.length > 0 && (
                <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-blue-800 text-sm">
                    🏆 Seu produto mais vendido é "{metrics.topProducts[0].name}" com {metrics.topProducts[0].quantitySold} unidades vendidas!
                  </p>
                </div>
              )}
              
              {metrics.daily.ticketAverage > 0 && (
                <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
                  <p className="text-purple-800 text-sm">
                    💰 Seu ticket médio hoje é de {new Intl.NumberFormat('pt-BR', {
                      style: 'currency',
                      currency: 'BRL'
                    }).format(metrics.daily.ticketAverage)}
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">📊 Próximas Ações</h3>
            <div className="space-y-3">
              {metrics.pendingOrders > 5 && (
                <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                  <p className="text-yellow-800 text-sm">
                    ⚠️ Você tem muitos pedidos pendentes. Considere processar os mais antigos primeiro.
                  </p>
                </div>
              )}
              
              {metrics.daily.sales === 0 && (
                <div className="p-3 bg-orange-50 rounded-lg border border-orange-200">
                  <p className="text-orange-800 text-sm">
                    📈 Ainda não houve vendas hoje. Que tal criar uma promoção especial?
                  </p>
                </div>
              )}
              
              <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                <p className="text-gray-800 text-sm">
                  ✅ Continue acompanhando suas métricas diariamente para melhores resultados!
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;