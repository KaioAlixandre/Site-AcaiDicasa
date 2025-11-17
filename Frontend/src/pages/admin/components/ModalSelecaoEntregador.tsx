import React, { useState, useEffect } from 'react';
import { X, Truck, Phone, CheckCircle } from 'lucide-react';
import { Deliverer } from '../../../types';
import apiService from '../../../services/api';

interface DelivererSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (delivererId: number) => void;
  orderId: number;
  customerName: string;
}

const DelivererSelectionModal: React.FC<DelivererSelectionModalProps> = ({
  isOpen,
  onClose,
  onSelect,
  orderId,
  customerName
}) => {
  const [deliverers, setDeliverers] = useState<Deliverer[]>([]);
  const [selectedDeliverer, setSelectedDeliverer] = useState<number | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadDeliverers();
    }
  }, [isOpen]);

  const loadDeliverers = async () => {
    try {
      const response = await apiService.getDeliverers();
      // Filtrar apenas entregadores ativos
      setDeliverers(response.filter((deliverer: Deliverer) => deliverer.isActive));
    } catch (error) {
      console.error('Erro ao carregar entregadores:', error);
    }
  };

  const handleConfirm = () => {
    if (selectedDeliverer) {
      onSelect(selectedDeliverer);
      setSelectedDeliverer(null);
      onClose();
    }
  };

  const handleCancel = () => {
    setSelectedDeliverer(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-3">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between p-3 sm:p-4 border-b border-slate-200">
          <div>
            <h3 className="text-base sm:text-lg font-semibold text-slate-800">
              Selecionar Entregador
            </h3>
            <p className="text-xs sm:text-sm text-slate-500">
              Pedido #{orderId} - {customerName}
            </p>
          </div>
          <button
            onClick={handleCancel}
            className="text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-3 sm:p-4">
          {deliverers.length === 0 ? (
            <div className="text-center py-8">
              <Truck className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500">Nenhum entregador ativo encontrado</p>
              <p className="text-sm text-slate-400 mt-1">
                Cadastre entregadores na aba Configurações
              </p>
            </div>
          ) : (
            <div className="space-y-3 max-h-60 overflow-y-auto">
              {deliverers.map((deliverer) => (
                <div
                  key={deliverer.id}
                  onClick={() => setSelectedDeliverer(deliverer.id)}
                  className={`p-4 border rounded-lg cursor-pointer transition-all ${
                    selectedDeliverer === deliverer.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-full ${
                        selectedDeliverer === deliverer.id 
                          ? 'bg-blue-100 text-blue-600' 
                          : 'bg-slate-100 text-slate-600'
                      }`}>
                        <Truck className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="font-medium text-slate-800">
                          {deliverer.name}
                        </h4>
                        <div className="flex items-center gap-1 text-sm text-slate-500">
                          <Phone className="w-3 h-3" />
                          {deliverer.phone}
                        </div>
                      </div>
                    </div>
                    {selectedDeliverer === deliverer.id && (
                      <CheckCircle className="w-5 h-5 text-blue-600" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex gap-2 p-3 sm:p-4 border-t border-slate-200">
          <button
            onClick={handleCancel}
            className="flex-1 px-4 py-2 text-slate-600 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors text-sm"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            disabled={!selectedDeliverer}
            className={`flex-1 px-4 py-2 text-white rounded-lg transition-colors text-sm ${
              selectedDeliverer
                ? 'bg-blue-600 hover:bg-blue-700'
                : 'bg-slate-300 cursor-not-allowed'
            }`}
          >
            Confirmar Entrega
          </button>
        </div>
      </div>
    </div>
  );
};

export default DelivererSelectionModal;