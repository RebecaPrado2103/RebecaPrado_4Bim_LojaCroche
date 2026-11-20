
const URL_API = 'http://127.0.0.1:3001';

const SILHUETA_URL = `${URL_API}/imagens/silhueta.png`;

// CONTROLE DAS OPERAÇÕES
let oQueEstaFazendo = '';
let produto = null;

// INICIALIZAÇÃO
async function inicializar() {
    bloquearAtributos(true);

    document.getElementById('inputId_produto').readOnly = false;

    visibilidadeDosBotoes('inline', 'none', 'none', 'none', 'none', 'none');

    await listar();
}

// CARREGAR A IMAGEM DO PRODUTO
function carregarImagem(id) {
    const imagem = document.getElementById('imgProduto');

    imagem.onerror = null;

    if (!id) {
        imagem.src = SILHUETA_URL;
        return;
    }

    imagem.onerror = () => {
        imagem.onerror = null;
        imagem.src = SILHUETA_URL;
    };

    imagem.src = `${URL_API}/imagens/produto/${id}.png?t=${Date.now()}`;
}

// SELECIONAR UMA IMAGEM
function acionarUpload() {

    console.log('Operação atual:', oQueEstaFazendo);

    if (
        oQueEstaFazendo !== 'inserindo' &&
        oQueEstaFazendo !== 'alterando'
    ) {
        mostrarAviso('Clique em Inserir ou Alterar primeiro para escolher uma imagem.');
        return;
    }

    document.getElementById('inputImagem').click();
}

// MOSTRAR A PRÉVIA DA IMAGEM
function previewImagem() {

    const arquivo = document.getElementById('inputImagem').files[0];

    if (!arquivo) {
        return;
    }

    if (arquivo.type !== 'image/png') {
        mostrarAviso('Selecione somente uma imagem PNG.');
        document.getElementById('inputImagem').value = '';
        return;
    }

    const url = URL.createObjectURL(arquivo);

    document.getElementById('imgProduto').src = url;

    mostrarAviso('Imagem selecionada! Clique em Salvar para continuar.');
}

// MOSTRAR AVISOS
function mostrarAviso(mensagem) {
    document.getElementById('divAviso').textContent = mensagem;
}


// LISTA DE PRODUTOS
let produtos = [];

// BUSCAR TODOS OS PRODUTOS
async function listar() {

    try {
        const resposta = await fetch(
            `${URL_API}/api/produtos/gerenciar/listar`,
            {
                method: 'GET',
                credentials: 'include'
            }
        );

        const dados = await resposta.json();

        if (!resposta.ok) {
            mostrarAviso(dados.mensagem || 'Erro ao carregar produtos.');
            return;
        }

        produtos = dados.produtos;

        exibirProdutos();

    } catch (erro) {
        console.error('Erro ao listar produtos:', erro);
        mostrarAviso('Não foi possível carregar os produtos.');
    }
}

// EXIBIR OS PRODUTOS NA PÁGINA
function exibirProdutos() {

    const saida = document.getElementById('outputSaida');

    saida.innerHTML = '';

    if (produtos.length === 0) {
        saida.textContent = 'Nenhum produto cadastrado.';
        return;
    }

    produtos.forEach((item) => {

        const div = document.createElement('div');

        div.classList.add('produto-item');

        div.innerHTML = `
            <h4>${item.nome_produto}</h4>
            <p>ID: ${item.id_produto}</p>
            <p>Categoria: ${item.categoria_produto || 'Sem categoria'}</p>
            <p>Preço: R$ ${Number(item.preco_unitario_produto).toFixed(2)}</p>
            <p>Estoque: ${item.quantidade_estoque_produto}</p>
            <p>Status: ${item.ativo_produto ? 'Ativo' : 'Inativo'}</p>
        `;

        saida.appendChild(div);
    });
}


// PROCURAR PRODUTO PELO ID
function procure() {

    const campoId = document.getElementById('inputId_produto');
    const idDigitado = campoId.value.trim();
    const id = Number(idDigitado);

    if (!Number.isInteger(id) || id <= 0) {

        voltarAoInicio('Informe um ID válido.');

        return;
    }

    const encontrado = produtos.find(
        item => Number(item.id_produto) === id
    );

    if (!encontrado) {

        produto = null;

        limparAtributos();

        campoId.value = idDigitado;
        campoId.readOnly = false;

        carregarImagem(null);

        bloquearAtributos(true);

        visibilidadeDosBotoes('inline', 'inline', 'none', 'none', 'none', 'none');

        mostrarAviso('Produto não encontrado.');

        return;
    }

    produto = encontrado;

    mostrarDadosProduto(produto);

    bloquearAtributos(true);

    carregarImagem(produto.id_produto);

    if (produto.ativo_produto) {
        visibilidadeDosBotoes('inline', 'none', 'inline', 'inline', 'none', 'none');
    } else {
        visibilidadeDosBotoes('inline', 'none', 'none', 'none', 'inline', 'none');
    }

    mostrarAviso('Produto encontrado com sucesso!');
}

// PREENCHER O FORMULÁRIO COM OS DADOS
function mostrarDadosProduto(item) {

    document.getElementById('inputId_produto').value =
        item.id_produto;

    document.getElementById('inputNome_produto').value =
        item.nome_produto;

    document.getElementById('inputQuantidade_produto').value =
        item.quantidade_estoque_produto;

    document.getElementById('inputPreco_produto').value =
        item.preco_unitario_produto;

    document.getElementById('inputCategoria_produto').value =
        item.categoria_produto || '';

    document.getElementById('inputDestaque_produto').checked =
        item.destaque_produto;
}

// BLOQUEAR OU LIBERAR OS CAMPOS DO FORMULÁRIO
function bloquearAtributos(bloquear) {

    document.getElementById('inputNome_produto').readOnly = bloquear;

    document.getElementById('inputQuantidade_produto').readOnly = bloquear;

    document.getElementById('inputPreco_produto').readOnly = bloquear;

    document.getElementById('inputCategoria_produto').readOnly = bloquear;

    document.getElementById('inputDestaque_produto').disabled = bloquear;

    document.getElementById('inputImagem').disabled = bloquear;
}

// CONTROLAR A VISIBILIDADE DOS BOTÕES
function visibilidadeDosBotoes(procure, inserir, alterar, desativar, reativar, salvar) {

    document.getElementById('btProcure').style.display = procure;
    document.getElementById('btInserir').style.display = inserir;
    document.getElementById('btAlterar').style.display = alterar;
    document.getElementById('btDesativar').style.display = desativar;
    document.getElementById('btReativar').style.display = reativar;
    document.getElementById('btSalvar').style.display = salvar;

    document.getElementById('btCancelar').style.display =
        salvar === 'inline' ? 'inline' : 'none';
}


// PREPARAR O CADASTRO DE UM NOVO PRODUTO
function inserir() {

    oQueEstaFazendo = 'inserindo';

    produto = null;

    limparAtributos();

    bloquearAtributos(false);

    document.getElementById('inputId_produto').readOnly = true;

    carregarImagem(null);

    visibilidadeDosBotoes('none', 'none', 'none', 'none', 'none', 'inline');

    mostrarAviso('Preencha os dados do novo produto e selecione uma imagem PNG.');
}


// LIMPAR OS CAMPOS DO FORMULÁRIO
function limparAtributos() {

    document.getElementById('inputId_produto').value = '';

    document.getElementById('inputNome_produto').value = '';

    document.getElementById('inputQuantidade_produto').value = '';

    document.getElementById('inputPreco_produto').value = '';

    document.getElementById('inputCategoria_produto').value = '';

    document.getElementById('inputDestaque_produto').checked = false;

    document.getElementById('inputImagem').value = '';
}

// RETORNAR A PÁGINA AO ESTADO INICIAL
function voltarAoInicio(mensagem) {

    oQueEstaFazendo = '';
    produto = null;

    limparAtributos();

    document.getElementById('inputId_produto').readOnly = false;

    carregarImagem(null);

    bloquearAtributos(true);

    visibilidadeDosBotoes('inline', 'none', 'none', 'none', 'none', 'none');

    mostrarAviso(mensagem);
}


// PREPARAR A ALTERAÇÃO DE UM PRODUTO
function alterar() {

    if (!produto) {
        mostrarAviso('Primeiro procure um produto para alterar.');
        return;
    }

    oQueEstaFazendo = 'alterando';

    bloquearAtributos(false);

    document.getElementById('inputId_produto').readOnly = true;

    visibilidadeDosBotoes('none', 'none', 'none', 'none', 'none', 'inline');

    mostrarAviso('Altere os dados desejados e clique em Salvar.');
}


// DESATIVAR UM PRODUTO
async function desativar() {

    if (!produto) {
        mostrarAviso('Primeiro procure um produto para desativar.');
        return;
    }

    const confirmar = confirm(
        `Deseja realmente desativar o produto "${produto.nome_produto}"?`
    );

    if (!confirmar) {
        return;
    }

    try {
        const resposta = await fetch(
            `${URL_API}/api/produtos/gerenciar/desativar/${produto.id_produto}`,
            {
                method: 'PATCH',
                credentials: 'include'
            }
        );

        const dados = await resposta.json();

        if (!resposta.ok) {
            mostrarAviso(dados.mensagem || 'Não foi possível desativar o produto.');
            return;
        }

        await listar();

        voltarAoInicio('Produto desativado com sucesso!');

    } catch (erro) {
        console.error('Erro ao desativar produto:', erro);
        mostrarAviso('Não foi possível concluir a operação.');
    }
}

