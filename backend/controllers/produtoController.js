const { query } = require('../database');
const fs = require('fs/promises');
const path = require('path');

// Listar todos os produtos ativos
exports.listarProdutos = async (req, res) => {
    try {
        const result = await query(`
            SELECT *
            FROM produto
            WHERE ativo_produto = TRUE
            ORDER BY id_produto
        `);

        res.json({
            sucesso: true,
            produtos: result.rows
        });

    } catch (error) {
        console.error('Erro ao listar produtos:', error);

        res.status(500).json({
            sucesso: false,
            mensagem: 'Erro ao listar produtos.'
        });
    }
};

// LISTAR TODOS OS PRODUTOS PARA O GERENTE
exports.listarTodosProdutos = async (req, res) => {
    try {
        const resultado = await query(`
            SELECT *
            FROM produto
            ORDER BY id_produto
        `);

        return res.status(200).json({
            sucesso: true,
            produtos: resultado.rows
        });

    } catch (error) {
        console.error('Erro ao listar todos os produtos:', error);

        return res.status(500).json({
            sucesso: false,
            mensagem: 'Erro ao listar os produtos.'
        });
    }
};

// Listar os produtos em destaque da página inicial
exports.listarDestaques = async (req, res) => {
    try {
        const result = await query(`
            SELECT *
            FROM produto
            WHERE ativo_produto = TRUE
            AND destaque_produto = TRUE
            ORDER BY id_produto
        `);

        res.json({
            sucesso: true,
            produtos: result.rows
        });

    } catch (error) {
        console.error('Erro ao listar produtos em destaque:', error);

        res.status(500).json({
            sucesso: false,
            mensagem: 'Erro ao listar produtos em destaque.'
        });
    }
};

// Buscar um produto específico pelo ID
exports.buscarProdutoPorId = async (req, res) => {
    try {
        const { id } = req.params;

        const resultado = await query(`
            SELECT *
            FROM produto
            WHERE id_produto = $1
            AND ativo_produto = TRUE
        `, [id]);

        if (resultado.rows.length === 0) {
            return res.status(404).json({
                sucesso: false,
                mensagem: 'Produto não encontrado.'
            });
        }

        res.json({
            sucesso: true,
            produto: resultado.rows[0]
        });

    } catch (error) {
        console.error('Erro ao buscar produto:', error);

        res.status(500).json({
            sucesso: false,
            mensagem: 'Erro ao buscar produto.'
        });
    }
};

// CADASTRAR UM NOVO PRODUTO
exports.cadastrarProduto = async (req, res) => {
    try {
        const {
            nome_produto,
            quantidade_estoque_produto,
            preco_unitario_produto,
            categoria_produto,
            destaque_produto
        } = req.body;

        // VERIFICAR OS CAMPOS OBRIGATÓRIOS
        if (
            !nome_produto ||
            quantidade_estoque_produto === undefined ||
            preco_unitario_produto === undefined
        ) {
            return res.status(400).json({
                sucesso: false,
                mensagem: 'Preencha todos os campos obrigatórios.'
            });
        }

        // VALIDAR OS VALORES
        const quantidade = Number(quantidade_estoque_produto);
        const preco = Number(preco_unitario_produto);

        if (
            !Number.isInteger(quantidade) ||
            quantidade < 0 ||
            !Number.isFinite(preco) ||
            preco <= 0
        ) {
            return res.status(400).json({
                sucesso: false,
                mensagem: 'Informe uma quantidade e um preço válidos.'
            });
        }

        // VERIFICAR SE UMA IMAGEM FOI ENVIADA
        if (!req.file) {
            return res.status(400).json({
                sucesso: false,
                mensagem: 'Envie uma imagem PNG para o produto.'
            });
        }

        // CADASTRAR NO BANCO DE DADOS
        const resultado = await query(`
            INSERT INTO produto (
                nome_produto,
                quantidade_estoque_produto,
                preco_unitario_produto,
                categoria_produto,
                destaque_produto
            )
            VALUES ($1, $2, $3, $4, $5)
            RETURNING *
        `, [
            nome_produto.trim(),
            quantidade,
            preco,
            categoria_produto || null,
            destaque_produto === 'true'
        ]);

        // RENOMEAR A IMAGEM COM O ID DO PRODUTO
        const idProduto = resultado.rows[0].id_produto;

        const caminhoImagem = path.join(
            __dirname,
            '../../imagens/produto',
            `${idProduto}.png`
        );

        await fs.rename(req.file.path, caminhoImagem);

        return res.status(201).json({
            sucesso: true,
            mensagem: 'Produto cadastrado com sucesso!',
            produto: resultado.rows[0]
        });

    } catch (error) {
        console.error('Erro ao cadastrar produto:', error);

        return res.status(500).json({
            sucesso: false,
            mensagem: 'Erro ao cadastrar produto.'
        });
    }
};