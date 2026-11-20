
// ELEMENTOS DA PÁGINA
const listaProdutos = document.getElementById('lista-produtos');
const botaoCadastrar = document.getElementById('botao-cadastrar');

// ELEMENTOS DO FORMULÁRIO
const formularioProduto = document.getElementById('formulario-produto');
const formCadastroProduto = document.getElementById('form-cadastro-produto');
const botaoCancelar = document.getElementById('botao-cancelar');


// ABRIR FORMULÁRIO DE CADASTRO
botaoCadastrar.addEventListener('click', function () {

    formularioProduto.hidden = false;

    formularioProduto.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
    });

});

// CANCELAR CADASTRO
botaoCancelar.addEventListener('click', function () {

    formCadastroProduto.reset();

    formularioProduto.hidden = true;

});

// BUSCAR OS PRODUTOS DO BANCO DE DADOS
async function carregarProdutos() {

    try {
        const resposta = await fetch(
            'http://127.0.0.1:3001/api/produtos/gerenciar/listar',
            {
                method: 'GET',
                credentials: 'include'
            }
        );

        const dados = await resposta.json();

        if (!resposta.ok || !dados.sucesso) {
            throw new Error(
                dados.mensagem || 'Não foi possível carregar os produtos.'
            );
        }

        exibirProdutos(dados.produtos);

    } catch (erro) {
        console.error('Erro ao carregar produtos:', erro);

        listaProdutos.textContent =
            'Não foi possível carregar os produtos.';
    }
}

// EXIBIR OS PRODUTOS NA PÁGINA
function exibirProdutos(produtos) {

    listaProdutos.innerHTML = '';

    if (produtos.length === 0) {
        listaProdutos.textContent =
            'Nenhum produto cadastrado.';
        return;
    }

    produtos.forEach(produto => {

        const item = document.createElement('div');
        item.classList.add('produto-item');

        const nome = document.createElement('h4');
        nome.textContent = produto.nome_produto;

        const preco = document.createElement('p');
        preco.textContent = Number(
            produto.preco_unitario_produto
        ).toLocaleString('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        });

        const estoque = document.createElement('p');
        estoque.textContent =
            `Estoque: ${produto.quantidade_estoque_produto}`;

        item.appendChild(nome);
        item.appendChild(preco);
        item.appendChild(estoque);

        listaProdutos.appendChild(item);
    });
}

// INICIALIZAÇÃO
carregarProdutos();
