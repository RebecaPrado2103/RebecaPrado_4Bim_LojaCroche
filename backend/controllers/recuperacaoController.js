const { query, pool } = require('../database');
const crypto = require('crypto');
const transporter = require('../email');
const bcrypt = require('bcrypt');

// SOLICITAR CÓDIGO DE RECUPERAÇÃO
exports.solicitarCodigo = async (req, res) => {

    const { email } = req.body;

    // Verificar se o e-mail foi informado
    if (!email || typeof email !== 'string') {
        return res.status(400).json({
            sucesso: false,
            mensagem: 'Informe seu e-mail.'
        });
    }

    const emailInformado = email.trim();

    try {

        // Buscar a pessoa pelo e-mail
        const resultado = await query(
            `SELECT
                cpf_pessoa,
                nome_pessoa,
                email_pessoa
             FROM pessoa
             WHERE LOWER(email_pessoa) = LOWER($1)`,
            [emailInformado]
        );

        // Mensagem que será apresentada ao cliente
        const mensagem = {
            sucesso: true,
            mensagem: 'Se este e-mail estiver cadastrado, você receberá um código de recuperação.'
        };

        // Se o e-mail não estiver cadastrado,
        // apresentar a mesma mensagem
        if (resultado.rows.length === 0) {
            return res.status(200).json(mensagem);
        }

        const pessoa = resultado.rows[0];

        // Gerar um código numérico de 6 dígitos
        const codigo = crypto
            .randomInt(100000, 1000000)
            .toString();

        // Proteger o código antes de guardá-lo no banco
        const codigoHash = crypto
            .createHash('sha256')
            .update(codigo)
            .digest('hex');

        // Guardar o código protegido e sua validade
        await query(
            `UPDATE pessoa
             SET
                codigo_recuperacao_hash = $1,
                codigo_recuperacao_expira = NOW() + INTERVAL '15 minutes',
                tentativas_recuperacao = 0
             WHERE cpf_pessoa = $2`,
            [codigoHash, pessoa.cpf_pessoa]
        );

        // Enviar o código por e-mail
        await transporter.sendMail({

            from: `"Entre Laços" <${process.env.EMAIL_USER}>`,

            to: pessoa.email_pessoa,

            subject: 'Código de recuperação de senha - Entre Laços',

            text: `Olá, ${pessoa.nome_pessoa}!

Recebemos uma solicitação para recuperar a senha da sua conta Entre Laços.

Seu código de recuperação é: ${codigo}

Este código é válido por 15 minutos e só pode ser utilizado uma vez.

Se você não solicitou a recuperação, ignore este e-mail.

Com carinho,
Equipe Entre Laços`
        });

        // Responder ao cliente
        return res.status(200).json(mensagem);

    } catch (error) {

        console.error('Erro ao solicitar recuperação:', error);

        return res.status(500).json({
            sucesso: false,
            mensagem: 'Não foi possível enviar o código. Tente novamente.'
        });
    }
};

 // REDEFINIR SENHA
