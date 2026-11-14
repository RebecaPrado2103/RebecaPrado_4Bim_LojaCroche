const { pool } = require('../database');

// CONFIRMAR PEDIDO
exports.confirmarPedido = async (req, res) => {

    const cpfCliente = req.session.usuario.cpf;
    const { dadosEntrega, pagamentos } = req.body;

    // VERIFICAR DADOS DE ENTREGA
    const camposObrigatorios = [
        'nome',
        'cep',
        'endereco',
        'numero',
        'cidade',
        'estado'
    ];

    for (const campo of camposObrigatorios) {
        if (!dadosEntrega || !dadosEntrega[campo]?.trim()) {
            return res.status(400).json({
                sucesso: false,
                mensagem: 'Preencha todos os dados obrigatórios de entrega.'
            });
        }
    }

    // VERIFICAR PAGAMENTOS
    if (!Array.isArray(pagamentos) || pagamentos.length === 0) {
        return res.status(400).json({
            sucesso: false,
            mensagem: 'Selecione pelo menos uma forma de pagamento.'
        });
    }

    // VALIDAR CADA FORMA DE PAGAMENTO
    const formasPermitidas = [1, 2, 3];

    for (const pagamento of pagamentos) {

        const formaId = Number(pagamento.formaPagamentoId);
        const valor = Number(pagamento.valor);

        if (!formasPermitidas.includes(formaId)) {
            return res.status(400).json({
                sucesso: false,
                mensagem: 'Forma de pagamento inválida.'
            });
        }

        if (!Number.isFinite(valor) || valor <= 0) {
            return res.status(400).json({
                sucesso: false,
                mensagem: 'Informe valores válidos para os pagamentos.'
            });
        }
    }

    // INICIAR CONEXÃO COM O BANCO
    const client = await pool.connect();

    try {

        // INICIAR TRANSAÇÃO
        await client.query('BEGIN');

        // BUSCAR O CARRINHO DO CLIENTE
        const resultadoCarrinho = await client.query(
            `SELECT id_carrinho
         FROM carrinho
         WHERE cliente_cpf = $1`,
            [cpfCliente]
        );

        if (resultadoCarrinho.rows.length === 0) {
            await client.query('ROLLBACK');

            return res.status(400).json({
                sucesso: false,
                mensagem: 'Seu carrinho está vazio.'
            });
        }

        const idCarrinho = resultadoCarrinho.rows[0].id_carrinho;

        // BUSCAR OS PRODUTOS DO CARRINHO
        // E BLOQUEAR SEUS REGISTROS DURANTE A COMPRA
        const resultadoItens = await client.query(
            `SELECT
        p.id_produto,
        p.nome_produto,
        p.preco_unitario_produto,
        p.quantidade_estoque_produto,
        p.ativo_produto,
        ic.quantidade_item_carrinho
        FROM item_carrinho ic
        INNER JOIN produto p
        ON p.id_produto = ic.produto_id
        WHERE ic.carrinho_id = $1
        FOR UPDATE OF p`,
            [idCarrinho]
        );

        const itensCarrinho = resultadoItens.rows;

        // VERIFICAR SE EXISTEM PRODUTOS INATIVOS
        const produtoInativo = itensCarrinho.find(
            item => !item.ativo_produto
        );

        if (produtoInativo) {

            await client.query('ROLLBACK');

            return res.status(400).json({
                sucesso: false,
                mensagem: `O produto ${produtoInativo.nome_produto} não está mais disponível. Atualize seu carrinho.`
            });

        }

        if (itensCarrinho.length === 0) {
            await client.query('ROLLBACK');

            return res.status(400).json({
                sucesso: false,
                mensagem: 'Seu carrinho não possui produtos disponíveis.'
            });
        }

        // CONFERIR A DISPONIBILIDADE DO ESTOQUE
        for (const item of itensCarrinho) {

            if (
                item.quantidade_item_carrinho >
                item.quantidade_estoque_produto
            ) {
                await client.query('ROLLBACK');

                return res.status(400).json({
                    sucesso: false,
                    mensagem: `Estoque insuficiente para o produto ${item.nome_produto}.`
                });
            }

        }

        // CALCULAR O TOTAL DA COMPRA EM CENTAVOS
        const totalCompraCentavos = itensCarrinho.reduce(
            (total, item) => {
                return total +
                    Math.round(Number(item.preco_unitario_produto) * 100) *
                    Number(item.quantidade_item_carrinho);
            },
            0
        );

        // SOMAR OS VALORES DOS PAGAMENTOS EM CENTAVOS
        const totalPagamentosCentavos = pagamentos.reduce(
            (total, pagamento) => {
                return total + Math.round(Number(pagamento.valor) * 100);
            },
            0
        );

        // CONFERIR SE OS VALORES CORRESPONDEM
        if (totalPagamentosCentavos !== totalCompraCentavos) {

            await client.query('ROLLBACK');

            return res.status(400).json({
                sucesso: false,
                mensagem: 'A soma dos pagamentos deve corresponder ao total da compra.'
            });

        }

        const resultadoPedido = await client.query(
            `INSERT INTO pedido (
        cliente_cpf,
        valor_total,
        status_pedido,
        nome_entrega,
        cep_entrega,
        endereco_entrega,
        numero_entrega,
        complemento_entrega,
        cidade_entrega,
        estado_entrega
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    RETURNING id_pedido`,
            [
                cpfCliente,
                totalCompraCentavos / 100,
                'Pagamento aprovado',
                dadosEntrega.nome.trim(),
                dadosEntrega.cep.trim(),
                dadosEntrega.endereco.trim(),
                dadosEntrega.numero.trim(),
                dadosEntrega.complemento?.trim() || null,
                dadosEntrega.cidade.trim(),
                dadosEntrega.estado.trim().toUpperCase()
            ]
        );

        // RECUPERAR O ID DO PEDIDO CRIADO
        const idPedido = resultadoPedido.rows[0].id_pedido;

        // REGISTRAR OS PRODUTOS DO PEDIDO
        for (const item of itensCarrinho) {

            await client.query(
                `INSERT INTO item_pedido (
            pedido_id,
            produto_id,
            quantidade_item_pedido,
            preco_unitario_item_pedido
        )
        VALUES ($1, $2, $3, $4)`,
                [
                    idPedido,
                    item.id_produto,
                    item.quantidade_item_carrinho,
                    item.preco_unitario_produto
                ]
            );

        }

        // REGISTRAR AS FORMAS DE PAGAMENTO
        for (const pagamento of pagamentos) {

            await client.query(
                `INSERT INTO pagamento (
            pedido_id,
            forma_pagamento_id,
            valor_pagamento,
            status_pagamento
        )
        VALUES ($1, $2, $3, $4)`,
                [
                    idPedido,
                    Number(pagamento.formaPagamentoId),
                    Math.round(Number(pagamento.valor) * 100) / 100,
                    'Aprovado'
                ]
            );

        }

        // ATUALIZAR O ESTOQUE DOS PRODUTOS
        for (const item of itensCarrinho) {

            const resultadoEstoque = await client.query(
                `UPDATE produto
         SET quantidade_estoque_produto =
             quantidade_estoque_produto - $1
         WHERE id_produto = $2
         AND quantidade_estoque_produto >= $1
         RETURNING id_produto`,
                [
                    item.quantidade_item_carrinho,
                    item.id_produto
                ]
            );

            if (resultadoEstoque.rowCount === 0) {
                throw new Error(
                    `Não foi possível atualizar o estoque de ${item.nome_produto}.`
                );
            }

        }

        // ESVAZIAR O CARRINHO APÓS A COMPRA
        await client.query(
            `DELETE FROM item_carrinho
            WHERE carrinho_id = $1`,
            [idCarrinho]
        );

        // CONFIRMAR A TRANSAÇÃO
        await client.query('COMMIT');

        // RETORNAR A CONFIRMAÇÃO DA COMPRA
        return res.status(201).json({
            sucesso: true,
            mensagem: 'Compra realizada com sucesso!',
            idPedido: idPedido,
            valorTotal: totalCompraCentavos / 100
        });

    } catch (error) {

        await client.query('ROLLBACK');

        console.error('Erro ao registrar pedido:', error);

        return res.status(500).json({
            sucesso: false,
            mensagem: 'Não foi possível preparar sua compra.'
        });

    } finally {

        client.release();

    }

};