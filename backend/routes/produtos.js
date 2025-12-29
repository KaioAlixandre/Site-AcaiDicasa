const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { authenticateToken, authorize } = require('./auth');
const multer = require('multer');
const cloudinary = require('../services/cloudinary');
const streamifier = require('streamifier');

// Usar armazenamento em memória para processar upload
const upload = multer({ storage: multer.memoryStorage() });

// Função helper para transformar produto do Prisma para o formato do frontend
const transformProduct = (product) => {
    return {
        id: product.id,
        name: product.nome,
        description: product.descricao || '',
        price: product.preco,
        categoryId: product.categoriaId,
        isActive: product.ativo,
        isFeatured: product.destaque || false,
        receiveComplements: product.recebeComplementos || false,
        quantidadeComplementos: product.quantidadeComplementos ?? 0,
        receiveFlavors: product.recebeSabores || false,
        flavorCategories: (product.categorias_sabor || []).map(pcs => ({
            categoryId: pcs.categoriaSaborId,
            categoryName: pcs.categoriaSabor?.nome || '',
            quantity: pcs.quantidade
        })),
        createdAt: product.criadoEm || new Date(),
        updatedAt: product.atualizadoEm || new Date(),
        category: product.categoria ? {
            id: product.categoria.id,
            name: product.categoria.nome
        } : null,
        images: (product.imagens_produto || []).map(img => ({
            id: img.id,
            url: img.url,
            productId: img.produtoId
        })),
        mainImage: product.imagens_produto?.[0]?.url || null
    };
};

// ========== ROTAS ESPECÍFICAS (devem vir antes de rotas com parâmetros dinâmicos) ==========

// Rota para listar todas as categorias
router.get('/categories', async (req, res) => {
    console.log('📂 GET /api/products/categories: Requisição para listar todas as categorias de produtos.');
    try {
        const categories = await prisma.categoria_produto.findMany();
        // Transformar o campo 'nome' para 'name' para compatibilidade com o frontend
        const transformedCategories = categories.map(cat => ({
            id: cat.id,
            name: cat.nome
        }));
        console.log(`✅ GET /api/products/categories: Categorias listadas com sucesso (${categories.length} encontradas).`);
        res.status(200).json(transformedCategories);
    } catch (err) {
        console.error('❌ GET /api/products/categories: Erro ao buscar categorias:', err.message);
        res.status(500).json({ message: 'Erro ao buscar categorias.', error: err.message });
    }
});

// Rota para adicionar uma nova categoria (apenas para administradores)
router.post('/categories/add', authenticateToken, authorize('admin'), async (req, res) => {
    const { nome } = req.body;
    console.log(`✨ POST /api/products/categories/add: Requisição para adicionar nova categoria: ${nome}.`);
    // Validação básica
    if (!nome || !nome.trim()) {
        console.warn('⚠️ POST /api/products/categories/add: Nome da categoria ausente.');
        return res.status(400).json({ message: 'Nome da categoria é obrigatório.' });
    }
    try {
        // Verificar se já existe uma categoria com o mesmo nome
        const existingCategory = await prisma.categoria_produto.findFirst({
            where: { nome: nome.trim() }
        });
        
        if (existingCategory) {
            console.warn('⚠️ POST /api/products/categories/add: Categoria já existe.');
            return res.status(409).json({ message: 'Já existe uma categoria com este nome.' });
        }

        const newCategory = await prisma.categoria_produto.create({
            data: { nome: nome.trim() },
        });
        console.log(`✅ POST /api/products/categories/add: Nova categoria adicionada com sucesso: ${newCategory.nome}.`);
        // Transformar o campo 'nome' para 'name' para compatibilidade com o frontend
        const transformedCategory = {
            id: newCategory.id,
            name: newCategory.nome
        };
        res.status(201).json(transformedCategory);
    } catch (err) {
        console.error('❌ POST /api/products/categories/add: Erro ao adicionar categoria:', err.message);
        res.status(500).json({ message: 'Erro ao adicionar categoria.', error: err.message });
    }
});

