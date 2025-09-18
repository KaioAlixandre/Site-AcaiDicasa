import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom'; // adicione useNavigate
import { ArrowRight, Star, Truck, Clock, Shield } from 'lucide-react';
import { Product } from '../types';
import { apiService } from '../services/api';
import Loading from '../components/Loading';
import { useAuth } from '../contexts/AuthContext'; // adicione useAuth

const Home: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Redireciona para o login se não houver autenticação
  useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);

  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadFeaturedProducts = async () => {
      try {
        const products = await apiService.getProducts();
        setFeaturedProducts(products.slice(0, 4)); // Mostrar apenas os primeiros 4 produtos
      } catch (error) {
        console.error('Erro ao carregar produtos:', error);
      } finally {
        setLoading(false);
      }
    };

    loadFeaturedProducts();
  }, []);

  const features = [
    {
      icon: <Truck size={32} className="text-purple-600" />,
      title: "Entrega Rápida",
      description: "Entregamos em até 30 minutos na sua região"
    },
    {
      icon: <Clock size={32} className="text-purple-600" />,
      title: "Atendimento 24h",
      description: "Estamos sempre prontos para atender você"
    },
    {
      icon: <Shield size={32} className="text-purple-600" />,
      title: "Qualidade Garantida",
      description: "Ingredientes frescos e de primeira qualidade"
    }
  ];

  if (loading) {
    return <Loading fullScreen text="Carregando produtos..." />;
  }

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-purple-600 to-pink-600 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-4xl md:text-6xl font-bold mb-6">
                O melhor açaí da cidade está aqui!
              </h1>
              <p className="text-xl mb-8 text-purple-100">
                Descubra nossos sabores únicos, ingredientes frescos e a qualidade 
                que só a AçaíDíCasa pode oferecer. Peça online e receba em casa!
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  to="/products"
                  className="inline-flex items-center px-8 py-4 bg-white text-purple-600 font-semibold rounded-lg hover:bg-gray-100 transition-colors"
                >
                  Ver Produtos
                  <ArrowRight size={20} className="ml-2" />
                </Link>
                <Link
                  to="/about"
                  className="inline-flex items-center px-8 py-4 border-2 border-white text-white font-semibold rounded-lg hover:bg-white hover:text-purple-600 transition-colors"
                >
                  Conheça Nossa História
                </Link>
              </div>
            </div>
            <div className="relative">
              <div className="bg-white bg-opacity-10 rounded-2xl p-8 backdrop-blur-sm">
                <div className="text-center">
                  <div className="w-32 h-32 bg-white bg-opacity-20 rounded-full mx-auto mb-4 flex items-center justify-center">
                    <span className="text-6xl">🥤</span>
                  </div>
                  <h3 className="text-2xl font-bold mb-2">Açaí Premium</h3>
                  <p className="text-purple-100 mb-4">
                    Feito com ingredientes selecionados
                  </p>
                  <div className="flex justify-center space-x-1 mb-4">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} size={20} className="text-yellow-400 fill-current" />
                    ))}
                  </div>
                  <p className="text-3xl font-bold">A partir de R$ 12,90</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Por que escolher a AçaíDíCasa?
            </h2>
            <p className="text-xl text-gray-600">
              Oferecemos a melhor experiência em açaí da região
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="text-center p-6 bg-white rounded-lg shadow-md">
                <div className="flex justify-center mb-4">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products Section */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Produtos em Destaque
            </h2>
            <p className="text-xl text-gray-600">
              Conheça nossos sabores mais populares
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {featuredProducts.map((product) => (
              <div key={product.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                <div className="h-48 bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center">
                  <span className="text-6xl">🥤</span>
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {product.name}
                  </h3>
                  <p className="text-gray-600 mb-4 line-clamp-2">
                    {product.description || 'Açaí delicioso e refrescante'}
                  </p>
                  <div className="flex justify-between items-center">
                    <span className="text-2xl font-bold text-purple-600">
                      R$ {Number(product.price ?? 0).toFixed(2)}

                    </span>
                    <Link
                      to={`/products/${product.id}`}
                      className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                    >
                      Ver Detalhes
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="text-center mt-8">
            <Link
              to="/products"
              className="inline-flex items-center px-8 py-4 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 transition-colors"
            >
              Ver Todos os Produtos
              <ArrowRight size={20} className="ml-2" />
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-purple-600 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-4">
            Pronto para experimentar?
          </h2>
          <p className="text-xl mb-8 text-purple-100">
            Faça seu pedido agora e receba em casa com toda a qualidade AçaíDíCasa
          </p>
          <Link
            to="/products"
            className="inline-flex items-center px-8 py-4 bg-white text-purple-600 font-semibold rounded-lg hover:bg-gray-100 transition-colors"
          >
            Fazer Pedido
            <ArrowRight size={20} className="ml-2" />
          </Link>
        </div>
      </section>
    </div>
  );
};

export default Home;
