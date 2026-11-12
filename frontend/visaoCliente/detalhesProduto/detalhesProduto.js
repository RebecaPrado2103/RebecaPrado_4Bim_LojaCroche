// Identifica o ID do produto presente na URL
const parametros = new URLSearchParams(window.location.search);
const idProduto = parametros.get('id');

// Busca os detalhes do produto no banco de dados
async function carregarDetalhesProduto() {

    const conteudo = document.getElementById('conteudo-produto');

    try {

        const resposta = await fetch(
            `http://localhost:3001/api/produtos/${idProduto}`
        );

        const dados = await resposta.json();

        if (!resposta.ok || !dados.sucesso) {
            throw new Error(dados.mensagem || 'Produto não encontrado.');
        }

        const produto = dados.produto;

        // Cria a área de informações do produto
        conteudo.innerHTML = `
            <div class="produto-detalhe-card">

                <div class="produto-detalhe-imagem">
                    Foto do produto
                </div>

                <div class="produto-detalhe-informacoes">

                    <p class="produto-detalhe-categoria">
                        ${produto.categoria_produto}
                    </p>

                    <h1>${produto.nome_produto}</h1>

                    <p class="produto-detalhe-preco">
                        ${Number(produto.preco_unitario_produto).toLocaleString(
                            'pt-BR',
                            { style: 'currency', currency: 'BRL' }
                        )}
                    </p>

                    <p class="produto-detalhe-estoque">
                        ${produto.quantidade_estoque_produto} unidades disponíveis
                    </p>

                    <div class="produto-detalhe-quantidade">
                        <label for="quantidade">Quantidade:</label>

                        <input
                            type="number"
                            id="quantidade"
                            min="1"
                            max="${produto.quantidade_estoque_produto}"
                            value="1"
                        >
                    </div>

                    <button class="botao-adicionar-carrinho">
                        Adicionar ao carrinho
                    </button>

                </div>

            </div>
        `;

    } catch (error) {

        console.error('Erro:', error);

        conteudo.innerHTML = `
            <p class="mensagem-erro">
                ${error.message}
            </p>
        `;
    }
}

// Executa a função
carregarDetalhesProduto();