// Rota para atualizar uma categoria (apenas para administradores)
router.put('/categories/:id', authenticateToken, authorize('admin'), async (req, res) => {
    const { id } = req.params;
    const { nome } = req.body;
    console.log(`🔄 PUT /api/products/categories/${id}: Requisição para atualizar categoria.`);
    
    if (!nome || !nome.trim()) {
        console.warn('⚠️ PUT /api/products/categories: Nome da categoria ausente.');
        return res.status(400).json({ message: 'Nome da categoria é obrigatório.' });
    }

    try {
        // Verificar se a categoria existe
        const existingCategory = await prisma.categoria_produto.findUnique({
            where: { id: parseInt(id) }
        });

        if (!existingCategory) {
            console.warn(`⚠️ PUT /api/products/categories/${id}: Categoria não encontrada.`);
            return res.status(404).json({ message: 'Categoria não encontrada.' });
        }

        // Verificar se já existe outra categoria com o mesmo nome
        const duplicateCategory = await prisma.categoria_produto.findFirst({
            where: {
                nome: nome.trim(),
                id: { not: parseInt(id) }
            }
        });

        if (duplicateCategory) {
            console.warn('⚠️ PUT /api/products/categories: Nome já existe em outra categoria.');
            return res.status(409).json({ message: 'Já existe outra categoria com este nome.' });
        }

        const updatedCategory = await prisma.categoria_produto.update({
            where: { id: parseInt(id) },
            data: { nome: nome.trim() }
        });

        console.log(`✅ PUT /api/products/categories/${id}: Categoria atualizada com sucesso.`);
        const transformedCategory = {
            id: updatedCategory.id,
            name: updatedCategory.nome
        };
        res.status(200).json(transformedCategory);
    } catch (err) {
        console.error(`❌ PUT /api/products/categories/${id}: Erro ao atualizar categoria:`, err.message);
        if (err.code === 'P2025') {
            return res.status(404).json({ message: 'Categoria não encontrada.' });
        }
        res.status(500).json({ message: 'Erro ao atualizar categoria.', error: err.message });
    }
});

// Rota para deletar uma categoria (apenas para administradores)
router.delete('/categories/:id', authenticateToken, authorize('admin'), async (req, res) => {
    const { id } = req.params;
    console.log(`🗑️ DELETE /api/products/categories/${id}: Requisição para deletar categoria.`);

    try {
        // Verificar se a categoria existe
        const existingCategory = await prisma.categoria_produto.findUnique({
            where: { id: parseInt(id) },
            include: {
                produtos: {
                    select: { id: true }
                }
            }
        });

        if (!existingCategory) {
            console.warn(`⚠️ DELETE /api/products/categories/${id}: Categoria não encontrada.`);
            return res.status(404).json({ message: 'Categoria não encontrada.' });
        }

        // Verificar se há produtos associados
        if (existingCategory.produtos && existingCategory.produtos.length > 0) {
            console.warn(`⚠️ DELETE /api/products/categories/${id}: Categoria possui ${existingCategory.produtos.length} produto(s) associado(s).`);
            return res.status(400).json({ 
                message: `Não é possível deletar. Esta categoria possui ${existingCategory.produtos.length} produto(s) associado(s).` 
            });
        }

        await prisma.categoria_produto.delete({
            where: { id: parseInt(id) }
        });

        console.log(`✅ DELETE /api/products/categories/${id}: Categoria deletada com sucesso.`);
        res.status(200).json({ message: 'Categoria deletada com sucesso.' });
    } catch (err) {
        console.error(`❌ DELETE /api/products/categories/${id}: Erro ao deletar categoria:`, err.message);
        if (err.code === 'P2025') {
            return res.status(404).json({ message: 'Categoria não encontrada.' });
        }
        res.status(500).json({ message: 'Erro ao deletar categoria.', error: err.message });
    }
});

