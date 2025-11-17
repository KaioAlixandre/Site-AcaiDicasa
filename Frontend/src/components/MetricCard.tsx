import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  change?: number;
  icon: React.ReactNode;
  color: string;
  format?: 'currency' | 'number' | 'percentage';
}

const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  change,
  icon,
  color,
  format = 'number'
}) => {
  const formatValue = (val: string | number) => {
    const numVal = typeof val === 'string' ? parseFloat(val) : val;
    
    switch (format) {
      case 'currency':
        return new Intl.NumberFormat('pt-BR', {
          style: 'currency',
          currency: 'BRL'
        }).format(numVal);
      case 'percentage':
        return `${numVal.toFixed(1)}%`;
      default:
        return numVal.toLocaleString('pt-BR');
    }
  };

  const getChangeIcon = () => {
    if (!change) return null;
    return change >= 0 ? 
      <TrendingUp className="w-4 h-4" /> : 
      <TrendingDown className="w-4 h-4" />;
  };

  const getChangeColor = () => {
    if (!change) return 'text-gray-500';
    return change >= 0 ? 'text-green-600' : 'text-red-600';
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-3 sm:p-4 md:p-6 border border-gray-100 hover:shadow-lg transition-shadow">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <div className={`p-2 sm:p-3 rounded-lg ${color} bg-opacity-10`}>
            <div className={`${color}`}>
              {icon}
            </div>
          </div>
          <div className="ml-2 sm:ml-4">
            <p className="text-[10px] sm:text-xs md:text-sm font-medium text-gray-600 uppercase tracking-wide">{title}</p>
            <p className="text-base sm:text-xl md:text-2xl font-bold text-gray-900 mt-0.5 sm:mt-1">
              {formatValue(value)}
            </p>
          </div>
        </div>
      </div>
      
      {change !== undefined && (
        <div className="mt-2 sm:mt-3 md:mt-4 flex items-center">
          <div className={`flex items-center ${getChangeColor()}`}>
            {getChangeIcon()}
            <span className="ml-1 text-xs sm:text-sm font-medium">
              {Math.abs(change).toFixed(1)}%
            </span>
          </div>
          <span className="text-gray-500 text-[10px] sm:text-xs md:text-sm ml-2">
            comparado a ontem
          </span>
        </div>
      )}
    </div>
  );
};

export default MetricCard;