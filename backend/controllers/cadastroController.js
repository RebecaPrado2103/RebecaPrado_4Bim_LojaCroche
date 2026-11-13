const { query } = require('../database');
const bcrypt = require('bcrypt');

// CADASTRAR CLIENTE
exports.cadastrarCliente = async (req, res) => {

    try {

        // RECEBER OS DADOS ENVIADOS PELO FRONTEND
        const {
            nome,
            cpf,
            dataNascimento,
            email,
            endereco,
            senha
        } = req.body;

        // VERIFICAR SE OS CAMPOS OBRIGATÓRIOS FORAM PREENCHIDOS
        if (!nome || !cpf || !email || !senha) {
            return res.status(400).json({
                sucesso: false,
                mensagem: 'Preencha todos os campos obrigatórios.'
            });
        }

        // VERIFICAR SE O CPF POSSUI 11 NÚMEROS
        if (!/^\d{11}$/.test(cpf)) {
            return res.status(400).json({
                sucesso: false,
                mensagem: 'O CPF deve conter exatamente 11 números.'
            });
        }

        // VERIFICAR SE CPF OU EMAIL JÁ ESTÃO CADASTRADOS
        const pessoaExistente = await query(
            `SELECT cpf_pessoa, email_pessoa
             FROM pessoa
             WHERE cpf_pessoa = $1 OR email_pessoa = $2`,
            [cpf, email]
        );

        if (pessoaExistente.rows.length > 0) {

            return res.status(409).json({
                sucesso: false,
                mensagem: 'Este CPF ou e-mail já está cadastrado.'
            });

        }

        // PROTEGER A SENHA COM HASH
        const senhaHash = await bcrypt.hash(senha, 10);

        // INICIAR TRANSAÇÃO
        const client = await require('../database').pool.connect();

        try {

            await client.query('BEGIN');

            // INSERIR DADOS NA TABELA PESSOA
            await client.query(
                `INSERT INTO pessoa
                (cpf_pessoa, nome_pessoa, data_nascimento_pessoa,
                 endereco_pessoa, senha_pessoa, email_pessoa)
                 VALUES ($1, $2, $3, $4, $5, $6)`,
                [
                    cpf,
                    nome,
                    dataNascimento || null,
                    endereco || null,
                    senhaHash,
                    email
                ]
            );

            // INSERIR CLIENTE NA TABELA CLIENTE
            await client.query(
                `INSERT INTO cliente
                (pessoa_cpf_pessoa, data_cadastro_cliente)
                VALUES ($1, CURRENT_DATE)`,
                [cpf]
            );

            // CONFIRMAR TRANSAÇÃO
            await client.query('COMMIT');

            return res.status(201).json({
                sucesso: true,
                mensagem: 'Cadastro realizado com sucesso!'
            });

        } catch (error) {

            await client.query('ROLLBACK');
            throw error;

        } finally {

            client.release();

        }

    } catch (error) {

        console.error('Erro ao cadastrar cliente:', error);

        return res.status(500).json({
            sucesso: false,
            mensagem: 'Não foi possível realizar o cadastro.'
        });

    }

};