// Rota para buscar produtos por categoria
router.get('/category/:categoriaId', async (req, res) => {
    const { categoriaId } = req.params;
    console.log(`📂 GET /api/products/category/${categoriaId}: Requisição para buscar produtos por categoria.`);
    try {
        const products = await prisma.produto.findMany({
            where: {
                categoriaId: parseInt(categoriaId)
            },
            include: {
                categoria: true,
                imagens_produto: {
                    orderBy: { id: 'asc' }
                },
                opcoes_produto: {
                    include: {
                        valores_opcao: true,
                    },
                },
                categorias_sabor: {
                    include: {
                        categoriaSabor: true
                    }
                }
            },
        });
        if (products.length === 0) {
            console.warn(`⚠️ GET /api/products/category/${categoriaId}: Nenhum produto encontrado para a categoria: ${categoriaId}.`);
            return res.status(404).json({ message: "Nenhum produto encontrado para esta categoria." });
        }
        
        // Transformar campos do português para inglês
        const transformedProducts = products.map(product => {
            const transformed = transformProduct(product);
            // Adicionar opcoes se existirem
            if (product.opcoes_produto) {
                transformed.options = product.opcoes_produto;
            }
            return transformed;
        });
        
        console.log(`✅ GET /api/products/category/${categoriaId}: Produtos da categoria ${categoriaId} listados com sucesso (${products.length} encontrados).`);
        res.status(200).json(transformedProducts);
    } catch (err) {
        console.error(`❌ GET /api/products/category/${categoriaId}: Erro ao buscar produtos por categoria:`, err.message);
        res.status(500).json({ message: "Erro ao buscar produtos por categoria.", error: err.message });
    }
});

// Rota para adicionar um novo produto (apenas para usuários administradores)
router.post('/add', authenticateToken, authorize('admin'), upload.array('images', 5), async (req, res) => {
    const { nome, preco, descricao, categoriaId, isFeatured, receiveComplements, quantidadeComplementos, receiveFlavors, flavorCategories } = req.body;
    console.log('Categoria recebida:', categoriaId);
    console.log('Destaque:', isFeatured);
    console.log('Recebe complementos:', receiveComplements);
    console.log('Recebe sabores:', receiveFlavors);
    console.log('Categorias de sabores:', flavorCategories);
    const imageFiles = req.files || [];
    console.log(`✨ POST /api/products/add: Requisição para adicionar novo produto: ${nome}.`);
    console.log('Arquivos recebidos:', imageFiles.length);
    console.log('Arquivos detalhes:', imageFiles.map(f => f.originalname));
    try {
        // Upload das imagens para o Cloudinary
        const imagesData = [];
        const streamifier = require('streamifier');
        for (const file of imageFiles) {
            const streamUpload = () => {
                return new Promise((resolve, reject) => {
                    const stream = cloudinary.uploader.upload_stream({ folder: 'produtos' }, (error, result) => {
                        if (result) {
                            resolve({ url: result.secure_url });
                        } else {
                            reject(error);
                        }
                    });
                    streamifier.createReadStream(file.buffer).pipe(stream);
                });
            };
            const uploadResult = await streamUpload();
            imagesData.push(uploadResult);
        }
        console.log('Imagens a serem criadas (Cloudinary):', imagesData);
        
        // Processar categorias de sabores
        let flavorCategoriesData = [];
        if (receiveFlavors === 'true' || receiveFlavors === true) {
            try {
                const parsedFlavorCategories = typeof flavorCategories === 'string' ? JSON.parse(flavorCategories) : flavorCategories;
                if (Array.isArray(parsedFlavorCategories) && parsedFlavorCategories.length > 0) {
                    flavorCategoriesData = parsedFlavorCategories.map(fc => ({
                        categoriaSaborId: parseInt(fc.categoryId),
                        quantidade: parseInt(fc.quantity) || 1
                    })).filter(fc => !isNaN(fc.categoriaSaborId));
                }
            } catch (e) {
                console.warn('⚠️ Erro ao processar categorias de sabores:', e.message);
            }
        }
        
        const newProduct = await prisma.produto.create({
            data: {
                nome,
                preco: parseFloat(preco),
                descricao,
                categoriaId: parseInt(categoriaId),
                destaque: isFeatured === 'true' || isFeatured === true,
                recebeComplementos: receiveComplements === 'true' || receiveComplements === true,
                quantidadeComplementos: receiveComplements === 'true' || receiveComplements === true ? parseInt(quantidadeComplementos) || 0 : 0,
                recebeSabores: receiveFlavors === 'true' || receiveFlavors === true,
                imagens_produto: imagesData.length > 0 ? { create: imagesData } : undefined,
                categorias_sabor: flavorCategoriesData.length > 0 ? { create: flavorCategoriesData } : undefined
            },
            include: { 
                imagens_produto: true,
                categorias_sabor: {
                    include: {
                        categoriaSabor: true
                    }
                },
                categoria: true
            }
        });
        console.log(`✅ POST /api/products/add: Novo produto adicionado com sucesso: ${newProduct.nome}.`);
        console.log('🖼️ Imagens criadas:', newProduct.imagens_produto);
        console.log('🍓 Categorias de sabores:', newProduct.categorias_sabor);
        
        res.status(201).json({ 
            message: 'Produto adicionado com sucesso.', 
            product: transformProduct(newProduct)
        });
    } catch (err) {
        console.error('❌ POST /api/products/add: Erro ao adicionar produto:', err.message);
        res.status(500).json({ message: 'Erro ao adicionar produto.', error: err.message });
    }
});

