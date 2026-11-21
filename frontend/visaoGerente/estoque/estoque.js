
const URL_API = 'http://127.0.0.1:3001';

// Elementos da página
const totalProdutos = document.getElementById('total-produtos');
const produtosEstoqueBaixo = document.getElementById('produtos-estoque-baixo');
const produtosSemEstoque = document.getElementById('produtos-sem-estoque');

const listaProdutos = document.getElementById('lista-produtos');
const pesquisaProduto = document.getElementById('pesquisa-produto');
const filtroEstoque = document.getElementById('filtro-estoque');
const listaMovimentacoes = document.getElementById('lista-movimentacoes');

// Formulários de movimentação
const produtoEntrada = document.getElementById('produto-entrada');
const produtoSaida = document.getElementById('produto-saida');

// Produtos recebidos do servidor
let produtos = [];

// Inicialização
document.addEventListener('DOMContentLoaded', () => {
    listarProdutos();
    listarMovimentacoes();
});

// Buscar produtos no servidor
async function listarProdutos() {
    try {
        const resposta = await fetch(`${URL_API}/api/produtos/gerenciar/listar`, {
            credentials: 'include'
        });

        const dados = await resposta.json();

        if (!resposta.ok || !dados.sucesso) {
            throw new Error(dados.mensagem || 'Não foi possível carregar os produtos.');
        }

        produtos = dados.produtos;

        atualizarResumo();
        exibirProdutos(produtos);
        preencherProdutosMovimentacao();

    } catch (erro) {
        console.error('Erro ao carregar estoque:', erro);
        listaProdutos.textContent = 'Não foi possível carregar os produtos.';
    }
}

// Preencher os campos de seleção dos formulários
function preencherProdutosMovimentacao() {
    const campos = [produtoEntrada, produtoSaida];

    campos.forEach(campo => {
        campo.innerHTML = '<option value="">Selecione um produto</option>';

        produtos.forEach(produto => {
            const opcao = document.createElement('option');

            opcao.value = produto.id_produto;
            opcao.textContent = `${produto.nome_produto} (Estoque: ${produto.quantidade_estoque_produto})`;

            campo.appendChild(opcao);
        });
    });
}

// Buscar histórico de movimentações no servidor
async function listarMovimentacoes() {
    try {
        const resposta = await fetch(`${URL_API}/api/estoque/movimentacoes`, {
            credentials: 'include'
        });

        const dados = await resposta.json();

        if (!resposta.ok || !dados.sucesso) {
            throw new Error(dados.mensagem || 'Não foi possível carregar o histórico.');
        }

        exibirMovimentacoes(dados.movimentacoes);

    } catch (erro) {
        console.error('Erro ao carregar movimentações:', erro);
        listaMovimentacoes.innerHTML = '';

        const linha = document.createElement('tr');
        const celula = document.createElement('td');

        celula.colSpan = 6;
        celula.textContent = 'Não foi possível carregar o histórico.';

        linha.appendChild(celula);
        listaMovimentacoes.appendChild(linha);
    }
}

// Exibir movimentações na tabela
function exibirMovimentacoes(movimentacoes) {
    listaMovimentacoes.innerHTML = '';

    if (movimentacoes.length === 0) {
        const linha = document.createElement('tr');
        const celula = document.createElement('td');

        celula.colSpan = 6;
        celula.textContent = 'Nenhuma movimentação registrada.';

        linha.appendChild(celula);
        listaMovimentacoes.appendChild(linha);

        return;
    }

    movimentacoes.forEach(movimentacao => {
        const linha = document.createElement('tr');

        const data = new Date(movimentacao.data_movimentacao);

        const dataFormatada = data.toLocaleString('pt-BR');

        const informacoes = [
            movimentacao.nome_produto,
            movimentacao.tipo_movimentacao,
            movimentacao.quantidade_movimentacao,
            dataFormatada,
            movimentacao.nome_funcionario || 'Não informado',
            movimentacao.observacao_movimentacao || 'Sem observação'
        ];

        informacoes.forEach(informacao => {
            const celula = document.createElement('td');
            celula.textContent = informacao;
            linha.appendChild(celula);
        });

        listaMovimentacoes.appendChild(linha);
    });
}

