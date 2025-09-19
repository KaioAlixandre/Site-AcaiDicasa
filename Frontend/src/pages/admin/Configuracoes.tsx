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
      setConfig(data);
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
    await apiService.updateStoreConfig(config);
    setLoading(false);
    alert('Configurações salvas com sucesso!');
  };

  if (loading || !config) {
    return <div className="p-8 text-center text-slate-500">Carregando...</div>;
  }

  return (
    <div id="configuracoes" className="page">
      <header className="mb-8">
        <h2 className="text-3xl font-bold text-slate-800">Configurações da Loja</h2>
        <p className="text-slate-500">Defina o horário de funcionamento e o status da loja.</p>
      </header>
      <div className="max-w-2xl mx-auto bg-white p-8 rounded-xl shadow-md">
        <form className="space-y-6" onSubmit={handleSubmit}>
          <div>
            <label className="block text-lg font-semibold text-slate-700 mb-2">Status da Loja</label>
            <div className="flex items-center justify-between bg-slate-50 p-4 rounded-lg">
              <span className="font-medium text-slate-600">Fechar/Abrir a loja manualmente</span>
              <label htmlFor="isOpen" className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  id="isOpen"
                  name="isOpen"
                  checked={!!config.isOpen}
                  onChange={handleChange}
                  className="sr-only peer"
                />
                <div className="w-14 h-8 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-1 after:left-[4px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-green-500"></div>
              </label>
            </div>
            <p className="text-sm text-slate-500 mt-2">Esta opção sobrepõe o horário de funcionamento. Útil para feriados ou imprevistos.</p>
          </div>
          <div>
            <label className="block text-lg font-semibold text-slate-700 mb-2">Horário de Funcionamento</label>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="openingTime" className="block text-sm font-medium text-slate-600 mb-1">Abre às</label>
                <input
                  type="time"
                  id="openingTime"
                  name="openingTime"
                  value={config.openingTime || ''}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>
              <div>
                <label htmlFor="closingTime" className="block text-sm font-medium text-slate-600 mb-1">Fecha às</label>
                <input
                  type="time"
                  id="closingTime"
                  name="closingTime"
                  value={config.closingTime || ''}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>
            </div>
          </div>
          <div>
            <label className="block text-lg font-semibold text-slate-700 mb-2">Dias de Funcionamento</label>
            <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-7 gap-2">
              {diasSemana.map((dia) => (
                <label key={dia.value} className="flex items-center gap-2 p-3 border rounded-lg cursor-pointer hover:bg-slate-50">
                  <input
                    type="checkbox"
                    checked={config.openDays?.split(',').includes(dia.value)}
                    onChange={() => handleDayToggle(dia.value)}
                    className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  {dia.label}
                </label>
              ))}
            </div>
          </div>
          <div className="pt-4 text-right">
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