// Rota para atualizar um produto existente (apenas para administradores)
router.put('/update/:id', authenticateToken, authorize('admin'), upload.array('images', 5), async (req, res) => {
    const { id } = req.params;
    const { nome, preco, descricao, categoriaId, ativo, isFeatured, receiveComplements, quantidadeComplementos, receiveFlavors, flavorCategories } = req.body;
    const imageFiles = req.files || [];
    console.log(`🔄 PUT /api/products/update/${id}: Requisição para atualizar produto.`);
    console.log('📝 Dados recebidos:', { nome, preco, descricao, categoriaId, ativo });
    console.log('🍓 Recebe sabores:', receiveFlavors);
    console.log('🍓 Categorias de sabores:', flavorCategories);
    console.log('🖼️ Arquivos de imagem recebidos:', imageFiles.length);
        if (imageFiles.length > 0) {
            console.log('🖼️ Detalhes das imagens:', imageFiles.map(f => ({ originalname: f.originalname, size: f.size })));
    }
    
    try {
        // Verificar se o produto existe
        const existingProduct = await prisma.produto.findUnique({
            where: { id: parseInt(id) },
            include: { 
                imagens_produto: true,
                categorias_sabor: true
            }
        });
        
        if (!existingProduct) {
            console.warn(`⚠️ PUT /api/products/update/${id}: Produto não encontrado.`);
            return res.status(404).json({ message: 'Produto não encontrado.' });
        }
        
        // Preparar os dados de atualização - apenas incluir campos que foram fornecidos
        const updateData = {};
        
        if (nome !== undefined && nome !== null && nome !== '') {
            updateData.nome = nome;
        }
        
        if (preco !== undefined && preco !== null && preco !== '') {
            const parsedPreco = parseFloat(preco);
            if (!isNaN(parsedPreco)) {
                updateData.preco = parsedPreco;
            }
        } else {
            // Se preco não foi fornecido, manter o valor existente
            updateData.preco = existingProduct.preco;
        }
        
        if (descricao !== undefined && descricao !== null) {
            updateData.descricao = descricao;
        }
        
        if (categoriaId !== undefined && categoriaId !== null && categoriaId !== '') {
            const parsedCategoriaId = parseInt(categoriaId);
            if (!isNaN(parsedCategoriaId)) {
                updateData.categoriaId = parsedCategoriaId;
            }
        }
        
        if (ativo !== undefined && ativo !== null) {
            updateData.ativo = ativo === 'true' || ativo === true;
        }
        
        if (isFeatured !== undefined && isFeatured !== null) {
            updateData.destaque = isFeatured === 'true' || isFeatured === true;
        }
        
        if (receiveComplements !== undefined && receiveComplements !== null) {
            updateData.recebeComplementos = receiveComplements === 'true' || receiveComplements === true;
        }
        
        if (quantidadeComplementos !== undefined && quantidadeComplementos !== null && quantidadeComplementos !== '') {
            const parsedQtd = parseInt(quantidadeComplementos);
            if (!isNaN(parsedQtd)) {
                updateData.quantidadeComplementos = parsedQtd;
            }
        } else if (receiveComplements === 'false' || receiveComplements === false) {
            updateData.quantidadeComplementos = 0;
        }
        
        if (receiveFlavors !== undefined && receiveFlavors !== null) {
            updateData.recebeSabores = receiveFlavors === 'true' || receiveFlavors === true;
        }
        
        // Se houver novas imagens, deletar as antigas do banco e enviar as novas para o Cloudinary
        if (imageFiles.length > 0) {
            console.log(`🗑️ Deletando ${existingProduct.imagens_produto.length} imagens antigas...`);
            // Deletar registros de imagens antigas no banco
            await prisma.imagem_produto.deleteMany({
                where: { produtoId: parseInt(id) }
            });
            // Upload das novas imagens para o Cloudinary
            const imagesData = [];
            const streamifier = require('streamifier');
            for (const file of imageFiles) {
                const streamUpload = () => {
                    return new Promise((resolve, reject) => {
                        const stream = cloudinary.uploader.upload_stream({ folder: 'produtos' }, (error, result) => {
                            if (result) {
                                resolve(result.secure_url);
                            } else {
                                reject(error);
                            }
                        });
                        streamifier.createReadStream(file.buffer).pipe(stream);
                    });
                };
                const uploadResult = await streamUpload();
                imagesData.push({ url: uploadResult });
            }
            updateData.imagens_produto = { create: imagesData };
            console.log(`✨ ${imageFiles.length} novas imagens enviadas para o Cloudinary e adicionadas ao produto.`);
        }
        
        // Atualizar o produto e gerenciar categorias de sabores
        const updatedProduct = await prisma.$transaction(async (tx) => {
            // Deletar categorias de sabores antigas se necessário
            if (receiveFlavors !== undefined) {
                await tx.produto_categoria_sabor.deleteMany({
                    where: { produtoId: parseInt(id) }
                });
            }
            
            // Atualizar o produto
            const product = await tx.produto.update({
                where: { id: parseInt(id) },
                data: updateData,
                include: { 
                    imagens_produto: true,
                    categorias_sabor: {
                        include: {
                            categoriaSabor: true
                        }
                    }
                }
            });
            
            // Adicionar novas categorias de sabores se necessário
            if (receiveFlavors === 'true' || receiveFlavors === true) {
                try {
                    const parsedFlavorCategories = typeof flavorCategories === 'string' ? JSON.parse(flavorCategories) : flavorCategories;
                    if (Array.isArray(parsedFlavorCategories) && parsedFlavorCategories.length > 0) {
                        const flavorCategoriesData = parsedFlavorCategories.map(fc => ({
                            produtoId: parseInt(id),
                            categoriaSaborId: parseInt(fc.categoryId),
                            quantidade: parseInt(fc.quantity) || 1
                        })).filter(fc => !isNaN(fc.categoriaSaborId));
                        
                        if (flavorCategoriesData.length > 0) {
                            await tx.produto_categoria_sabor.createMany({
                                data: flavorCategoriesData
                            });
                        }
                    }
                } catch (e) {
                    console.warn('⚠️ Erro ao processar categorias de sabores:', e.message);
                }
            }
            
            // Retornar produto atualizado com categorias de sabores
            return await tx.produto.findUnique({
                where: { id: parseInt(id) },
                include: { 
                    imagens_produto: true,
                    categorias_sabor: {
                        include: {
                            categoriaSabor: true
                        }
                    }
                }
            });
        });
        
        console.log(`✅ PUT /api/products/update/${id}: Produto atualizado com sucesso: ${updatedProduct.nome}.`);
        console.log('🍓 Categorias de sabores atualizadas:', updatedProduct.categorias_sabor);
        console.log('🖼️ Imagens atuais:', updatedProduct.imagens_produto);
        
        // Buscar categoria para incluir na transformação
        const completeProduct = await prisma.produto.findUnique({
            where: { id: parseInt(id) },
            include: {
                imagens_produto: true,
                categorias_sabor: {
                    include: {
                        categoriaSabor: true
                    }
                },
                categoria: true
            }
        });
        
        res.status(200).json({ 
            message: 'Produto atualizado com sucesso.', 
            product: transformProduct(completeProduct)
        });
    } catch (err) {
        console.error(`❌ PUT /api/products/update/${id}: Erro ao atualizar produto:`, err.message);
        res.status(500).json({ message: 'Erro ao atualizar produto.', error: err.message });
    }
});

