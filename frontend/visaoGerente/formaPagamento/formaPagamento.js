const API = 'http://127.0.0.1:3001/api/formas-pagamento';

// ELEMENTOS DA PÁGINA
const formulario = document.getElementById('form-cadastro');
const campoNome = document.getElementById('nome-forma');

const formularioEdicao = document.getElementById('form-edicao');
const areaEdicao = document.getElementById('area-edicao');
const campoNomeEdicao = document.getElementById('nome-forma-edicao');
const botaoCancelarEdicao = document.getElementById('cancelar-edicao');

const campoPesquisa = document.getElementById('pesquisa-forma');
const tabelaFormas = document.getElementById('tabela-formas');
const totalFormas = document.getElementById('total-formas');

// ARMAZENAR AS FORMAS CARREGADAS
let formasPagamento = [];

// IDENTIFICAR A FORMA QUE ESTÁ SENDO EDITADA
let idFormaEdicao = null;


// CARREGAR AS FORMAS DE PAGAMENTO
async function carregarFormas() {
    try {
        const resposta = await fetch(`${API}/gerenciar/listar`, {
            credentials: 'include'
        });

        const dados = await resposta.json();

        if (!resposta.ok) {
            throw new Error(dados.mensagem || 'Não foi possível carregar as formas.');
        }

        formasPagamento = dados.formasPagamento;

        mostrarFormas();

    } catch (error) {
        console.error('Erro ao carregar formas de pagamento:', error);

        tabelaFormas.innerHTML = `
            <tr>
                <td colspan="4">
                    Não foi possível carregar as formas de pagamento.
                </td>
            </tr>
        `;
    }
}


// EXIBIR AS FORMAS NA TABELA
function mostrarFormas() {

    // ATUALIZAR A QUANTIDADE TOTAL
    totalFormas.textContent =
        `Total de formas cadastradas: ${formasPagamento.length}`;

    // OBTER O TEXTO PESQUISADO
    const pesquisa = campoPesquisa.value.trim().toLowerCase();

    // FILTRAR AS FORMAS DE PAGAMENTO
    const formasFiltradas = formasPagamento.filter(forma =>
        forma.nome_forma_pagamento.toLowerCase().includes(pesquisa)
    );

    // VERIFICAR SE EXISTEM RESULTADOS
    if (formasFiltradas.length === 0) {

        tabelaFormas.innerHTML = `
            <tr>
                <td colspan="4">
                    Nenhuma forma de pagamento encontrada.
                </td>
            </tr>
        `;

        return;
    }

    // MONTAR AS LINHAS DA TABELA
    tabelaFormas.innerHTML = formasFiltradas.map(forma => `

        <tr>

            <td>${forma.id_forma_pagamento}</td>

            <td>${escaparHTML(forma.nome_forma_pagamento)}</td>

            <td>
                ${forma.ativo_forma_pagamento ? 'Ativa' : 'Inativa'}
            </td>

            <td class="acoes-tabela">

                <button
                    type="button"
                    class="botao-editar"
                    data-acao="editar"
                    data-id="${forma.id_forma_pagamento}">
                    Editar
                </button>

                ${forma.ativo_forma_pagamento
                ? `
                <button
                    type="button"
                    class="botao-desativar"
                    data-acao="desativar"
                    data-id="${forma.id_forma_pagamento}">
                    Desativar
                </button>
                `
                : `
                <button
                    type="button"
                    class="botao-reativar"
                    data-acao="reativar"
                    data-id="${forma.id_forma_pagamento}">
                    Reativar
                </button>
                `
                }

            </td>

        </tr>

    `).join('');
}


// PROTEGER OS NOMES EXIBIDOS NA TABELA
function escaparHTML(valor) {
    return String(valor).replace(/[&<>"']/g, caractere => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    })[caractere]);
}


// PESQUISAR FORMAS DE PAGAMENTO
campoPesquisa.addEventListener('input', () => {
    mostrarFormas();
});


// CADASTRAR UMA NOVA FORMA
formulario.addEventListener('submit', async (evento) => {

    evento.preventDefault();

    const nome = campoNome.value.trim();

    if (!nome) {
        alert('Informe o nome da forma de pagamento.');
        return;
    }

    try {
        const resposta = await fetch(`${API}/gerenciar/cadastrar`, {
            method: 'POST',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                nome_forma_pagamento: nome
            })
        });

        const dados = await resposta.json();

        if (!resposta.ok) {
            throw new Error(dados.mensagem || 'Erro ao cadastrar.');
        }

        alert(dados.mensagem);

        formulario.reset();

        await carregarFormas();

    } catch (error) {
        alert(error.message);
    }
});


// IDENTIFICAR OS CLIQUES NOS BOTÕES DA TABELA
tabelaFormas.addEventListener('click', async (evento) => {

    const botao = evento.target.closest('button[data-acao]');

    if (!botao) return;

    const id = Number(botao.dataset.id);
    const acao = botao.dataset.acao;

    if (acao === 'editar') {
        iniciarEdicao(id);
    }

    if (acao === 'desativar') {
        await alterarSituacao(id, 'desativar');
    }

    if (acao === 'reativar') {
        await alterarSituacao(id, 'reativar');
    }
});


// MOSTRAR O FORMULÁRIO DE EDIÇÃO
function iniciarEdicao(id) {

    const forma = formasPagamento.find(
        item => item.id_forma_pagamento === id
    );

    if (!forma) return;

    idFormaEdicao = id;

    campoNomeEdicao.value = forma.nome_forma_pagamento;

    areaEdicao.hidden = false;

    areaEdicao.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
    });

    campoNomeEdicao.focus();
}


// SALVAR A EDIÇÃO
formularioEdicao.addEventListener('submit', async (evento) => {

    evento.preventDefault();

    if (idFormaEdicao === null) return;

    const novoNome = campoNomeEdicao.value.trim();

    if (!novoNome) {
        alert('O nome não pode ficar vazio.');
        return;
    }

    try {
        const resposta = await fetch(
            `${API}/gerenciar/${idFormaEdicao}`,
            {
                method: 'PUT',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    nome_forma_pagamento: novoNome
                })
            }
        );

        const dados = await resposta.json();

        if (!resposta.ok) {
            throw new Error(dados.mensagem || 'Erro ao editar.');
        }

        alert(dados.mensagem);

        cancelarEdicao();

        await carregarFormas();

    } catch (error) {
        alert(error.message);
    }
});


// CANCELAR A EDIÇÃO
function cancelarEdicao() {

    formularioEdicao.reset();

    areaEdicao.hidden = true;

    idFormaEdicao = null;
}

botaoCancelarEdicao.addEventListener('click', cancelarEdicao);


// DESATIVAR OU REATIVAR UMA FORMA
async function alterarSituacao(id, acao) {

    const confirmacao = confirm(
        acao === 'desativar'
            ? 'Deseja realmente desativar esta forma de pagamento?'
            : 'Deseja reativar esta forma de pagamento?'
    );

    if (!confirmacao) return;

    try {
        const resposta = await fetch(
            `${API}/gerenciar/${id}/${acao}`,
            {
                method: 'PATCH',
                credentials: 'include'
            }
        );

        const dados = await resposta.json();

        if (!resposta.ok) {
            throw new Error(dados.mensagem || 'Erro ao alterar situação.');
        }

        alert(dados.mensagem);

        await carregarFormas();

    } catch (error) {
        alert(error.message);
    }
}


// CARREGAR A LISTA AO ABRIR A PÁGINA
carregarFormas();
