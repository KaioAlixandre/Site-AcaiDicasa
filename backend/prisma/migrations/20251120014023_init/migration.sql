-- CreateTable
CREATE TABLE `enderecos` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `rua` VARCHAR(255) NOT NULL,
    `numero` VARCHAR(20) NOT NULL,
    `complemento` VARCHAR(100) NULL,
    `bairro` VARCHAR(100) NOT NULL,
    `pontoReferencia` VARCHAR(255) NULL,
    `padrao` BOOLEAN NOT NULL DEFAULT false,
    `usuarioId` INTEGER NOT NULL,

    INDEX `Endereco_userId_fkey`(`usuarioId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `carrinhos` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `usuarioId` INTEGER NOT NULL,
    `criadoEm` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `Carrinho_userId_key`(`usuarioId`),
    INDEX `Carrinho_userId_fkey`(`usuarioId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `itens_carrinho` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `carrinhoId` INTEGER NOT NULL,
    `produtoId` INTEGER NOT NULL,
    `quantidade` INTEGER NOT NULL,
    `criadoEm` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `opcoesSelecionadas` JSON NULL,

    INDEX `CartItem_productId_fkey`(`produtoId`),
    UNIQUE INDEX `CartItem_cartId_productId_key`(`carrinhoId`, `produtoId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `itens_carrinho_complementos` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `itemCarrinhoId` INTEGER NOT NULL,
    `complementoId` INTEGER NOT NULL,
    `criadoEm` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `itens_carrinho_complementos_itemCarrinhoId_idx`(`itemCarrinhoId`),
    INDEX `itens_carrinho_complementos_complementoId_idx`(`complementoId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `relatorios_vendas_categoria` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `data` DATE NOT NULL,
    `unidadesVendidas` INTEGER NOT NULL,
    `receitaTotal` DECIMAL(12, 2) NOT NULL,
    `categoriaId` INTEGER NOT NULL,

    INDEX `CategorySalesReport_categoryId_fkey`(`categoriaId`),
    UNIQUE INDEX `CategorySalesReport_date_categoryId_key`(`data`, `categoriaId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `complementos` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nome` VARCHAR(100) NOT NULL,
    `imagemUrl` VARCHAR(255) NULL,
    `ativo` BOOLEAN NOT NULL DEFAULT true,
    `categoriaId` INTEGER NULL,
    `criadoEm` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `atualizadoEm` DATETIME(3) NOT NULL,

    INDEX `Complement_categoryId_fkey`(`categoriaId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `categorias_complemento` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nome` VARCHAR(100) NOT NULL,
    `criadoEm` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `atualizadoEm` DATETIME(3) NOT NULL,

    UNIQUE INDEX `ComplementCategory_name_key`(`nome`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `cupons` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `codigo` VARCHAR(50) NOT NULL,
    `tipoDesconto` ENUM('PERCENTAGE', 'FIXED_AMOUNT') NOT NULL,
    `valor` DECIMAL(10, 2) NOT NULL,
    `expiraEm` DATETIME(3) NULL,
    `ativo` BOOLEAN NOT NULL DEFAULT true,
    `maxUsos` INTEGER NULL,
    `contadorUsos` INTEGER NOT NULL DEFAULT 0,

    UNIQUE INDEX `Coupon_code_key`(`codigo`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `relatorios_vendas_diario` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `data` DATE NOT NULL,
    `vendasTotais` DECIMAL(12, 2) NOT NULL,
    `contadorPedidos` INTEGER NOT NULL,
    `itensVendidosTotal` INTEGER NOT NULL,
    `valorMedioPedido` DECIMAL(12, 2) NOT NULL,

    UNIQUE INDEX `DailySalesReport_date_key`(`data`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `entregadores` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nome` VARCHAR(100) NOT NULL,
    `telefone` VARCHAR(20) NOT NULL,
    `email` VARCHAR(100) NULL,
    `ativo` BOOLEAN NOT NULL DEFAULT true,
    `criadoEm` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `valores_opcao` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `valor` VARCHAR(100) NOT NULL,
    `modificadorPreco` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    `opcaoId` INTEGER NOT NULL,

    INDEX `OptionValue_optionId_fkey`(`opcaoId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `pedidos` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `usuarioId` INTEGER NOT NULL,
    `status` ENUM('pending_payment', 'being_prepared', 'ready_for_pickup', 'on_the_way', 'delivered', 'canceled') NOT NULL DEFAULT 'being_prepared',
    `precoTotal` DECIMAL(10, 2) NOT NULL,
    `criadoEm` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `complementoEntrega` VARCHAR(191) NULL,
    `bairroEntrega` VARCHAR(191) NULL,
    `numeroEntrega` VARCHAR(191) NULL,
    `ruaEntrega` VARCHAR(191) NULL,
    `telefoneEntrega` VARCHAR(191) NULL,
    `taxaEntrega` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    `tipoEntrega` VARCHAR(191) NOT NULL DEFAULT 'delivery',
    `metodoPagamento` ENUM('CREDIT_CARD', 'PIX', 'CASH_ON_DELIVERY') NULL,
    `entregadorId` INTEGER NULL,
    `atualizadoEm` DATETIME(3) NOT NULL,

    INDEX `Order_delivererId_fkey`(`entregadorId`),
    INDEX `Order_userId_fkey`(`usuarioId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `cupons_pedido` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `pedidoId` INTEGER NOT NULL,
    `cupomId` INTEGER NOT NULL,
    `valorDesconto` DECIMAL(10, 2) NOT NULL,

    UNIQUE INDEX `OrderCoupon_orderId_key`(`pedidoId`),
    INDEX `OrderCoupon_couponId_fkey`(`cupomId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `itens_pedido` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `pedidoId` INTEGER NOT NULL,
    `produtoId` INTEGER NOT NULL,
    `quantidade` INTEGER NOT NULL,
    `precoNoPedido` DECIMAL(10, 2) NOT NULL,
    `opcoesSelecionadasSnapshot` JSON NULL,

    INDEX `OrderItem_orderId_fkey`(`pedidoId`),
    INDEX `OrderItem_productId_fkey`(`produtoId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `itens_pedido_complementos` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `itemPedidoId` INTEGER NOT NULL,
    `complementoId` INTEGER NOT NULL,
    `criadoEm` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `itens_pedido_complementos_itemPedidoId_idx`(`itemPedidoId`),
    INDEX `itens_pedido_complementos_complementoId_idx`(`complementoId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `pagamentos` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `valor` DECIMAL(10, 2) NOT NULL,
    `metodo` ENUM('CREDIT_CARD', 'PIX', 'CASH_ON_DELIVERY') NOT NULL,
    `status` ENUM('PENDING', 'PAID', 'FAILED', 'REFUNDED') NOT NULL DEFAULT 'PENDING',
    `idTransacao` VARCHAR(255) NULL,
    `criadoEm` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `atualizadoEm` DATETIME(3) NOT NULL,
    `pedidoId` INTEGER NOT NULL,

    UNIQUE INDEX `Payment_orderId_key`(`pedidoId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `produtos` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nome` VARCHAR(255) NOT NULL,
    `preco` DECIMAL(10, 2) NOT NULL,
    `descricao` TEXT NULL,
    `criadoEm` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `categoriaId` INTEGER NULL,
    `ativo` BOOLEAN NOT NULL DEFAULT true,
    `destaque` BOOLEAN NOT NULL DEFAULT false,
    `recebeComplementos` BOOLEAN NOT NULL DEFAULT false,

    INDEX `Product_categoryId_fkey`(`categoriaId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `categorias_produto` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nome` VARCHAR(100) NOT NULL,

    UNIQUE INDEX `ProductCategory_name_key`(`nome`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `imagens_produto` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `url` VARCHAR(255) NOT NULL,
    `textoAlt` VARCHAR(255) NULL,
    `produtoId` INTEGER NOT NULL,

    INDEX `ProductImage_productId_fkey`(`produtoId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `opcoes_produto` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nome` VARCHAR(100) NOT NULL,
    `produtoId` INTEGER NOT NULL,

    INDEX `ProductOption_productId_fkey`(`produtoId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `relatorios_vendas_produto` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `data` DATE NOT NULL,
    `unidadesVendidas` INTEGER NOT NULL,
    `receitaTotal` DECIMAL(12, 2) NOT NULL,
    `produtoId` INTEGER NOT NULL,

    INDEX `ProductSalesReport_productId_fkey`(`produtoId`),
    UNIQUE INDEX `ProductSalesReport_date_productId_key`(`data`, `produtoId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `avaliacoes` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `avaliacao` INTEGER NOT NULL,
    `comentario` TEXT NULL,
    `criadoEm` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `usuarioId` INTEGER NOT NULL,
    `produtoId` INTEGER NOT NULL,

    INDEX `Review_productId_fkey`(`produtoId`),
    UNIQUE INDEX `Review_userId_productId_key`(`usuarioId`, `produtoId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `configuracoes_loja` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `aberto` BOOLEAN NOT NULL DEFAULT true,
    `horaAbertura` VARCHAR(5) NOT NULL,
    `horaFechamento` VARCHAR(5) NOT NULL,
    `diasAbertos` VARCHAR(20) NOT NULL,
    `atualizadoEm` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `usuarios` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nomeUsuario` VARCHAR(50) NOT NULL,
    `email` VARCHAR(100) NOT NULL,
    `senha` VARCHAR(255) NOT NULL,
    `funcao` ENUM('user', 'admin', 'master') NOT NULL DEFAULT 'user',
    `criadoEm` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `telefone` VARCHAR(20) NULL,

    UNIQUE INDEX `User_username_key`(`nomeUsuario`),
    UNIQUE INDEX `User_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `redefinicoes_senha` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `email` VARCHAR(191) NOT NULL,
    `codigo` VARCHAR(6) NOT NULL,
    `criadoEm` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `expiraEm` DATETIME(3) NOT NULL,
    `usado` BOOLEAN NOT NULL DEFAULT false,

    INDEX `redefinicoes_senha_email_idx`(`email`),
    INDEX `redefinicoes_senha_codigo_idx`(`codigo`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `enderecos` ADD CONSTRAINT `Endereco_userId_fkey` FOREIGN KEY (`usuarioId`) REFERENCES `usuarios`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `carrinhos` ADD CONSTRAINT `Carrinho_userId_fkey` FOREIGN KEY (`usuarioId`) REFERENCES `usuarios`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `itens_carrinho` ADD CONSTRAINT `CartItem_cartId_fkey` FOREIGN KEY (`carrinhoId`) REFERENCES `carrinhos`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `itens_carrinho` ADD CONSTRAINT `CartItem_productId_fkey` FOREIGN KEY (`produtoId`) REFERENCES `produtos`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `itens_carrinho_complementos` ADD CONSTRAINT `itens_carrinho_complementos_itemCarrinhoId_fkey` FOREIGN KEY (`itemCarrinhoId`) REFERENCES `itens_carrinho`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `itens_carrinho_complementos` ADD CONSTRAINT `itens_carrinho_complementos_complementoId_fkey` FOREIGN KEY (`complementoId`) REFERENCES `complementos`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `relatorios_vendas_categoria` ADD CONSTRAINT `CategorySalesReport_categoryId_fkey` FOREIGN KEY (`categoriaId`) REFERENCES `categorias_produto`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `complementos` ADD CONSTRAINT `Complement_categoryId_fkey` FOREIGN KEY (`categoriaId`) REFERENCES `categorias_complemento`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `valores_opcao` ADD CONSTRAINT `OptionValue_optionId_fkey` FOREIGN KEY (`opcaoId`) REFERENCES `opcoes_produto`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `pedidos` ADD CONSTRAINT `Order_delivererId_fkey` FOREIGN KEY (`entregadorId`) REFERENCES `entregadores`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `pedidos` ADD CONSTRAINT `Order_userId_fkey` FOREIGN KEY (`usuarioId`) REFERENCES `usuarios`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `cupons_pedido` ADD CONSTRAINT `OrderCoupon_couponId_fkey` FOREIGN KEY (`cupomId`) REFERENCES `cupons`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `cupons_pedido` ADD CONSTRAINT `OrderCoupon_orderId_fkey` FOREIGN KEY (`pedidoId`) REFERENCES `pedidos`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `itens_pedido` ADD CONSTRAINT `OrderItem_orderId_fkey` FOREIGN KEY (`pedidoId`) REFERENCES `pedidos`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `itens_pedido` ADD CONSTRAINT `OrderItem_productId_fkey` FOREIGN KEY (`produtoId`) REFERENCES `produtos`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `itens_pedido_complementos` ADD CONSTRAINT `itens_pedido_complementos_itemPedidoId_fkey` FOREIGN KEY (`itemPedidoId`) REFERENCES `itens_pedido`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `itens_pedido_complementos` ADD CONSTRAINT `itens_pedido_complementos_complementoId_fkey` FOREIGN KEY (`complementoId`) REFERENCES `complementos`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `pagamentos` ADD CONSTRAINT `Payment_orderId_fkey` FOREIGN KEY (`pedidoId`) REFERENCES `pedidos`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `produtos` ADD CONSTRAINT `Product_categoryId_fkey` FOREIGN KEY (`categoriaId`) REFERENCES `categorias_produto`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `imagens_produto` ADD CONSTRAINT `ProductImage_productId_fkey` FOREIGN KEY (`produtoId`) REFERENCES `produtos`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `opcoes_produto` ADD CONSTRAINT `ProductOption_productId_fkey` FOREIGN KEY (`produtoId`) REFERENCES `produtos`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `relatorios_vendas_produto` ADD CONSTRAINT `ProductSalesReport_productId_fkey` FOREIGN KEY (`produtoId`) REFERENCES `produtos`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `avaliacoes` ADD CONSTRAINT `Review_productId_fkey` FOREIGN KEY (`produtoId`) REFERENCES `produtos`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `avaliacoes` ADD CONSTRAINT `Review_userId_fkey` FOREIGN KEY (`usuarioId`) REFERENCES `usuarios`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
