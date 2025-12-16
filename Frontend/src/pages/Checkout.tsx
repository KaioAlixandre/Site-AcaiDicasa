import React, { useState, useEffect } from 'react';
import { useNotification } from '../components/NotificationProvider';
import { useNavigate } from 'react-router-dom';
import { 
  CreditCard, 
  Smartphone, 
  DollarSign, 
  MapPin, 
  Package, 
  Truck, 
  Store, 
  CheckCircle,
  Plus,
  X,
  Edit,
  Phone
} from 'lucide-react';
import apiService from '../services/api';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { AddressForm } from '../types';
import { checkStoreStatus } from '../utils/storeUtils';
import { validatePhoneWithAPI, applyPhoneMask, validatePhoneLocal, removePhoneMask } from '../utils/phoneValidation';

const paymentMethods = [
  { label: 'Cartão de Crédito', value: 'CREDIT_CARD', icon: <CreditCard size={20} />, color: 'blue' },
  { label: 'PIX', value: 'PIX', icon: <Smartphone size={20} />, color: 'green' },
  { label: 'Dinheiro na Entrega', value: 'CASH_ON_DELIVERY', icon: <DollarSign size={20} />, color: 'yellow' },
];




const Checkout: React.FC = () => {
  const { items, total, clearCart } = useCart();
  const { user, refreshUserProfile, register, login } = useAuth();
  const { notify } = useNotification();
  const [paymentMethod, setPaymentMethod] = useState('');
  const [deliveryType, setDeliveryType] = useState('delivery'); // 'delivery' ou 'pickup'
  const [loading, setLoading] = useState(false);
  const [pixInfo] = useState<any>(null);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [addressForm, setAddressForm] = useState<AddressForm>({
    street: '',
    number: '',
    complement: '',
    neighborhood: '',
    reference: '',
    isDefault: true
  });
  const [hasNumber, setHasNumber] = useState(true);
  const [addressLoading, setAddressLoading] = useState(false);
  const [orderNotes, setOrderNotes] = useState('');
  const [promoFreteAtiva, setPromoFreteAtiva] = useState(false);
  const [promoFreteValorMinimo, setPromoFreteValorMinimo] = useState(0);
  const [entregaDisponivel, setEntregaDisponivel] = useState(true);
  const [horaEntregaFim, setHoraEntregaFim] = useState<string | null>(null);
  const [horaEntregaInicio, setHoraEntregaInicio] = useState<string | null>(null);
  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null);
  const [userAddresses, setUserAddresses] = useState<any[]>([]);
  const [loadingAddresses, setLoadingAddresses] = useState(false);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const navigate = useNavigate();

  // States para o fluxo de cadastro em checkout (quando não há usuário logado)
  const [regStep, setRegStep] = useState<number>(1); // 1 = nome, 2 = telefone+senha
  const [regName, setRegName] = useState<string>('');
  const [regTelefone, setRegTelefone] = useState<string>('');
  const [regPassword, setRegPassword] = useState<string>('');
  const [regConfirmPassword, setRegConfirmPassword] = useState<string>('');
  const [regLoading, setRegLoading] = useState<boolean>(false);
  const [regError, setRegError] = useState<string>('');
  const [regPhoneValidating, setRegPhoneValidating] = useState<boolean>(false);
  const [regPhoneValidationStatus, setRegPhoneValidationStatus] = useState<'idle' | 'valid' | 'invalid'>('idle');
  const [regPhoneValidationMessage, setRegPhoneValidationMessage] = useState<string>('');
  // Estado para login rápido dentro do checkout
  const [loginMode, setLoginMode] = useState<boolean>(false);
  const [loginTelefoneLocal, setLoginTelefoneLocal] = useState<string>('');
  const [loginPasswordLocal, setLoginPasswordLocal] = useState<string>('');
  const [loginLoadingLocal, setLoginLoadingLocal] = useState<boolean>(false);
  const [loginErrorLocal, setLoginErrorLocal] = useState<string>('');

  const deliveryFee = 3.00; // Taxa de entrega base
  
  // Calcular se tem direito ao frete grátis
  const temFreteGratis = promoFreteAtiva && total >= promoFreteValorMinimo && deliveryType === 'delivery';
  const finalTotal = deliveryType === 'delivery' ? total + (temFreteGratis ? 0 : deliveryFee) : total;

  // Verificar se a loja está aberta e se há promoção ativa
  useEffect(() => {
    let intervalId: string | number | NodeJS.Timeout | undefined;
    const loadStoreConfig = async () => {
      try {
        const [config, promoCheck] = await Promise.all([
          apiService.getStoreConfig(),
          fetch('/api/store-config/promo-frete-check').then(r => r.json())
        ]);

        if (promoCheck.ativa) {
          setPromoFreteAtiva(true);
          setPromoFreteValorMinimo(promoCheck.valorMinimo);
        }

        if (config) {
          const status = checkStoreStatus(config);
          if (!status.isOpen) {
            notify(`A loja está fechada: ${status.reason}${status.nextOpenTime ? '\n' + status.nextOpenTime : ''}`, 'error');
            navigate('/cart');
          }
          // Lógica unificada para disponibilidade de entrega
          const horaFim = config.horaEntregaFim;
          const horaStart = config.horaEntregaInicio;
          setHoraEntregaFim(horaFim || null);
          setHoraEntregaInicio(horaStart || null);

          const updateDisponibilidade = () => {
            let disponivel = true;
            const now = new Date();
            if (horaStart) {
              const [h, m] = horaStart.split(':').map(Number);
              const inicio = new Date();
              inicio.setHours(h, m, 0, 0);
              if (now < inicio) {
                disponivel = false;
              }
            }
            if (horaFim) {
              const [h, m] = horaFim.split(':').map(Number);
              const fim = new Date();
              fim.setHours(h, m, 0, 0);
              if (now > fim) {
                disponivel = false;
              }
            }
            setEntregaDisponivel(disponivel);
          };

          updateDisponibilidade();
          intervalId = setInterval(updateDisponibilidade, 30000); // Atualiza a cada 30 segundos
        }
      } catch (error) {
        setEntregaDisponivel(true);
      }
    };

    loadStoreConfig();
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [navigate]);

  // Carregar endereços do usuário quando logado e tipo de entrega for delivery
  useEffect(() => {
    const loadAddresses = async () => {
    if (user && deliveryType === 'delivery') {
        setLoadingAddresses(true);
        try {
          const addresses = await apiService.getAddresses();
          setUserAddresses(addresses);
          // Selecionar o endereço padrão automaticamente
          const defaultAddress = addresses.find((addr: any) => addr.isDefault) || addresses[0];
          if (defaultAddress) {
            setSelectedAddressId(defaultAddress.id);
          } else if (addresses.length === 0) {
            // Se não há endereços, abrir modal para criar
            setShowAddressModal(true);
            setShowAddressForm(true);
      }
        } catch (error) {
          console.error('Erro ao carregar endereços:', error);
          // Tentar usar endereços do perfil do usuário como fallback
          // Mapear de português para inglês
          if (user.enderecos && user.enderecos.length > 0) {
            const mappedAddresses = user.enderecos.map((addr: any) => ({
              id: addr.id,
              street: addr.rua || addr.street || '',
              number: addr.numero || addr.number || '',
              complement: addr.complemento || addr.complement || '',
              neighborhood: addr.bairro || addr.neighborhood || '',
              reference: addr.pontoReferencia || addr.reference || '',
              isDefault: addr.padrao || addr.isDefault || false,
              userId: addr.usuarioId || addr.userId || 0
            }));
            setUserAddresses(mappedAddresses);
            const defaultAddress = mappedAddresses.find((addr: any) => addr.isDefault) || mappedAddresses[0];
            if (defaultAddress) {
              setSelectedAddressId(defaultAddress.id);
            }
          } else {
            // Se não há endereços, abrir modal para criar
            setShowAddressModal(true);
            setShowAddressForm(true);
          }
        } finally {
          setLoadingAddresses(false);
        }
    } else if (deliveryType === 'pickup') {
        setUserAddresses([]);
        setSelectedAddressId(null);
        setShowAddressModal(false);
    }
    };
    loadAddresses();
  }, [user, deliveryType]);

  const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAddressForm({ ...addressForm, [e.target.name]: e.target.value });
  };

  const handleHasNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const checked = e.target.checked;
    setHasNumber(checked);
    if (!checked) {
      setAddressForm({ ...addressForm, number: 'S/N' });
    } else {
      setAddressForm({ ...addressForm, number: '' });
    }
  };

  const handleAddressSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddressLoading(true);
    try {
      // Se for o primeiro endereço, definir como padrão automaticamente
      const isFirstAddress = !user?.enderecos || user.enderecos.length === 0;
      const addressData = {
        ...addressForm,
        isDefault: isFirstAddress
      };
      await apiService.addAddress(addressData);
      await refreshUserProfile();
      notify('Endereço cadastrado com sucesso!', 'success');
      // Recarregar endereços e selecionar o novo endereço
      const addresses = await apiService.getAddresses();
      setUserAddresses(addresses);
      const newAddress = addresses[addresses.length - 1]; // O último é o recém-criado
      setSelectedAddressId(newAddress.id);
      setShowAddressForm(false);
      // Limpar formulário
      setAddressForm({
        street: '',
        number: '',
        complement: '',
        neighborhood: '',
        reference: '',
        isDefault: false
      });
      setHasNumber(true);
    } catch (error) {
      notify('Erro ao cadastrar endereço!', 'error');
    }
    setAddressLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentMethod) {
      notify('Selecione uma forma de pagamento!', 'warning');
      return;
    }
    setLoading(true);
    try {
      // Envie os dados do pedido para o backend
      if (!user) {
        notify('Usuário não autenticado!', 'error');
        setLoading(false);
        return;
      }
      // Validar endereço selecionado para entrega
      if (deliveryType === 'delivery' && !selectedAddressId) {
        notify('Selecione um endereço de entrega!', 'warning');
        setLoading(false);
        return;
      }

      await apiService.createOrder({
        items,
        paymentMethod, // <-- este campo é obrigatório!
        addressId: deliveryType === 'delivery' ? (selectedAddressId ?? undefined) : undefined,
        deliveryType,
        deliveryFee: deliveryType === 'delivery' ? deliveryFee : 0,
        notes: orderNotes.trim() || undefined, // Adiciona observações se houver
      });
      clearCart();
      notify('Pedido realizado com sucesso!', 'success');
      navigate('/orders');
    } catch (err: any) {
      notify('Erro ao finalizar pedido! ' + (err?.response?.data?.message || err.message), 'error');
      
    }
    setLoading(false);
  };

  if (pixInfo) {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="max-w-2xl mx-auto px-3 sm:px-6 py-4 md:py-8">
          <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-slate-200">
            {/* Header */}
            <div className="bg-gradient-to-r from-green-600 to-emerald-600 p-4 md:p-6 text-center">
              <CheckCircle size={48} className="md:w-16 md:h-16 text-white mx-auto mb-3 md:mb-4" />
              <h2 className="text-xl md:text-3xl font-bold text-white mb-1 md:mb-2">Pedido Quase Finalizado!</h2>
              <p className="text-green-100 text-sm md:text-lg">Siga as instruções para concluir</p>
            </div>

            {/* Content */}
            <div className="p-4 md:p-6">
              <div className="text-center">
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 md:p-4 mb-4 md:mb-6">
                  <div className="flex items-center justify-center mb-2">
                    <Smartphone size={20} className="text-yellow-600 mr-2" />
                    <span className="font-bold text-yellow-800 text-sm md:text-base">IMPORTANTE!</span>
                  </div>
                  <p className="text-yellow-800 text-xs md:text-sm font-medium">
                    Após o pagamento, envie a foto do comprovante para nosso WhatsApp!
                  </p>
                </div>

                <button
                  onClick={() => navigate('/orders')}
                  className="inline-flex items-center px-5 py-2.5 md:px-6 md:py-3 bg-purple-600 text-white text-sm md:text-base font-semibold rounded-lg hover:bg-purple-700 transition-all duration-200 shadow-md hover:shadow-lg"
                >
                  <Package className="mr-2" size={18} />
                  Ver Meus Pedidos
                </button>

                <div className="mt-6 md:mt-8 text-base md:text-xl font-bold text-purple-600">
                  Obrigado por comprar conosco! 💜
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Se não tem endereço, mostrar formulário de endereço
  if (showAddressForm) {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="max-w-2xl mx-auto px-3 sm:px-6 py-4 md:py-8">
          <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-slate-200">
            {/* Header */}
            <div className="bg-purple-600 p-4 md:p-6 text-center">
              <MapPin size={40} className="md:w-12 md:h-12 text-white mx-auto mb-2 md:mb-3" />
              <h2 className="text-xl md:text-2xl font-bold text-white mb-1">Cadastrar Endereço</h2>
              <p className="text-purple-100 text-xs md:text-sm">Para finalizar seu pedido, precisamos do seu endereço</p>
            </div>

            {/* Form */}
            <div className="p-4 md:p-6">
              <form className="space-y-3 md:space-y-4" onSubmit={handleAddressSubmit}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                  <div>
                    <label className="block text-xs md:text-sm font-semibold text-slate-700 mb-1.5">
                      Rua / Avenida
                    </label>
                    <input
                      name="street"
                      value={addressForm.street}
                      onChange={handleAddressChange}
                      placeholder="Nome da rua"
                      required
                      className="w-full px-3 py-2 md:px-4 md:py-2.5 text-sm border-2 border-slate-200 rounded-lg focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all duration-200"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-xs md:text-sm font-semibold text-slate-700 mb-1.5">
                      Número
                    </label>
                    <div className="flex items-center gap-2 mb-1.5">
                      <input
                        type="checkbox"
                        id="hasNumber"
                        checked={hasNumber}
                        onChange={handleHasNumberChange}
                        className="w-4 h-4 text-purple-600 border-slate-300 rounded focus:ring-purple-500"
                      />
                      <label htmlFor="hasNumber" className="text-xs md:text-sm text-slate-700 cursor-pointer">
                        Endereço possui número?
                      </label>
                    </div>
                    <input
                      name="number"
                      value={addressForm.number}
                      onChange={handleAddressChange}
                      placeholder="123"
                      required={hasNumber}
                      disabled={!hasNumber}
                      className={`w-full px-3 py-2 md:px-4 md:py-2.5 text-sm border-2 border-slate-200 rounded-lg focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all duration-200 ${!hasNumber ? 'bg-slate-100 cursor-not-allowed' : ''}`}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs md:text-sm font-semibold text-slate-700 mb-1.5">
                    Complemento (opcional)
                  </label>
                  <input
                    name="complement"
                    value={addressForm.complement}
                    onChange={handleAddressChange}
                    placeholder="Apartamento, bloco, etc."
                    className="w-full px-3 py-2 md:px-4 md:py-2.5 text-sm border-2 border-slate-200 rounded-lg focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all duration-200"
                  />
                </div>

                <div>
                  <label className="block text-xs md:text-sm font-semibold text-slate-700 mb-1.5">
                    Bairro
                  </label>
                  <input
                    name="neighborhood"
                    value={addressForm.neighborhood}
                    onChange={handleAddressChange}
                    placeholder="Nome do bairro"
                    required
                    className="w-full px-3 py-2 md:px-4 md:py-2.5 text-sm border-2 border-slate-200 rounded-lg focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all duration-200"
                  />
                </div>

                <div>
                  <label className="block text-xs md:text-sm font-semibold text-slate-700 mb-1.5">
                    Ponto de Referência (opcional)
                  </label>
                  <input
                    name="reference"
                    value={addressForm.reference}
                    onChange={handleAddressChange}
                    placeholder="Ex: Próximo ao mercado, em frente à escola, etc."
                    className="w-full px-3 py-2 md:px-4 md:py-2.5 text-sm border-2 border-slate-200 rounded-lg focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all duration-200"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-purple-600 text-white py-2.5 md:py-3 rounded-lg text-sm md:text-base font-semibold hover:bg-purple-700 transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={addressLoading}
                >
                  {addressLoading ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                      Salvando...
                    </div>
                  ) : (
                    <div className="flex items-center justify-center">
                      <CheckCircle className="mr-2" size={16} />
                      Salvar Endereço
                    </div>
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Se não há usuário logado, mostrar fluxo de cadastro em duas etapas
  if (!user) {
    const handleNextFromName = (e: React.FormEvent) => {
      e.preventDefault();
      setRegError('');
      if (!regName || regName.trim().length < 2) {
        setRegError('Por favor, informe seu nome.');
        return;
      }
      setRegStep(2);
    };

    const handleRegisterSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setRegError('');
      setRegPhoneValidationStatus('idle');
      setRegPhoneValidationMessage('');
      
      if (!regTelefone || !regPassword) {
        setRegError('Preencha telefone e senha');
        return;
      }
      if (regPassword.length < 6) {
        setRegError('A senha deve ter pelo menos 6 caracteres');
        return;
      }
      if (regPassword !== regConfirmPassword) {
        setRegError('As senhas não coincidem');
        return;
      }

      // Validar telefone
      if (!regTelefone || regTelefone.replace(/\D/g, '').length < 10) {
        setRegError('Por favor, informe um número de telefone válido');
        return;
      }

      // Validar telefone com API
      setRegPhoneValidating(true);
      try {
        const validation = await validatePhoneWithAPI(regTelefone);
        
        if (!validation.valid) {
          setRegPhoneValidationStatus('invalid');
          setRegPhoneValidationMessage(validation.error || 'Número de telefone inválido');
          setRegError(validation.error || 'Número de telefone inválido. Por favor, verifique e tente novamente.');
          setRegPhoneValidating(false);
          return;
        }

        setRegPhoneValidationStatus('valid');
        setRegPhoneValidationMessage('Número de telefone válido!');
        
        setRegLoading(true);
        // Criar conta - remover máscara antes de enviar
        const telefoneSemMascara = removePhoneMask(regTelefone);
        await register(regName.trim(), telefoneSemMascara, regPassword);
        // Fazer login automático - usar telefone sem máscara
        await login(telefoneSemMascara, regPassword);
        // Após login, verificar perfil e decidir próximo passo
        try {
          const profile = await apiService.getProfile();
          if (profile.enderecos && profile.enderecos.length > 0) {
            setRegError('');
            setLoginMode(false);
            return;
          }
          if (!profile.enderecos || profile.enderecos.length === 0) {
            navigate('/add-address');
            return;
          }
        } catch (errProfile) {
          navigate('/add-address');
          return;
        }
      } catch (err: any) {
        setRegError(err.message || 'Erro ao criar conta');
        setRegPhoneValidationStatus('invalid');
      } finally {
        setRegLoading(false);
        setRegPhoneValidating(false);
      }
    };

    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <div className="max-w-md sm:max-w-lg lg:max-w-xl w-full bg-white rounded-xl shadow p-6 sm:p-8 border border-slate-200">
          <h2 className="text-xl font-bold mb-4 text-center">Criar Conta para Finalizar Pedido</h2>

          {/* Link para alternar para login rápido */}
          <div className="text-center mb-3">
            {!loginMode ? (
              <button
                type="button"
                onClick={() => { setLoginMode(true); setRegError(''); setLoginErrorLocal(''); }}
                className="text-sm text-purple-600 hover:underline"
              >Já tenho uma conta — Fazer login</button>
            ) : (
              <button
                type="button"
                onClick={() => { setLoginMode(false); setLoginErrorLocal(''); }}
                className="text-sm text-slate-600 hover:underline"
              >Voltar ao cadastro</button>
            )}
          </div>

          {loginMode ? (
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                setLoginErrorLocal('');
                if (!loginTelefoneLocal || !loginPasswordLocal) {
                  setLoginErrorLocal('Preencha telefone e senha');
                  return;
                }
                
                // Validação básica de formato do telefone
                const cleaned = loginTelefoneLocal.replace(/\D/g, '');
                if (cleaned.length < 10 || cleaned.length > 11) {
                  setLoginErrorLocal('Por favor, informe um número de telefone válido (10 ou 11 dígitos)');
                  return;
                }
                
                // Validação local rápida
                const validation = validatePhoneLocal(loginTelefoneLocal);
                if (!validation.valid) {
                  setLoginErrorLocal(validation.error || 'Número de telefone inválido');
                  return;
                }
                
                try {
                  setLoginLoadingLocal(true);
                  // Remover máscara antes de fazer login
                  const telefoneSemMascara = removePhoneMask(loginTelefoneLocal);
                  await login(telefoneSemMascara, loginPasswordLocal);
                  // Buscar perfil atualizado e decidir próximo passo
                  try {
                    const profile = await apiService.getProfile();
                    if (profile.enderecos && profile.enderecos.length > 0) {
                      // Já tem endereço — fechar o card e permitir finalizar pedido
                      setLoginMode(false);
                      setRegError('');
                      setLoginErrorLocal('');
                      return;
                    }
                    if (!profile.enderecos || profile.enderecos.length === 0) {
                      navigate('/add-address');
                      return;
                    }
                  } catch (errProfile) {
                    // fallback: enviar para adicionar endereço
                    navigate('/add-address');
                    return;
                  }
                } catch (err: any) {
                  setLoginErrorLocal(err.message || 'Erro ao efetuar login');
                } finally {
                  setLoginLoadingLocal(false);
                }
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Número de Celular</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Phone className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    value={loginTelefoneLocal}
                    onChange={(e) => {
                      const maskedValue = applyPhoneMask(e.target.value);
                      setLoginTelefoneLocal(maskedValue);
                    }}
                    type="tel"
                    placeholder="(00) 00000-0000"
                    required
                    className="w-full pl-10 pr-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-purple-200"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Senha</label>
                <input
                  value={loginPasswordLocal}
                  onChange={(e) => setLoginPasswordLocal(e.target.value)}
                  type="password"
                  placeholder="Sua senha"
                  required
                  className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-purple-200"
                />
              </div>
              {loginErrorLocal && <div className="text-sm text-red-600">{loginErrorLocal}</div>}
              <div className="flex flex-col sm:flex-row justify-between items-center gap-2">
                <button
                  type="button"
                  onClick={() => setLoginMode(false)}
                  className="w-full sm:w-auto text-sm text-slate-600 underline text-center"
                >Voltar</button>
                <button
                  type="submit"
                  disabled={loginLoadingLocal}
                  className="w-full sm:w-auto bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 disabled:opacity-50 text-center"
                >
                  {loginLoadingLocal ? 'Entrando...' : 'Entrar'}
                </button>
              </div>
            </form>
          ) : regStep === 1 ? (
            <form onSubmit={handleNextFromName} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Nome</label>
                <input
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  placeholder="Seu nome completo"
                  required
                  className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-purple-200"
                />
              </div>
              {regError && <div className="text-sm text-red-600">{regError}</div>}
              <div className="flex flex-col sm:flex-row justify-between items-center gap-2">
                <button
                  type="submit"
                  className="w-full sm:w-auto bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 text-center"
                >
                  Próximo
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/cart')}
                  className="w-full sm:w-auto text-sm text-slate-600 underline text-center"
                >Voltar ao Carrinho</button>
              </div>
            </form>

          ) : (
            <form onSubmit={handleRegisterSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Número de Celular</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Phone className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    value={regTelefone}
                    onChange={(e) => {
                      const maskedValue = applyPhoneMask(e.target.value);
                      setRegTelefone(maskedValue);
                      if (regPhoneValidationStatus !== 'idle') {
                        setRegPhoneValidationStatus('idle');
                        setRegPhoneValidationMessage('');
                      }
                    }}
                    type="tel"
                    placeholder="(00) 00000-0000"
                    required
                    disabled={regPhoneValidating}
                    className={`w-full pl-10 pr-10 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-purple-200 ${
                      regPhoneValidationStatus === 'valid' 
                        ? 'border-green-300 bg-green-50' 
                        : regPhoneValidationStatus === 'invalid'
                        ? 'border-red-300 bg-red-50'
                        : 'border-gray-300'
                    }`}
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                    {regPhoneValidating ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-purple-600 border-t-transparent"></div>
                    ) : regPhoneValidationStatus === 'valid' ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : regPhoneValidationStatus === 'invalid' ? (
                      <X className="h-4 w-4 text-red-500" />
                    ) : null}
                  </div>
                </div>
                {regPhoneValidationMessage && (
                  <p className={`mt-1 text-xs ${
                    regPhoneValidationStatus === 'valid' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {regPhoneValidationMessage}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Senha</label>
                  <input
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    type="password"
                    placeholder="Senha (min 6 caracteres)"
                    required
                    className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-purple-200"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Confirmar Senha</label>
                  <input
                    value={regConfirmPassword}
                    onChange={(e) => setRegConfirmPassword(e.target.value)}
                    type="password"
                    placeholder="Repita a senha"
                    required
                    className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-purple-200"
                  />
                </div>
              </div>

              {regError && <div className="text-sm text-red-600">{regError}</div>}

              <div className="flex flex-col sm:flex-row justify-between items-center gap-2">
                <button
                  type="button"
                  onClick={() => setRegStep(1)}
                  className="w-full sm:w-auto text-sm text-slate-600 underline text-center"
                >Voltar</button>
                <button
                  type="submit"
                  disabled={regLoading}
                  className="w-full sm:w-auto bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 disabled:opacity-50 text-center"
                >
                  {regLoading ? 'Criando...' : 'Criar Conta e Continuar'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-4xl mx-auto px-3 sm:px-6 py-4 md:py-8">
        {/* Banner de Promoção */}
        {promoFreteAtiva && deliveryType === 'delivery' && (
          <div className="mb-4 bg-gradient-to-r from-emerald-500 to-green-600 rounded-xl shadow-lg p-4 text-white">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-2 rounded-lg">
                <Truck className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-lg">Promoção de Frete Grátis Hoje!</h3>
                <p className="text-sm text-emerald-50">
                  Pedidos acima de <strong>R$ {promoFreteValorMinimo.toFixed(2)}</strong> ganham frete grátis!
                  {total >= promoFreteValorMinimo ? (
                    <span className="ml-2 bg-white/30 px-2 py-0.5 rounded-full text-xs font-semibold">
                      ✓ Você conseguiu!
                    </span>
                  ) : (
                    <span className="ml-2 text-xs">
                      Faltam apenas R$ {(promoFreteValorMinimo - total).toFixed(2)}
                    </span>
                  )}
                </p>
              </div>
            </div>
          </div>
        )}
        
        <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-slate-200">
          <div className="p-4 md:p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
              {/* Left Column - Options */}
              <div className="space-y-4 md:space-y-6">
                {/* Delivery Type */}
                <div className="bg-slate-50 rounded-lg border border-slate-200 p-3 md:p-4">
                  <h3 className="text-base md:text-lg font-bold text-slate-900 mb-3 flex items-center">
                    <Truck className="mr-2 text-purple-600" size={20} />
                    Tipo de Entrega
                  </h3>
                  <div className="space-y-2">
                    <label 
                      className={`flex items-center p-2.5 md:p-3 border-2 border-slate-200 rounded-lg cursor-pointer transition-all duration-200 has-[:checked]:border-purple-500 has-[:checked]:bg-purple-50 ${!entregaDisponivel ? 'opacity-50 cursor-not-allowed' : 'hover:bg-white'}`}
                      onClick={(e) => {
                        if (entregaDisponivel && deliveryType === 'delivery' && user) {
                          e.preventDefault();
                          setShowAddressModal(true);
                        }
                      }}
                    >
                      <input
                        type="radio"
                        name="deliveryType"
                        value="delivery"
                        checked={deliveryType === 'delivery'}
                        onChange={() => {
                          if (entregaDisponivel) {
                            setDeliveryType('delivery');
                            if (user) {
                              setShowAddressModal(true);
                            }
                          }
                        }}
                        className="w-4 h-4 text-purple-600 mr-2 md:mr-3"
                        disabled={!entregaDisponivel}
                      />
                      <div className="flex items-center flex-1">
                        <div className="bg-purple-100 p-1.5 md:p-2 rounded-lg mr-2 md:mr-3">
                          <Truck size={16} className="md:w-5 md:h-5 text-purple-600" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="text-sm md:text-base font-semibold text-slate-900">Entrega em casa</div>
                          <div className="text-xs md:text-sm text-slate-600">+ R$ {deliveryFee.toFixed(2)} taxa de entrega</div>
                              {deliveryType === 'delivery' && user && selectedAddressId && (
                                <div className="text-xs text-purple-600 font-medium mt-1 flex items-center gap-1">
                                  <MapPin size={12} />
                                  {(() => {
                                    const selectedAddress = userAddresses.find((addr: any) => addr.id === selectedAddressId);
                                    return selectedAddress 
                                      ? `${selectedAddress.street}, ${selectedAddress.number} - ${selectedAddress.neighborhood}`
                                      : 'Endereço selecionado';
                                  })()}
                                </div>
                              )}
                          {!entregaDisponivel && (
                            <div className="text-xs text-red-600 font-semibold mt-1">
                              {horaEntregaInicio && new Date() < (() => { const [h, m] = horaEntregaInicio.split(':').map(Number); const d = new Date(); d.setHours(h, m, 0, 0); return d; })()
                                ? `O serviço de entrega em casa só inicia às ${horaEntregaInicio}`
                                : `Horário de entrega encerrado${horaEntregaFim ? ` (${horaEntregaFim})` : ''}`}
                            </div>
                          )}
                            </div>
                            {deliveryType === 'delivery' && user && selectedAddressId && entregaDisponivel && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setShowAddressModal(true);
                                }}
                                className="ml-2 p-1.5 text-purple-600 hover:bg-purple-100 rounded-lg transition-colors"
                                title="Trocar endereço"
                              >
                                <Edit size={16} />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </label>

                    <label className="flex items-center p-2.5 md:p-3 border-2 border-slate-200 rounded-lg cursor-pointer hover:bg-white transition-all duration-200 has-[:checked]:border-green-500 has-[:checked]:bg-green-50">
                      <input
                        type="radio"
                        name="deliveryType"
                        value="pickup"
                        checked={deliveryType === 'pickup'}
                        onChange={() => setDeliveryType('pickup')}
                        className="w-4 h-4 text-green-600 mr-2 md:mr-3"
                      />
                      <div className="flex items-center flex-1">
                        <div className="bg-green-100 p-1.5 md:p-2 rounded-lg mr-2 md:mr-3">
                          <Store size={16} className="md:w-5 md:h-5 text-green-600" />
                        </div>
                        <div className="flex-1">
                          <div className="text-sm md:text-base font-semibold text-slate-900">Retirada no local</div>
                          <div className="text-xs md:text-sm text-green-600">Sem taxa de entrega</div>
                        </div>
                      </div>
                    </label>
                  </div>
                </div>

                {/* Payment Method */}
                <div className="bg-slate-50 rounded-lg border border-slate-200 p-3 md:p-4">
                  <h3 className="text-base md:text-lg font-bold text-slate-900 mb-3 flex items-center">
                    <CreditCard className="mr-2 text-purple-600" size={20} />
                    Forma de Pagamento
                  </h3>
                  <div className="space-y-2">
                    {paymentMethods.map((method) => (
                      <label key={method.value} className="flex items-center p-2.5 md:p-3 border-2 border-slate-200 rounded-lg cursor-pointer hover:bg-white transition-all duration-200 has-[:checked]:border-purple-500 has-[:checked]:bg-purple-50">
                        <input
                          type="radio"
                          name="paymentMethod"
                          value={method.value}
                          checked={paymentMethod === method.value}
                          onChange={() => setPaymentMethod(method.value)}
                          className="w-4 h-4 text-purple-600 mr-2 md:mr-3"
                        />
                        <div className="text-purple-600 mr-2">{method.icon}</div>
                        <span className="text-sm md:text-base font-semibold text-slate-900">{method.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right Column - Order Summary */}
              <div className="lg:sticky lg:top-8">
                <div className="bg-slate-50 rounded-lg p-3 md:p-4 border border-slate-200">
                  <h3 className="text-base md:text-lg font-bold text-slate-900 mb-3 md:mb-4 flex items-center">
                    <Package className="mr-2 text-purple-600" size={20} />
                    Resumo do Pedido
                  </h3>

                  {/* Items List */}
                  <div className="space-y-2 mb-3 md:mb-4">
                    {items.map((item) => (
                      <div key={item.id} className="flex justify-between items-center p-2 md:p-2.5 bg-white rounded-lg border border-slate-200">
                        <div className="flex items-center space-x-2">
                          <div className="bg-purple-100 text-purple-600 rounded-full w-6 h-6 md:w-7 md:h-7 flex items-center justify-center font-bold text-xs">
                            {item.quantity}
                          </div>
                          <div>
                            <div className="text-xs md:text-sm font-semibold text-slate-900">{item.product.name}</div>
                            <div className="text-[10px] md:text-xs text-slate-600">R$ {Number(item.product.price).toFixed(2)} cada</div>
                          </div>
                        </div>
                        <div className="text-xs md:text-sm font-bold text-slate-900">
                          R$ {(Number(item.product.price) * item.quantity).toFixed(2)}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Totals */}
                  <div className="border-t border-slate-300 pt-2 md:pt-3 space-y-1.5 md:space-y-2">
                    <div className="flex justify-between text-slate-700 text-xs md:text-sm">
                      <span className="font-semibold">Subtotal:</span>
                      <span className="font-bold">R$ {Number(total).toFixed(2)}</span>
                    </div>
                    
                    {deliveryType === 'delivery' && (
                      <div className="flex justify-between text-slate-700 text-xs md:text-sm">
                        <span className="font-semibold">Taxa de entrega:</span>
                        {temFreteGratis ? (
                          <span className="font-bold text-emerald-600">
                            <span className="line-through text-slate-400 text-xs mr-1">R$ {deliveryFee.toFixed(2)}</span>
                            GRÁTIS!
                          </span>
                        ) : (
                          <span className="font-bold">R$ {deliveryFee.toFixed(2)}</span>
                        )}
                      </div>
                    )}
                    
                    <div className="border-t border-slate-300 pt-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm md:text-base font-bold text-slate-900">Total:</span>
                        <span className="text-base md:text-xl font-bold text-purple-600">
                          R$ {finalTotal.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Observações do Pedido */}
                  <div className="border-t border-slate-300 pt-3 md:pt-4">
                    <label className="block text-xs md:text-sm font-semibold text-slate-700 mb-2">
                      Observações do Pedido (opcional)
                    </label>
                    <textarea
                      value={orderNotes}
                      onChange={(e) => setOrderNotes(e.target.value)}
                      placeholder="Ex: Remover algum ingrediente, preferências, etc."
                      maxLength={500}
                      rows={3}
                      className="w-full px-3 py-2 md:px-4 md:py-2.5 text-xs md:text-sm border-2 border-slate-200 rounded-lg focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all duration-200 resize-none"
                    />
                    <div className="text-[10px] md:text-xs text-slate-500 mt-1 text-right">
                      {orderNotes.length}/500 caracteres
                    </div>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    onClick={handleSubmit}
                    className="w-full mt-3 md:mt-4 bg-purple-600 text-white py-2.5 md:py-3 rounded-lg text-sm md:text-base font-semibold hover:bg-purple-700 transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={loading || !paymentMethod}
                  >
                    {loading ? (
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-4 w-4 md:h-5 md:w-5 border-2 border-white border-t-transparent mr-2"></div>
                        Finalizando...
                      </div>
                    ) : (
                      <div className="flex items-center justify-center">
                        <CheckCircle className="mr-2" size={18} />
                        Finalizar Pedido - R$ {finalTotal.toFixed(2)}
                      </div>
                    )}
                  </button>

                  {!paymentMethod && (
                    <p className="text-xs md:text-sm text-red-600 text-center mt-2 font-medium">
                      ⚠️ Selecione uma forma de pagamento
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Seleção de Endereço */}
      {showAddressModal && user && deliveryType === 'delivery' && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200">
              <h3 className="text-lg sm:text-xl font-bold text-gray-800 flex items-center gap-2">
                <MapPin className="text-purple-600" size={20} />
                Selecionar Endereço de Entrega
              </h3>
              <button
                onClick={() => {
                  setShowAddressModal(false);
                  setShowAddressForm(false);
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title="Fechar"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6">
              {loadingAddresses ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-2 border-purple-600 border-t-transparent"></div>
                </div>
              ) : showAddressForm ? (
                <div className="space-y-4">
                  <h4 className="text-base font-semibold text-gray-800 mb-3">Adicionar Novo Endereço</h4>
                  <form className="space-y-3" onSubmit={handleAddressSubmit}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs md:text-sm font-semibold text-slate-700 mb-1.5">
                          Rua / Avenida
                        </label>
                        <input
                          name="street"
                          value={addressForm.street}
                          onChange={handleAddressChange}
                          placeholder="Nome da rua"
                          required
                          className="w-full px-3 py-2 text-sm border-2 border-slate-200 rounded-lg focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-xs md:text-sm font-semibold text-slate-700 mb-1.5">
                          Número
                        </label>
                        <div className="flex items-center gap-2 mb-1.5">
                          <input
                            type="checkbox"
                            id="hasNumberModal"
                            checked={hasNumber}
                            onChange={handleHasNumberChange}
                            className="w-4 h-4 text-purple-600 border-slate-300 rounded focus:ring-purple-500"
                          />
                          <label htmlFor="hasNumberModal" className="text-xs text-slate-700 cursor-pointer">
                            Endereço possui número?
                          </label>
                        </div>
                        <input
                          name="number"
                          value={addressForm.number}
                          onChange={handleAddressChange}
                          placeholder="123"
                          required={hasNumber}
                          disabled={!hasNumber}
                          className={`w-full px-3 py-2 text-sm border-2 border-slate-200 rounded-lg focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-200 ${!hasNumber ? 'bg-slate-100 cursor-not-allowed' : ''}`}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs md:text-sm font-semibold text-slate-700 mb-1.5">
                        Complemento (opcional)
                      </label>
                      <input
                        name="complement"
                        value={addressForm.complement}
                        onChange={handleAddressChange}
                        placeholder="Apartamento, bloco, etc."
                        className="w-full px-3 py-2 text-sm border-2 border-slate-200 rounded-lg focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
                      />
                    </div>

                    <div>
                      <label className="block text-xs md:text-sm font-semibold text-slate-700 mb-1.5">
                        Bairro
                      </label>
                      <input
                        name="neighborhood"
                        value={addressForm.neighborhood}
                        onChange={handleAddressChange}
                        placeholder="Nome do bairro"
                        required
                        className="w-full px-3 py-2 text-sm border-2 border-slate-200 rounded-lg focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
                      />
                    </div>

                    <div>
                      <label className="block text-xs md:text-sm font-semibold text-slate-700 mb-1.5">
                        Ponto de Referência (opcional)
                      </label>
                      <input
                        name="reference"
                        value={addressForm.reference}
                        onChange={handleAddressChange}
                        placeholder="Ex: Próximo ao mercado"
                        className="w-full px-3 py-2 text-sm border-2 border-slate-200 rounded-lg focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
                      />
                    </div>

                    <div className="flex gap-2 pt-2">
                      <button
                        type="submit"
                        disabled={addressLoading}
                        className="flex-1 bg-purple-600 text-white py-2.5 rounded-lg text-sm font-semibold hover:bg-purple-700 disabled:opacity-50 transition-colors"
                      >
                        {addressLoading ? 'Salvando...' : 'Salvar Endereço'}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowAddressForm(false);
                          setAddressForm({
                            street: '',
                            number: '',
                            complement: '',
                            neighborhood: '',
                            reference: '',
                            isDefault: false
                          });
                          setHasNumber(true);
                        }}
                        className="px-4 py-2.5 bg-slate-200 text-slate-700 rounded-lg text-sm font-semibold hover:bg-slate-300 transition-colors"
                      >
                        Cancelar
                      </button>
                    </div>
                  </form>
                </div>
              ) : (
                <div className="space-y-3">
                  {userAddresses.length === 0 ? (
                    <div className="text-center py-8 text-slate-600">
                      <MapPin size={48} className="mx-auto mb-3 text-slate-400" />
                      <p className="text-sm mb-4">Nenhum endereço cadastrado</p>
                      <button
                        onClick={() => setShowAddressForm(true)}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition-colors"
                      >
                        <Plus size={16} />
                        Adicionar novo endereço
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="space-y-2">
                        {userAddresses.map((address: any) => {
                          const isSelected = selectedAddressId === address.id;
                          return (
                            <label
                              key={address.id}
                              className={`flex items-start p-4 border-2 rounded-lg cursor-pointer transition-all duration-200 ${
                                isSelected
                                  ? 'border-purple-500 bg-purple-50'
                                  : 'border-slate-200 hover:bg-slate-50'
                              }`}
                            >
                              <input
                                type="radio"
                                name="selectedAddress"
                                value={address.id}
                                checked={isSelected}
                                onChange={() => setSelectedAddressId(address.id)}
                                className="w-4 h-4 text-purple-600 mr-3 mt-0.5"
                              />
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="text-sm font-semibold text-slate-900">
                                    {address.street}, {address.number}
                                  </span>
                                  {address.isDefault && (
                                    <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-semibold">
                                      Padrão
                                    </span>
                                  )}
                                </div>
                                {address.complement && (
                                  <div className="text-xs text-slate-600 mb-1">
                                    {address.complement}
                                  </div>
                                )}
                                <div className="text-xs text-slate-600">
                                  {address.neighborhood}
                                  {address.reference && ` • ${address.reference}`}
                                </div>
                              </div>
                            </label>
                          );
                        })}
                      </div>
                      <button
                        onClick={() => setShowAddressForm(true)}
                        className="w-full mt-4 flex items-center justify-center gap-2 p-3 border-2 border-dashed border-slate-300 rounded-lg text-slate-600 hover:border-purple-500 hover:text-purple-600 transition-colors text-sm font-semibold"
                      >
                        <Plus size={16} />
                        Adicionar novo endereço
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            {!showAddressForm && userAddresses.length > 0 && (
              <div className="p-4 sm:p-6 border-t border-gray-200 flex justify-end gap-3">
                <button
                  onClick={() => {
                    setShowAddressModal(false);
                    if (!selectedAddressId) {
                      setDeliveryType('pickup');
                    }
                  }}
                  className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg font-semibold hover:bg-slate-300 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => {
                    if (selectedAddressId) {
                      setShowAddressModal(false);
                      notify('Endereço selecionado com sucesso!', 'success');
                    } else {
                      notify('Selecione um endereço para continuar', 'warning');
                    }
                  }}
                  className="px-6 py-2 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition-colors"
                >
                  Confirmar
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Checkout;