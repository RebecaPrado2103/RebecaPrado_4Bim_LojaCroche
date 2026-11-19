
function verificarFuncionario(req, res, next) {

    // Verificar se existe um usuário conectado
    if (!req.session.usuario) {
        return res.status(401).json({
            sucesso: false,
            mensagem: 'Você precisa entrar na sua conta.'
        });
    }

    // Verificar se o usuário escolheu entrar como funcionário
    if (req.session.usuario.tipo !== 'funcionario') {
        return res.status(403).json({
            sucesso: false,
            mensagem: 'Acesso permitido somente para funcionários.'
        });
    }

    // Permitir que a requisição continue
    next();
}

module.exports = verificarFuncionario;