exports.redefinirSenha = async (req, res) => {

    const { email, codigo, novaSenha } = req.body;

    // Verificar se os campos foram preenchidos
    if (!email || !codigo || !novaSenha) {
        return res.status(400).json({
            sucesso: false,
            mensagem: 'Preencha todos os campos.'
        });
    }

    // Verificar se o código possui 6 dígitos
    if (!/^\d{6}$/.test(codigo)) {
        return res.status(400).json({
            sucesso: false,
            mensagem: 'Informe um código válido.'
        });
    }

    // Verificar se a senha possui pelo menos 8 caracteres
    if (typeof novaSenha !== 'string' || novaSenha.length < 8) {
        return res.status(400).json({
            sucesso: false,
            mensagem: 'A senha deve possuir pelo menos 8 caracteres.'
        });
    }

    // Evitar senhas maiores que o limite do bcrypt
    if (Buffer.byteLength(novaSenha, 'utf8') > 72) {
        return res.status(400).json({
            sucesso: false,
            mensagem: 'A senha é muito longa.'
        });
    }

    const emailInformado = email.trim();

    // Proteger o código informado
    const codigoHash = crypto
        .createHash('sha256')
        .update(codigo)
        .digest('hex');

    let cliente;

    try {

        cliente = await pool.connect();

        await cliente.query('BEGIN');

        // Buscar a pessoa e bloquear o registro durante a validação
        const resultado = await cliente.query(
            `SELECT
                cpf_pessoa,
                codigo_recuperacao_hash,
                codigo_recuperacao_expira,
                tentativas_recuperacao
             FROM pessoa
             WHERE LOWER(email_pessoa) = LOWER($1)
             FOR UPDATE`,
            [emailInformado]
        );

        // Verificar se o e-mail possui uma recuperação ativa
        if (resultado.rows.length === 0) {

            await cliente.query('ROLLBACK');

            return res.status(400).json({
                sucesso: false,
                mensagem: 'Código inválido ou expirado.'
            });
        }

        const pessoa = resultado.rows[0];

        // Verificar se existe um código ativo
        if (!pessoa.codigo_recuperacao_hash) {

            await cliente.query('ROLLBACK');

            return res.status(400).json({
                sucesso: false,
                mensagem: 'Código inválido ou expirado.'
            });
        }

        // Limitar a quantidade de tentativas
        if (pessoa.tentativas_recuperacao >= 5) {

            await cliente.query('ROLLBACK');

            return res.status(429).json({
                sucesso: false,
                mensagem: 'Limite de tentativas atingido. Solicite um novo código.'
            });
        }

        // Verificar se o código expirou
        if (new Date(pessoa.codigo_recuperacao_expira) <= new Date()) {

            await cliente.query(
                `UPDATE pessoa
                 SET
                    codigo_recuperacao_hash = NULL,
                    codigo_recuperacao_expira = NULL,
                    tentativas_recuperacao = 0
                 WHERE cpf_pessoa = $1`,
                [pessoa.cpf_pessoa]
            );

            await cliente.query('COMMIT');

            return res.status(400).json({
                sucesso: false,
                mensagem: 'O código expirou. Solicite um novo.'
            });
        }

        // Comparar os códigos protegidos
        const codigoCorreto = crypto.timingSafeEqual(
            Buffer.from(codigoHash, 'hex'),
            Buffer.from(pessoa.codigo_recuperacao_hash, 'hex')
        );

        // Se o código estiver incorreto
        if (!codigoCorreto) {

            await cliente.query(
                `UPDATE pessoa
                 SET tentativas_recuperacao = tentativas_recuperacao + 1
                 WHERE cpf_pessoa = $1`,
                [pessoa.cpf_pessoa]
            );

            await cliente.query('COMMIT');

            return res.status(400).json({
                sucesso: false,
                mensagem: 'Código inválido ou expirado.'
            });
        }

        // Proteger a nova senha
        const senhaHash = await bcrypt.hash(novaSenha, 10);

        // Atualizar a senha e invalidar o código
        await cliente.query(
            `UPDATE pessoa
             SET
                senha_pessoa = $1,
                codigo_recuperacao_hash = NULL,
                codigo_recuperacao_expira = NULL,
                tentativas_recuperacao = 0
             WHERE cpf_pessoa = $2`,
            [senhaHash, pessoa.cpf_pessoa]
        );

        await cliente.query('COMMIT');

        return res.status(200).json({
            sucesso: true,
            mensagem: 'Senha redefinida com sucesso! Você já pode entrar na sua conta.'
        });

    } catch (error) {

        if (cliente) {
            await cliente.query('ROLLBACK').catch(() => {});
        }

        console.error('Erro ao redefinir senha:', error);

        return res.status(500).json({
            sucesso: false,
            mensagem: 'Não foi possível redefinir a senha.'
        });

    } finally {

        if (cliente) {
            cliente.release();
        }
    }
};
