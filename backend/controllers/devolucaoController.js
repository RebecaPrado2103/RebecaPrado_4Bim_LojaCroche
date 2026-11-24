const { query, pool } = require('../database');

// LISTAR PEDIDOS DISPONÍVEIS PARA DEVOLUÇÃO
exports.listarPedidosDisponiveis = async (req, res) => {
    try {

        const resultado = await query(`
            SELECT
                p.id_pedido,
                p.data_pedido,
                p.cliente_cpf,
                pe.nome_pessoa,

                (
                    SELECT COUNT(*)
                    FROM item_pedido ip
                    WHERE ip.pedido_id = p.id_pedido
                ) AS quantidade_itens

            FROM pedido p

            INNER JOIN cliente c
                ON p.cliente_cpf = c.pessoa_cpf_pessoa

            INNER JOIN pessoa pe
                ON c.pessoa_cpf_pessoa = pe.cpf_pessoa

            WHERE p.status_pedido = 'Entregue'

            AND EXISTS (
                SELECT 1
                FROM item_pedido ip

                WHERE ip.pedido_id = p.id_pedido

                AND ip.quantidade_item_pedido > (
                    SELECT COALESCE(
                        SUM(idv.quantidade_devolvida), 0
                    )
                    FROM item_devolucao idv

                    INNER JOIN devolucao d
                        ON idv.devolucao_id = d.id_devolucao

                    WHERE idv.pedido_id = ip.pedido_id
                      AND idv.produto_id = ip.produto_id
                      AND d.status_devolucao <> 'Recusada'
                )
            )

            ORDER BY p.data_pedido DESC;
        `);

        return res.status(200).json({
            sucesso: true,
            pedidos: resultado.rows
        });

    } catch (error) {

        console.error(
            'Erro ao listar pedidos disponíveis:',
            error
        );

        return res.status(500).json({
            sucesso: false,
            mensagem: 'Erro ao carregar os pedidos disponíveis.'
        });
    }
};

// CONSULTAR OS PRODUTOS DE UM PEDIDO
exports.listarItensPedido = async (req, res) => {
    const { id } = req.params;

    try {
        const resultado = await query(`
            SELECT
                ip.produto_id,
                pr.nome_produto,
                ip.quantidade_item_pedido AS quantidade_comprada,

                COALESCE((
                    SELECT SUM(idv.quantidade_devolvida)
                    FROM item_devolucao idv
                    INNER JOIN devolucao d
                        ON d.id_devolucao = idv.devolucao_id
                    WHERE idv.pedido_id = ip.pedido_id
                      AND idv.produto_id = ip.produto_id
                      AND d.status_devolucao <> 'Recusada'
                ), 0) AS quantidade_reservada,

                ip.quantidade_item_pedido - COALESCE((
                    SELECT SUM(idv.quantidade_devolvida)
                    FROM item_devolucao idv
                    INNER JOIN devolucao d
                        ON d.id_devolucao = idv.devolucao_id
                    WHERE idv.pedido_id = ip.pedido_id
                      AND idv.produto_id = ip.produto_id
                      AND d.status_devolucao <> 'Recusada'
                ), 0) AS quantidade_disponivel

            FROM item_pedido ip
            INNER JOIN produto pr
                ON pr.id_produto = ip.produto_id
            WHERE ip.pedido_id = $1
            ORDER BY pr.nome_produto;
        `, [id]);

        if (resultado.rows.length === 0) {
            return res.status(404).json({
                sucesso: false,
                mensagem: 'Pedido não encontrado ou sem produtos.'
            });
        }

        return res.status(200).json({
            sucesso: true,
            itens: resultado.rows
        });

    } catch (error) {
        console.error('Erro ao consultar produtos do pedido:', error);

        return res.status(500).json({
            sucesso: false,
            mensagem: 'Erro ao carregar os produtos do pedido.'
        });
    }
};