// Rota para deletar um produto (apenas para administradores)
router.delete('/delete/:id', authenticateToken, authorize('admin'), async (req, res) => {
    const { id } = req.params;
    console.log(`🗑️ DELETE /api/products/delete/${id}: Requisição para deletar produto.`);
    try {
        await prisma.produto.delete({ where: { id: parseInt(id) } });
        console.log(`✅ DELETE /api/products/delete/${id}: Produto deletado com sucesso.`);
        res.status(200).json({ message: 'Produto deletado com sucesso.' });
    } catch (err) {
        console.error(`❌ DELETE /api/products/delete/${id}: Erro ao deletar produto:`, err.message);
        res.status(500).json({ message: 'Erro ao deletar produto.', error: err.message });
    }
});

// ========== ROTAS GENÉRICAS (devem vir por último) ==========

// Rota para listar todos os produtos
router.get('/', async (req, res) => {
    console.log('📦 GET /api/products: Requisição para listar todos os produtos.');
    try {
        const products = await prisma.produto.findMany({
            include: { 
                imagens_produto: {
                    orderBy: { id: 'asc' } // Primeira imagem inserida será a principal
                }, 
                categoria: true,
                categorias_sabor: {
                    include: {
                        categoriaSabor: true
                    }
                }
            }
        });
        
        // Transformar campos do português para inglês
        const transformedProducts = products.map(product => transformProduct(product));
        
        console.log(`✅ Retornando ${transformedProducts.length} produtos com imagens`);
        if (transformedProducts.length > 0) {
            console.log('🖼️ Exemplo produto:', {
                id: transformedProducts[0].id,
                name: transformedProducts[0].name,
                images: transformedProducts[0].images,
                mainImage: transformedProducts[0].mainImage
            });
        }
        res.json(transformedProducts);
    } catch (err) {
        console.error('❌ GET /api/products: Erro ao buscar produtos:', err.message);
        res.status(500).json({ message: 'Erro ao buscar produtos.', error: err.message });
    }
});

// Rota para buscar um produto específico por ID
router.get('/:id', async (req, res) => {
    const { id } = req.params;
    console.log(`🔍 GET /api/products/${id}: Requisição para buscar produto específico.`);
    
    try {
        const product = await prisma.produto.findUnique({
            where: { id: parseInt(id) },
            include: { 
                imagens_produto: {
                    orderBy: { id: 'asc' }
                }, 
                categoria: true,
                categorias_sabor: {
                    include: {
                        categoriaSabor: true
                    }
                }
            }
        });

        if (!product) {
            console.warn(`⚠️ GET /api/products/${id}: Produto não encontrado.`);
            return res.status(404).json({ message: 'Produto não encontrado.' });
        }

        // Transformar campos do português para inglês
        const transformedProduct = transformProduct(product);

        console.log(`✅ Produto ${id} encontrado:`, transformedProduct.name);
        res.json(transformedProduct);
    } catch (err) {
        console.error(`❌ GET /api/products/${id}: Erro ao buscar produto:`, err.message);
        res.status(500).json({ message: 'Erro ao buscar produto.', error: err.message });
    }
});

module.exports = router;
