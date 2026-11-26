// ELEMENTOS DA PÁGINA
const formulario = document.getElementById('form-minha-conta');

const campoNome = document.getElementById('nome-pessoa');
const campoCPF = document.getElementById('cpf-pessoa');
const campoEmail = document.getElementById('email-pessoa');
const campoDataNascimento = document.getElementById('data-nascimento-pessoa');
const campoEndereco = document.getElementById('endereco-pessoa');

const mensagemConta = document.getElementById('mensagem-conta');
const botaoSalvar = document.getElementById('btn-salvar-conta');

// ENDEREÇO DA API
const API_MINHA_CONTA =
    'http://127.0.0.1:3001/api/clientes/minha-conta';


// EXIBIR MENSAGEM NA PÁGINA
function mostrarMensagem(texto, sucesso = false) {
    mensagemConta.textContent = texto;

    mensagemConta.style.color = sucesso
        ? '#4f7b52'
        : '#a34d4d';
}


// CARREGAR OS DADOS DO CLIENTE
async function carregarMinhaConta() {
    try {
        mostrarMensagem('Carregando seus dados...');

        const resposta = await fetch(API_MINHA_CONTA, {
            method: 'GET',
            credentials: 'include'
        });

        const dados = await resposta.json();

        if (!resposta.ok) {
            throw new Error(
                dados.mensagem || 'Não foi possível carregar sua conta.'
            );
        }

        const cliente = dados.cliente;

        // Preenche os campos do formulário
        campoNome.value = cliente.nome_pessoa;
        campoCPF.value = cliente.cpf_pessoa;
        campoEmail.value = cliente.email_pessoa;

        // Formata a data para o campo type="date"
        if (cliente.data_nascimento_pessoa) {
            campoDataNascimento.value =
                String(cliente.data_nascimento_pessoa).slice(0, 10);
        }

        campoEndereco.value = cliente.endereco_pessoa;

        mostrarMensagem('');

    } catch (error) {
        console.error('Erro ao carregar minha conta:', error);

        mostrarMensagem(
            error.message || 'Erro ao carregar os dados da sua conta.'
        );
    }
}


// SALVAR AS ALTERAÇÕES
formulario.addEventListener('submit', async (evento) => {
    evento.preventDefault();

    try {
        botaoSalvar.disabled = true;
        botaoSalvar.textContent = 'Salvando...';

        mostrarMensagem('Salvando suas alterações...');

        // Dados que podem ser alterados pelo cliente
        const dadosAtualizados = {
            nome_pessoa: campoNome.value,
            email_pessoa: campoEmail.value,
            data_nascimento_pessoa: campoDataNascimento.value,
            endereco_pessoa: campoEndereco.value
        };

        const resposta = await fetch(API_MINHA_CONTA, {
            method: 'PUT',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(dadosAtualizados)
        });

        const dados = await resposta.json();

        if (!resposta.ok) {
            throw new Error(
                dados.mensagem || 'Não foi possível salvar as alterações.'
            );
        }

        // Atualiza os campos com os dados retornados pelo servidor
        const cliente = dados.cliente;

        campoNome.value = cliente.nome_pessoa;
        campoCPF.value = cliente.cpf_pessoa;
        campoEmail.value = cliente.email_pessoa;

        campoDataNascimento.value =
            String(cliente.data_nascimento_pessoa).slice(0, 10);

        campoEndereco.value = cliente.endereco_pessoa;

        mostrarMensagem(
            dados.mensagem || 'Dados atualizados com sucesso!',
            true
        );

    } catch (error) {
        console.error('Erro ao salvar minha conta:', error);

        mostrarMensagem(
            error.message || 'Erro ao salvar os dados da sua conta.'
        );

    } finally {
        botaoSalvar.disabled = false;
        botaoSalvar.textContent = 'Salvar alterações';
    }
});

// CARREGAR OS DADOS ASSIM QUE A PÁGINA ABRIR
carregarMinhaConta();

// =================================
// CONTROLE DO CARRINHO LATERAL
// =================================
const botaoAbrirCarrinho = document.getElementById('abrir-carrinho');
const botaoFecharCarrinho = document.getElementById('fechar-carrinho');
const carrinhoLateral = document.getElementById('carrinho-lateral');
const fundoCarrinho = document.getElementById('fundo-carrinho');
const botaoCancelarCarrinho = document.querySelector('.botao-cancelar');

function abrirCarrinho() {
    carrinhoLateral.classList.add('aberto');
    fundoCarrinho.classList.add('aberto');
    document.body.style.overflow = 'hidden';
}

function fecharCarrinho() {
    carrinhoLateral.classList.remove('aberto');
    fundoCarrinho.classList.remove('aberto');
    document.body.style.overflow = '';
}

if (botaoAbrirCarrinho) botaoAbrirCarrinho.addEventListener('click', abrirCarrinho);
if (botaoFecharCarrinho) botaoFecharCarrinho.addEventListener('click', fecharCarrinho);
if (botaoCancelarCarrinho) botaoCancelarCarrinho.addEventListener('click', fecharCarrinho);
if (fundoCarrinho) fundoCarrinho.addEventListener('click', fecharCarrinho);

document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape') {
        fecharCarrinho();
    }
});