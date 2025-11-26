import React, { useEffect, useState } from 'react';
import { useNotification } from '../../components/NotificationProvider';
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

  const { notify } = useNotification();
  useEffect(() => {
    apiService.getStoreConfig().then((data) => {
      // Mapear os nomes dos campos do backend para o frontend
      const mappedData = {
        ...data,
        openTime: data.openingTime,
        closeTime: data.closingTime,
        diasAbertos: data.openDays ?? data.diasAbertos ?? '',
        promocaoTaxaAtiva: data.promocaoTaxaAtiva || false,
        promocaoDias: data.promocaoDias || '',
        promocaoValorMinimo: data.promocaoValorMinimo || ''
      };
      setConfig(mappedData);
      setLoading(false);
    }).catch(error => {
      console.error('Erro ao carregar configurações:', error);
      setLoading(false);
      notify('Erro ao carregar configurações', 'error');
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
    const days = config.diasAbertos ? config.diasAbertos.split(',') : [];
    const newDays = days.includes(day)
      ? days.filter((d: string) => d !== day)
      : [...days, day];
    setConfig((prev: any) => ({
      ...prev,
      diasAbertos: newDays.sort().join(','),
    }));
  };

  const handlePromoDayToggle = (day: string) => {
    const days = config.promocaoDias ? config.promocaoDias.split(',') : [];
    const newDays = days.includes(day)
      ? days.filter((d: string) => d !== day)
      : [...days, day];
    setConfig((prev: any) => ({
      ...prev,
      promocaoDias: newDays.sort().join(','),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Mapear os nomes dos campos do frontend para o backend
    const dataToSend = {
      ...config,
      openingTime: config.openTime,
      closingTime: config.closeTime,
      diasAbertos: config.diasAbertos ?? '',
    };
    try {
      await apiService.updateStoreConfig(dataToSend);
      setLoading(false);
      notify('Configurações salvas com sucesso!', 'success');
    } catch (error) {
      console.error('Erro ao salvar configurações:', error);
      setLoading(false);
      notify('Erro ao salvar configurações. Tente novamente.', 'error');
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
                    config.diasAbertos?.split(',').includes(dia.value)
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

          {/* Seção de Promoção de Taxa de Entrega */}
          <div className="border-t border-slate-200 pt-6 mt-6">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">🎉 Promoção de Frete Grátis</h3>
            
            <div className="flex items-center mb-4">
              <input
                type="checkbox"
                id="promocaoTaxaAtiva"
                name="promocaoTaxaAtiva"
                checked={config.promocaoTaxaAtiva || false}
                onChange={handleChange}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-slate-300 rounded"
              />
              <label htmlFor="promocaoTaxaAtiva" className="ml-2 block text-sm text-slate-700 font-medium">
                Ativar promoção de frete grátis
              </label>
            </div>

            {config.promocaoTaxaAtiva && (
              <div className="space-y-4 pl-6 border-l-2 border-indigo-200">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Valor mínimo para frete grátis (R$)
                  </label>
                  <input
                    type="number"
                    name="promocaoValorMinimo"
                    value={config.promocaoValorMinimo || ''}
                    onChange={handleChange}
                    min="0"
                    step="0.01"
                    placeholder="Ex: 30.00"
                    className="w-full md:w-64 p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    Clientes que gastarem este valor ou mais terão frete grátis
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Dias da promoção
                  </label>
                  <div className="grid grid-cols-7 gap-2">
                    {diasSemana.map((dia) => (
                      <button
                        key={dia.value}
                        type="button"
                        onClick={() => handlePromoDayToggle(dia.value)}
                        className={`p-2 text-sm font-medium rounded-lg border transition-colors ${
                          config.promocaoDias?.split(',').includes(dia.value)
                            ? 'bg-emerald-100 border-emerald-300 text-emerald-800'
                            : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        {dia.label}
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-slate-500 mt-2">
                    Selecione os dias em que a promoção estará ativa
                  </p>
                </div>

                <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-3">
                  <p className="text-sm text-indigo-800">
                    <strong>💡 Resumo:</strong> {config.promocaoDias ? (
                      <>
                        Frete grátis para pedidos acima de <strong>R$ {config.promocaoValorMinimo || '0,00'}</strong> nos dias selecionados.
                      </>
                    ) : (
                      'Selecione os dias e o valor mínimo para ativar a promoção.'
                    )}
                  </p>
                </div>
              </div>
            )}
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