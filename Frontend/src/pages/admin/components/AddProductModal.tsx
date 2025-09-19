import React, { useState } from 'react';
import { ProductCategory } from '../../../types';

interface Props {
  categories: ProductCategory[];
  onClose: () => void;
  onAdd: (data: any) => void;
}

const AddProductModal: React.FC<Props> = ({ categories, onClose, onAdd }) => {
  const [form, setForm] = useState({
    name: '',
    price: '',
    categoryId: '',
    isActive: true,
    description: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    let newValue: string | boolean = value;
    if (type === 'checkbox' && e.target instanceof HTMLInputElement) {
      newValue = e.target.checked;
    }
    setForm({ ...form, [name]: newValue });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAdd({
      name: form.name,
      price: parseFloat(form.price),
      categoryId: Number(form.categoryId),
      isActive: form.isActive,
      description: form.description
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-8 w-full max-w-md shadow-lg">
        <h3 className="text-xl font-bold mb-4">Adicionar Produto</h3>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <input name="name" value={form.name} onChange={handleChange} placeholder="Nome" required className="w-full px-3 py-2 border rounded" />
          <input name="price" value={form.price} onChange={handleChange} placeholder="Preço" required type="number" step="0.01" className="w-full px-3 py-2 border rounded" />
          <select name="categoryId" value={form.categoryId} onChange={handleChange} required className="w-full px-3 py-2 border rounded">
            <option value="">Selecione a categoria</option>
            {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
          </select>
          <textarea name="description" value={form.description} onChange={handleChange} placeholder="Descrição" className="w-full px-3 py-2 border rounded" />
          <div className="flex items-center gap-2">
            <input type="checkbox" name="isActive" checked={form.isActive} onChange={handleChange} />
            <span>Ativo</span>
          </div>
          <div className="flex gap-2 justify-end pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded bg-gray-200">Cancelar</button>
            <button type="submit" className="px-4 py-2 rounded bg-indigo-600 text-white">Salvar</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddProductModal;