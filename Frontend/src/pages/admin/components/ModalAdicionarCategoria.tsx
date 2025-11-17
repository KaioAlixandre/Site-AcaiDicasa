import React, { useState } from 'react';

interface Props {
  onClose: () => void;
  onAdd: (name: string) => void;
}

const AddCategoryModal: React.FC<Props> = ({ onClose, onAdd }) => {
  const [name, setName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) onAdd(name.trim());
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl p-3 sm:p-4 w-full max-w-md shadow-lg">
        <h3 className="text-base sm:text-lg font-bold mb-2 sm:mb-3">Adicionar Categoria</h3>
        <form className="space-y-2 sm:space-y-3" onSubmit={handleSubmit}>
          <input
            name="name"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Nome da categoria"
            required
            className="w-full px-3 py-2 border rounded text-sm sm:text-base"
          />
          <div className="flex flex-col sm:flex-row gap-2 justify-end pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded bg-gray-200 text-sm sm:text-base">Cancelar</button>
            <button type="submit" className="px-4 py-2 rounded bg-indigo-600 text-white text-sm sm:text-base">Salvar</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddCategoryModal;