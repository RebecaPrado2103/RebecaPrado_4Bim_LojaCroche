// CONEXÃO COM O BANCO DE DADOS
const { query } = require('../database');
const bcrypt = require('bcrypt');

// LISTAR FUNCIONÁRIOS
exports.listarFuncionarios = async (req, res) => {

    try {

        const resultado = await query(`
            SELECT
                p.cpf_pessoa,
                p.nome_pessoa,
                p.email_pessoa,
                p.data_nascimento_pessoa,
                p.endereco_pessoa,
                f.salario_funcionario,
                f.porcentagem_comissao_funcionario,
                f.ativo_funcionario,
                c.id_cargo,
                c.nome_cargo

            FROM funcionario f

            INNER JOIN pessoa p
                ON f.pessoa_cpf_pessoa = p.cpf_pessoa

            INNER JOIN cargo c
                ON f.cargo_id_cargo = c.id_cargo

            ORDER BY p.nome_pessoa ASC;
        `);

        return res.status(200).json({
            sucesso: true,
            funcionarios: resultado.rows
        });

    } catch (erro) {

        console.error('Erro ao listar funcionários:', erro);

        return res.status(500).json({
            sucesso: false,
            mensagem: 'Não foi possível carregar os funcionários.'
        });

    }
};


// BUSCAR DETALHES DE UM FUNCIONÁRIO
exports.buscarDetalhesFuncionario = async (req, res) => {

    try {

        const { cpf } = req.params;

        const resultado = await query(`
            SELECT
                p.cpf_pessoa,
                p.nome_pessoa,
                p.data_nascimento_pessoa,
                p.endereco_pessoa,
                p.email_pessoa,
                f.salario_funcionario,
                f.porcentagem_comissao_funcionario,
                f.ativo_funcionario,
                c.id_cargo,
                c.nome_cargo

            FROM funcionario f

            INNER JOIN pessoa p
                ON f.pessoa_cpf_pessoa = p.cpf_pessoa

            INNER JOIN cargo c
                ON f.cargo_id_cargo = c.id_cargo

            WHERE p.cpf_pessoa = $1;
        `, [cpf]);

        // VERIFICAR SE O FUNCIONÁRIO EXISTE
        if (resultado.rows.length === 0) {

            return res.status(404).json({
                sucesso: false,
                mensagem: 'Funcionário não encontrado.'
            });

        }

        return res.status(200).json({
            sucesso: true,
            funcionario: resultado.rows[0]
        });

    } catch (erro) {

        console.error('Erro ao buscar funcionário:', erro);

        return res.status(500).json({
            sucesso: false,
            mensagem: 'Não foi possível carregar os detalhes do funcionário.'
        });

    }

};


 // CADASTRAR FUNCIONÁRIO
exports.cadastrarFuncionario = async (req, res) => {

    try {

        // RECEBER OS DADOS DO FRONTEND
        const {
            nome,
            cpf,
            dataNascimento,
            email,
            endereco,
            senha,
            cargoId,
            salario,
            comissao
        } = req.body;

        // VERIFICAR CAMPOS OBRIGATÓRIOS
        if (
            !nome || !cpf || !email || !senha ||
            !cargoId || salario === undefined || comissao === undefined
        ) {
            return res.status(400).json({
                sucesso: false,
                mensagem: 'Preencha todos os campos obrigatórios.'
            });
        }

        // VALIDAR CPF
        if (!/^\d{11}$/.test(cpf)) {
            return res.status(400).json({
                sucesso: false,
                mensagem: 'O CPF deve conter exatamente 11 números.'
            });
        }

        // VALIDAR VALORES NUMÉRICOS
        const salarioNumero = Number(salario);
        const comissaoNumero = Number(comissao);
        const cargoNumero = Number(cargoId);

        if (
            !Number.isFinite(salarioNumero) ||
            salarioNumero < 0 ||
            salarioNumero > 99999999.99 ||
            !Number.isFinite(comissaoNumero) ||
            comissaoNumero < 0 ||
            comissaoNumero > 100 ||
            !Number.isInteger(cargoNumero) ||
            cargoNumero < 1
        ) {
            return res.status(400).json({
                sucesso: false,
                mensagem: 'Confira o salário, a comissão e o cargo informados.'
            });
        }

        // VERIFICAR SE CPF OU EMAIL JÁ EXISTEM
        const pessoaExistente = await query(
            `SELECT cpf_pessoa
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

        // VERIFICAR SE O CARGO EXISTE
        const cargoExistente = await query(
            'SELECT id_cargo FROM cargo WHERE id_cargo = $1',
            [cargoNumero]
        );

        if (cargoExistente.rows.length === 0) {
            return res.status(400).json({
                sucesso: false,
                mensagem: 'O cargo selecionado não existe.'
            });
        }

        // PROTEGER A SENHA
        const senhaHash = await bcrypt.hash(senha, 10);

        // INICIAR TRANSAÇÃO
        const client = await require('../database').pool.connect();

        try {

            await client.query('BEGIN');

            // INSERIR DADOS PESSOAIS
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

            // INSERIR DADOS PROFISSIONAIS
            await client.query(
                `INSERT INTO funcionario
                (pessoa_cpf_pessoa, salario_funcionario,
                 cargo_id_cargo, porcentagem_comissao_funcionario)
                 VALUES ($1, $2, $3, $4)`,
                [cpf, salarioNumero, cargoNumero, comissaoNumero]
            );

            // CONFIRMAR TRANSAÇÃO
            await client.query('COMMIT');

            return res.status(201).json({
                sucesso: true,
                mensagem: 'Funcionário cadastrado com sucesso!'
            });

        } catch (erro) {

            await client.query('ROLLBACK');
            throw erro;

        } finally {

            client.release();

        }

    } catch (erro) {

        console.error('Erro ao cadastrar funcionário:', erro);

        return res.status(500).json({
            sucesso: false,
            mensagem: 'Não foi possível cadastrar o funcionário.'
        });

    }

};

// EDITAR FUNCIONÁRIO
exports.editarFuncionario = async (req, res) => {

    const { cpf } = req.params;

    try {

        // RECEBER OS DADOS DO FRONTEND
        const {
            nome,
            dataNascimento,
            email,
            endereco,
            cargoId,
            salario,
            comissao
        } = req.body;

        // VERIFICAR CAMPOS OBRIGATÓRIOS
        if (
            !nome?.trim() ||
            !email?.trim() ||
            !cargoId ||
            salario === undefined ||
            comissao === undefined
        ) {
            return res.status(400).json({
                sucesso: false,
                mensagem: 'Preencha todos os campos obrigatórios.'
            });
        }

        // VALIDAR CPF
        if (!/^\d{11}$/.test(cpf)) {
            return res.status(400).json({
                sucesso: false,
                mensagem: 'CPF inválido.'
            });
        }

        // VALIDAR VALORES NUMÉRICOS
        const salarioNumero = Number(salario);
        const comissaoNumero = Number(comissao);
        const cargoNumero = Number(cargoId);

        if (
            !Number.isFinite(salarioNumero) ||
            salarioNumero < 0 ||
            salarioNumero > 99999999.99 ||
            !Number.isFinite(comissaoNumero) ||
            comissaoNumero < 0 ||
            comissaoNumero > 100 ||
            !Number.isInteger(cargoNumero) ||
            cargoNumero < 1
        ) {
            return res.status(400).json({
                sucesso: false,
                mensagem: 'Confira o salário, a comissão e o cargo informados.'
            });
        }

        // VERIFICAR SE O FUNCIONÁRIO EXISTE
        const funcionarioExistente = await query(
            `SELECT pessoa_cpf_pessoa, cargo_id_cargo
             FROM funcionario
             WHERE pessoa_cpf_pessoa = $1`,
            [cpf]
        );

        if (funcionarioExistente.rows.length === 0) {
            return res.status(404).json({
                sucesso: false,
                mensagem: 'Funcionário não encontrado.'
            });
        }

        const cargoAtual = Number(
            funcionarioExistente.rows[0].cargo_id_cargo
        );

        // PROTEGER O CARGO DE GERENTE
        if (cargoNumero === 1 && cargoAtual !== 1) {
            return res.status(403).json({
                sucesso: false,
                mensagem: 'O cargo de gerente está reservado.'
            });
        }

        if (cargoAtual === 1 && cargoNumero !== 1) {
            return res.status(403).json({
                sucesso: false,
                mensagem: 'Não é permitido alterar o cargo do gerente.'
            });
        }

        // VERIFICAR SE O E-MAIL JÁ ESTÁ EM USO
        const emailExistente = await query(
            `SELECT cpf_pessoa
             FROM pessoa
             WHERE email_pessoa = $1
             AND cpf_pessoa <> $2`,
            [email.trim(), cpf]
        );

        if (emailExistente.rows.length > 0) {
            return res.status(409).json({
                sucesso: false,
                mensagem: 'Este e-mail já está cadastrado.'
            });
        }

        // VERIFICAR SE O CARGO EXISTE
        const cargoExistente = await query(
            'SELECT id_cargo FROM cargo WHERE id_cargo = $1',
            [cargoNumero]
        );

        if (cargoExistente.rows.length === 0) {
            return res.status(400).json({
                sucesso: false,
                mensagem: 'O cargo selecionado não existe.'
            });
        }

        // INICIAR TRANSAÇÃO
        const client = await require('../database').pool.connect();

        try {

            await client.query('BEGIN');

            // ATUALIZAR DADOS PESSOAIS
            await client.query(
                `UPDATE pessoa
                 SET nome_pessoa = $1,
                     data_nascimento_pessoa = $2,
                     email_pessoa = $3,
                     endereco_pessoa = $4
                 WHERE cpf_pessoa = $5`,
                [
                    nome.trim(),
                    dataNascimento || null,
                    email.trim(),
                    endereco || null,
                    cpf
                ]
            );

            // ATUALIZAR DADOS PROFISSIONAIS
            await client.query(
                `UPDATE funcionario
                 SET cargo_id_cargo = $1,
                     salario_funcionario = $2,
                     porcentagem_comissao_funcionario = $3
                 WHERE pessoa_cpf_pessoa = $4`,
                [
                    cargoNumero,
                    salarioNumero,
                    comissaoNumero,
                    cpf
                ]
            );

            await client.query('COMMIT');

            return res.status(200).json({
                sucesso: true,
                mensagem: 'Funcionário atualizado com sucesso!'
            });

        } catch (erro) {

            await client.query('ROLLBACK');
            throw erro;

        } finally {

            client.release();

        }

    } catch (erro) {

        console.error('Erro ao editar funcionário:', erro);

        return res.status(500).json({
            sucesso: false,
            mensagem: 'Não foi possível atualizar o funcionário.'
        });

    }

};

// DESATIVAR FUNCIONÁRIO
exports.desativarFuncionario = async (req, res) => {

    try {

        const { cpf } = req.params;

        // VALIDAR CPF
        if (!/^\d{11}$/.test(cpf)) {
            return res.status(400).json({
                sucesso: false,
                mensagem: 'CPF inválido.'
            });
        }

        // VERIFICAR SE O FUNCIONÁRIO EXISTE
        const resultado = await query(
            `SELECT cargo_id_cargo, ativo_funcionario
             FROM funcionario
             WHERE pessoa_cpf_pessoa = $1`,
            [cpf]
        );

        if (resultado.rows.length === 0) {
            return res.status(404).json({
                sucesso: false,
                mensagem: 'Funcionário não encontrado.'
            });
        }

        const funcionario = resultado.rows[0];

        // IMPEDIR A DESATIVAÇÃO DO GERENTE
        if (Number(funcionario.cargo_id_cargo) === 1) {
            return res.status(403).json({
                sucesso: false,
                mensagem: 'A conta do gerente não pode ser desativada.'
            });
        }

        // VERIFICAR SE JÁ ESTÁ INATIVO
        if (!funcionario.ativo_funcionario) {
            return res.status(400).json({
                sucesso: false,
                mensagem: 'Este funcionário já está inativo.'
            });
        }

        // ATUALIZAR SITUAÇÃO
        await query(
            `UPDATE funcionario
             SET ativo_funcionario = FALSE
             WHERE pessoa_cpf_pessoa = $1`,
            [cpf]
        );

        return res.status(200).json({
            sucesso: true,
            mensagem: 'Funcionário desativado com sucesso!'
        });

    } catch (erro) {

        console.error('Erro ao desativar funcionário:', erro);

        return res.status(500).json({
            sucesso: false,
            mensagem: 'Não foi possível desativar o funcionário.'
        });

    }

};

// LISTAR CARGOS DISPONÍVEIS
exports.listarCargos = async (req, res) => {

    try {

        const resultado = await query(`
            SELECT id_cargo, nome_cargo
            FROM cargo
            ORDER BY id_cargo ASC;
        `);

        return res.status(200).json({
            sucesso: true,
            cargos: resultado.rows
        });

    } catch (erro) {

        console.error('Erro ao listar cargos:', erro);

        return res.status(500).json({
            sucesso: false,
            mensagem: 'Não foi possível carregar os cargos.'
        });

    }

};

// REATIVAR FUNCIONÁRIO
exports.reativarFuncionario = async (req, res) => {

    try {

        const { cpf } = req.params;

        if (!/^\d{11}$/.test(cpf)) {
            return res.status(400).json({
                sucesso: false,
                mensagem: 'CPF inválido.'
            });
        }

        const resultado = await query(
            `SELECT cargo_id_cargo, ativo_funcionario
             FROM funcionario
             WHERE pessoa_cpf_pessoa = $1`,
            [cpf]
        );

        if (resultado.rows.length === 0) {
            return res.status(404).json({
                sucesso: false,
                mensagem: 'Funcionário não encontrado.'
            });
        }

        const funcionario = resultado.rows[0];

        if (funcionario.ativo_funcionario) {
            return res.status(400).json({
                sucesso: false,
                mensagem: 'Este funcionário já está ativo.'
            });
        }

        await query(
            `UPDATE funcionario
             SET ativo_funcionario = TRUE
             WHERE pessoa_cpf_pessoa = $1`,
            [cpf]
        );

        return res.status(200).json({
            sucesso: true,
            mensagem: 'Funcionário reativado com sucesso!'
        });

    } catch (erro) {

        console.error('Erro ao reativar funcionário:', erro);

        return res.status(500).json({
            sucesso: false,
            mensagem: 'Erro ao reativar funcionário.'
        });

    }
};