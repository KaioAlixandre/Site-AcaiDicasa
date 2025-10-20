import React from 'react';
import { Pencil, Trash2, Plus } from 'lucide-react';
import { Product, ProductCategory } from '../../types';
import ModalAdicionarProduto from './components/ModalAdicionarProduto';
import ModalEditarProduto from './components/ModalEditarProduto';
import ModalAdicionarCategoria from './components/ModalAdicionarCategoria';
import Products from '../Products';

const Produtos: React.FC<{
  products: Product[],
  categories: ProductCategory[],
  showAddModal: boolean,
  setShowAddModal: (show: boolean) => void,
  showAddCategoryModal: boolean,
  setShowAddCategoryModal: (show: boolean) => void,
  editProduct: Product | null,
  setEditProduct: (product: Product | null) => void,
  handleAddProduct: (data: any) => void,
  handleAddCategory: (name: string) => void,
  handleEdit: (product: Product) => void,
  handleUpdateProduct: (id: number, data: any) => void,
  handleDelete: (id: number) => void
}> = ({
  products, categories, showAddModal, setShowAddModal, showAddCategoryModal, setShowAddCategoryModal,
  editProduct, setEditProduct, handleAddProduct, handleAddCategory, handleEdit, handleUpdateProduct, handleDelete
}) => (
  <div id="produtos" className="page">
    <header className="mb-8 flex justify-between items-center">
      <div>
        <h2 className="text-3xl font-bold text-slate-800">Produtos</h2>
        <p className="text-slate-500">Cadastre e gerencie seus produtos, categorias e variações.</p>
      </div>
      <div className="flex gap-2">
        <button
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-semibold flex items-center gap-2 hover:bg-indigo-700 transition-colors"
          onClick={() => setShowAddModal(true)}
        >
          <Pencil className="w-5 h-5" />
          Novo Produto
        </button>
        <button
          className="bg-green-600 text-white px-4 py-2 rounded-lg font-semibold flex items-center gap-2 hover:bg-green-700 transition-colors"
          onClick={() => setShowAddCategoryModal(true)}
        >
          <Plus className="w-5 h-5" />
          Nova Categoria
        </button>
      </div>
    </header>
    <div className="bg-white p-2 rounded-xl shadow-md">
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="border-b border-slate-200 text-slate-500">
            <tr>
              <th className="p-4">Produto</th>
              <th className="p-4">Categoria</th>
              <th className="p-4 text-right">Preço Base</th>
              <th className="p-4 text-center">Status</th>
              <th className="p-4 text-center">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {products.map((prod) => (
              <tr key={prod.id} className="hover:bg-slate-50">
                <td className="p-4 font-medium text-slate-800">{prod.name}</td>
                <td className="p-4 text-slate-600">{prod.category?.name || '-'}</td>
                <td className="p-4 text-right font-medium text-slate-800">R$ {prod.price ? Number(prod.price).toFixed(2) : '--'}</td>
                <td className="p-4 text-center">
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${prod.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {prod.isActive ? 'Ativo' : 'Inativo'}
                  </span>
                </td>
                <td className="p-4 text-center space-x-2">
                  <button
                    className="p-2 text-slate-500 rounded-md hover:bg-slate-200 hover:text-indigo-600"
                    onClick={() => handleEdit(prod)}
                  >
                    <Pencil className="w-5 h-5" />
                  </button>
                  <button
                    className="p-2 text-slate-500 rounded-md hover:bg-slate-200 hover:text-red-600"
                    onClick={() => handleDelete(prod.id)}
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
    {showAddModal && (
      <ModalAdicionarProduto
        categories={categories}
        onClose={() => setShowAddModal(false)}
        onAdd={handleAddProduct}
      />
    )}
    {editProduct && (
      <ModalEditarProduto
        categories={categories}
        product={editProduct}
        onClose={() => setEditProduct(null)}
        onUpdate={handleUpdateProduct}
      />
    )}
    {showAddCategoryModal && (
      <ModalAdicionarCategoria
        onClose={() => setShowAddCategoryModal(false)}
        onAdd={handleAddCategory}
      />
    )}
  </div>
);

export default Produtos;