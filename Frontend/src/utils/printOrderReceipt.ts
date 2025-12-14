import { Order } from '../types';

interface PrintOrderReceiptOptions {
  order: Order;
  user?: {
    nomeUsuario?: string;
    telefone?: string;
    email?: string;
  };
  storeInfo?: {
    name?: string;
    address?: string;
    cnpj?: string;
    phone?: string;
  };
}

/**
 * Formata data para exibição
 */
const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

/**
 * Formata método de pagamento
 */
const formatPaymentMethod = (method?: string): string => {
  switch (method) {
    case 'CREDIT_CARD':
      return 'Cartão de Crédito';
    case 'PIX':
      return 'PIX';
    case 'CASH_ON_DELIVERY':
      return 'Dinheiro na Entrega';
    default:
      return method || 'Não informado';
  }
};

/**
 * Formata tipo de entrega
 */
const formatDeliveryType = (type?: string): string => {
  return type === 'delivery' ? 'Entrega em Casa' : 'Retirada no Local';
};

/**
 * Gera e imprime a nota do pedido
 */
export const printOrderReceipt = (options: PrintOrderReceiptOptions) => {
  const { order, user, storeInfo } = options;

  // Calcular subtotal
  const subtotal = (order.orderitem || []).reduce(
    (sum, item) => sum + (Number(item.priceAtOrder ?? 0) * item.quantity),
    0
  );

  // Gerar HTML da nota
  const receiptHTML = `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Nota do Pedido #${order.id.toString().padStart(4, '0')}</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          font-family: Arial, sans-serif;
          padding: 20px;
          color: #1f2937;
          background: white;
        }
        
        .receipt {
          max-width: 800px;
          margin: 0 auto;
          background: white;
        }
        
        .header {
          text-align: center;
          border-bottom: 3px solid #1f2937;
          padding-bottom: 20px;
          margin-bottom: 30px;
        }
        
        .header h1 {
          font-size: 32px;
          font-weight: bold;
          color: #1f2937;
          margin-bottom: 10px;
        }
        
        .header p {
          font-size: 14px;
          color: #4b5563;
          margin: 2px 0;
        }
        
        .section {
          margin-bottom: 25px;
        }
        
        .section-title {
          font-size: 18px;
          font-weight: bold;
          color: #1f2937;
          margin-bottom: 15px;
          border-bottom: 2px solid #e5e7eb;
          padding-bottom: 5px;
        }
        
        .info-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 15px;
          margin-bottom: 15px;
        }
        
        .info-item {
          font-size: 14px;
        }
        
        .info-label {
          color: #6b7280;
          font-size: 12px;
          margin-bottom: 3px;
        }
        
        .info-value {
          font-weight: bold;
          color: #1f2937;
        }
        
        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 10px;
        }
        
        table thead {
          background-color: #f3f4f6;
          border-bottom: 2px solid #d1d5db;
        }
        
        table th {
          padding: 12px;
          text-align: left;
          font-weight: bold;
          font-size: 13px;
          color: #374151;
        }
        
        table th.text-center {
          text-align: center;
        }
        
        table th.text-right {
          text-align: right;
        }
        
        table td {
          padding: 12px;
          border-bottom: 1px solid #e5e7eb;
          font-size: 13px;
        }
        
        table td.text-center {
          text-align: center;
        }
        
        table td.text-right {
          text-align: right;
        }
        
        .item-name {
          font-weight: bold;
          color: #1f2937;
        }
        
        .item-complements {
          font-size: 11px;
          color: #6b7280;
          margin-top: 3px;
          font-style: italic;
        }
        
        .summary {
          margin-top: 20px;
          border-top: 2px solid #1f2937;
          padding-top: 15px;
        }
        
        .summary-row {
          display: flex;
          justify-content: space-between;
          padding: 8px 0;
          font-size: 14px;
        }
        
        .summary-row.total {
          border-top: 2px solid #1f2937;
          margin-top: 10px;
          padding-top: 15px;
          font-size: 20px;
          font-weight: bold;
        }
        
        .summary-label {
          color: #374151;
        }
        
        .summary-value {
          font-weight: bold;
          color: #1f2937;
        }
        
        .summary-value.total {
          color: #7c3aed;
          font-size: 24px;
        }
        
        .footer {
          text-align: center;
          margin-top: 40px;
          padding-top: 20px;
          border-top: 2px solid #e5e7eb;
          color: #6b7280;
          font-size: 12px;
        }
        
        .notes {
          background-color: #fef3c7;
          border: 1px solid #fbbf24;
          border-radius: 6px;
          padding: 12px;
          margin-top: 15px;
        }
        
        .notes-title {
          font-weight: bold;
          color: #92400e;
          margin-bottom: 5px;
          font-size: 13px;
        }
        
        .notes-content {
          color: #78350f;
          font-size: 12px;
          white-space: pre-wrap;
        }
        
        @media print {
          body {
            padding: 0;
          }
          
          .receipt {
            max-width: 100%;
          }
          
          @page {
            size: A4;
            margin: 1.5cm;
          }
        }
      </style>
    </head>
    <body>
      <div class="receipt">
        <!-- Cabeçalho -->
        <div class="header">
          <h1>${storeInfo?.name || 'Açaidicasa'}</h1>
          <p>${storeInfo?.address || 'Praça Geraldo Sá - Centro'}</p>
          ${storeInfo?.cnpj ? `<p>CNPJ: ${storeInfo.cnpj}</p>` : ''}
          ${storeInfo?.phone ? `<p>Telefone: ${storeInfo.phone}</p>` : ''}
        </div>

        <!-- Informações do Pedido -->
        <div class="section">
          <h2 class="section-title">NOTA DO PEDIDO</h2>
          <div class="info-grid">
            <div class="info-item">
              <div class="info-label">Número do Pedido</div>
              <div class="info-value">#${order.id.toString().padStart(4, '0')}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Data/Hora</div>
              <div class="info-value">${formatDate(order.createdAt)}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Tipo de Entrega</div>
              <div class="info-value">${formatDeliveryType(order.deliveryType)}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Forma de Pagamento</div>
              <div class="info-value">${formatPaymentMethod((order as any).paymentMethod || order.payment?.method)}</div>
            </div>
          </div>
        </div>

        <!-- Informações do Cliente -->
        ${user ? `
        <div class="section">
          <h2 class="section-title">DADOS DO CLIENTE</h2>
          <div class="info-grid">
            ${user.nomeUsuario ? `
            <div class="info-item">
              <div class="info-label">Nome</div>
              <div class="info-value">${user.nomeUsuario}</div>
            </div>
            ` : ''}
            ${user.telefone ? `
            <div class="info-item">
              <div class="info-label">Telefone</div>
              <div class="info-value">${user.telefone}</div>
            </div>
            ` : ''}
            ${user.email ? `
            <div class="info-item">
              <div class="info-label">E-mail</div>
              <div class="info-value">${user.email}</div>
            </div>
            ` : ''}
          </div>
        </div>
        ` : ''}

        <!-- Endereço de Entrega -->
        ${order.deliveryType === 'delivery' && order.shippingStreet ? `
        <div class="section">
          <h2 class="section-title">ENDEREÇO DE ENTREGA</h2>
          <div class="info-item">
            <div class="info-value">
              ${order.shippingStreet}, ${order.shippingNumber}
              ${order.shippingComplement ? ` - ${order.shippingComplement}` : ''}
            </div>
            <div class="info-value" style="margin-top: 5px;">${order.shippingNeighborhood}</div>
            ${order.shippingPhone ? `<div class="info-value" style="margin-top: 5px;">Telefone: ${order.shippingPhone}</div>` : ''}
          </div>
        </div>
        ` : ''}

        <!-- Itens do Pedido -->
        <div class="section">
          <h2 class="section-title">ITENS DO PEDIDO</h2>
          <table>
            <thead>
              <tr>
                <th>Item</th>
                <th class="text-center">Qtd</th>
                <th class="text-right">Unit.</th>
                <th class="text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              ${(order.orderitem || []).map((item) => {
                const isCustomAcai = item.selectedOptionsSnapshot?.customAcai;
                const isCustomSorvete = item.selectedOptionsSnapshot?.customSorvete;
                const isCustomProduct = item.selectedOptionsSnapshot?.customProduct;
                const customData = isCustomAcai || isCustomSorvete || isCustomProduct;
                
                const complementos = [];
                if (item.complements && item.complements.length > 0) {
                  complementos.push(...item.complements.map(c => c.name));
                }
                if (customData?.complementNames && Array.isArray(customData.complementNames)) {
                  complementos.push(...customData.complementNames);
                }
                
                return `
                  <tr>
                    <td>
                      <div class="item-name">${item.product?.name || 'Produto'}</div>
                      ${customData ? '<div class="item-complements">(Personalizado)</div>' : ''}
                      ${complementos.length > 0 ? `<div class="item-complements">+ ${complementos.join(', ')}</div>` : ''}
                    </td>
                    <td class="text-center">${item.quantity}</td>
                    <td class="text-right">R$ ${Number(item.priceAtOrder ?? 0).toFixed(2)}</td>
                    <td class="text-right"><strong>R$ ${(Number(item.priceAtOrder ?? 0) * item.quantity).toFixed(2)}</strong></td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>

        <!-- Observações -->
        ${order.notes && order.notes.trim() ? `
        <div class="section">
          <div class="notes">
            <div class="notes-title">OBSERVAÇÕES DO CLIENTE</div>
            <div class="notes-content">${order.notes}</div>
          </div>
        </div>
        ` : ''}

        <!-- Resumo Financeiro -->
        <div class="section">
          <div class="summary">
            <div class="summary-row">
              <span class="summary-label">Subtotal:</span>
              <span class="summary-value">R$ ${subtotal.toFixed(2)}</span>
            </div>
            ${order.deliveryType === 'delivery' ? `
            <div class="summary-row">
              <span class="summary-label">Taxa de Entrega:</span>
              <span class="summary-value">R$ ${Number(order.deliveryFee || 0).toFixed(2)}</span>
            </div>
            ` : ''}
            <div class="summary-row total">
              <span class="summary-label">TOTAL:</span>
              <span class="summary-value total">R$ ${Number(order.totalPrice).toFixed(2)}</span>
            </div>
          </div>
        </div>

        <!-- Rodapé -->
        <div class="footer">
          <p style="margin-bottom: 10px; font-weight: bold;">Obrigado pela sua preferência!</p>
          <p>Volte sempre ao ${storeInfo?.name || 'Açaidicasa'}</p>
          <p style="margin-top: 15px; font-size: 11px; color: #9ca3af;">
            Esta é uma nota de pedido. Guarde para seu controle.
          </p>
        </div>
      </div>
    </body>
    </html>
  `;

  // Criar uma nova janela para impressão
  const printWindow = window.open('', '_blank', 'width=800,height=600');
  if (!printWindow) {
    alert('Por favor, permita pop-ups para imprimir a nota.');
    return;
  }

  printWindow.document.write(receiptHTML);
  printWindow.document.close();

  // Aguardar o carregamento e imprimir
  printWindow.onload = () => {
    setTimeout(() => {
      printWindow.print();
      // Fechar a janela após impressão (opcional)
      // printWindow.close();
    }, 250);
  };
};

