import React, { useEffect, useState } from 'react';
import {
  Pencil, Trash2, LayoutDashboard, ShoppingCart, Package, Users, Settings, LogOut,
  DollarSign, ShoppingBag, Loader, Award, TrendingUp, Eye, RotateCw, ArrowRightCircle, Sprout, Plus, Printer
} from 'lucide-react';
import apiService from '../services/api';
import { Product, ProductCategory, User, Order } from '../types';



// Modais
const AddProductModal = ({ onClose, onAdd, categories }: { onClose: () => void, onAdd: (data: any) => void, categories: ProductCategory[] }) => {
  const [form, setForm] = useState({ name: '', price: '', categoryId: '', active: true });

  

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAdd({
      name: form.name,
      price: parseFloat(form.price),
      categoryId: Number(form.categoryId),
      active: form.active,
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
          <div className="flex items-center gap-2">
            <input type="checkbox" checked={form.active} onChange={e => setForm({ ...form, active: e.target.checked })} />
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

const EditProductModal = ({
  product, onClose, onUpdate, categories
}: { product: Product, onClose: () => void, onUpdate: (id: number, data: any) => void, categories: ProductCategory[] }) => {
  const [form, setForm] = useState({
    name: product.name,
    price: product.price.toString(),
    categoryId: product.category?.id?.toString() || '',
    active: product.isActive,
  });

  // Remove local categories state and fetching, use passed prop instead

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdate(product.id, {
      name: form.name,
      price: parseFloat(form.price),
      categoryId: Number(form.categoryId),
      active: form.active,
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-8 w-full max-w-md shadow-lg">
        <h3 className="text-xl font-bold mb-4">Editar Produto</h3>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <input name="name" value={form.name} onChange={handleChange} placeholder="Nome" required className="w-full px-3 py-2 border rounded" />
          <input name="price" value={form.price} onChange={handleChange} placeholder="Preço" required type="number" step="0.01" className="w-full px-3 py-2 border rounded" />
          <select name="categoryId" value={form.categoryId} onChange={handleChange} required className="w-full px-3 py-2 border rounded">
            <option value="">Selecione a categoria</option>
            {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
          </select>
          <div className="flex items-center gap-2">
            <input type="checkbox" checked={form.active} onChange={e => setForm({ ...form, active: e.target.checked })} />
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

// Modal para adicionar categoria
const AddCategoryModal = ({ onClose, onAdd }: { onClose: () => void, onAdd: (name: string) => void }) => {
  const [name, setName] = useState('');
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) onAdd(name.trim());
  };
  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-8 w-full max-w-md shadow-lg">
        <h3 className="text-xl font-bold mb-4">Adicionar Categoria</h3>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <input
            name="name"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Nome da categoria"
            required
            className="w-full px-3 py-2 border rounded"
          />
          <div className="flex gap-2 justify-end pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded bg-gray-200">Cancelar</button>
            <button type="submit" className="px-4 py-2 rounded bg-indigo-600 text-white">Salvar</button>
          </div>
        </form>
      </div>
    </div>
  );
};

const pages = [
  { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard /> },
  { id: 'pedidos', label: 'Pedidos', icon: <ShoppingCart /> },
  { id: 'produtos', label: 'Produtos', icon: <Package /> },
  { id: 'clientes', label: 'Clientes', icon: <Users /> },
  { id: 'configuracoes', label: 'Configurações', icon: <Settings /> }
];

const Admin: React.FC = () => {
  const [activePage, setActivePage] = useState('dashboard');
  const [products, setProducts] = useState<Product[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAddCategoryModal, setShowAddCategoryModal] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [user, setUser] = useState<User[]>([]); // Simulação de usuário logado
  const [orders, setOrders] = useState<Order[]>([]); // Estado para pedidos

  useEffect(() => {
    if (activePage === 'produtos') {
      apiService.getProducts().then(setProducts);
    }
  }, [activePage, showAddModal, editProduct]);

  useEffect(() => {
    apiService.getCategories().then(setCategories);
  }, []); // Busca as categorias quando o componente Admin é montado

  useEffect(() => {
  if (activePage === 'clientes') {
    apiService.getUsers().then(setUser);
  }
}, [activePage]);

useEffect(() => {
  if (activePage === 'pedidos') {
    apiService.getOrders().then(setOrders);
  }
}, [activePage]);

  const handleAddProduct = async (data: any) => {
    await apiService.createProduct(data);
    setShowAddModal(false);
  };

  const handleAddCategory = async (name: string) => {
    await apiService.addCategory(name);
    setShowAddCategoryModal(false);
    setCategories(await apiService.getCategories());
    // Se quiser atualizar a lista de categorias, chame a função que busca as categorias aqui
  };

  const handleEdit = (product: Product) => setEditProduct(product);

  const handleUpdateProduct = async (id: number, data: any) => {
    await apiService.updateProduct(id, data);
    setEditProduct(null);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Deseja remover este produto?')) {
      await apiService.deleteProduct(id);
      setProducts(await apiService.getProducts());
    }
  };

  return (
    <div className="flex h-screen bg-slate-100 font-inter">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-800 text-slate-300 flex flex-col fixed h-full">
        <div className="h-20 flex items-center justify-center border-b border-slate-700">
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Sprout />
            <span>Açaí Dicasa</span>
          </h1>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          {pages.map(page => (
            <button
              key={page.id}
              onClick={() => setActivePage(page.id)}
              className={`sidebar-item flex items-center gap-3 px-4 py-3 rounded-lg transition-all hover:bg-slate-700 w-full text-left ${
                activePage === page.id ? 'active bg-indigo-600 text-white shadow' : ''
              }`}
            >
              <span className="w-5 h-5">{page.icon}</span>
              <span className="font-medium">{page.label}</span>
            </button>
          ))}
        </nav>
        <div className="p-4 border-t border-slate-700">
          <button className="flex items-center gap-3 px-4 py-3 rounded-lg transition-all text-red-400 hover:bg-red-900/50 w-full">
            <LogOut />
            <span className="font-medium">Sair</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="ml-64 flex-1 p-6 md:p-8 overflow-y-auto">
        {/* Dashboard */}
        {activePage === 'dashboard' && (
          <div id="dashboard" className="page">
            <header className="mb-8">
              <h2 className="text-3xl font-bold text-slate-800">Dashboard</h2>
              <p className="text-slate-500">Visão geral das suas vendas e métricas.</p>
            </header>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-white p-6 rounded-xl shadow-md flex items-center gap-4">
                <div className="bg-blue-100 p-3 rounded-full">
                  <DollarSign className="text-blue-600" />
                </div>
                <div>
                  <p className="text-slate-500 text-sm">Faturamento (Hoje)</p>
                  <p className="text-2xl font-bold text-slate-800">R$ 457,80</p>
                </div>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-md flex items-center gap-4">
                <div className="bg-green-100 p-3 rounded-full">
                  <ShoppingBag className="text-green-600" />
                </div>
                <div>
                  <p className="text-slate-500 text-sm">Pedidos (Hoje)</p>
                  <p className="text-2xl font-bold text-slate-800">18</p>
                </div>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-md flex items-center gap-4">
                <div className="bg-yellow-100 p-3 rounded-full">
                  <Loader className="text-yellow-600" />
                </div>
                <div>
                  <p className="text-slate-500 text-sm">Pedidos Pendentes</p>
                  <p className="text-2xl font-bold text-slate-800">3</p>
                </div>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-md flex items-center gap-4">
                <div className="bg-indigo-100 p-3 rounded-full">
                  <Users className="text-indigo-600" />
                </div>
                <div>
                  <p className="text-slate-500 text-sm">Total de Clientes</p>
                  <p className="text-2xl font-bold text-slate-800">124</p>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-md">
                <h3 className="text-lg font-semibold text-slate-800 mb-4">Vendas na Semana</h3>
                <div className="h-80 bg-slate-50 flex items-center justify-center rounded-lg">
                  <p className="text-slate-400">[ Placeholder para o Gráfico de Vendas ]</p>
                </div>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-md">
                <h3 className="text-lg font-semibold text-slate-800 mb-4">Produtos Mais Vendidos</h3>
                <ul className="space-y-4">
                  <li className="flex items-center gap-4">
                    <div className="bg-slate-100 rounded-lg p-2">
                      <Award className="text-yellow-500" />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-700">Açaí Turbinado 500ml</p>
                      <p className="text-sm text-slate-500">32 vendidos</p>
                    </div>
                  </li>
                  <li className="flex items-center gap-4">
                    <div className="bg-slate-100 rounded-lg p-2">
                      <Award className="text-slate-400" />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-700">Creme de Ninho 300ml</p>
                      <p className="text-sm text-slate-500">25 vendidos</p>
                    </div>
                  </li>
                  <li className="flex items-center gap-4">
                    <div className="bg-slate-100 rounded-lg p-2">
                      <Award className="text-orange-400" />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-700">Suco de Laranja 500ml</p>
                      <p className="text-sm text-slate-500">19 vendidos</p>
                    </div>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Pedidos */}
        {activePage === 'pedidos' && (
          <div id="pedidos" className="page">
            <header className="mb-8 flex justify-between items-center">
              <div>
                <h2 className="text-3xl font-bold text-slate-800">Pedidos</h2>
                <p className="text-slate-500">Gerencie os pedidos recebidos.</p>
              </div>
              <button className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-semibold flex items-center gap-2 hover:bg-indigo-700 transition-colors">
                <RotateCw className="w-4 h-4" />
                Atualizar
              </button>
            </header>
            <div className="bg-white p-2 rounded-xl shadow-md">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="border-b border-slate-200 text-slate-500">
                    <tr>
                      <th className="p-4">Cliente</th>
                      <th className="p-4">Endereço</th>
                      <th className="p-4">Status</th>
                      <th className="p-4 text-right">Total</th>
                      <th className="p-4 text-center">Ações</th>
                    </tr>
                  </thead>
                    <tbody className="divide-y divide-slate-200">
                    {orders.map(order => (
                        <tr key={order.id} className="hover:bg-slate-50">
                        <td className="p-4">
                            <div className="font-medium text-slate-800">{order.user?.username || '-'}</div>
                            <div className="text-sm text-slate-500">{new Date(order.createdAt).toLocaleTimeString()}</div>
                        </td>
                        <td className="p-4 text-slate-600">
                            {order.shippingStreet}, {order.shippingNumber}
                        </td>
                        <td className="p-4">
                            <span className={`px-2 py-1 text-xs font-semibold rounded-full status-${order.status}`}>
                            {order.status}
                            </span>
                        </td>
                        <td className="p-4 text-right font-medium text-slate-800">
                            R$ {Number(order.totalPrice).toFixed(2)}
                        </td>
                        <td className="p-4 text-center space-x-2">
                            <button title="Imprimir Pedido" className="p-2 text-slate-500 rounded-md hover:bg-slate-200 hover:text-blue-600"><Printer className="w-5 h-5" /></button>
                            <button title="Avançar Status" className="p-2 text-slate-500 rounded-md hover:bg-slate-200 hover:text-green-600"><ArrowRightCircle className="w-5 h-5" /></button>
                        </td>
                        </tr>
                    ))}
                    </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Produtos */}
        {activePage === 'produtos' && (
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
              <AddProductModal
                categories={categories}
                onClose={() => setShowAddModal(false)}
                onAdd={handleAddProduct}
              />
            )}
            {showAddCategoryModal && (
              <AddCategoryModal
                onClose={() => setShowAddCategoryModal(false)}
                onAdd={handleAddCategory}
              />
            )}
            {editProduct && (
              <EditProductModal
                categories={categories}
                product={editProduct}
                onClose={() => setEditProduct(null)}
                onUpdate={handleUpdateProduct}
              />
            )}
          </div>
        )}

        {/* Clientes */}
        {activePage === 'clientes' && (
          <div id="clientes" className="page">
            <header className="mb-8">
              <h2 className="text-3xl font-bold text-slate-800">Clientes</h2>
              <p className="text-slate-500">Visualize e gerencie sua base de clientes.</p>
            </header>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              <div className="bg-white p-6 rounded-xl shadow-md flex items-center gap-4">
                <div className="bg-indigo-100 p-3 rounded-full">
                  <Users className="text-indigo-600" />
                </div>
                <div>
                  <p className="text-slate-500 text-sm">Total de Clientes</p>
                  <p className="text-2xl font-bold text-slate-800">{user.length}</p>
                </div>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-md flex items-center gap-4">
                <div className="bg-green-100 p-3 rounded-full">
                  <TrendingUp className="text-green-600" />
                </div>
                <div>
                  <p className="text-slate-500 text-sm">LTV Médio</p>
                  <p className="text-2xl font-bold text-slate-800">R$ 89,50</p>
                </div>
              </div>
            </div>
            <div className="bg-white p-2 rounded-xl shadow-md">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="border-b border-slate-200 text-slate-500">
                    <tr>
                      <th className="p-4">Nome do Cliente</th>
                      <th className="p-4">Contato</th>
                      <th className="p-4 text-center">Pedidos</th>
                      <th className="p-4 text-right">Total Gasto (LTV)</th>
                      <th className="p-4 text-center">Ações</th>
                    </tr>
                  </thead>
                    <tbody className="divide-y divide-slate-200">
                    {user.map(user => (
                        <tr key={user.id} className="hover:bg-slate-50">
                        <td className="p-4 font-medium text-slate-800">{user.username}</td>
                        <td className="p-4 text-slate-600">{user.phone || '-'}</td>
                        <td className="p-4 text-center text-slate-600">{user.orders?.length || 0}</td>
                        <td className="p-4 text-right font-medium text-slate-800">
                            R$ {user.orders?.reduce((acc, order) => acc + Number(order.totalPrice), 0).toFixed(2)}
                        </td>
                        <td className="p-4 text-center">
                            <button className="text-indigo-600 hover:text-indigo-800">Detalhes</button>
                        </td>
                        </tr>
                    ))}
                    </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Configurações */}
        {activePage === 'configuracoes' && (
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
        )}
      </main>
      <style>{`
        .sidebar-item.active {
          background-color: #4f46e5;
          color: white;
          box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
        }
        .sidebar-item.active svg {
          color: white;
        }
        .status-received { background-color: #dbeafe; color: #1e40af; }
        .status-in_preparation { background-color: #fef9c3; color: #854d0e; }
        .status-out_for_delivery { background-color: #e0e7ff; color: #4338ca; }
        .status-completed { background-color: #dcfce7; color: #166534; }
        .status-canceled { background-color: #fee2e2; color: #991b1b; }
        ::-webkit-scrollbar { width: 8px; }
        ::-webkit-scrollbar-track { background: #f1f5f9; }
        ::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
        ::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
      `}</style>
    </div>
  );
};

export default Admin;