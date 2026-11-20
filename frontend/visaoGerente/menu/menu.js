
// ELEMENTOS DO MENU
const nomeGerente = document.getElementById('nome-gerente');
const botaoSair = document.getElementById('botao-sair');


// VERIFICAR SESSÃO
async function verificarSessao() {
    try {
        const resposta = await fetch(
            'http://127.0.0.1:3001/api/login/sessao',
            {
                method: 'GET',
                credentials: 'include'
            }
        );

        const dados = await resposta.json();

        if (!resposta.ok || dados.usuario.tipo !== 'funcionario') {
            window.location.href = '../../login/index.html';
            return;
        }

        nomeGerente.textContent = dados.usuario.nome;

    } catch (erro) {
        console.error('Erro ao verificar sessão:', erro);
        alert('Não foi possível verificar seu acesso.');
    }
}


// SAIR DA CONTA
async function sairDaConta() {
    try {
        const resposta = await fetch(
            'http://127.0.0.1:3001/api/login/sair',
            {
                method: 'POST',
                credentials: 'include'
            }
        );

        const dados = await resposta.json();

        if (resposta.ok) {
            window.location.href = '../../login/index.html';
        } else {
            alert(dados.mensagem || 'Não foi possível sair da conta.');
        }

    } catch (erro) {
        console.error('Erro ao sair da conta:', erro);
        alert('Não foi possível encerrar a sessão.');
    }
}


// EVENTOS
botaoSair.addEventListener('click', sairDaConta);


// INICIALIZAÇÃO
verificarSessao();
