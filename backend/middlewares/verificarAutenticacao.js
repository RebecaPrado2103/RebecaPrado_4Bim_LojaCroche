function verificarAutenticacao(req, res, next) {

    // Verificar se existe um usuário conectado
    if (!req.session.usuario) {
        return res.status(401).json({
            sucesso: false,
            mensagem: 'Você precisa entrar na sua conta.'
        });
    }

    // Verificar se o usuário é um cliente
    if (req.session.usuario.tipo !== 'cliente') {
        return res.status(403).json({
            sucesso: false,
            mensagem: 'Acesso permitido somente para clientes.'
        });
    }

    // Permitir que a requisição continue
    next();
}

module.exports = verificarAutenticacao;