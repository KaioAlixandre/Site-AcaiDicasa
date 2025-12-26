import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Phone, ArrowLeft, AlertCircle, CheckCircle } from 'lucide-react';
import Loading from '../components/Loading';
import { applyPhoneMask, validatePhoneLocal } from '../utils/phoneValidation';

const ForgotPassword: React.FC = () => {
  const [telefone, setTelefone] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [codeSent, setCodeSent] = useState(false);
  const [developmentCode, setDevelopmentCode] = useState('');
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const maskedValue = applyPhoneMask(e.target.value);
    setTelefone(maskedValue);
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!telefone) {
      setError('Por favor, digite seu telefone.');
      return;
    }

    // Validar telefone
    const phoneValidation = validatePhoneLocal(telefone);
    if (!phoneValidation.valid) {
      setError(phoneValidation.error || 'Por favor, digite um telefone válido.');
      return;
    }

    setLoading(true);
    setError('');
    setMessage('');

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ telefone }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(data.message);
        setCodeSent(true);
        
        // Se está em modo de desenvolvimento, salvar o código
        if (data.development && data.code) {
          setDevelopmentCode(data.code);
        }
        
        // Redirecionar para página de reset após 3 segundos
        setTimeout(() => {
          navigate('/reset-password', { 
            state: { 
              telefone,
              developmentCode: data.development ? data.code : null 
            } 
          });
        }, 3000);
      } else {
        setError(data.message || 'Erro ao enviar código de recuperação.');
      }
    } catch (err) {
     
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
            <Phone className="h-8 w-8 text-purple-600" />
          </div>
          
          <h2 className="text-3xl font-bold text-gray-900">
            Esqueceu sua senha?
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Digite seu telefone e enviaremos um código de verificação
          </p>
        </div>

        {/* Form */}
        <div className="bg-white shadow-lg rounded-lg px-8 py-6">
          {!codeSent ? (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="telefone" className="block text-sm font-medium text-gray-700">
                  Telefone
                </label>
                <input
                  id="telefone"
                  name="telefone"
                  type="tel"
                  autoComplete="tel"
                  required
                  value={telefone}
                  onChange={handleChange}
                  className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-purple-500 focus:border-purple-500 focus:z-10"
                  placeholder="(00) 00000-0000"
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
                Código enviado!
              </h3>
              
              {message && (
                <div className="flex items-center space-x-2 text-green-600 bg-green-50 p-3 rounded-md">
                  <CheckCircle className="h-4 w-4" />
                  <span className="text-sm">{message}</span>
                </div>
              )}
              
              <p className="text-sm text-gray-600">
                Verifique seu email ou WhatsApp e digite o código na próxima página.
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
                    telefone,
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