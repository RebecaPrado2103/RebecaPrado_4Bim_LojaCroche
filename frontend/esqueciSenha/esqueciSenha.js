const formularioRecuperacao = document.getElementById('form-recuperacao');
const campoEmail = document.getElementById('email-recuperacao');
const botaoRecuperacao = document.getElementById('botao-recuperacao');
const mensagemRecuperacao = document.getElementById('mensagem-recuperacao');

const formularioNovaSenha = document.getElementById('form-nova-senha');
const campoCodigo = document.getElementById('codigo-recuperacao');
const campoNovaSenha = document.getElementById('nova-senha');
const campoConfirmarSenha = document.getElementById('confirmar-senha');
const botaoNovaSenha = document.getElementById('botao-nova-senha');
const mensagemNovaSenha = document.getElementById('mensagem-nova-senha');


// ======================================
// SOLICITAR CÓDIGO DE RECUPERAÇÃO
// ======================================

formularioRecuperacao.addEventListener('submit', async function (evento) {

    evento.preventDefault();

    const email = campoEmail.value.trim();

    mensagemRecuperacao.textContent = '';

    botaoRecuperacao.disabled = true;
    botaoRecuperacao.textContent = 'Enviando...';

    try {

        const resposta = await fetch(
            'http://127.0.0.1:3001/api/recuperacao/solicitar',
            {
                method: 'POST',

                headers: {
                    'Content-Type': 'application/json'
                },

                body: JSON.stringify({
                    email: email
                })
            }
        );

        const dados = await resposta.json();

        if (!resposta.ok) {
            throw new Error(
                dados.mensagem || 'Não foi possível solicitar o código.'
            );
        }

        // Mostrar a mensagem recebida do backend
        mensagemRecuperacao.textContent = dados.mensagem;

        // Esconder o formulário do e-mail
        formularioRecuperacao.hidden = true;

        // Mostrar o formulário da nova senha
        formularioNovaSenha.hidden = false;

    } catch (erro) {

        console.error('Erro ao solicitar código:', erro);

        mensagemRecuperacao.textContent =
            'Não foi possível enviar o código. Tente novamente.';

    } finally {

        botaoRecuperacao.disabled = false;
        botaoRecuperacao.textContent = 'Enviar código';

    }

});


// ======================================
// REDEFINIR SENHA
// ======================================

formularioNovaSenha.addEventListener('submit', async function (evento) {

    evento.preventDefault();

    const email = campoEmail.value.trim();
    const codigo = campoCodigo.value.trim();
    const novaSenha = campoNovaSenha.value;
    const confirmarSenha = campoConfirmarSenha.value;

    mensagemNovaSenha.textContent = '';

    // Verificar se as senhas são iguais
    if (novaSenha !== confirmarSenha) {

        mensagemNovaSenha.textContent =
            'As senhas não são iguais. Verifique e tente novamente.';

        return;
    }

    botaoNovaSenha.disabled = true;
    botaoNovaSenha.textContent = 'Redefinindo...';

    try {

        const resposta = await fetch(
            'http://127.0.0.1:3001/api/recuperacao/redefinir',
            {
                method: 'POST',

                headers: {
                    'Content-Type': 'application/json'
                },

                body: JSON.stringify({
                    email: email,
                    codigo: codigo,
                    novaSenha: novaSenha
                })
            }
        );

        const dados = await resposta.json();

        if (!resposta.ok) {
            throw new Error(
                dados.mensagem || 'Não foi possível redefinir a senha.'
            );
        }

        mensagemNovaSenha.textContent = dados.mensagem;

        // Impedir novo envio após o sucesso
        botaoNovaSenha.textContent = 'Senha redefinida';
        botaoNovaSenha.disabled = true;

        // Limpar os campos
        campoCodigo.value = '';
        campoNovaSenha.value = '';
        campoConfirmarSenha.value = '';

    } catch (erro) {

        console.error('Erro ao redefinir senha:', erro);

        mensagemNovaSenha.textContent =
            erro.message || 'Não foi possível redefinir a senha.';

        botaoNovaSenha.disabled = false;
        botaoNovaSenha.textContent = 'Redefinir senha';

    }

});