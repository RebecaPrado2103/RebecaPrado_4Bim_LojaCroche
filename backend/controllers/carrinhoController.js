const { query, pool } = require('../database');

// BUSCAR O CARRINHO DO CLIENTE
exports.buscarCarrinho = async (req, res) => {
    try {
        const cpf = req.session.usuario.cpf;

        // Buscar o carrinho do cliente
        const resultado = await query(
            `SELECT id_carrinho
             FROM carrinho
             WHERE cliente_cpf = $1`,
            [cpf]
        );

        // Se ainda não existir, criar um carrinho
        let idCarrinho;

        if (resultado.rows.length === 0) {
            const novoCarrinho = await query(
                `INSERT INTO carrinho (cliente_cpf)
                 VALUES ($1)
                 RETURNING id_carrinho`,
                [cpf]
            );

            idCarrinho = novoCarrinho.rows[0].id_carrinho;
        } else {
            idCarrinho = resultado.rows[0].id_carrinho;
        }

        // Buscar os produtos do carrinho
        const itens = await query(
            `SELECT
                p.id_produto,
                p.nome_produto,
                p.preco_unitario_produto,
                p.quantidade_estoque_produto,
                ic.quantidade_item_carrinho
             FROM item_carrinho ic
             INNER JOIN produto p
                ON p.id_produto = ic.produto_id
             WHERE ic.carrinho_id = $1
             ORDER BY p.id_produto`,
            [idCarrinho]
        );

        return res.status(200).json({
            sucesso: true,
            idCarrinho: idCarrinho,
            itens: itens.rows
        });

    } catch (error) {
        console.error('Erro ao buscar carrinho:', error);

        return res.status(500).json({
            sucesso: false,
            mensagem: 'Não foi possível carregar o carrinho.'
        });
    }
};

// ADICIONAR UM PRODUTO AO CARRINHO
exports.adicionarItem = async (req, res) => {
    const idProduto = Number(req.body.idProduto);
    const quantidade = Number(req.body.quantidade);
    const cpf = req.session.usuario.cpf;

    // Verifica se os dados são válidos
    if (
        !Number.isInteger(idProduto) ||
        idProduto <= 0 ||
        !Number.isInteger(quantidade) ||
        quantidade <= 0
    ) {
        return res.status(400).json({
            sucesso: false,
            mensagem: 'Produto ou quantidade inválidos.'
        });
    }

    const conexao = await pool.connect();

    try {
        await conexao.query('BEGIN');

        // Busca ou cria o carrinho do cliente
        const resultadoCarrinho = await conexao.query(
            `INSERT INTO carrinho (cliente_cpf)
             VALUES ($1)
             ON CONFLICT (cliente_cpf)
             DO UPDATE SET cliente_cpf = EXCLUDED.cliente_cpf
             RETURNING id_carrinho`,
            [cpf]
        );

        const idCarrinho = resultadoCarrinho.rows[0].id_carrinho;

        // Busca o produto e verifica o estoque
        const resultadoProduto = await conexao.query(
            `SELECT id_produto, nome_produto,
                    quantidade_estoque_produto
             FROM produto
             WHERE id_produto = $1
             AND ativo_produto = true
             FOR UPDATE`,
            [idProduto]
        );

        if (resultadoProduto.rows.length === 0) {
            await conexao.query('ROLLBACK');

            return res.status(404).json({
                sucesso: false,
                mensagem: 'Produto não encontrado ou indisponível.'
            });
        }

        const produto = resultadoProduto.rows[0];

        // Verifica se o produto já está no carrinho
        const resultadoItem = await conexao.query(
            `SELECT quantidade_item_carrinho
             FROM item_carrinho
             WHERE carrinho_id = $1
             AND produto_id = $2`,
            [idCarrinho, idProduto]
        );

        const quantidadeAtual = resultadoItem.rows.length > 0
            ? resultadoItem.rows[0].quantidade_item_carrinho
            : 0;

        const novaQuantidade = quantidadeAtual + quantidade;

        // Impede que a quantidade ultrapasse o estoque
        if (novaQuantidade > produto.quantidade_estoque_produto) {
            await conexao.query('ROLLBACK');

            return res.status(400).json({
                sucesso: false,
                mensagem: 'Quantidade solicitada maior que o estoque disponível.'
            });
        }

        // Adiciona o produto ou atualiza sua quantidade
        await conexao.query(
            `INSERT INTO item_carrinho
                (carrinho_id, produto_id, quantidade_item_carrinho)
             VALUES ($1, $2, $3)
             ON CONFLICT (carrinho_id, produto_id)
             DO UPDATE SET
                quantidade_item_carrinho =
                item_carrinho.quantidade_item_carrinho + EXCLUDED.quantidade_item_carrinho`,
            [idCarrinho, idProduto, quantidade]
        );

        await conexao.query('COMMIT');

        return res.status(201).json({
            sucesso: true,
            mensagem: 'Produto adicionado ao carrinho!',
            produto: produto.nome_produto,
            quantidade: novaQuantidade
        });

    } catch (error) {
        await conexao.query('ROLLBACK');

        console.error('Erro ao adicionar produto ao carrinho:', error);

        return res.status(500).json({
            sucesso: false,
            mensagem: 'Erro ao adicionar produto ao carrinho.'
        });

    } finally {
        conexao.release();
    }
};

