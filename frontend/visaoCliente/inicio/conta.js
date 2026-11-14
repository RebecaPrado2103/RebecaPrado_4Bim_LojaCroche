document.addEventListener('DOMContentLoaded', async function () {

    const linkLogin = document.getElementById('link-login');
    const saudacaoCliente = document.getElementById('saudacao-cliente');
    const botaoSair = document.getElementById('botao-sair');

    // VERIFICAR SE EXISTE UMA SESSÃO
    async function verificarSessao() {
        try {
            const resposta = await fetch(
                'http://127.0.0.1:3001/api/login/sessao',
                {
                    credentials: 'include'
                }
            );

            if (!resposta.ok) {
                mostrarVisitante();
                return;
            }

            const resultado = await resposta.json();

            if (resultado.autenticado) {
                mostrarCliente(resultado.usuario.nome);
            } else {
                mostrarVisitante();
            }

        } catch (error) {
            console.error('Erro ao verificar sessão:', error);
            mostrarVisitante();
        }
    }

    // EXIBIR OPÇÕES PARA VISITANTES
    function mostrarVisitante() {
        linkLogin.hidden = false;
        saudacaoCliente.hidden = true;
        botaoSair.hidden = true;
    }

    // EXIBIR OPÇÕES PARA CLIENTES CONECTADOS
    function mostrarCliente(nome) {
        linkLogin.hidden = true;
        saudacaoCliente.textContent = `Olá, ${nome}!`;
        saudacaoCliente.hidden = false;
        botaoSair.hidden = false;
    }

    // ENCERRAR SESSÃO
    botaoSair.addEventListener('click', async function () {
        try {
            const resposta = await fetch(
                'http://127.0.0.1:3001/api/login/sair',
                {
                    method: 'POST',
                    credentials: 'include'
                }
            );

            const resultado = await resposta.json();

            if (!resposta.ok) {
                throw new Error(resultado.mensagem);
            }

            mostrarVisitante();
            alert('Você saiu da sua conta!');

        } catch (error) {
            console.error('Erro ao sair da conta:', error);
            alert('Não foi possível encerrar sua sessão.');
        }
    });

    // INICIAR VERIFICAÇÃO
    verificarSessao();

});