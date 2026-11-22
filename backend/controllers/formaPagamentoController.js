const { query } = require('../database');

// LISTAR TODAS AS FORMAS DE PAGAMENTO
exports.listarFormasPagamento = async (req, res) => {
    try {
        const resultado = await query(`
            SELECT *
            FROM forma_pagamento
            ORDER BY id_forma_pagamento
        `);

        return res.status(200).json({
            sucesso: true,
            formasPagamento: resultado.rows
        });

    } catch (error) {
        console.error('Erro ao listar formas de pagamento:', error);

        return res.status(500).json({
            sucesso: false,
            mensagem: 'Erro ao listar formas de pagamento.'
        });
    }
};

// CADASTRAR UMA NOVA FORMA DE PAGAMENTO
exports.cadastrarFormaPagamento = async (req, res) => {
    try {
        const { nome_forma_pagamento } = req.body;

        // VALIDAR O CAMPO OBRIGATÓRIO
        if (
            typeof nome_forma_pagamento !== 'string' ||
            !nome_forma_pagamento.trim()
        ) {
            return res.status(400).json({
                sucesso: false,
                mensagem: 'Informe o nome da forma de pagamento.'
            });
        }

        const nome = nome_forma_pagamento.trim();

        // VERIFICAR SE JÁ EXISTE UMA FORMA COM ESSE NOME
        const existente = await query(`
            SELECT id_forma_pagamento
            FROM forma_pagamento
            WHERE LOWER(nome_forma_pagamento) = LOWER($1)
        `, [nome]);

        if (existente.rows.length > 0) {
            return res.status(409).json({
                sucesso: false,
                mensagem: 'Essa forma de pagamento já está cadastrada.'
            });
        }

        // CADASTRAR NO BANCO DE DADOS
        const resultado = await query(`
            INSERT INTO forma_pagamento (
                nome_forma_pagamento
            )
            VALUES ($1)
            RETURNING *
        `, [nome]);

        return res.status(201).json({
            sucesso: true,
            mensagem: 'Forma de pagamento cadastrada com sucesso!',
            formaPagamento: resultado.rows[0]
        });

    } catch (error) {
        console.error('Erro ao cadastrar forma de pagamento:', error);

        return res.status(500).json({
            sucesso: false,
            mensagem: 'Erro ao cadastrar forma de pagamento.'
        });
    }
};

// ALTERAR UMA FORMA DE PAGAMENTO
exports.alterarFormaPagamento = async (req, res) => {
    try {
        const id = Number(req.params.id);
        const { nome_forma_pagamento } = req.body;

        // VALIDAR O ID
        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({
                sucesso: false,
                mensagem: 'ID de forma de pagamento inválido.'
            });
        }

        // VALIDAR O NOME
        if (
            typeof nome_forma_pagamento !== 'string' ||
            !nome_forma_pagamento.trim()
        ) {
            return res.status(400).json({
                sucesso: false,
                mensagem: 'Informe o nome da forma de pagamento.'
            });
        }

        const nome = nome_forma_pagamento.trim();

        // VERIFICAR SE O NOME JÁ ESTÁ SENDO UTILIZADO
        const existente = await query(`
            SELECT id_forma_pagamento
            FROM forma_pagamento
            WHERE LOWER(nome_forma_pagamento) = LOWER($1)
            AND id_forma_pagamento <> $2
        `, [nome, id]);

        if (existente.rows.length > 0) {
            return res.status(409).json({
                sucesso: false,
                mensagem: 'Já existe outra forma de pagamento com esse nome.'
            });
        }

        // ATUALIZAR NO BANCO
        const resultado = await query(`
            UPDATE forma_pagamento
            SET nome_forma_pagamento = $1
            WHERE id_forma_pagamento = $2
            RETURNING *
        `, [nome, id]);

        if (resultado.rowCount === 0) {
            return res.status(404).json({
                sucesso: false,
                mensagem: 'Forma de pagamento não encontrada.'
            });
        }

        return res.status(200).json({
            sucesso: true,
            mensagem: 'Forma de pagamento alterada com sucesso!',
            formaPagamento: resultado.rows[0]
        });

    } catch (error) {
        console.error('Erro ao alterar forma de pagamento:', error);

        return res.status(500).json({
            sucesso: false,
            mensagem: 'Erro ao alterar forma de pagamento.'
        });
    }
};

// DESATIVAR UMA FORMA DE PAGAMENTO
exports.desativarFormaPagamento = async (req, res) => {
    try {
        const id = Number(req.params.id);

        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({
                sucesso: false,
                mensagem: 'ID de forma de pagamento inválido.'
            });
        }

        const resultado = await query(`
            UPDATE forma_pagamento
            SET ativo_forma_pagamento = FALSE
            WHERE id_forma_pagamento = $1
            RETURNING *
        `, [id]);

        if (resultado.rowCount === 0) {
            return res.status(404).json({
                sucesso: false,
                mensagem: 'Forma de pagamento não encontrada.'
            });
        }

        return res.status(200).json({
            sucesso: true,
            mensagem: 'Forma de pagamento desativada com sucesso!'
        });

    } catch (error) {
        console.error('Erro ao desativar forma de pagamento:', error);

        return res.status(500).json({
            sucesso: false,
            mensagem: 'Erro ao desativar forma de pagamento.'
        });
    }
};

// REATIVAR UMA FORMA DE PAGAMENTO
exports.reativarFormaPagamento = async (req, res) => {
    try {
        const id = Number(req.params.id);

        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({
                sucesso: false,
                mensagem: 'ID de forma de pagamento inválido.'
            });
        }

        const resultado = await query(`
            UPDATE forma_pagamento
            SET ativo_forma_pagamento = TRUE
            WHERE id_forma_pagamento = $1
            RETURNING *
        `, [id]);

        if (resultado.rowCount === 0) {
            return res.status(404).json({
                sucesso: false,
                mensagem: 'Forma de pagamento não encontrada.'
            });
        }

        return res.status(200).json({
            sucesso: true,
            mensagem: 'Forma de pagamento reativada com sucesso!',
            formaPagamento: resultado.rows[0]
        });

    } catch (error) {
        console.error('Erro ao reativar forma de pagamento:', error);

        return res.status(500).json({
            sucesso: false,
            mensagem: 'Erro ao reativar forma de pagamento.'
        });
    }
};

// LISTAR FORMAS DE PAGAMENTO ATIVAS PARA O CLIENTE
exports.listarFormasAtivas = async (req, res) => {
    try {
        const resultado = await query(`
            SELECT
                id_forma_pagamento,
                nome_forma_pagamento
            FROM forma_pagamento
            WHERE ativo_forma_pagamento = TRUE
            ORDER BY id_forma_pagamento
        `);

        return res.status(200).json({
            sucesso: true,
            formasPagamento: resultado.rows
        });

    } catch (error) {
        console.error('Erro ao listar formas de pagamento ativas:', error);

        return res.status(500).json({
            sucesso: false,
            mensagem: 'Erro ao carregar as formas de pagamento.'
        });
    }
};