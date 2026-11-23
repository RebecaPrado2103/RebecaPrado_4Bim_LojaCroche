// CONEXÃO COM O BANCO DE DADOS
const { query } = require('../database');

// LISTAR TODOS OS CARGOS
exports.listarCargos = async (req, res) => {
    try {
        const resultado = await query(`
            SELECT
                c.id_cargo,
                c.nome_cargo,
                c.ativo_cargo,
                COUNT(f.pessoa_cpf_pessoa)
                    FILTER (WHERE f.ativo_funcionario = TRUE)
                    AS funcionarios_ativos
            FROM cargo c
            LEFT JOIN funcionario f
                ON f.cargo_id_cargo = c.id_cargo
            GROUP BY
                c.id_cargo,
                c.nome_cargo,
                c.ativo_cargo
            ORDER BY c.id_cargo ASC;
        `);

        return res.status(200).json({
            sucesso: true,
            cargos: resultado.rows
        });

    } catch (error) {
        console.error('Erro ao listar cargos:', error);

        return res.status(500).json({
            sucesso: false,
            mensagem: 'Erro ao buscar os cargos.'
        });
    }
};

 // CADASTRAR NOVO CARGO
exports.cadastrarCargo = async (req, res) => {
    try {
        const { nome_cargo } = req.body;

        // VERIFICAR SE O NOME FOI INFORMADO
        if (!nome_cargo || !nome_cargo.trim()) {
            return res.status(400).json({
                sucesso: false,
                mensagem: 'Informe o nome do cargo.'
            });
        }

        const nome = nome_cargo.trim();

        // VERIFICAR SE JÁ EXISTE UM CARGO COM ESSE NOME
        const cargoExistente = await query(
            `SELECT id_cargo
             FROM cargo
             WHERE LOWER(nome_cargo) = LOWER($1)`,
            [nome]
        );

        if (cargoExistente.rows.length > 0) {
            return res.status(409).json({
                sucesso: false,
                mensagem: 'Já existe um cargo com esse nome.'
            });
        }

        // CADASTRAR O NOVO CARGO
        const resultado = await query(
            `INSERT INTO cargo (nome_cargo, ativo_cargo)
             VALUES ($1, TRUE)
             RETURNING id_cargo, nome_cargo, ativo_cargo`,
            [nome]
        );

        return res.status(201).json({
            sucesso: true,
            mensagem: 'Cargo cadastrado com sucesso!',
            cargo: resultado.rows[0]
        });

    } catch (error) {
        console.error('Erro ao cadastrar cargo:', error);

        return res.status(500).json({
            sucesso: false,
            mensagem: 'Erro ao cadastrar o cargo.'
        });
    }
};

 // EDITAR NOME DE UM CARGO
exports.editarCargo = async (req, res) => {
    try {
        const { id } = req.params;
        const { nome_cargo } = req.body;

        const cargoId = Number(id);

        // VALIDAR O ID
        if (!Number.isInteger(cargoId) || cargoId <= 0) {
            return res.status(400).json({
                sucesso: false,
                mensagem: 'ID de cargo inválido.'
            });
        }

        // PROTEGER O CARGO GERENTE
        if (cargoId === 1) {
            return res.status(403).json({
                sucesso: false,
                mensagem: 'O cargo Gerente não pode ser alterado.'
            });
        }

        // VALIDAR O NOME
        if (!nome_cargo || !nome_cargo.trim()) {
            return res.status(400).json({
                sucesso: false,
                mensagem: 'Informe o nome do cargo.'
            });
        }

        const nome = nome_cargo.trim();

        // VERIFICAR SE O CARGO EXISTE
        const cargoExistente = await query(
            `SELECT id_cargo
             FROM cargo
             WHERE id_cargo = $1`,
            [cargoId]
        );

        if (cargoExistente.rows.length === 0) {
            return res.status(404).json({
                sucesso: false,
                mensagem: 'Cargo não encontrado.'
            });
        }

        // VERIFICAR SE OUTRO CARGO JÁ POSSUI ESSE NOME
        const nomeDuplicado = await query(
            `SELECT id_cargo
             FROM cargo
             WHERE LOWER(nome_cargo) = LOWER($1)
               AND id_cargo <> $2`,
            [nome, cargoId]
        );

        if (nomeDuplicado.rows.length > 0) {
            return res.status(409).json({
                sucesso: false,
                mensagem: 'Já existe outro cargo com esse nome.'
            });
        }

        // ATUALIZAR O NOME
        const resultado = await query(
            `UPDATE cargo
             SET nome_cargo = $1
             WHERE id_cargo = $2
             RETURNING id_cargo, nome_cargo, ativo_cargo`,
            [nome, cargoId]
        );

        return res.status(200).json({
            sucesso: true,
            mensagem: 'Cargo atualizado com sucesso!',
            cargo: resultado.rows[0]
        });

    } catch (error) {
        console.error('Erro ao editar cargo:', error);

        return res.status(500).json({
            sucesso: false,
            mensagem: 'Erro ao atualizar o cargo.'
        });
    }
};

 // DESATIVAR UM CARGO
