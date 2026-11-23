const db = require('../database');

// VERIFICAR SE O FUNCIONÁRIO POSSUI A PERMISSÃO
function verificarPermissao(permissaoNecessaria) {

    return async (req, res, next) => {

        try {

            // Verificar se existe um funcionário autenticado
            if (
                !req.session.usuario ||
                req.session.usuario.tipo !== 'funcionario'
            ) {
                return res.status(403).json({
                    sucesso: false,
                    mensagem: 'Acesso permitido somente para funcionários.'
                });
            }

            // Identificar o cargo do funcionário
            const cargoId = Number(req.session.usuario.cargoId);

            // Consultar se o cargo existe e está ativo
            const resultadoCargo = await db.query(
                `SELECT ativo_cargo
                 FROM cargo
                 WHERE id_cargo = $1`,
                [cargoId]
            );

            if (
                resultadoCargo.rows.length === 0 ||
                !resultadoCargo.rows[0].ativo_cargo
            ) {
                return res.status(403).json({
                    sucesso: false,
                    mensagem: 'Este cargo está inativo ou não existe.'
                });
            }

            // O gerente possui acesso total ao sistema
            if (cargoId === 1) {
                return next();
            }

            // Consultar as permissões do cargo no banco
            const resultadoPermissao = await db.query(
                `SELECT p.id_permissao
                 FROM cargo_has_permissao cp
                 JOIN permissao p
                    ON p.id_permissao = cp.permissao_id_permissao
                 WHERE cp.cargo_id_cargo = $1
                   AND p.codigo_permissao = $2`,
                [cargoId, permissaoNecessaria]
            );

            // Verificar se a permissão foi encontrada
            if (resultadoPermissao.rows.length === 0) {
                return res.status(403).json({
                    sucesso: false,
                    mensagem: 'Você não possui permissão para realizar esta operação.'
                });
            }

            // Permitir que a requisição continue
            next();

        } catch (error) {

            console.error('Erro ao verificar permissão:', error);

            return res.status(500).json({
                sucesso: false,
                mensagem: 'Erro ao verificar as permissões do funcionário.'
            });

        }
    };
}

module.exports = verificarPermissao;