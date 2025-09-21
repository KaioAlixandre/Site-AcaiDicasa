import React from 'react';
import { WeeklyData } from '../types';

interface WeeklyChartProps {
  data: WeeklyData[];
  title: string;
}

const WeeklyChart: React.FC<WeeklyChartProps> = ({ data, title }) => {
  const maxRevenue = Math.max(...data.map(d => d.revenue));
  const maxOrders = Math.max(...data.map(d => d.orders));

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-6">{title}</h3>
      
      <div className="space-y-4">
        {data.map((day, index) => (
          <div key={index} className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-700 w-16">{day.day}</span>
              <div className="flex-1 mx-4">
                <div className="flex items-center space-x-2">
                  {/* Barra de Faturamento */}
                  <div className="flex-1">
                    <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                      <span>Faturamento</span>
                      <span>{formatCurrency(day.revenue)}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-green-500 h-2 rounded-full transition-all duration-300"
                        style={{
                          width: maxRevenue > 0 ? `${(day.revenue / maxRevenue) * 100}%` : '0%'
                        }}
                      ></div>
                    </div>
                  </div>
                  
                  {/* Barra de Pedidos */}
                  <div className="flex-1">
                    <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                      <span>Pedidos</span>
                      <span>{day.orders}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                        style={{
                          width: maxOrders > 0 ? `${(day.orders / maxOrders) * 100}%` : '0%'
                        }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-4 flex items-center justify-center space-x-6 text-sm">
        <div className="flex items-center">
          <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
          <span className="text-gray-600">Faturamento</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
          <span className="text-gray-600">Pedidos</span>
        </div>
      </div>
    </div>
  );
};

export default WeeklyChart;