const { query } = require('../database');

// FUNÇÕES DO GERENCIAMENTO DE CLIENTES
exports.listarClientes = async (req, res) => {
    try {

        const resultado = await query(`
            SELECT
                p.cpf_pessoa,
                p.nome_pessoa,
                p.email_pessoa,
                p.data_nascimento_pessoa,
                p.endereco_pessoa,
                c.data_cadastro_cliente
            FROM cliente c
            INNER JOIN pessoa p
                ON c.pessoa_cpf_pessoa = p.cpf_pessoa
            ORDER BY p.nome_pessoa
        `);

        return res.status(200).json({
            sucesso: true,
            clientes: resultado.rows
        });

    } catch (error) {

        console.error('Erro ao listar clientes:', error);

        return res.status(500).json({
            sucesso: false,
            mensagem: 'Erro ao listar os clientes.'
        });

    }
};

exports.buscarDetalhesCliente = async (req, res) => {
    try {

        const { cpf } = req.params;

        // BUSCAR OS DADOS DO CLIENTE
        const resultado = await query(
            `SELECT
                p.cpf_pessoa,
                p.nome_pessoa,
                p.email_pessoa,
                p.data_nascimento_pessoa,
                p.endereco_pessoa,
                c.data_cadastro_cliente
            FROM cliente c
            INNER JOIN pessoa p
                ON c.pessoa_cpf_pessoa = p.cpf_pessoa
            WHERE p.cpf_pessoa = $1`,
            [cpf]
        );

        // VERIFICAR SE O CLIENTE EXISTE
        if (resultado.rowCount === 0) {
            return res.status(404).json({
                sucesso: false,
                mensagem: 'Cliente não encontrado.'
            });
        }

        // BUSCAR O HISTÓRICO DE PEDIDOS DO CLIENTE
        const resultadoPedidos = await query(
            `SELECT
                id_pedido,
                data_pedido,
                valor_total,
                status_pedido
            FROM pedido
            WHERE cliente_cpf = $1
            ORDER BY data_pedido DESC`,
            [cpf]
        );

        // RETORNAR OS DADOS DO CLIENTE E SEUS PEDIDOS
        return res.status(200).json({
            sucesso: true,
            cliente: resultado.rows[0],
            pedidos: resultadoPedidos.rows
        });

    } catch (error) {

        console.error('Erro ao buscar detalhes do cliente:', error);

        return res.status(500).json({
            sucesso: false,
            mensagem: 'Erro ao buscar os detalhes do cliente.'
        });

    }
};

 // BUSCAR OS DADOS DO CLIENTE CONECTADO
exports.buscarMinhaConta = async (req, res) => {
    try {
        // Pega o CPF do cliente que está conectado
        const cpfCliente = req.session?.usuario?.cpf;

        // Verifica se o cliente está logado
        if (!cpfCliente) {
            return res.status(401).json({
                sucesso: false,
                mensagem: 'Faça login para visualizar sua conta.'
            });
        }

        // Busca os dados do cliente no banco
        const resultado = await query(
            `SELECT
                p.cpf_pessoa,
                p.nome_pessoa,
                p.email_pessoa,
                p.data_nascimento_pessoa,
                p.endereco_pessoa
             FROM cliente c
             INNER JOIN pessoa p
                ON c.pessoa_cpf_pessoa = p.cpf_pessoa
             WHERE p.cpf_pessoa = $1`,
            [cpfCliente]
        );

        // Verifica se o cliente existe
        if (resultado.rowCount === 0) {
            return res.status(404).json({
                sucesso: false,
                mensagem: 'Cliente não encontrado.'
            });
        }

        // Envia os dados encontrados
        return res.status(200).json({
            sucesso: true,
            cliente: resultado.rows[0]
        });

    } catch (error) {
        console.error('Erro ao buscar minha conta:', error);

        return res.status(500).json({
            sucesso: false,
            mensagem: 'Erro ao buscar os dados da sua conta.'
        });
    }
};

 // ATUALIZAR OS DADOS DO CLIENTE CONECTADO