// REATIVAR UM PRODUTO
async function reativar() {
    if (!produto) {
        mostrarAviso('Nenhum produto selecionado.');
        return;
    }

    try {
        const resposta = await fetch(
            `${URL_API}/api/produtos/gerenciar/reativar/${produto.id_produto}`,
            {
                method: 'PATCH',
                credentials: 'include'
            }
        );

        const dados = await resposta.json();

        if (!resposta.ok) {
            mostrarAviso(dados.mensagem || 'Não foi possível reativar o produto.');
            return;
        }

        await listar();
        voltarAoInicio('Produto reativado com sucesso!');

    } catch (erro) {
        console.error('Erro ao reativar produto:', erro);
        mostrarAviso('Erro ao conectar com o servidor.');
    }
}

// CONECTAR OS BOTÕES ÀS FUNÇÕES

document.getElementById('btProcure').addEventListener('click', procure);

document.getElementById('btInserir').addEventListener('click', inserir);

document.getElementById('btAlterar').addEventListener('click', alterar);

document.getElementById('btDesativar').addEventListener('click', desativar);

document.getElementById('imgProduto').addEventListener('click', acionarUpload);

document.getElementById('inputImagem').addEventListener('change', previewImagem);

document.getElementById('btSalvar').addEventListener('click', salvar);

document.getElementById('btCancelar').addEventListener('click', cancelarOperacao);

document.getElementById('btReativar').addEventListener('click', reativar);


// SALVAR UM NOVO PRODUTO
async function salvar() {

    if (oQueEstaFazendo === 'alterando') {
        await salvarAlteracao();
        return;
    }

    if (oQueEstaFazendo !== 'inserindo') {
        mostrarAviso('Nenhuma operação foi selecionada.');
        return;
    }

    const nome = document.getElementById('inputNome_produto').value.trim();
    const quantidade = document.getElementById('inputQuantidade_produto').value;
    const preco = document.getElementById('inputPreco_produto').value;
    const categoria = document.getElementById('inputCategoria_produto').value.trim();
    const destaque = document.getElementById('inputDestaque_produto').checked;
    const imagem = document.getElementById('inputImagem').files[0];

    if (!nome || quantidade === '' || preco === '') {
        mostrarAviso('Preencha todos os campos obrigatórios.');
        return;
    }

    const formulario = new FormData();

    formulario.append('nome_produto', nome);
    formulario.append('quantidade_estoque_produto', quantidade);
    formulario.append('preco_unitario_produto', preco);
    formulario.append('categoria_produto', categoria);
    formulario.append('destaque_produto', destaque);
    if (imagem) {
        formulario.append('imagem', imagem);
    }

    try {
        const resposta = await fetch(
            `${URL_API}/api/produtos/gerenciar/cadastrar`,
            {
                method: 'POST',
                credentials: 'include',
                body: formulario
            }
        );

        const dados = await resposta.json();

        if (!resposta.ok) {
            mostrarAviso(dados.mensagem || 'Não foi possível cadastrar o produto.');
            return;
        }

        mostrarAviso(dados.mensagem);

        await listar();

        voltarAoInicio('Produto cadastrado com sucesso!');

    } catch (erro) {
        console.error('Erro ao cadastrar produto:', erro);
        mostrarAviso('Não foi possível cadastrar o produto.');
    }
}


// ALTERAR UM PRODUTO
async function salvarAlteracao() {

    if (!produto) {
        mostrarAviso('Primeiro procure um produto.');
        return;
    }

    const nome = document.getElementById('inputNome_produto').value.trim();
    const quantidade = document.getElementById('inputQuantidade_produto').value;
    const preco = document.getElementById('inputPreco_produto').value;
    const categoria = document.getElementById('inputCategoria_produto').value.trim();
    const destaque = document.getElementById('inputDestaque_produto').checked;
    const imagem = document.getElementById('inputImagem').files[0];

    if (!nome || quantidade === '' || preco === '') {
        mostrarAviso('Preencha todos os campos obrigatórios.');
        return;
    }

    const formulario = new FormData();

    formulario.append('nome_produto', nome);
    formulario.append('quantidade_estoque_produto', quantidade);
    formulario.append('preco_unitario_produto', preco);
    formulario.append('categoria_produto', categoria);
    formulario.append('destaque_produto', destaque);

    if (imagem) {
        formulario.append('imagem', imagem);
    }

    try {
        const resposta = await fetch(
            `${URL_API}/api/produtos/gerenciar/alterar/${produto.id_produto}`,
            {
                method: 'PUT',
                credentials: 'include',
                body: formulario
            }
        );

        const dados = await resposta.json();

        if (!resposta.ok) {
            mostrarAviso(dados.mensagem || 'Não foi possível alterar o produto.');
            return;
        }

        mostrarAviso(dados.mensagem);

        await listar();

        voltarAoInicio('Produto alterado com sucesso!');

    } catch (erro) {
        console.error('Erro ao alterar produto:', erro);
        mostrarAviso('Não foi possível concluir a alteração.');
    }
}

// CANCELAR A OPERAÇÃO ATUAL
async function cancelarOperacao() {

    voltarAoInicio('Operação cancelada.');

    await listar();
}
