import React, { useEffect, useState } from 'react';
import apiService from '../../services/api';

const diasSemana = [
  { label: 'Dom', value: '0' },
  { label: 'Seg', value: '1' },
  { label: 'Ter', value: '2' },
  { label: 'Qua', value: '3' },
  { label: 'Qui', value: '4' },
  { label: 'Sex', value: '5' },
  { label: 'Sáb', value: '6' },
];

const Configuracoes: React.FC = () => {
  const [config, setConfig] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiService.getStoreConfig().then((data) => {
      console.log('Configuração recebida:', data);
      // Mapear os nomes dos campos do backend para o frontend
      const mappedData = {
        ...data,
        openTime: data.openingTime,
        closeTime: data.closingTime
      };
      console.log('Dados mapeados para o frontend:', mappedData);
      setConfig(mappedData);
      setLoading(false);
    }).catch(error => {
      console.error('Erro ao carregar configurações:', error);
      setLoading(false);
    });
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setConfig((prev: any) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleDayToggle = (day: string) => {
    const days = config.openDays ? config.openDays.split(',') : [];
    const newDays = days.includes(day)
      ? days.filter((d: string) => d !== day)
      : [...days, day];
    setConfig((prev: any) => ({
      ...prev,
      openDays: newDays.sort().join(','),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    // Mapear os nomes dos campos do frontend para o backend
    const dataToSend = {
      ...config,
      openingTime: config.openTime,
      closingTime: config.closeTime
    };
    
    console.log('Dados que serão enviados para o backend:', dataToSend);
    
    try {
      await apiService.updateStoreConfig(dataToSend);
      setLoading(false);
      alert('Configurações salvas com sucesso!');
    } catch (error) {
      console.error('Erro ao salvar configurações:', error);
      setLoading(false);
      alert('Erro ao salvar configurações. Tente novamente.');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-gray-600">Carregando configurações...</div>
      </div>
    );
  }

  if (!config) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Erro ao carregar configurações.</p>
      </div>
    );
  }

  return (
    <div id="configuracoes" className="page">
      <header className="mb-4 sm:mb-6">
        <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-slate-800">Configurações</h2>
        <p className="text-xs sm:text-sm text-slate-500">Configure o funcionamento da sua loja.</p>
      </header>
      <div className="bg-white p-3 sm:p-4 md:p-6 rounded-xl shadow-md">
        <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Horário de Abertura
              </label>
              <input
                type="time"
                name="openTime"
                value={config.openTime || ''}
                onChange={handleChange}
                className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Horário de Fechamento
              </label>
              <input
                type="time"
                name="closeTime"
                value={config.closeTime || ''}
                onChange={handleChange}
                className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Dias de Funcionamento
            </label>
            <div className="grid grid-cols-7 gap-2">
              {diasSemana.map((dia) => (
                <button
                  key={dia.value}
                  type="button"
                  onClick={() => handleDayToggle(dia.value)}
                  className={`p-2 text-sm font-medium rounded-lg border transition-colors ${
                    config.openDays?.split(',').includes(dia.value)
                      ? 'bg-indigo-100 border-indigo-300 text-indigo-800'
                      : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {dia.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="isOpen"
              name="isOpen"
              checked={config.isOpen || false}
              onChange={handleChange}
              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-slate-300 rounded"
            />
            <label htmlFor="isOpen" className="ml-2 block text-sm text-slate-700">
              Loja aberta (desmarque para fechar temporariamente)
            </label>
          </div>

          <div className="pt-4">
            <button
              type="submit"
              className="bg-indigo-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-indigo-700 transition-colors w-full sm:w-auto"
              disabled={loading}
            >
              Salvar Alterações
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Configuracoes;