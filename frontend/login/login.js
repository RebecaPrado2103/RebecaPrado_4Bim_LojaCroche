
document.addEventListener('DOMContentLoaded', function () {

    // ELEMENTOS DO LOGIN
    const formLogin = document.getElementById('form-login');
    const mensagemLogin = document.getElementById('mensagem-login');

    // ELEMENTOS DA ESCOLHA DE ACESSO
    const escolhaAcesso = document.getElementById('escolha-acesso');
    const botaoCliente = document.getElementById('entrar-cliente');
    const botaoFuncionario = document.getElementById('entrar-funcionario');

    const tituloInicial = document.querySelector('.cartao-login > .titulo-login');
    const linkCadastro = document.querySelector('.link-cadastro');

    // REALIZAR LOGIN
    formLogin.addEventListener('submit', async function (event) {
        event.preventDefault();

        const dadosLogin = {
            cpf: document.getElementById('cpf').value.replace(/\D/g, ''),
            senha: document.getElementById('senha').value
        };

        try {
            mensagemLogin.textContent = 'Verificando seus dados...';
            mensagemLogin.style.color = '#715b53';

            const resposta = await fetch('http://127.0.0.1:3001/api/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify(dadosLogin)
            });

            const resultado = await resposta.json();

            if (!resposta.ok) {
                throw new Error(resultado.mensagem || 'Não foi possível realizar o login.');
            }

            // RECEBER AS OPÇÕES DE ACESSO
            const opcoes = resultado.usuario.opcoesAcesso;

            // Se a única opção for cliente, entrar diretamente
            if (opcoes.length === 1 && opcoes[0] === 'cliente') {
                await selecionarAcesso('cliente');
                return;
            }

            // Nos demais casos, mostrar a escolha de acesso
            mostrarEscolhaAcesso(opcoes);

        } catch (error) {
            mensagemLogin.textContent = error.message;
            mensagemLogin.style.color = '#b04f5b';

            console.error('Erro no login:', error);
        }
    });

    // MOSTRAR AS OPÇÕES DISPONÍVEIS
    function mostrarEscolhaAcesso(opcoes) {

        formLogin.hidden = true;
        tituloInicial.hidden = true;
        linkCadastro.hidden = true;

        // Mostrar ou esconder cada botão conforme as permissões
        botaoCliente.hidden = !opcoes.includes('cliente');
        botaoFuncionario.hidden = !opcoes.includes('funcionario');

        escolhaAcesso.hidden = false;
    }

    // REGISTRAR A ESCOLHA NO BACKEND
    async function selecionarAcesso(tipo) {

        try {
            const resposta = await fetch('http://127.0.0.1:3001/api/login/acesso', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify({ tipo })
            });

            const resultado = await resposta.json();

            if (!resposta.ok) {
                throw new Error(resultado.mensagem || 'Não foi possível selecionar o acesso.');
            }

            // ENCAMINHAR PARA A ÁREA ESCOLHIDA
            if (tipo === 'cliente') {
                window.location.href = '../visaoCliente/inicio/index.html';
            } else {
                window.location.href = '../visaoGerente/menu/index.html';
            }

        } catch (error) {
            mostrarMensagemAcesso(error.message);
            console.error('Erro ao selecionar acesso:', error);
        }
    }

    // MOSTRAR MENSAGENS NA TELA DE ESCOLHA
    function mostrarMensagemAcesso(texto) {

        let mensagem = document.getElementById('mensagem-acesso');

        if (!mensagem) {
            mensagem = document.createElement('p');
            mensagem.id = 'mensagem-acesso';
            mensagem.style.color = '#b04f5b';
            mensagem.style.fontSize = '14px';
            mensagem.style.textAlign = 'center';
            mensagem.style.marginTop = '15px';

            escolhaAcesso.appendChild(mensagem);
        }

        mensagem.textContent = texto;
    }

    // EVENTOS DOS BOTÕES
    botaoCliente.addEventListener('click', function () {
        selecionarAcesso('cliente');
    });

    botaoFuncionario.addEventListener('click', function () {
        selecionarAcesso('funcionario');
    });

});
