import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, ShoppingCart, Package, Users, Settings, LogOut, Plus, Truck, Sprout
} from 'lucide-react';
import apiService from '../../services/api';
import { Product, ProductCategory, User, Order } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import Dashboard from './Dashboard';
import Pedidos from './Pedidos';
import Produtos from './Produtos';
import Clientes from './Clientes';
import Configuracoes from './Configuracoes';
import Entregadores from './Entregadores';
import Complementos from './Complementos';
import ModalSelecaoEntregador from './components/ModalSelecaoEntregador';

const pages = [
  { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard /> },
  { id: 'pedidos', label: 'Pedidos', icon: <ShoppingCart /> },
  { id: 'produtos', label: 'Produtos', icon: <Package /> },
  { id: 'complementos', label: 'Complementos', icon: <Plus /> },
  { id: 'clientes', label: 'Clientes', icon: <Users /> },
  { id: 'entregadores', label: 'Entregadores', icon: <Truck /> },
  { id: 'configuracoes', label: 'Configurações', icon: <Settings /> }
];

const Admin: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activePage, setActivePage] = useState('dashboard');
  const [products, setProducts] = useState<Product[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAddCategoryModal, setShowAddCategoryModal] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [users, setUsers] = useState<User[]>([]); // Lista de usuários
  const [orders, setOrders] = useState<Order[]>([]); // Estado para pedidos
  
  // Estados do modal de seleção de entregador
  const [showDelivererModal, setShowDelivererModal] = useState(false);
  const [selectedOrderForDelivery, setSelectedOrderForDelivery] = useState<Order | null>(null);

  // Verificar se o usuário tem permissão de admin
  useEffect(() => {
    if (!user) {
      console.log('❌ [Admin] Usuário não autenticado, redirecionando para login...');
      navigate('/login');
      return;
    }
    
    if (user.funcao !== 'admin' && user.funcao !== 'master') {
      console.log(`❌ [Admin] Usuário não tem permissão de admin. Função atual: ${user.funcao}, redirecionando...`);
      navigate('/');
      return;
    }
    
    console.log(`✅ [Admin] Usuário autenticado com permissão de admin: ${user.nomeUsuario} (${user.funcao})`);
  }, [user, navigate]);

  // Se não há usuário ou não tem permissão, não renderizar nada
  if (!user || (user.funcao !== 'admin' && user.funcao !== 'master')) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Verificando permissões...</p>
        </div>
      </div>
    );
  }

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
      apiService.getUsers().then(setUsers);
    }
  }, [activePage]);

useEffect(() => {
  if (activePage === 'pedidos') {
    apiService.getOrdersAdmin().then(setOrders);
  }
}, [activePage]);

  const handleAddProduct = async (data: any) => {
    await apiService.createProduct(data);
    setShowAddModal(false);
    // Recarregar produtos e categorias após adicionar
    setProducts(await apiService.getProducts());
    setCategories(await apiService.getCategories());
  };

  const handleAddCategory = async (name: string) => {
    await apiService.addCategory(name);
    setShowAddCategoryModal(false);
    setCategories(await apiService.getCategories());
  };

  const handleEdit = (product: Product) => setEditProduct(product);

  const handleUpdateProduct = async (id: number, data: any) => {
    try {
      await apiService.updateProduct(id, data);
      setEditProduct(null);
      // Recarregar a lista de produtos após atualização
      const updatedProducts = await apiService.getProducts();
      setProducts(updatedProducts);
    } catch (error) {
      console.error('Erro ao atualizar produto:', error);
      alert('Erro ao atualizar produto. Tente novamente.');
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Deseja remover este produto?')) {
      await apiService.deleteProduct(id);
      setProducts(await apiService.getProducts());
    }
  };


const getNextStatus = (current: string, deliveryType: string = 'delivery') => {
  if (current === 'being_prepared') {
    // Para retirada: being_prepared -> ready_for_pickup
    if (deliveryType === 'pickup') {
      return 'ready_for_pickup';
    }
    // Para entrega: being_prepared -> on_the_way
    return 'on_the_way';
  }
  
  // Para outros status, seguir ordem normal
  const statusFlow = deliveryType === 'pickup' 
    ? ['pending_payment', 'being_prepared', 'ready_for_pickup', 'delivered', 'canceled']
    : ['pending_payment', 'being_prepared', 'on_the_way', 'delivered', 'canceled'];
    
  const idx = statusFlow.indexOf(current);
  return idx >= 0 && idx < statusFlow.length - 2 ? statusFlow[idx + 1] : statusFlow[idx];
};

interface AdvanceStatusOrder {
  id: number;
  status: string;
  deliveryType?: string;
}

const handleAdvanceStatus = async (order: AdvanceStatusOrder): Promise<void> => {
  const nextStatus = getNextStatus(order.status, order.deliveryType);
  
  // Se está mudando de "being_prepared" para "on_the_way", mostrar modal de seleção de entregador
  if (order.status === 'being_prepared' && nextStatus === 'on_the_way') {
    setSelectedOrderForDelivery(order as Order);
    setShowDelivererModal(true);
    return;
  }
  
  // Para outros casos, avançar status normalmente
  await apiService.advanceOrderStatus(order.id, nextStatus);
  setOrders(await apiService.getOrdersAdmin());
};

const handleDelivererSelected = async (delivererId: number) => {
  if (!selectedOrderForDelivery) return;
  
  try {
    await apiService.advanceOrderStatus(selectedOrderForDelivery.id, 'on_the_way', delivererId);
    setOrders(await apiService.getOrdersAdmin());
    setShowDelivererModal(false);
    setSelectedOrderForDelivery(null);
  } catch (error) {
    console.error('Erro ao atribuir entregador:', error);
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
          <button 
            onClick={() => {
              logout();
              navigate('/');
            }}
            className="flex items-center gap-3 px-4 py-3 rounded-lg transition-all text-red-400 hover:bg-red-900/50 w-full"
          >
            <LogOut />
            <span className="font-medium">Sair</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="ml-64 flex-1 p-6 md:p-8 overflow-y-auto">
        {/* Dashboard */}
        {activePage === 'dashboard' && <Dashboard />}

        {/* Pedidos */}
        {activePage === 'pedidos' && <Pedidos orders={orders} handleAdvanceStatus={handleAdvanceStatus} />}

        {/* Produtos */}
        {activePage === 'produtos' && (
          <Produtos
            products={products}
            categories={categories}
            showAddModal={showAddModal}
            setShowAddModal={setShowAddModal}
            showAddCategoryModal={showAddCategoryModal}
            setShowAddCategoryModal={setShowAddCategoryModal}
            editProduct={editProduct}
            setEditProduct={setEditProduct}
            handleAddProduct={handleAddProduct}
            handleAddCategory={handleAddCategory}
            handleEdit={handleEdit}
            handleUpdateProduct={handleUpdateProduct}
            handleDelete={handleDelete}
          />
        )}

        {/* Complementos */}
        {activePage === 'complementos' && <Complementos />}

        {/* Clientes */}
        {activePage === 'clientes' && <Clientes user={users} />}

        {/* Entregadores */}
        {activePage === 'entregadores' && <Entregadores />}

        {/* Configurações */}
        {activePage === 'configuracoes' && <Configuracoes />}
      </main>

      {/* Modal de Seleção de Entregador */}
      <ModalSelecaoEntregador
        isOpen={showDelivererModal}
        onClose={() => setShowDelivererModal(false)}
        onSelect={handleDelivererSelected}
        orderId={selectedOrderForDelivery?.id || 0}
        customerName={selectedOrderForDelivery?.user?.username || 'Cliente'}
      />

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