const { query } = require('../database');
const bcrypt = require('bcrypt');

// REALIZAR LOGIN DO CLIENTE
exports.entrar = async (req, res) => {
    try {
        const { cpf, senha } = req.body;

        // Verificar se os campos foram preenchidos
        if (!cpf || !senha) {
            return res.status(400).json({
                sucesso: false,
                mensagem: 'Informe o CPF e a senha.'
            });
        }

        // Buscar o cliente no banco de dados
        const resultado = await query(
            `SELECT p.cpf_pessoa, p.nome_pessoa, p.senha_pessoa
             FROM pessoa p
             INNER JOIN cliente c
             ON c.pessoa_cpf_pessoa = p.cpf_pessoa
             WHERE p.cpf_pessoa = $1`,
            [cpf]
        );

        // Verificar se o cliente existe
        if (resultado.rows.length === 0) {
            return res.status(401).json({
                sucesso: false,
                mensagem: 'CPF ou senha incorretos.'
            });
        }

        const cliente = resultado.rows[0];

        // Comparar a senha digitada com o hash armazenado
        const senhaCorreta = await bcrypt.compare(
            senha,
            cliente.senha_pessoa
        );

        if (!senhaCorreta) {
            return res.status(401).json({
                sucesso: false,
                mensagem: 'CPF ou senha incorretos.'
            });
        }

        // Criar a sessão do cliente
        req.session.usuario = {
            cpf: cliente.cpf_pessoa,
            nome: cliente.nome_pessoa,
            tipo: 'cliente'
        };

        // Salvar a sessão antes de responder
        req.session.save((erro) => {
            if (erro) {
                console.error('Erro ao salvar sessão:', erro);

                return res.status(500).json({
                    sucesso: false,
                    mensagem: 'Não foi possível iniciar a sessão.'
                });
            }

            return res.status(200).json({
                sucesso: true,
                mensagem: 'Login realizado com sucesso!',
                usuario: {
                    nome: cliente.nome_pessoa
                }
            });
        });

    } catch (error) {
        console.error('Erro ao realizar login:', error);

        return res.status(500).json({
            sucesso: false,
            mensagem: 'Ocorreu um erro ao tentar realizar o login.'
        });
    }
};

// VERIFICAR SE EXISTE UMA SESSÃO ATIVA
exports.verificarSessao = (req, res) => {

    if (!req.session.usuario) {
        return res.status(401).json({
            sucesso: false,
            autenticado: false,
            mensagem: 'Nenhum usuário está conectado.'
        });
    }

    return res.status(200).json({
        sucesso: true,
        autenticado: true,
        usuario: {
            nome: req.session.usuario.nome,
            tipo: req.session.usuario.tipo
        }
    });
};

// ENCERRAR A SESSÃO
exports.sair = (req, res) => {

    req.session.destroy((erro) => {

        if (erro) {
            console.error('Erro ao encerrar sessão:', erro);

            return res.status(500).json({
                sucesso: false,
                mensagem: 'Não foi possível encerrar a sessão.'
            });
        }

        res.clearCookie('connect.sid', {
            path: '/',
            httpOnly: true,
            secure: false,
            sameSite: 'lax'
        });

        return res.status(200).json({
            sucesso: true,
            mensagem: 'Você saiu da sua conta.'
        });
    });
};