exports.atualizarMinhaConta = async (req, res) => {
    try {
        // CPF do cliente conectado
        const cpfCliente = req.session?.usuario?.cpf;

        if (!cpfCliente) {
            return res.status(401).json({
                sucesso: false,
                mensagem: 'Faça login para atualizar sua conta.'
            });
        }

        // Dados recebidos do formulário
        const {
            nome_pessoa,
            email_pessoa,
            data_nascimento_pessoa,
            endereco_pessoa
        } = req.body;

        // Verifica se os campos foram preenchidos
        if (
            !nome_pessoa?.trim() ||
            !email_pessoa?.trim() ||
            !data_nascimento_pessoa ||
            !endereco_pessoa?.trim()
        ) {
            return res.status(400).json({
                sucesso: false,
                mensagem: 'Preencha todos os campos.'
            });
        }

        // Verifica o formato do e-mail
        const emailValido = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!emailValido.test(email_pessoa.trim())) {
            return res.status(400).json({
                sucesso: false,
                mensagem: 'Informe um e-mail válido.'
            });
        }

        // Verifica o formato da data
        const formatoData = /^\d{4}-\d{2}-\d{2}$/;

        if (!formatoData.test(data_nascimento_pessoa)) {
            return res.status(400).json({
                sucesso: false,
                mensagem: 'Informe uma data de nascimento válida.'
            });
        }

        // Confere se a data realmente existe
        const [ano, mes, dia] = data_nascimento_pessoa
            .split('-')
            .map(Number);

        const dataNascimento = new Date(
            Date.UTC(ano, mes - 1, dia)
        );

        const dataExiste =
            dataNascimento.getUTCFullYear() === ano &&
            dataNascimento.getUTCMonth() === mes - 1 &&
            dataNascimento.getUTCDate() === dia;

        if (!dataExiste) {
            return res.status(400).json({
                sucesso: false,
                mensagem: 'A data de nascimento não existe.'
            });
        }

        // Impede uma data de nascimento no futuro
        const hoje = new Date();

        const hojeFormatado =
            `${hoje.getFullYear()}-` +
            `${String(hoje.getMonth() + 1).padStart(2, '0')}-` +
            `${String(hoje.getDate()).padStart(2, '0')}`;

        if (data_nascimento_pessoa > hojeFormatado) {
            return res.status(400).json({
                sucesso: false,
                mensagem: 'A data de nascimento não pode ser futura.'
            });
        }

        // Atualiza somente os campos permitidos
        const resultado = await query(
            `UPDATE pessoa
             SET nome_pessoa = $1,
                 email_pessoa = $2,
                 data_nascimento_pessoa = $3,
                 endereco_pessoa = $4
             WHERE cpf_pessoa = $5
             RETURNING
                 cpf_pessoa,
                 nome_pessoa,
                 email_pessoa,
                 data_nascimento_pessoa,
                 endereco_pessoa`,
            [
                nome_pessoa.trim(),
                email_pessoa.trim(),
                data_nascimento_pessoa,
                endereco_pessoa.trim(),
                cpfCliente
            ]
        );

        if (resultado.rowCount === 0) {
            return res.status(404).json({
                sucesso: false,
                mensagem: 'Cliente não encontrado.'
            });
        }

        return res.status(200).json({
            sucesso: true,
            mensagem: 'Dados atualizados com sucesso!',
            cliente: resultado.rows[0]
        });

    } catch (error) {
        console.error('Erro ao atualizar minha conta:', error);

        // E-mail já cadastrado para outra pessoa
        if (error.code === '23505') {
            return res.status(409).json({
                sucesso: false,
                mensagem: 'Este e-mail já está cadastrado.'
            });
        }

        return res.status(500).json({
            sucesso: false,
            mensagem: 'Erro ao atualizar os dados da sua conta.'
        });
    }
};