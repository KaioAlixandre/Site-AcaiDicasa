import React from 'react';

const Configuracoes: React.FC = () => (
  <div id="configuracoes" className="page">
    <header className="mb-8">
      <h2 className="text-3xl font-bold text-slate-800">Configurações da Loja</h2>
      <p className="text-slate-500">Defina o horário de funcionamento e o status da loja.</p>
    </header>
    <div className="max-w-2xl mx-auto bg-white p-8 rounded-xl shadow-md">
      <form className="space-y-6">
        <div>
          <label className="block text-lg font-semibold text-slate-700 mb-2">Status da Loja</label>
          <div className="flex items-center justify-between bg-slate-50 p-4 rounded-lg">
            <span className="font-medium text-slate-600">Fechar/Abrir a loja manualmente</span>
            <label htmlFor="store-status" className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" id="store-status" className="sr-only peer" defaultChecked />
              <div className="w-14 h-8 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-1 after:left-[4px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-green-500"></div>
            </label>
          </div>
          <p className="text-sm text-slate-500 mt-2">Esta opção sobrepõe o horário de funcionamento. Útil para feriados ou imprevistos.</p>
        </div>
        <div>
          <label className="block text-lg font-semibold text-slate-700 mb-2">Horário de Funcionamento</label>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="opening-time" className="block text-sm font-medium text-slate-600 mb-1">Abre às</label>
              <input type="time" id="opening-time" defaultValue="14:00" className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label htmlFor="closing-time" className="block text-sm font-medium text-slate-600 mb-1">Fecha às</label>
              <input type="time" id="closing-time" defaultValue="22:00" className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
          </div>
        </div>
        <div>
          <label className="block text-lg font-semibold text-slate-700 mb-2">Dias de Funcionamento</label>
          <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-7 gap-2">
            {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((dia, i) => (
              <label key={dia} className="flex items-center gap-2 p-3 border rounded-lg cursor-pointer hover:bg-slate-50">
                <input type="checkbox" className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" defaultChecked={i > 0} />
                {dia}
              </label>
            ))}
          </div>
        </div>
        <div className="pt-4 text-right">
          <button type="submit" className="bg-indigo-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-indigo-700 transition-colors w-full sm:w-auto">
            Salvar Alterações
          </button>
        </div>
      </form>
    </div>
  </div>
);

export default Configuracoes;