exports.desativarCargo = async (req, res) => {
    try {
        const { id } = req.params;
        const cargoId = Number(id);

        // VALIDAR O ID
        if (!Number.isInteger(cargoId) || cargoId <= 0) {
            return res.status(400).json({
                sucesso: false,
                mensagem: 'ID de cargo inválido.'
            });
        }

        // PROTEGER O CARGO GERENTE
        if (cargoId === 1) {
            return res.status(403).json({
                sucesso: false,
                mensagem: 'O cargo Gerente não pode ser desativado.'
            });
        }

        // VERIFICAR SE O CARGO EXISTE
        const cargo = await query(
            `SELECT id_cargo, ativo_cargo
             FROM cargo
             WHERE id_cargo = $1`,
            [cargoId]
        );

        if (cargo.rows.length === 0) {
            return res.status(404).json({
                sucesso: false,
                mensagem: 'Cargo não encontrado.'
            });
        }

        if (!cargo.rows[0].ativo_cargo) {
            return res.status(400).json({
                sucesso: false,
                mensagem: 'Este cargo já está desativado.'
            });
        }

        // VERIFICAR FUNCIONÁRIOS ATIVOS VINCULADOS
        const funcionarios = await query(
            `SELECT COUNT(*) AS quantidade
             FROM funcionario
             WHERE cargo_id_cargo = $1
               AND ativo_funcionario = TRUE`,
            [cargoId]
        );

        if (Number(funcionarios.rows[0].quantidade) > 0) {
            return res.status(409).json({
                sucesso: false,
                mensagem: 'Não é possível desativar este cargo enquanto houver funcionários ativos vinculados a ele.'
            });
        }

        // DESATIVAR O CARGO
        const resultado = await query(
            `UPDATE cargo
             SET ativo_cargo = FALSE
             WHERE id_cargo = $1
             RETURNING id_cargo, nome_cargo, ativo_cargo`,
            [cargoId]
        );

        return res.status(200).json({
            sucesso: true,
            mensagem: 'Cargo desativado com sucesso!',
            cargo: resultado.rows[0]
        });

    } catch (error) {
        console.error('Erro ao desativar cargo:', error);

        return res.status(500).json({
            sucesso: false,
            mensagem: 'Erro ao desativar o cargo.'
        });
    }
};

 // REATIVAR UM CARGO
exports.reativarCargo = async (req, res) => {
    try {
        const { id } = req.params;
        const cargoId = Number(id);

        // VALIDAR O ID
        if (!Number.isInteger(cargoId) || cargoId <= 0) {
            return res.status(400).json({
                sucesso: false,
                mensagem: 'ID de cargo inválido.'
            });
        }

        // PROTEGER O CARGO GERENTE
        if (cargoId === 1) {
            return res.status(403).json({
                sucesso: false,
                mensagem: 'O cargo Gerente não precisa ser reativado.'
            });
        }

        // VERIFICAR SE O CARGO EXISTE
        const cargo = await query(
            `SELECT id_cargo, ativo_cargo
             FROM cargo
             WHERE id_cargo = $1`,
            [cargoId]
        );

        if (cargo.rows.length === 0) {
            return res.status(404).json({
                sucesso: false,
                mensagem: 'Cargo não encontrado.'
            });
        }

        if (cargo.rows[0].ativo_cargo) {
            return res.status(400).json({
                sucesso: false,
                mensagem: 'Este cargo já está ativo.'
            });
        }

        // REATIVAR O CARGO
        const resultado = await query(
            `UPDATE cargo
             SET ativo_cargo = TRUE
             WHERE id_cargo = $1
             RETURNING id_cargo, nome_cargo, ativo_cargo`,
            [cargoId]
        );

        return res.status(200).json({
            sucesso: true,
            mensagem: 'Cargo reativado com sucesso!',
            cargo: resultado.rows[0]
        });

    } catch (error) {
        console.error('Erro ao reativar cargo:', error);

        return res.status(500).json({
            sucesso: false,
            mensagem: 'Erro ao reativar o cargo.'
        });
    }
};

 // LISTAR PERMISSÕES DE UM CARGO
