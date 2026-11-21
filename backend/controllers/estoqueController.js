const { query, pool } = require('../database');

// LISTAR O HISTÓRICO DE MOVIMENTAÇÕES
exports.listarMovimentacoes = async (req, res) => {
    try {
        const resultado = await query(`
            SELECT
                m.id_movimentacao,
                m.tipo_movimentacao,
                m.quantidade_movimentacao,
                m.data_movimentacao,
                m.observacao_movimentacao,
                p.id_produto,
                p.nome_produto,
                pe.nome_pessoa AS nome_funcionario
            FROM movimentacao_estoque m
            INNER JOIN produto p
                ON m.produto_id = p.id_produto
            LEFT JOIN funcionario f
                ON m.funcionario_cpf = f.pessoa_cpf_pessoa
            LEFT JOIN pessoa pe
                ON f.pessoa_cpf_pessoa = pe.cpf_pessoa
            ORDER BY m.data_movimentacao DESC
        `);

        return res.status(200).json({
            sucesso: true,
            movimentacoes: resultado.rows
        });

    } catch (error) {
        console.error('Erro ao listar movimentações:', error);

        return res.status(500).json({
            sucesso: false,
            mensagem: 'Erro ao carregar o histórico de estoque.'
        });
    }
};


// REGISTRAR ENTRADA DE PRODUTOS
exports.registrarEntrada = async (req, res) => {
    const conexao = await pool.connect();

    try {
        const { produto_id, quantidade, observacao } = req.body;

        // VALIDAR O ID DO PRODUTO
        const idProduto = Number(produto_id);

        if (!Number.isInteger(idProduto) || idProduto <= 0) {
            return res.status(400).json({
                sucesso: false,
                mensagem: 'Informe um produto válido.'
            });
        }

        // VALIDAR A QUANTIDADE
        const quantidadeEntrada = Number(quantidade);

        if (!Number.isInteger(quantidadeEntrada) || quantidadeEntrada <= 0) {
            return res.status(400).json({
                sucesso: false,
                mensagem: 'Informe uma quantidade válida.'
            });
        }

        // INICIAR A TRANSAÇÃO
        await conexao.query('BEGIN');

        // ATUALIZAR O ESTOQUE
        const resultado = await conexao.query(`
            UPDATE produto
            SET quantidade_estoque_produto =
                quantidade_estoque_produto + $1
            WHERE id_produto = $2
            RETURNING *
        `, [quantidadeEntrada, idProduto]);

        // VERIFICAR SE O PRODUTO EXISTE
        if (resultado.rowCount === 0) {
            await conexao.query('ROLLBACK');

            return res.status(404).json({
                sucesso: false,
                mensagem: 'Produto não encontrado.'
            });
        }

        // REGISTRAR A MOVIMENTAÇÃO
        await conexao.query(`
            INSERT INTO movimentacao_estoque (
                produto_id,
                funcionario_cpf,
                tipo_movimentacao,
                quantidade_movimentacao,
                observacao_movimentacao
            )
            VALUES ($1, $2, 'Entrada', $3, $4)
        `, [
            idProduto,
            req.session.usuario.cpf,
            quantidadeEntrada,
            observacao?.trim() || null
        ]);

        // CONFIRMAR A TRANSAÇÃO
        await conexao.query('COMMIT');

        return res.status(200).json({
            sucesso: true,
            mensagem: 'Entrada registrada com sucesso!',
            produto: resultado.rows[0]
        });

    } catch (error) {
        await conexao.query('ROLLBACK');

        console.error('Erro ao registrar entrada:', error);

        return res.status(500).json({
            sucesso: false,
            mensagem: 'Não foi possível registrar a entrada.'
        });

    } finally {
        conexao.release();
    }
};


 // REGISTRAR SAÍDA MANUAL DE PRODUTOS
exports.registrarSaida = async (req, res) => {
    const conexao = await pool.connect();

    try {
        const { produto_id, quantidade, observacao } = req.body;

        // VALIDAR O ID DO PRODUTO
        const idProduto = Number(produto_id);

        if (!Number.isInteger(idProduto) || idProduto <= 0) {
            return res.status(400).json({
                sucesso: false,
                mensagem: 'Informe um produto válido.'
            });
        }

        // VALIDAR A QUANTIDADE
        const quantidadeSaida = Number(quantidade);

        if (!Number.isInteger(quantidadeSaida) || quantidadeSaida <= 0) {
            return res.status(400).json({
                sucesso: false,
                mensagem: 'Informe uma quantidade válida.'
            });
        }

        // INICIAR A TRANSAÇÃO
        await conexao.query('BEGIN');

        // DIMINUIR O ESTOQUE SOMENTE SE HOUVER QUANTIDADE SUFICIENTE
        const resultado = await conexao.query(`
            UPDATE produto
            SET quantidade_estoque_produto =
                quantidade_estoque_produto - $1
            WHERE id_produto = $2
            AND quantidade_estoque_produto >= $1
            RETURNING *
        `, [quantidadeSaida, idProduto]);

        // VERIFICAR SE A SAÍDA FOI POSSÍVEL
        if (resultado.rowCount === 0) {
            await conexao.query('ROLLBACK');

            const produto = await query(`
                SELECT id_produto, quantidade_estoque_produto
                FROM produto
                WHERE id_produto = $1
            `, [idProduto]);

            if (produto.rowCount === 0) {
                return res.status(404).json({
                    sucesso: false,
                    mensagem: 'Produto não encontrado.'
                });
            }

            return res.status(400).json({
                sucesso: false,
                mensagem: 'Estoque insuficiente para realizar essa saída.'
            });
        }

        // REGISTRAR A MOVIMENTAÇÃO
        await conexao.query(`
            INSERT INTO movimentacao_estoque (
                produto_id,
                funcionario_cpf,
                tipo_movimentacao,
                quantidade_movimentacao,
                observacao_movimentacao
            )
            VALUES ($1, $2, 'Saída', $3, $4)
        `, [
            idProduto,
            req.session.usuario.cpf,
            quantidadeSaida,
            observacao?.trim() || null
        ]);

        // CONFIRMAR A TRANSAÇÃO
        await conexao.query('COMMIT');

        return res.status(200).json({
            sucesso: true,
            mensagem: 'Saída registrada com sucesso!',
            produto: resultado.rows[0]
        });

    } catch (error) {
        await conexao.query('ROLLBACK');

        console.error('Erro ao registrar saída:', error);

        return res.status(500).json({
            sucesso: false,
            mensagem: 'Não foi possível registrar a saída.'
        });

    } finally {
        conexao.release();
    }
};
