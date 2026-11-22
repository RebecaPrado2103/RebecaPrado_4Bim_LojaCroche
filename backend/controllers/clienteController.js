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