exports.listarPermissoesCargo = async (req, res) => {
    try {
        const cargoId = Number(req.params.id);

        // VALIDAR O ID
        if (!Number.isInteger(cargoId) || cargoId <= 0) {
            return res.status(400).json({
                sucesso: false,
                mensagem: 'ID de cargo inválido.'
            });
        }

        // VERIFICAR SE O CARGO EXISTE
        const cargo = await query(
            `SELECT id_cargo, nome_cargo
             FROM cargo
             WHERE id_cargo = $1`,
            [cargoId]
        );

        if (cargo.rows.length === 0) {
            return res.status(404).json({
                sucesso: false,
                mensagem: 'Cargo não encontrado.'
            });
        }

        // BUSCAR TODAS AS PERMISSÕES E IDENTIFICAR AS ATRIBUÍDAS
        const resultado = await query(
            `SELECT
                p.id_permissao,
                p.codigo_permissao,
                p.descricao_permissao,
                CASE
                    WHEN cp.permissao_id_permissao IS NOT NULL
                    THEN TRUE
                    ELSE FALSE
                END AS selecionada
             FROM permissao p
             LEFT JOIN cargo_has_permissao cp
                ON cp.permissao_id_permissao = p.id_permissao
                AND cp.cargo_id_cargo = $1
             ORDER BY p.id_permissao ASC`,
            [cargoId]
        );

        return res.status(200).json({
            sucesso: true,
            cargo: cargo.rows[0],
            permissoes: resultado.rows
        });

    } catch (error) {
        console.error('Erro ao listar permissões:', error);

        return res.status(500).json({
            sucesso: false,
            mensagem: 'Erro ao buscar as permissões do cargo.'
        });
    }
};

 // ATUALIZAR PERMISSÕES DE UM CARGO
exports.atualizarPermissoesCargo = async (req, res) => {
    const db = require('../database');
    let conexao;

    try {
        const cargoId = Number(req.params.id);
        const { permissoes } = req.body;

        // VALIDAR O ID DO CARGO
        if (!Number.isInteger(cargoId) || cargoId <= 0) {
            return res.status(400).json({
                sucesso: false,
                mensagem: 'ID de cargo inválido.'
            });
        }

        // PROTEGER AS PERMISSÕES DO GERENTE
        if (cargoId === 1) {
            return res.status(403).json({
                sucesso: false,
                mensagem: 'As permissões do cargo Gerente não podem ser alteradas.'
            });
        }

        // VALIDAR A LISTA DE PERMISSÕES
        if (!Array.isArray(permissoes)) {
            return res.status(400).json({
                sucesso: false,
                mensagem: 'Informe uma lista válida de permissões.'
            });
        }

        const idsPermissoes = permissoes.map(Number);

        if (
            idsPermissoes.some(id =>
                !Number.isInteger(id) || id <= 0
            ) ||
            new Set(idsPermissoes).size !== idsPermissoes.length
        ) {
            return res.status(400).json({
                sucesso: false,
                mensagem: 'A lista contém IDs inválidos ou repetidos.'
            });
        }

        conexao = await db.pool.connect();

        await conexao.query('BEGIN');

        // VERIFICAR SE O CARGO EXISTE
        const cargo = await conexao.query(
            `SELECT id_cargo
             FROM cargo
             WHERE id_cargo = $1`,
            [cargoId]
        );

        if (cargo.rows.length === 0) {
            await conexao.query('ROLLBACK');

            return res.status(404).json({
                sucesso: false,
                mensagem: 'Cargo não encontrado.'
            });
        }

        // VERIFICAR SE TODAS AS PERMISSÕES EXISTEM
        const resultadoPermissoes = await conexao.query(
            `SELECT id_permissao
             FROM permissao
             WHERE id_permissao = ANY($1::INTEGER[])`,
            [idsPermissoes]
        );

        if (resultadoPermissoes.rows.length !== idsPermissoes.length) {
            await conexao.query('ROLLBACK');

            return res.status(400).json({
                sucesso: false,
                mensagem: 'Uma ou mais permissões informadas não existem.'
            });
        }

        // REMOVER AS PERMISSÕES ANTERIORES
        await conexao.query(
            `DELETE FROM cargo_has_permissao
             WHERE cargo_id_cargo = $1`,
            [cargoId]
        );

        // INSERIR AS NOVAS PERMISSÕES
        for (const permissaoId of idsPermissoes) {
            await conexao.query(
                `INSERT INTO cargo_has_permissao
                    (cargo_id_cargo, permissao_id_permissao)
                 VALUES ($1, $2)`,
                [cargoId, permissaoId]
            );
        }

        await conexao.query('COMMIT');

        return res.status(200).json({
            sucesso: true,
            mensagem: 'Permissões atualizadas com sucesso!'
        });

    } catch (error) {
        if (conexao) {
            await conexao.query('ROLLBACK');
        }

        console.error('Erro ao atualizar permissões:', error);

        return res.status(500).json({
            sucesso: false,
            mensagem: 'Erro ao atualizar as permissões do cargo.'
        });

    } finally {
        if (conexao) {
            conexao.release();
        }
    }
};