// ATUALIZAR A QUANTIDADE DE UM PRODUTO
exports.atualizarQuantidade = async (req, res) => {
    const idProduto = Number(req.params.idProduto);
    const quantidade = Number(req.body.quantidade);
    const cpf = req.session.usuario.cpf;

    if (
        !Number.isInteger(idProduto) ||
        idProduto <= 0 ||
        !Number.isInteger(quantidade) ||
        quantidade <= 0
    ) {
        return res.status(400).json({
            sucesso: false,
            mensagem: 'Produto ou quantidade inválidos.'
        });
    }

    const conexao = await pool.connect();

    try {
        await conexao.query('BEGIN');

        // Busca o carrinho do cliente
        const resultadoCarrinho = await conexao.query(
            `SELECT id_carrinho
             FROM carrinho
             WHERE cliente_cpf = $1`,
            [cpf]
        );

        if (resultadoCarrinho.rows.length === 0) {
            await conexao.query('ROLLBACK');

            return res.status(404).json({
                sucesso: false,
                mensagem: 'Carrinho não encontrado.'
            });
        }

        const idCarrinho = resultadoCarrinho.rows[0].id_carrinho;

        // Verifica o estoque do produto
        const resultadoProduto = await conexao.query(
            `SELECT quantidade_estoque_produto
             FROM produto
             WHERE id_produto = $1
             AND ativo_produto = true
             FOR UPDATE`,
            [idProduto]
        );

        if (resultadoProduto.rows.length === 0) {
            await conexao.query('ROLLBACK');

            return res.status(404).json({
                sucesso: false,
                mensagem: 'Produto não encontrado ou indisponível.'
            });
        }

        const estoque = resultadoProduto.rows[0].quantidade_estoque_produto;

        if (quantidade > estoque) {
            await conexao.query('ROLLBACK');

            return res.status(400).json({
                sucesso: false,
                mensagem: 'Quantidade maior que o estoque disponível.'
            });
        }

        // Atualiza a quantidade no carrinho
        const resultadoAtualizacao = await conexao.query(
            `UPDATE item_carrinho
             SET quantidade_item_carrinho = $1
             WHERE carrinho_id = $2
             AND produto_id = $3
             RETURNING quantidade_item_carrinho`,
            [quantidade, idCarrinho, idProduto]
        );

        if (resultadoAtualizacao.rows.length === 0) {
            await conexao.query('ROLLBACK');

            return res.status(404).json({
                sucesso: false,
                mensagem: 'Produto não encontrado no carrinho.'
            });
        }

        await conexao.query('COMMIT');

        return res.status(200).json({
            sucesso: true,
            mensagem: 'Quantidade atualizada com sucesso!',
            quantidade: resultadoAtualizacao.rows[0].quantidade_item_carrinho
        });

    } catch (error) {
        await conexao.query('ROLLBACK');

        console.error('Erro ao atualizar quantidade:', error);

        return res.status(500).json({
            sucesso: false,
            mensagem: 'Erro ao atualizar a quantidade do produto.'
        });

    } finally {
        conexao.release();
    }
};

 // REMOVER UM PRODUTO DO CARRINHO
exports.removerItem = async (req, res) => {
    const idProduto = Number(req.params.idProduto);
    const cpf = req.session.usuario.cpf;

    if (!Number.isInteger(idProduto) || idProduto <= 0) {
        return res.status(400).json({
            sucesso: false,
            mensagem: 'ID do produto inválido.'
        });
    }

    try {
        // Localiza o carrinho do cliente
        const resultadoCarrinho = await query(
            `SELECT id_carrinho
             FROM carrinho
             WHERE cliente_cpf = $1`,
            [cpf]
        );

        if (resultadoCarrinho.rows.length === 0) {
            return res.status(404).json({
                sucesso: false,
                mensagem: 'Carrinho não encontrado.'
            });
        }

        const idCarrinho = resultadoCarrinho.rows[0].id_carrinho;

        // Remove o produto do carrinho
        const resultado = await query(
            `DELETE FROM item_carrinho
             WHERE carrinho_id = $1
             AND produto_id = $2
             RETURNING produto_id`,
            [idCarrinho, idProduto]
        );

        if (resultado.rows.length === 0) {
            return res.status(404).json({
                sucesso: false,
                mensagem: 'Produto não encontrado no carrinho.'
            });
        }

        return res.status(200).json({
            sucesso: true,
            mensagem: 'Produto removido do carrinho!'
        });

    } catch (error) {
        console.error('Erro ao remover produto do carrinho:', error);

        return res.status(500).json({
            sucesso: false,
            mensagem: 'Erro ao remover produto do carrinho.'
        });
    }
};