import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, ArrowLeft, AlertCircle, CheckCircle } from 'lucide-react';
import Loading from '../components/Loading';

const ForgotPassword: React.FC = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [emailSent, setEmailSent] = useState(false);
  const [developmentCode, setDevelopmentCode] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      setError('Por favor, digite seu email.');
      return;
    }

    if (!email.includes('@')) {
      setError('Por favor, digite um email válido.');
      return;
    }

    setLoading(true);
    setError('');
    setMessage('');

    try {
      const response = await fetch('http://localhost:3001/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(data.message);
        setEmailSent(true);
        
        // Se está em modo de desenvolvimento, salvar o código
        if (data.development && data.code) {
          setDevelopmentCode(data.code);
        }
        
        // Redirecionar para página de reset após 3 segundos
        setTimeout(() => {
          navigate('/reset-password', { 
            state: { 
              email,
              developmentCode: data.development ? data.code : null 
            } 
          });
        }, 3000);
      } else {
        setError(data.message || 'Erro ao enviar email de recuperação.');
      }
    } catch (err) {
      console.error('Erro ao solicitar recuperação:', err);
      setError('Erro de conexão. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <Loading />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-white flex items-center justify-center px-4">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <Link
            to="/login"
            className="inline-flex items-center text-purple-600 hover:text-purple-700 mb-6 transition-colors"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar ao login
          </Link>
          
          <div className="mx-auto h-16 w-16 bg-purple-100 rounded-full flex items-center justify-center mb-6">
            <Mail className="h-8 w-8 text-purple-600" />
          </div>
          
          <h2 className="text-3xl font-bold text-gray-900">
            Esqueceu sua senha?
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Digite seu email e enviaremos um código de verificação
          </p>
        </div>

        {/* Form */}
        <div className="bg-white shadow-lg rounded-lg px-8 py-6">
          {!emailSent ? (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-purple-500 focus:border-purple-500 focus:z-10"
                  placeholder="Digite seu email"
                />
              </div>

              {error && (
                <div className="flex items-center space-x-2 text-red-600 bg-red-50 p-3 rounded-md">
                  <AlertCircle className="h-4 w-4" />
                  <span className="text-sm">{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'Enviando...' : 'Enviar código'}
              </button>
            </form>
          ) : (
            <div className="text-center space-y-4">
              <div className="mx-auto h-16 w-16 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              
              <h3 className="text-lg font-medium text-gray-900">
                Email enviado!
              </h3>
              
              {message && (
                <div className="flex items-center space-x-2 text-green-600 bg-green-50 p-3 rounded-md">
                  <CheckCircle className="h-4 w-4" />
                  <span className="text-sm">{message}</span>
                </div>
              )}
              
              <p className="text-sm text-gray-600">
                Verifique sua caixa de entrada e clique no link ou digite o código na próxima página.
              </p>
              
              {developmentCode && (
                <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-md">
                  <p className="text-sm text-yellow-800 font-medium">
                    🚧 Modo de Desenvolvimento
                  </p>
                  <p className="text-sm text-yellow-700 mt-1">
                    Código de verificação: <span className="font-mono font-bold text-lg">{developmentCode}</span>
                  </p>
                </div>
              )}
              
              <p className="text-xs text-gray-500">
                Redirecionando automaticamente em alguns segundos...
              </p>

              <button
                onClick={() => navigate('/reset-password', { 
                  state: { 
                    email,
                    developmentCode: developmentCode || null 
                  } 
                })}
                className="w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-colors"
              >
                Continuar para redefinir senha
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="text-center">
          <p className="text-sm text-gray-600">
            Lembrou da senha?{' '}
            <Link to="/login" className="font-medium text-purple-600 hover:text-purple-500">
              Fazer login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;