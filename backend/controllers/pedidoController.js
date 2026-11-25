const { pool } = require('../database');

// CONFIRMAR PEDIDO
exports.confirmarPedido = async (req, res) => {

    const cpfCliente = req.session.usuario.cpf;
    const { dadosEntrega, pagamentos, itensCompra } = req.body;

    // IDENTIFICA A ORIGEM DA COMPRA
    const compraDireta = Array.isArray(itensCompra) && itensCompra.length > 0;

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

    // VALIDAR OS DADOS DE CADA PAGAMENTO
    for (const pagamento of pagamentos) {

        const formaId = Number(pagamento.formaPagamentoId);
        const valor = Number(pagamento.valor);

        if (!Number.isInteger(formaId) || formaId <= 0) {
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

        // BUSCAR AS FORMAS DE PAGAMENTO ATIVAS
        const resultadoFormas = await client.query(
            `SELECT
            id_forma_pagamento,
            nome_forma_pagamento,
            max_parcelas_forma_pagamento
        FROM forma_pagamento
        WHERE ativo_forma_pagamento = TRUE
        FOR SHARE`
        );


        // VERIFICAR AS FORMAS ESCOLHIDAS E SUAS PARCELAS
        for (const pagamento of pagamentos) {

            const formaId = Number(pagamento.formaPagamentoId);

            // LOCALIZAR A FORMA DE PAGAMENTO NO BANCO
            const forma = resultadoFormas.rows.find(
                item => Number(item.id_forma_pagamento) === formaId
            );

            // VERIFICAR SE A FORMA ESTÁ ATIVA
            if (!forma) {

                await client.query('ROLLBACK');

                return res.status(400).json({
                    sucesso: false,
                    mensagem: 'Uma das formas de pagamento selecionadas não está disponível. Escolha outra opção.'
                });

            }

            // IDENTIFICAR SE É CARTÃO DE CRÉDITO
            const nomeForma = forma.nome_forma_pagamento
                .toLowerCase()
                .normalize('NFD')
                .replace(/[\u0300-\u036f]/g, '');

            const ehCredito =
                nomeForma.includes('cartao') &&
                nomeForma.includes('credito');

            // VALIDAR A QUANTIDADE DE PARCELAS
            const parcelas = Number(pagamento.parcelas ?? 1);

            const maxParcelas = Number(
                forma.max_parcelas_forma_pagamento
            );

            if (
                !Number.isInteger(parcelas) ||
                parcelas < 1 ||
                parcelas > maxParcelas ||
                parcelas > 12
            ) {

                await client.query('ROLLBACK');

                return res.status(400).json({
                    sucesso: false,
                    mensagem: 'A quantidade de parcelas informada é inválida.'
                });

            }

            // OUTRAS FORMAS DE PAGAMENTO NÃO PODEM SER PARCELADAS
            if (!ehCredito && parcelas !== 1) {

                await client.query('ROLLBACK');

                return res.status(400).json({
                    sucesso: false,
                    mensagem: 'Essa forma de pagamento não permite parcelamento.'
                });

            }

        }


        // BUSCAR OS PRODUTOS DA COMPRA
        let itensCarrinho = [];

        if (compraDireta) {

            // VALIDAR OS DADOS DA COMPRA DIRETA
            if (itensCompra.length !== 1) {
                await client.query('ROLLBACK');

                return res.status(400).json({
                    sucesso: false,
                    mensagem: 'Dados da compra direta inválidos.'
                });
            }

            const idProduto = Number(itensCompra[0].idProduto);
            const quantidade = Number(itensCompra[0].quantidade);

            if (
                !Number.isInteger(idProduto) ||
                idProduto <= 0 ||
                !Number.isInteger(quantidade) ||
                quantidade <= 0
            ) {
                await client.query('ROLLBACK');

                return res.status(400).json({
                    sucesso: false,
                    mensagem: 'Produto ou quantidade inválidos.'
                });
            }

            // BUSCAR O PRODUTO NO BANCO E BLOQUEAR SEU REGISTRO
            const resultadoProduto = await client.query(
                `SELECT
            id_produto,
            nome_produto,
            preco_unitario_produto,
            quantidade_estoque_produto,
            ativo_produto
        FROM produto
        WHERE id_produto = $1
        FOR UPDATE`,
                [idProduto]
            );

            if (resultadoProduto.rows.length === 0) {
                await client.query('ROLLBACK');

                return res.status(404).json({
                    sucesso: false,
                    mensagem: 'Produto não encontrado.'
                });
            }

            const produto = resultadoProduto.rows[0];

            // ORGANIZAR NO MESMO FORMATO DOS ITENS DO CARRINHO
            itensCarrinho = [{
                ...produto,
                quantidade_item_carrinho: quantidade
            }];

        } else {

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

            itensCarrinho = resultadoItens.rows;
        }

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

        // REGISTRAR AS FORMAS DE PAGAMENTO
        for (const pagamento of pagamentos) {

            await client.query(
                `INSERT INTO pagamento (
                    pedido_id,
                    forma_pagamento_id,
                    valor_pagamento,
                    status_pagamento,
                    quantidade_parcelas_pagamento
                )
                VALUES ($1, $2, $3, $4, $5)`,
                [
                    idPedido,
                    Number(pagamento.formaPagamentoId),
                    Math.round(Number(pagamento.valor) * 100) / 100,
                    'Aprovado',
                    Number(pagamento.parcelas ?? 1)
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

            // REGISTRAR A VENDA NO HISTÓRICO DO ESTOQUE
            await client.query(
                `INSERT INTO movimentacao_estoque (
                    produto_id,
                    funcionario_cpf,
                    pedido_id,
                    tipo_movimentacao,
                    quantidade_movimentacao,
                    observacao_movimentacao
                )
                VALUES ($1, NULL, $2, 'Venda', $3, $4)`,
                [
                    item.id_produto,
                    idPedido,
                    item.quantidade_item_carrinho,
                    'Venda realizada pelo cliente'
                ]
            );

        }

        // ESVAZIAR O CARRINHO SOMENTE QUANDO A COMPRA VIER DELE
        if (!compraDireta) {

            const resultadoCarrinho = await client.query(
                `SELECT id_carrinho
         FROM carrinho
         WHERE cliente_cpf = $1`,
                [cpfCliente]
            );

            if (resultadoCarrinho.rows.length > 0) {

                await client.query(
                    `DELETE FROM item_carrinho
             WHERE carrinho_id = $1`,
                    [resultadoCarrinho.rows[0].id_carrinho]
                );

            }

        }

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


// LISTAR PEDIDOS PARA O GERENTE
exports.listarPedidos = async (req, res) => {

    try {

        const resultado = await pool.query(
            `SELECT
                p.id_pedido,
                p.data_pedido,
                p.valor_total,
                p.status_pedido,
                pe.nome_pessoa AS nome_cliente
             FROM pedido p
             INNER JOIN pessoa pe
                ON pe.cpf_pessoa = p.cliente_cpf
             ORDER BY p.data_pedido DESC`
        );

        return res.status(200).json({
            sucesso: true,
            pedidos: resultado.rows
        });

    } catch (error) {

        console.error('Erro ao listar pedidos:', error);

        return res.status(500).json({
            sucesso: false,
            mensagem: 'Não foi possível carregar os pedidos.'
        });

    }

};


// BUSCAR DETALHES DE UM PEDIDO
exports.buscarDetalhesPedido = async (req, res) => {

    try {

        const idPedido = Number(req.params.id);

        if (!Number.isInteger(idPedido) || idPedido <= 0) {
            return res.status(400).json({
                sucesso: false,
                mensagem: 'Identificador do pedido inválido.'
            });
        }

        // BUSCAR DADOS PRINCIPAIS DO PEDIDO
        const resultadoPedido = await pool.query(
            `SELECT
                p.id_pedido,
                p.data_pedido,
                p.valor_total,
                p.status_pedido,
                pe.nome_pessoa AS nome_cliente,
                p.nome_entrega,
                p.cep_entrega,
                p.endereco_entrega,
                p.numero_entrega,
                p.complemento_entrega,
                p.cidade_entrega,
                p.estado_entrega
             FROM pedido p
             INNER JOIN pessoa pe
                ON pe.cpf_pessoa = p.cliente_cpf
             WHERE p.id_pedido = $1`,
            [idPedido]
        );

        if (resultadoPedido.rows.length === 0) {
            return res.status(404).json({
                sucesso: false,
                mensagem: 'Pedido não encontrado.'
            });
        }

        // BUSCAR PRODUTOS DO PEDIDO
        const resultadoItens = await pool.query(
            `SELECT
                pr.id_produto,
                pr.nome_produto,
                ip.quantidade_item_pedido,
                ip.preco_unitario_item_pedido
             FROM item_pedido ip
             INNER JOIN produto pr
                ON pr.id_produto = ip.produto_id
             WHERE ip.pedido_id = $1`,
            [idPedido]
        );

        // BUSCAR FORMAS DE PAGAMENTO
        const resultadoPagamentos = await pool.query(
            `SELECT
                fp.nome_forma_pagamento,
                pg.valor_pagamento,
                pg.status_pagamento
             FROM pagamento pg
             INNER JOIN forma_pagamento fp
                ON fp.id_forma_pagamento = pg.forma_pagamento_id
             WHERE pg.pedido_id = $1`,
            [idPedido]
        );

        return res.status(200).json({
            sucesso: true,
            pedido: resultadoPedido.rows[0],
            itens: resultadoItens.rows,
            pagamentos: resultadoPagamentos.rows
        });

    } catch (error) {

        console.error('Erro ao buscar detalhes do pedido:', error);

        return res.status(500).json({
            sucesso: false,
            mensagem: 'Não foi possível carregar os detalhes do pedido.'
        });

    }

};

// ATUALIZAR STATUS DO PEDIDO
exports.atualizarStatusPedido = async (req, res) => {

    let conexao;

    try {

        const idPedido = Number(req.params.id);
        const { status } = req.body;

        // VERIFICAR O ID DO PEDIDO
        if (!Number.isInteger(idPedido) || idPedido <= 0) {
            return res.status(400).json({
                sucesso: false,
                mensagem: 'Identificador do pedido inválido.'
            });
        }

        // DEFINIR AS TRANSIÇÕES PERMITIDAS
        const transicoes = {
            'Pagamento aprovado': ['Em preparação'],
            'Em preparação': ['Enviado'],
            'Enviado': ['Entregue'],
            'Entregue': [],
            'Cancelado': []
        };

        // CANCELAMENTO SERÁ IMPLEMENTADO COM A DEVOLUÇÃO DO ESTOQUE
        if (status === 'Cancelado') {
            return res.status(400).json({
                sucesso: false,
                mensagem: 'O cancelamento será disponibilizado após implementarmos a devolução ao estoque.'
            });
        }

        // VERIFICAR SE O NOVO STATUS É VÁLIDO
        const statusPermitidos = [
            'Em preparação',
            'Enviado',
            'Entregue'
        ];

        if (!statusPermitidos.includes(status)) {
            return res.status(400).json({
                sucesso: false,
                mensagem: 'Status do pedido inválido.'
            });
        }

        // INICIAR A CONEXÃO E A TRANSAÇÃO
        conexao = await pool.connect();

        await conexao.query('BEGIN');

        // BUSCAR O STATUS ATUAL E BLOQUEAR O PEDIDO DURANTE A OPERAÇÃO
        const resultadoAtual = await conexao.query(
            `SELECT status_pedido
             FROM pedido
             WHERE id_pedido = $1
             FOR UPDATE`,
            [idPedido]
        );

        // VERIFICAR SE O PEDIDO EXISTE
        if (resultadoAtual.rowCount === 0) {

            await conexao.query('ROLLBACK');

            return res.status(404).json({
                sucesso: false,
                mensagem: 'Pedido não encontrado.'
            });
        }

        const statusAtual = resultadoAtual.rows[0].status_pedido;

        // VERIFICAR SE A TRANSIÇÃO É PERMITIDA
        if (!transicoes[statusAtual]?.includes(status)) {

            await conexao.query('ROLLBACK');

            return res.status(400).json({
                sucesso: false,
                mensagem: `Não é possível alterar o pedido de "${statusAtual}" para "${status}".`
            });
        }

        // ATUALIZAR O STATUS
        const resultado = await conexao.query(
            `UPDATE pedido
             SET status_pedido = $1
             WHERE id_pedido = $2
             RETURNING id_pedido, status_pedido`,
            [status, idPedido]
        );

        // CONFIRMAR A TRANSAÇÃO
        await conexao.query('COMMIT');

        return res.status(200).json({
            sucesso: true,
            mensagem: 'Status do pedido atualizado com sucesso!',
            pedido: resultado.rows[0]
        });

    } catch (error) {

        // DESFAZER A TRANSAÇÃO EM CASO DE ERRO
        if (conexao) {
            try {
                await conexao.query('ROLLBACK');
            } catch (erroRollback) {
                console.error('Erro ao desfazer a transação:', erroRollback);
            }
        }

        console.error('Erro ao atualizar status do pedido:', error);

        return res.status(500).json({
            sucesso: false,
            mensagem: 'Não foi possível atualizar o status do pedido.'
        });

    } finally {

        // LIBERAR A CONEXÃO
        if (conexao) {
            conexao.release();
        }

    }

};


// CANCELAR PEDIDO E DEVOLVER PRODUTOS AO ESTOQUE
exports.cancelarPedido = async (req, res) => {

    let conexao;

    try {

        const idPedido = Number(req.params.id);
        const cpfFuncionario = req.session.usuario.cpf;

        // VERIFICAR O ID DO PEDIDO
        if (!Number.isInteger(idPedido) || idPedido <= 0) {
            return res.status(400).json({
                sucesso: false,
                mensagem: 'Identificador do pedido inválido.'
            });
        }

        // INICIAR CONEXÃO E TRANSAÇÃO
        conexao = await pool.connect();

        await conexao.query('BEGIN');

        // BUSCAR E BLOQUEAR O PEDIDO
        const resultadoPedido = await conexao.query(
            `SELECT id_pedido, status_pedido
             FROM pedido
             WHERE id_pedido = $1
             FOR UPDATE`,
            [idPedido]
        );

        if (resultadoPedido.rowCount === 0) {

            await conexao.query('ROLLBACK');

            return res.status(404).json({
                sucesso: false,
                mensagem: 'Pedido não encontrado.'
            });
        }

        const pedido = resultadoPedido.rows[0];

        // VERIFICAR SE O PEDIDO PODE SER CANCELADO
        if (!['Pagamento aprovado', 'Em preparação'].includes(pedido.status_pedido)) {

            await conexao.query('ROLLBACK');

            return res.status(400).json({
                sucesso: false,
                mensagem: 'Este pedido não pode mais ser cancelado.'
            });
        }

        // BUSCAR OS PRODUTOS DO PEDIDO
        const resultadoItens = await conexao.query(
            `SELECT produto_id, quantidade_item_pedido
             FROM item_pedido
             WHERE pedido_id = $1
             FOR UPDATE`,
            [idPedido]
        );

        if (resultadoItens.rowCount === 0) {

            await conexao.query('ROLLBACK');

            return res.status(400).json({
                sucesso: false,
                mensagem: 'Este pedido não possui produtos para devolver ao estoque.'
            });
        }

        // DEVOLVER CADA PRODUTO AO ESTOQUE
        for (const item of resultadoItens.rows) {

            const resultadoEstoque = await conexao.query(
                `UPDATE produto
                SET quantidade_estoque_produto =
                    quantidade_estoque_produto + $1
                WHERE id_produto = $2
                RETURNING id_produto`,
                [
                    item.quantidade_item_pedido,
                    item.produto_id
                ]
            );

            // VERIFICAR SE O ESTOQUE FOI DEVOLVIDO
            if (resultadoEstoque.rowCount === 0) {
                throw new Error(
                    `Não foi possível devolver o produto ${item.produto_id} ao estoque.`
                );
            }

            // REGISTRAR A DEVOLUÇÃO NO HISTÓRICO
            await conexao.query(
                `INSERT INTO movimentacao_estoque (
                    produto_id,
                    funcionario_cpf,
                    pedido_id,
                    tipo_movimentacao,
                    quantidade_movimentacao,
                    observacao_movimentacao
                )
                VALUES ($1, $2, $3, 'Cancelamento', $4, $5)`,
                [
                    item.produto_id,
                    cpfFuncionario,
                    idPedido,
                    item.quantidade_item_pedido,
                    'Devolução de estoque por cancelamento do pedido'
                ]
            );

        }

        // ATUALIZAR OS PAGAMENTOS SIMULADOS
        await conexao.query(
            `UPDATE pagamento
             SET status_pagamento = 'Cancelado'
             WHERE pedido_id = $1`,
            [idPedido]
        );

        // ATUALIZAR O STATUS DO PEDIDO
        const resultadoAtualizacao = await conexao.query(
            `UPDATE pedido
             SET status_pedido = 'Cancelado'
             WHERE id_pedido = $1
             RETURNING id_pedido, status_pedido`,
            [idPedido]
        );

        // CONFIRMAR TODAS AS ALTERAÇÕES
        await conexao.query('COMMIT');

        return res.status(200).json({
            sucesso: true,
            mensagem: 'Pedido cancelado e estoque devolvido com sucesso!',
            pedido: resultadoAtualizacao.rows[0]
        });

    } catch (error) {

        // DESFAZER TODAS AS ALTERAÇÕES EM CASO DE ERRO
        if (conexao) {
            try {
                await conexao.query('ROLLBACK');
            } catch (erroRollback) {
                console.error('Erro ao desfazer a transação:', erroRollback);
            }
        }

        console.error('Erro ao cancelar pedido:', error);

        return res.status(500).json({
            sucesso: false,
            mensagem: 'Não foi possível cancelar o pedido.'
        });

    } finally {

        if (conexao) {
            conexao.release();
        }

    }

};