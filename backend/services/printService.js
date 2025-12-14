const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const { promisify } = require('util');

const execAsync = promisify(exec);

/**
 * Gera o conteúdo HTML da nota do pedido
 */
function generateReceiptHTML(order, user, storeInfo = {}) {
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatPaymentMethod = (method) => {
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

  const formatDeliveryType = (type) => {
    return type === 'delivery' ? 'Entrega em Casa' : 'Retirada no Local';
  };

  // Calcular subtotal
  const subtotal = (order.itens_pedido || []).reduce(
    (sum, item) => sum + (Number(item.precoNoPedido || 0) * item.quantidade),
    0
  );

  const orderNumber = order.id.toString().padStart(4, '0');
  const orderDate = formatDate(order.criadoEm);
  const deliveryType = formatDeliveryType(order.tipoEntrega);
  const paymentMethod = formatPaymentMethod(order.metodoPagamento);

  // Gerar itens
  const itemsHTML = (order.itens_pedido || []).map((item) => {
    const isCustomAcai = item.opcoesSelecionadasSnapshot?.customAcai;
    const isCustomSorvete = item.opcoesSelecionadasSnapshot?.customSorvete;
    const isCustomProduct = item.opcoesSelecionadasSnapshot?.customProduct;
    const customData = isCustomAcai || isCustomSorvete || isCustomProduct;
    
    const complementos = [];
    if (item.complementos && item.complementos.length > 0) {
      complementos.push(...item.complementos.map(c => c.complemento?.nome || '').filter(Boolean));
    }
    if (customData?.complementNames && Array.isArray(customData.complementNames)) {
      complementos.push(...customData.complementNames);
    }
    
    const productName = item.produto?.nome || 'Produto';
    const customLabel = customData ? '<div style="font-size: 11px; color: #6b7280; margin-top: 3px; font-style: italic;">(Personalizado)</div>' : '';
    const complementsLabel = complementos.length > 0 ? `<div style="font-size: 11px; color: #6b7280; margin-top: 3px; font-style: italic;">+ ${complementos.join(', ')}</div>` : '';
    
    return `
      <tr>
        <td style="padding: 12px;">
          <div style="font-weight: bold; color: #1f2937;">${productName}</div>
          ${customLabel}
          ${complementsLabel}
        </td>
        <td style="padding: 12px; text-align: center;">${item.quantidade}</td>
        <td style="padding: 12px; text-align: right;">R$ ${Number(item.precoNoPedido || 0).toFixed(2)}</td>
        <td style="padding: 12px; text-align: right;"><strong>R$ ${(Number(item.precoNoPedido || 0) * item.quantidade).toFixed(2)}</strong></td>
      </tr>
    `;
  }).join('');

  return `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <title>Nota do Pedido #${orderNumber}</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
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
        table th.text-center { text-align: center; }
        table th.text-right { text-align: right; }
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
        @media print {
          @page { size: A4; margin: 1.5cm; }
          body { padding: 0; }
          .receipt { max-width: 100%; }
        }
      </style>
    </head>
    <body>
      <div class="receipt">
        <div class="header">
          <h1>${storeInfo.name || 'Açaidicasa'}</h1>
          <p>${storeInfo.address || 'Praça Geraldo Sá - Centro'}</p>
          ${storeInfo.cnpj ? `<p>CNPJ: ${storeInfo.cnpj}</p>` : ''}
          ${storeInfo.phone ? `<p>Telefone: ${storeInfo.phone}</p>` : ''}
        </div>

        <div class="section">
          <h2 class="section-title">NOTA DO PEDIDO</h2>
          <div class="info-grid">
            <div class="info-item">
              <div class="info-label">Número do Pedido</div>
              <div class="info-value">#${orderNumber}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Data/Hora</div>
              <div class="info-value">${orderDate}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Tipo de Entrega</div>
              <div class="info-value">${deliveryType}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Forma de Pagamento</div>
              <div class="info-value">${paymentMethod}</div>
            </div>
          </div>
        </div>

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
          </div>
        </div>
        ` : ''}

        ${order.tipoEntrega === 'delivery' && order.ruaEntrega ? `
        <div class="section">
          <h2 class="section-title">ENDEREÇO DE ENTREGA</h2>
          <div class="info-item">
            <div class="info-value">
              ${order.ruaEntrega}, ${order.numeroEntrega}
              ${order.complementoEntrega ? ` - ${order.complementoEntrega}` : ''}
            </div>
            <div class="info-value" style="margin-top: 5px;">${order.bairroEntrega}</div>
          </div>
        </div>
        ` : ''}

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
              ${itemsHTML}
            </tbody>
          </table>
        </div>

        ${order.observacoes ? `
        <div class="section">
          <div class="notes">
            <div style="font-weight: bold; color: #92400e; margin-bottom: 5px; font-size: 13px;">OBSERVAÇÕES DO CLIENTE</div>
            <div style="color: #78350f; font-size: 12px; white-space: pre-wrap;">${order.observacoes}</div>
          </div>
        </div>
        ` : ''}

        <div class="section">
          <div class="summary">
            <div class="summary-row">
              <span>Subtotal:</span>
              <span style="font-weight: bold;">R$ ${subtotal.toFixed(2)}</span>
            </div>
            ${order.tipoEntrega === 'delivery' ? `
            <div class="summary-row">
              <span>Taxa de Entrega:</span>
              <span style="font-weight: bold;">R$ ${Number(order.taxaEntrega || 0).toFixed(2)}</span>
            </div>
            ` : ''}
            <div class="summary-row total">
              <span>TOTAL:</span>
              <span class="summary-value total">R$ ${Number(order.precoTotal).toFixed(2)}</span>
            </div>
          </div>
        </div>

        <div class="footer">
          <p style="margin-bottom: 10px; font-weight: bold;">Obrigado pela sua preferência!</p>
          <p>Volte sempre ao ${storeInfo.name || 'Açaidicasa'}</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

/**
 * Imprime a nota do pedido automaticamente
 * Tenta usar diferentes métodos dependendo do sistema operacional
 */
async function printReceiptAutomatically(order, user, storeInfo = {}) {
  try {
    const htmlContent = generateReceiptHTML(order, user, storeInfo);
    
    // Criar diretório temporário se não existir
    const tempDir = path.join(__dirname, '../temp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    const htmlPath = path.join(tempDir, `receipt_${order.id}.html`);
    fs.writeFileSync(htmlPath, htmlContent, 'utf8');

    // Detectar sistema operacional
    const platform = process.platform;
    let printCommand;

    if (platform === 'win32') {
      // Windows - usar comando de impressão nativo
      // Converte o caminho para formato Windows
      const normalizedPath = htmlPath.replace(/\//g, '\\');
      // Usa o comando rundll32 para imprimir via shell
      printCommand = `powershell -Command "$printer = Get-Printer | Where-Object {$_.Default -eq $true} | Select-Object -First 1 -ExpandProperty Name; if ($printer) { Start-Process -FilePath '${normalizedPath}' -Verb Print -ErrorAction SilentlyContinue } else { Write-Host 'Nenhuma impressora padrão encontrada' }"`;
    } else if (platform === 'darwin') {
      // macOS - usar lpr ou cups
      printCommand = `lpr -o media=A4 "${htmlPath}"`;
    } else {
      // Linux - usar lp ou cups
      printCommand = `lp -d $(lpstat -d | cut -d: -f2 | xargs) -o media=A4 "${htmlPath}"`;
    }

    // Executar comando de impressão
    try {
      await execAsync(printCommand);
      console.log(`✅ Nota do pedido #${order.id} enviada para impressão automaticamente`);
      
      // Limpar arquivo temporário após um delay
      setTimeout(() => {
        try {
          if (fs.existsSync(htmlPath)) {
            fs.unlinkSync(htmlPath);
          }
        } catch (err) {
          console.error('Erro ao limpar arquivo temporário:', err);
        }
      }, 5000);
    } catch (printError) {
      console.warn(`⚠️ Não foi possível imprimir automaticamente. Erro: ${printError.message}`);
      console.log('💡 Certifique-se de que há uma impressora configurada no sistema');
    }

  } catch (error) {
    console.error('❌ Erro ao gerar/imprimir nota:', error);
  }
}

module.exports = {
  printReceiptAutomatically,
  generateReceiptHTML
};

