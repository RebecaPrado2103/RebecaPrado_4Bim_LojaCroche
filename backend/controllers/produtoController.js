const { query } = require('../database');

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