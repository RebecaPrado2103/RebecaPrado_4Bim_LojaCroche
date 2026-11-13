document.addEventListener('DOMContentLoaded', function () {

    // ELEMENTOS DO FORMULÁRIO
    const formCadastro = document.getElementById('form-cadastro');
    const mensagemCadastro = document.getElementById('mensagem-cadastro');

    const campoSenha = document.getElementById('senha');
    const campoConfirmarSenha = document.getElementById('confirmar-senha');

    // ENVIO DO FORMULÁRIO
    formCadastro.addEventListener('submit', async function (event) {

        // VALIDAR CPF
        function validarCPF(cpf) {

            cpf = cpf.replace(/\D/g, '');

            return cpf.length === 11;
        }

        event.preventDefault();

        // VERIFICAR SE O CPF É VÁLIDO
        const cpfDigitado = document.getElementById('cpf').value;

        if (!validarCPF(cpfDigitado)) {

            mensagemCadastro.textContent = 'Digite um CPF válido, com 11 números.';
            mensagemCadastro.style.color = '#b04f5b';

            document.getElementById('cpf').focus();

            return;
        }

        // VERIFICA SE AS SENHAS SÃO IGUAIS
        if (campoSenha.value !== campoConfirmarSenha.value) {

            mensagemCadastro.textContent = 'As senhas não coincidem. Verifique os campos.';
            mensagemCadastro.style.color = '#b04f5b';

            campoConfirmarSenha.focus();

            return;
        }

        // REUNIR OS DADOS DO FORMULÁRIO
        const dadosCadastro = {
            nome: document.getElementById('nome').value.trim(),
            cpf: cpfDigitado.replace(/\D/g, ''),
            dataNascimento: document.getElementById('data-nascimento').value,
            email: document.getElementById('email').value.trim(),
            endereco: document.getElementById('endereco').value.trim(),
            senha: campoSenha.value
        };

        try {

            mensagemCadastro.textContent = 'Realizando cadastro...';
            mensagemCadastro.style.color = '#715b53';

            // ENVIAR OS DADOS PARA O BACKEND
            const resposta = await fetch('http://localhost:3001/api/cadastro', {

                method: 'POST',

                headers: {
                    'Content-Type': 'application/json'
                },

                body: JSON.stringify(dadosCadastro)

            });

            const resultado = await resposta.json();

            // VERIFICAR A RESPOSTA DO SERVIDOR
            if (!resposta.ok) {
                throw new Error(resultado.mensagem || 'Não foi possível realizar o cadastro.');
            }

            mensagemCadastro.textContent = resultado.mensagem;
            mensagemCadastro.style.color = '#65866b';

            // LIMPAR FORMULÁRIO APÓS O CADASTRO
            formCadastro.reset();

        } catch (error) {

            mensagemCadastro.textContent = error.message;
            mensagemCadastro.style.color = '#b04f5b';

            console.error('Erro no cadastro:', error);

        }

    });

});