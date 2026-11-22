// PERMISSÕES DOS CARGOS
const permissoes = {
    1: [
        'produtos_visualizar',
        'produtos_cadastrar',
        'produtos_editar',
        'produtos_desativar',
        'estoque_visualizar',
        'estoque_atualizar',
        'pedidos_atualizar',
        'clientes_visualizar',

        // Gerenciamento de funcionários
        'funcionarios_visualizar',
        'funcionarios_cadastrar',
        'funcionarios_editar'
    ],

    2: ['produtos_visualizar', 'estoque_visualizar'],

    3: ['produtos_visualizar', 'estoque_visualizar'],

    4: ['produtos_visualizar', 'estoque_visualizar'],

    5: ['produtos_visualizar', 'estoque_visualizar', 'estoque_atualizar'],

    6: ['produtos_visualizar', 'estoque_visualizar'],

    7: ['produtos_visualizar', 'estoque_visualizar']
};

// VERIFICAR SE O FUNCIONÁRIO POSSUI A PERMISSÃO
function verificarPermissao(permissaoNecessaria) {

    return (req, res, next) => {

        // Verificar se existe um funcionário autenticado
        if (!req.session.usuario ||
            req.session.usuario.tipo !== 'funcionario') {

            return res.status(403).json({
                sucesso: false,
                mensagem: 'Acesso permitido somente para funcionários.'
            });
        }

        // Identificar o cargo do funcionário
        const cargoId = req.session.usuario.cargoId;

        // Buscar as permissões do cargo
        const permissoesCargo = permissoes[cargoId] || [];

        // Verificar se a permissão é autorizada
        if (!permissoesCargo.includes(permissaoNecessaria)) {

            return res.status(403).json({
                sucesso: false,
                mensagem: 'Você não possui permissão para realizar esta operação.'
            });
        }

        // Permitir que a requisição continue
        next();
    };
}

module.exports = verificarPermissao;