// Atualizar os indicadores
function atualizarResumo() {
    totalProdutos.textContent = produtos.length;

    produtosEstoqueBaixo.textContent = produtos.filter(
        produto => Number(produto.quantidade_estoque_produto) > 0 &&
            Number(produto.quantidade_estoque_produto) <= 5
    ).length;

    produtosSemEstoque.textContent = produtos.filter(
        produto => Number(produto.quantidade_estoque_produto) === 0
    ).length;
}

// Exibir produtos
function exibirProdutos(lista) {
    listaProdutos.innerHTML = '';

    if (lista.length === 0) {
        listaProdutos.textContent = 'Nenhum produto encontrado.';
        return;
    }

    lista.forEach(produto => {
        const item = document.createElement('div');
        item.classList.add('produto-estoque');

        item.innerHTML = `
            <div>
                <h3>${produto.nome_produto}</h3>
                <p>Código: ${produto.id_produto}</p>
            </div>

            <div>
                <p>Quantidade em estoque</p>
                <strong>${produto.quantidade_estoque_produto}</strong>
            </div>
        `;

        listaProdutos.appendChild(item);
    });
}


// Aplicar pesquisa e filtros
function filtrarProdutos() {
    const pesquisa = pesquisaProduto.value.toLowerCase().trim();
    const filtro = filtroEstoque.value;

    let produtosFiltrados = produtos.filter(produto => {
        const nome = produto.nome_produto.toLowerCase();
        const codigo = String(produto.id_produto);

        const correspondePesquisa =
            nome.includes(pesquisa) || codigo.includes(pesquisa);

        const quantidade = Number(produto.quantidade_estoque_produto);

        let correspondeFiltro = true;

        if (filtro === 'baixo') {
            correspondeFiltro = quantidade > 0 && quantidade <= 5;
        }

        if (filtro === 'zerado') {
            correspondeFiltro = quantidade === 0;
        }

        return correspondePesquisa && correspondeFiltro;
    });

    exibirProdutos(produtosFiltrados);
}

// Eventos dos campos
pesquisaProduto.addEventListener('input', filtrarProdutos);
filtroEstoque.addEventListener('change', filtrarProdutos);


// Registrar entrada ou saída de produtos
async function registrarMovimentacao(event, tipo) {
    event.preventDefault();

    const ehEntrada = tipo === 'entrada';

    const campoProduto = ehEntrada ? produtoEntrada : produtoSaida;
    const campoQuantidade = document.getElementById(
        ehEntrada ? 'quantidade-entrada' : 'quantidade-saida'
    );
    const campoObservacao = document.getElementById(
        ehEntrada ? 'observacao-entrada' : 'observacao-saida'
    );

    const dados = {
        produto_id: Number(campoProduto.value),
        quantidade: Number(campoQuantidade.value),
        observacao: campoObservacao.value.trim()
    };

    if (!dados.produto_id || !Number.isInteger(dados.quantidade) || dados.quantidade <= 0) {
        alert('Selecione um produto e informe uma quantidade válida.');
        return;
    }

    try {
        const resposta = await fetch(`${URL_API}/api/estoque/${tipo}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify(dados)
        });

        const resultado = await resposta.json();

        if (!resposta.ok || !resultado.sucesso) {
            throw new Error(resultado.mensagem || 'Não foi possível registrar a movimentação.');
        }

        alert(resultado.mensagem);

        // Limpar o formulário
        event.target.reset();

        // Atualizar produtos e quantidades na página
        await listarProdutos();
        await listarMovimentacoes();

    } catch (erro) {
        console.error(`Erro ao registrar ${tipo}:`, erro);
        alert(erro.message);
    }
}

// Eventos dos formulários
document.getElementById('form-entrada').addEventListener('submit', (event) => {
    registrarMovimentacao(event, 'entrada');
});

document.getElementById('form-saida').addEventListener('submit', (event) => {
    registrarMovimentacao(event, 'saida');
});

