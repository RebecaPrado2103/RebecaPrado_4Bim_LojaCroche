document.addEventListener('DOMContentLoaded', function () {

    // ELEMENTOS DO FORMULÁRIO
    const formLogin = document.getElementById('form-login');
    const mensagemLogin = document.getElementById('mensagem-login');

    // ENVIO DO FORMULÁRIO
    formLogin.addEventListener('submit', async function (event) {
        event.preventDefault();

        // COLETAR OS DADOS
        const dadosLogin = {
            cpf: document.getElementById('cpf').value.replace(/\D/g, ''),
            senha: document.getElementById('senha').value
        };

        try {
            mensagemLogin.textContent = 'Verificando seus dados...';
            mensagemLogin.style.color = '#715b53';

            // ENVIAR OS DADOS PARA O BACKEND
            const resposta = await fetch('http://127.0.0.1:3001/api/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify(dadosLogin)
            });

            const resultado = await resposta.json();

            // VERIFICAR A RESPOSTA
            if (!resposta.ok) {
                throw new Error(resultado.mensagem || 'Não foi possível realizar o login.');
            }

            mensagemLogin.textContent = resultado.mensagem;
            mensagemLogin.style.color = '#65866b';

            // REDIRECIONAR PARA A PÁGINA INICIAL
            setTimeout(function () {
                window.location.href = '../visaoCliente/inicio/index.html';
            }, 1000);

        } catch (error) {
            mensagemLogin.textContent = error.message;
            mensagemLogin.style.color = '#b04f5b';

            console.error('Erro no login:', error);
        }
    });
});