// REGISTRAR UMA DEVOLUÇÃO
exports.registrarDevolucao = async (req, res) => {
    const { pedido_id, motivo_devolucao, itens } = req.body;

    const conexao = await pool.connect();

    try {
        // VALIDAR OS DADOS RECEBIDOS
        if (
            !Number.isInteger(Number(pedido_id)) ||
            Number(pedido_id) <= 0 ||
            typeof motivo_devolucao !== 'string' ||
            !motivo_devolucao.trim() ||
            !Array.isArray(itens) ||
            itens.length === 0
        ) {
            return res.status(400).json({
                sucesso: false,
                mensagem: 'Informe o pedido, o motivo e os produtos devolvidos.'
            });
        }

        await conexao.query('BEGIN');

        // VERIFICAR SE O PEDIDO EXISTE E ESTÁ CONCLUÍDO
        const resultadoPedido = await conexao.query(`
            SELECT id_pedido
            FROM pedido
            WHERE id_pedido = $1
                AND status_pedido = 'Entregue'
            FOR UPDATE;
        `, [pedido_id]);

        if (resultadoPedido.rows.length === 0) {
            throw new Error('Pedido não encontrado ou não está concluído.');
        }

        // IMPEDIR QUE O MESMO PRODUTO APAREÇA DUAS VEZES
        const produtosInformados = itens.map(item => Number(item.produto_id));

        if (new Set(produtosInformados).size !== itens.length) {
            throw new Error('Um produto foi informado mais de uma vez.');
        }

        // CRIAR O REGISTRO DA DEVOLUÇÃO
        const resultadoDevolucao = await conexao.query(`
            INSERT INTO devolucao (
                pedido_id,
                motivo_devolucao,
                status_devolucao
            )
            VALUES ($1, $2, 'Concluída')
            RETURNING id_devolucao;
        `, [pedido_id, motivo_devolucao.trim()]);

        const devolucaoId = resultadoDevolucao.rows[0].id_devolucao;

        // PROCESSAR CADA PRODUTO DEVOLVIDO
        for (const item of itens) {
            const produtoId = Number(item.produto_id);
            const quantidade = Number(item.quantidade_devolvida);
            const condicao = item.condicao_produto;

            if (
                !Number.isInteger(produtoId) ||
                produtoId <= 0 ||
                !Number.isInteger(quantidade) ||
                quantidade <= 0 ||
                !['Em perfeito estado', 'Com defeito'].includes(condicao)
            ) {
                throw new Error('Existem dados inválidos nos produtos devolvidos.');
            }

            // CONFERIR A QUANTIDADE COMPRADA
            const resultadoItem = await conexao.query(`
                SELECT quantidade_item_pedido
                FROM item_pedido
                WHERE pedido_id = $1
                  AND produto_id = $2;
            `, [pedido_id, produtoId]);

            if (resultadoItem.rows.length === 0) {
                throw new Error(`O produto ${produtoId} não pertence a esse pedido.`);
            }

            const quantidadeComprada =
                Number(resultadoItem.rows[0].quantidade_item_pedido);

            // SOMAR AS QUANTIDADES JÁ DEVOLVIDAS
            const resultadoDevolvido = await conexao.query(`
                SELECT COALESCE(SUM(idv.quantidade_devolvida), 0) AS total
                FROM item_devolucao idv
                INNER JOIN devolucao d
                    ON d.id_devolucao = idv.devolucao_id
                WHERE idv.pedido_id = $1
                  AND idv.produto_id = $2
                  AND d.status_devolucao <> 'Recusada';
            `, [pedido_id, produtoId]);

            const quantidadeJaDevolvida =
                Number(resultadoDevolvido.rows[0].total);

            const quantidadeDisponivel =
                quantidadeComprada - quantidadeJaDevolvida;

            if (quantidade > quantidadeDisponivel) {
                throw new Error(
                    `Quantidade indisponível para o produto ${produtoId}.`
                );
            }

            // SALVAR O ITEM DA DEVOLUÇÃO
            await conexao.query(`
                INSERT INTO item_devolucao (
                    devolucao_id,
                    pedido_id,
                    produto_id,
                    quantidade_devolvida,
                    condicao_produto,
                    estoque_processado
                )
                VALUES ($1, $2, $3, $4, $5, $6);
            `, [
                devolucaoId,
                pedido_id,
                produtoId,
                quantidade,
                condicao,
                true
            ]);

            // DEVOLVER AO ESTOQUE SOMENTE PRODUTOS EM PERFEITO ESTADO
            if (condicao === 'Em perfeito estado') {

                // ATUALIZAR O ESTOQUE
                await conexao.query(`
                    UPDATE produto
                    SET quantidade_estoque_produto =
                        quantidade_estoque_produto + $1
                    WHERE id_produto = $2;
                `, [quantidade, produtoId]);

                // REGISTRAR A MOVIMENTAÇÃO DO ESTOQUE
                await conexao.query(`
                    INSERT INTO movimentacao_estoque (
                        produto_id,
                        funcionario_cpf,
                        pedido_id,
                        tipo_movimentacao,
                        quantidade_movimentacao,
                        observacao_movimentacao
                    )
                    VALUES ($1, $2, $3, 'Devolução', $4, $5);
                `, [
                    produtoId,
                    req.session.usuario.cpf,
                    pedido_id,
                    quantidade,
                    `Devolução #${devolucaoId} - ${motivo_devolucao.trim()}`
                ]);
            }
        }

        await conexao.query('COMMIT');

        return res.status(201).json({
            sucesso: true,
            mensagem: 'Devolução registrada com sucesso!',
            id_devolucao: devolucaoId
        });

    } catch (error) {
        await conexao.query('ROLLBACK');

        console.error('Erro ao registrar devolução:', error);

        return res.status(400).json({
            sucesso: false,
            mensagem: error.message || 'Erro ao registrar a devolução.'
        });

    } finally {
        conexao.release();
    }
};
// LISTAR HISTÓRICO DE DEVOLUÇÕES
exports.listarHistoricoDevolucoes = async (req, res) => {
    try {
        const resultado = await query(`
            SELECT
                d.id_devolucao,
                d.pedido_id,
                d.data_devolucao,
                d.motivo_devolucao,
                d.status_devolucao,

                pe.nome_pessoa,

                pr.id_produto,
                pr.nome_produto,

                idv.quantidade_devolvida,
                idv.condicao_produto

            FROM devolucao d

            INNER JOIN pedido p
                ON p.id_pedido = d.pedido_id

            INNER JOIN cliente c
                ON c.pessoa_cpf_pessoa = p.cliente_cpf

            INNER JOIN pessoa pe
                ON pe.cpf_pessoa = c.pessoa_cpf_pessoa

            INNER JOIN item_devolucao idv
                ON idv.devolucao_id = d.id_devolucao

            INNER JOIN produto pr
                ON pr.id_produto = idv.produto_id

            ORDER BY d.data_devolucao DESC, d.id_devolucao DESC;
        `);

        return res.status(200).json({
            sucesso: true,
            devolucoes: resultado.rows
        });

    } catch (error) {
        console.error('Erro ao listar histórico de devoluções:', error);

        return res.status(500).json({
            sucesso: false,
            mensagem: 'Erro ao carregar o histórico de devoluções.'
        });
    }
};