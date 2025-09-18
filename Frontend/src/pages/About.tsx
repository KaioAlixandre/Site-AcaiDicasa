import React from 'react';
import { Heart, Award, Users, Clock } from 'lucide-react';

const About: React.FC = () => {
  const stats = [
    { icon: <Users size={32} className="text-purple-600" />, number: '10K+', label: 'Clientes Satisfeitos' },
    { icon: <Award size={32} className="text-purple-600" />, number: '5+', label: 'Anos de Experiência' },
    { icon: <Heart size={32} className="text-purple-600" />, number: '50K+', label: 'Açaís Vendidos' },
    { icon: <Clock size={32} className="text-purple-600" />, number: '24/7', label: 'Atendimento' }
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-purple-600 to-pink-600 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Nossa História
            </h1>
            <p className="text-xl text-purple-100 max-w-3xl mx-auto">
              Conheça a AçaíDíCasa e descubra como nos tornamos a melhor açaíteria da região
            </p>
          </div>
        </div>
      </section>

      {/* Nossa História */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">
                Como tudo começou
              </h2>
              <p className="text-lg text-gray-600 mb-6">
                A AçaíDíCasa nasceu do sonho de trazer o melhor açaí da região para 
                a mesa dos nossos clientes. Fundada em 2019, começamos como uma 
                pequena barraquinha no centro da cidade.
              </p>
              <p className="text-lg text-gray-600 mb-6">
                Com muito amor, dedicação e ingredientes de primeira qualidade, 
                conquistamos o paladar dos nossos clientes e crescemos para nos 
                tornar a referência em açaí na região.
              </p>
              <p className="text-lg text-gray-600">
                Hoje, atendemos milhares de clientes todos os dias, sempre 
                mantendo o compromisso com a qualidade e o sabor que nos 
                tornaram famosos.
              </p>
            </div>
            <div className="bg-gradient-to-br from-purple-400 to-pink-400 rounded-2xl p-8 text-center">
              <div className="w-32 h-32 bg-white bg-opacity-20 rounded-full mx-auto mb-4 flex items-center justify-center">
                <span className="text-6xl">🥤</span>
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">
                Tradição e Qualidade
              </h3>
              <p className="text-purple-100">
                Mais de 5 anos servindo o melhor açaí da cidade
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Estatísticas */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Números que nos orgulham
            </h2>
            <p className="text-xl text-gray-600">
              Resultados que mostram nossa dedicação e qualidade
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="flex justify-center mb-4">
                  {stat.icon}
                </div>
                <div className="text-3xl font-bold text-gray-900 mb-2">
                  {stat.number}
                </div>
                <div className="text-gray-600">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Missão, Visão e Valores */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Nossos Princípios
            </h2>
            <p className="text-xl text-gray-600">
              Os valores que guiam nosso trabalho todos os dias
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center p-6 bg-white rounded-lg shadow-md">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Heart className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                Missão
              </h3>
              <p className="text-gray-600">
                Oferecer o melhor açaí da região, proporcionando uma experiência 
                única e deliciosa para nossos clientes, sempre com ingredientes 
                frescos e de qualidade.
              </p>
            </div>
            <div className="text-center p-6 bg-white rounded-lg shadow-md">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Award className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                Visão
              </h3>
              <p className="text-gray-600">
                Ser reconhecida como a melhor açaíteria da região, expandindo 
                nossa presença e levando nosso sabor único para mais clientes.
              </p>
            </div>
            <div className="text-center p-6 bg-white rounded-lg shadow-md">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                Valores
              </h3>
              <p className="text-gray-600">
                Qualidade, transparência, respeito ao cliente e paixão pelo que 
                fazemos. Estes são os pilares que sustentam nosso trabalho.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-purple-600 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-4">
            Venha conhecer nossa história de perto!
          </h2>
          <p className="text-xl mb-8 text-purple-100">
            Visite nossa loja e experimente o sabor que conquistou milhares de clientes
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="#"
              className="inline-flex items-center px-8 py-4 bg-white text-purple-600 font-semibold rounded-lg hover:bg-gray-100 transition-colors"
            >
              Visitar Loja
            </a>
            <a
              href="/products"
              className="inline-flex items-center px-8 py-4 border-2 border-white text-white font-semibold rounded-lg hover:bg-white hover:text-purple-600 transition-colors"
            >
              Fazer Pedido Online
            </a>
          </div>
        </div>
      </section>
    </div>
  );
};

export default About;
