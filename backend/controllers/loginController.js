const { query } = require('../database');
const bcrypt = require('bcrypt');


// REALIZAR LOGIN
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

        // Buscar a pessoa e verificar seus cadastros
        const resultado = await query(
            `SELECT
                p.cpf_pessoa,
                p.nome_pessoa,
                p.senha_pessoa,
                c.pessoa_cpf_pessoa AS cpf_cliente,
                f.pessoa_cpf_pessoa AS cpf_funcionario,
                f.cargo_id_cargo,
                cg.nome_cargo
             FROM pessoa p
             LEFT JOIN cliente c
                ON c.pessoa_cpf_pessoa = p.cpf_pessoa
             LEFT JOIN funcionario f
                ON f.pessoa_cpf_pessoa = p.cpf_pessoa
             LEFT JOIN cargo cg
                ON cg.id_cargo = f.cargo_id_cargo
             WHERE p.cpf_pessoa = $1`,
            [cpf]
        );

        // Verificar se a pessoa existe
        if (resultado.rows.length === 0) {
            return res.status(401).json({
                sucesso: false,
                mensagem: 'CPF ou senha incorretos.'
            });
        }

        const pessoa = resultado.rows[0];

        // Verificar a senha
        const senhaCorreta = await bcrypt.compare(
            senha,
            pessoa.senha_pessoa
        );

        if (!senhaCorreta) {
            return res.status(401).json({
                sucesso: false,
                mensagem: 'CPF ou senha incorretos.'
            });
        }

        // Identificar os cadastros da pessoa
        const ehCliente = pessoa.cpf_cliente !== null;
        const ehFuncionario = pessoa.cpf_funcionario !== null;
        const ehGerente = ehFuncionario &&
            pessoa.cargo_id_cargo === 1;

        // Definir as opções de acesso
        let opcoesAcesso = [];

        if (ehGerente) {
            opcoesAcesso = ['cliente', 'funcionario'];
        } else {
            if (ehCliente) {
                opcoesAcesso.push('cliente');
            }

            if (ehFuncionario) {
                opcoesAcesso.push('funcionario');
            }
        }

        // Impedir acesso de pessoas sem cadastro válido
        if (opcoesAcesso.length === 0) {
            return res.status(403).json({
                sucesso: false,
                mensagem: 'Esta pessoa não possui um cadastro autorizado.'
            });
        }

        // Criar a sessão com os dados da pessoa
        req.session.usuario = {
            cpf: pessoa.cpf_pessoa,
            nome: pessoa.nome_pessoa,
            ehCliente,
            ehFuncionario,
            ehGerente,
            cargoId: pessoa.cargo_id_cargo,
            cargo: pessoa.nome_cargo,
            opcoesAcesso
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
                    nome: pessoa.nome_pessoa,
                    opcoesAcesso
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


 
// ESCOLHER O TIPO DE ACESSO
exports.selecionarAcesso = async (req, res) => {

    try {
        const { tipo } = req.body;
        const usuario = req.session.usuario;

        // Verificar se existe uma sessão
        if (!usuario) {
            return res.status(401).json({
                sucesso: false,
                mensagem: 'Você precisa realizar o login novamente.'
            });
        }

        // Verificar se a opção escolhida está autorizada
        if (!usuario.opcoesAcesso.includes(tipo)) {
            return res.status(403).json({
                sucesso: false,
                mensagem: 'Você não possui permissão para acessar essa área.'
            });
        }

        // Criar cadastro de cliente para o gerente, se necessário
        if (tipo === 'cliente' && usuario.ehGerente) {

            await query(
                `INSERT INTO cliente
                    (pessoa_cpf_pessoa, data_cadastro_cliente)
                 VALUES ($1, CURRENT_DATE)
                 ON CONFLICT (pessoa_cpf_pessoa) DO NOTHING`,
                [usuario.cpf]
            );

            // Atualizar a informação na sessão
            usuario.ehCliente = true;
        }

        // Registrar a escolha na sessão
        usuario.tipo = tipo;

        // Salvar a sessão antes de responder
        req.session.save((erro) => {

            if (erro) {
                console.error('Erro ao salvar a escolha de acesso:', erro);

                return res.status(500).json({
                    sucesso: false,
                    mensagem: 'Não foi possível selecionar o acesso.'
                });
            }

            return res.status(200).json({
                sucesso: true,
                mensagem: 'Acesso selecionado com sucesso!',
                tipo: usuario.tipo
            });
        });

    } catch (error) {

        console.error('Erro ao selecionar o acesso:', error);

        return res.status(500).json({
            sucesso: false,
            mensagem: 'Não foi possível selecionar o acesso.'
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