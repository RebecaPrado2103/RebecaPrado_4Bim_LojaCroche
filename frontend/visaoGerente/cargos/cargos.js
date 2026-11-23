const API = 'http://127.0.0.1:3001/api/cargos';

// ELEMENTOS DA PÁGINA
const filtroStatus = document.getElementById('filtro-status');
const botaoNovoCargo = document.getElementById('botao-novo-cargo');
const containerCargos = document.getElementById('container-cargos');
const quantidadeCargos = document.getElementById('quantidade-cargos');

const areaFormulario = document.getElementById('area-formulario');
const formularioCargo = document.getElementById('formulario-cargo');
const tituloFormulario = document.getElementById('titulo-formulario');
const campoNomeCargo = document.getElementById('nome-cargo');
const fecharFormulario = document.getElementById('fechar-formulario');
const cancelarFormulario = document.getElementById('cancelar-formulario');

const areaPermissoes = document.getElementById('area-permissoes');
const tituloPermissoes = document.getElementById('titulo-permissoes');
const containerPermissoes = document.getElementById('container-permissoes');
const salvarPermissoes = document.getElementById('salvar-permissoes');
const fecharPermissoes = document.getElementById('fechar-permissoes');

// ESTADO DA PÁGINA
let cargos = [];
let cargoEditando = null;
let cargoSelecionadoPermissoes = null;
let permissoesCarregadas = [];

// NOMES DAS CATEGORIAS DE PERMISSÕES
const categoriasPermissoes = {
    produtos: 'Produtos',
    estoque: 'Estoque',
    pedidos: 'Pedidos',
    clientes: 'Clientes',
    funcionarios: 'Funcionários',
    formas_pagamento: 'Formas de pagamento',
    devolucoes: 'Devoluções',
    cargos: 'Cargos'
};

// AGRUPAR AS PERMISSÕES POR CATEGORIA
function identificarCategoria(codigo) {
    if (codigo.startsWith('formas_pagamento_')) {
        return 'formas_pagamento';
    }

    return codigo.split('_')[0];
}

// REQUISIÇÕES AO BACKEND
async function requisicao(url, opcoes = {}) {
    const resposta = await fetch(url, {
        ...opcoes,
        credentials: 'include',
        headers: {
            ...(opcoes.body ? { 'Content-Type': 'application/json' } : {}),
            ...opcoes.headers
        }
    });

    const dados = await resposta.json();

    if (!resposta.ok) {
        throw new Error(dados.mensagem || 'Não foi possível realizar a operação.');
    }

    return dados;
}

// CARREGAR CARGOS
async function carregarCargos() {
    try {
        containerCargos.textContent = 'Carregando cargos...';

        const dados = await requisicao(`${API}/gerenciar/listar`);

        cargos = dados.cargos;

        renderizarCargos();

    } catch (error) {
        console.error('Erro ao carregar cargos:', error);
        containerCargos.textContent = error.message;
    }
}

// RENDERIZAR OS CARGOS
function renderizarCargos() {
    const filtro = filtroStatus.value;

    let cargosFiltrados = cargos;

    if (filtro === 'ativos') {
        cargosFiltrados = cargos.filter(cargo => cargo.ativo_cargo);
    }

    if (filtro === 'inativos') {
        cargosFiltrados = cargos.filter(cargo => !cargo.ativo_cargo);
    }

    quantidadeCargos.textContent =
        `${cargosFiltrados.length} ${cargosFiltrados.length === 1 ? 'cargo' : 'cargos'}`;

    containerCargos.replaceChildren();

    if (cargosFiltrados.length === 0) {
        const mensagem = document.createElement('p');
        mensagem.className = 'carregando';
        mensagem.textContent = 'Nenhum cargo encontrado.';
        containerCargos.appendChild(mensagem);
        return;
    }

    cargosFiltrados.forEach(cargo => {
        const cartao = document.createElement('article');
        cartao.className = 'cargo-card';

        const informacoes = document.createElement('div');
        informacoes.className = 'cargo-informacoes';

        const nome = document.createElement('h4');
        nome.textContent = cargo.nome_cargo;

        const status = document.createElement('span');
        status.className = cargo.ativo_cargo ? 'status ativo' : 'status inativo';
        status.textContent = cargo.ativo_cargo ? 'Ativo' : 'Desativado';

        const quantidade = document.createElement('p');
        quantidade.textContent =
            `${cargo.funcionarios_ativos} ${Number(cargo.funcionarios_ativos) === 1 ? 'funcionário ativo' : 'funcionários ativos'}`;

        informacoes.append(nome, status, quantidade);

        const botoes = document.createElement('div');
        botoes.className = 'cargo-acoes';

        if (Number(cargo.id_cargo) !== 1) {
            const botaoEditar = criarBotao('Editar', 'botao-secundario');
            botaoEditar.addEventListener('click', () => abrirEdicao(cargo));

            botoes.appendChild(botaoEditar);
        }

        if (cargo.ativo_cargo) {
            const botaoPermissoes = criarBotao('Permissões', 'botao-secundario');

            botaoPermissoes.addEventListener('click', () => {
                abrirPermissoes(cargo);
            });

            botoes.appendChild(botaoPermissoes);

            if (Number(cargo.id_cargo) !== 1) {
                const botaoDesativar = criarBotao('Desativar', 'botao-perigo');

                botaoDesativar.addEventListener('click', () => {
                    desativarCargo(cargo);
                });

                botoes.appendChild(botaoDesativar);
            }

        } else {
            const botaoReativar = criarBotao('Reativar', 'botao-secundario');

            botaoReativar.addEventListener('click', () => {
                reativarCargo(cargo);
            });

            botoes.appendChild(botaoReativar);
        }

        cartao.append(informacoes, botoes);
        containerCargos.appendChild(cartao);
    });
}

// CRIAR BOTÕES
function criarBotao(texto, classe) {
    const botao = document.createElement('button');

    botao.type = 'button';
    botao.textContent = texto;
    botao.className = classe;

    return botao;
}

// ABRIR FORMULÁRIO DE CADASTRO
function abrirCadastro() {
    cargoEditando = null;

    tituloFormulario.textContent = 'Novo cargo';
    campoNomeCargo.value = '';

    areaPermissoes.hidden = true;
    areaFormulario.hidden = false;

    campoNomeCargo.focus();
}

// ABRIR FORMULÁRIO DE EDIÇÃO
function abrirEdicao(cargo) {
    cargoEditando = cargo.id_cargo;

    tituloFormulario.textContent = 'Editar cargo';
    campoNomeCargo.value = cargo.nome_cargo;

    areaPermissoes.hidden = true;
    areaFormulario.hidden = false;

    campoNomeCargo.focus();
}

// FECHAR FORMULÁRIO
function fecharAreaFormulario() {
    areaFormulario.hidden = true;
    formularioCargo.reset();
    cargoEditando = null;
}

// SALVAR CADASTRO OU EDIÇÃO
async function salvarCargo(event) {
    event.preventDefault();

    const nome = campoNomeCargo.value.trim();

    if (!nome) {
        alert('Informe o nome do cargo.');
        return;
    }

    const editando = cargoEditando !== null;

    const url = editando
        ? `${API}/gerenciar/${cargoEditando}`
        : `${API}/gerenciar/cadastrar`;

    try {
        await requisicao(url, {
            method: editando ? 'PUT' : 'POST',
            body: JSON.stringify({
                nome_cargo: nome
            })
        });

        alert(editando
            ? 'Cargo atualizado com sucesso!'
            : 'Cargo cadastrado com sucesso!');

        fecharAreaFormulario();
        await carregarCargos();

    } catch (error) {
        alert(error.message);
    }
}

// DESATIVAR CARGO
async function desativarCargo(cargo) {
    const confirmar = confirm(
        `Deseja realmente desativar o cargo "${cargo.nome_cargo}"?`
    );

    if (!confirmar) return;

    try {
        const dados = await requisicao(
            `${API}/gerenciar/${cargo.id_cargo}/desativar`,
            { method: 'PATCH' }
        );

        alert(dados.mensagem);
        await carregarCargos();

    } catch (error) {
        alert(error.message);
    }
}

// REATIVAR CARGO
async function reativarCargo(cargo) {
    const confirmar = confirm(
        `Deseja reativar o cargo "${cargo.nome_cargo}"?`
    );

    if (!confirmar) return;

    try {
        const dados = await requisicao(
            `${API}/gerenciar/${cargo.id_cargo}/reativar`,
            { method: 'PATCH' }
        );

        alert(dados.mensagem);
        await carregarCargos();

    } catch (error) {
        alert(error.message);
    }
}

// ABRIR PERMISSÕES
async function abrirPermissoes(cargo) {
    if (Number(cargo.id_cargo) === 1) {
        alert('O cargo Gerente possui todas as permissões.');
        return;
    }

    cargoSelecionadoPermissoes = cargo.id_cargo;

    tituloPermissoes.textContent = `Permissões: ${cargo.nome_cargo}`;

    areaFormulario.hidden = true;
    areaPermissoes.hidden = false;

    containerPermissoes.textContent = 'Carregando permissões...';

    try {
        const dados = await requisicao(
            `${API}/gerenciar/${cargo.id_cargo}/permissoes`
        );

        permissoesCarregadas = dados.permissoes;

        renderizarPermissoes();

    } catch (error) {
        containerPermissoes.textContent = error.message;
    }
}

// MOSTRAR PERMISSÕES AGRUPADAS
function renderizarPermissoes() {
    containerPermissoes.replaceChildren();

    const grupos = {};

    permissoesCarregadas.forEach(permissao => {
        const categoria = identificarCategoria(
            permissao.codigo_permissao
        );

        if (!grupos[categoria]) {
            grupos[categoria] = [];
        }

        grupos[categoria].push(permissao);
    });

    Object.entries(grupos).forEach(([categoria, permissoes]) => {
        const grupo = document.createElement('section');
        grupo.className = 'grupo-permissoes';

        const titulo = document.createElement('h4');
        titulo.textContent =
            categoriasPermissoes[categoria] || categoria;

        grupo.appendChild(titulo);

        permissoes.forEach(permissao => {
            const linha = document.createElement('label');
            linha.className = 'permissao-item';

            const checkbox = document.createElement('input');

            checkbox.type = 'checkbox';
            checkbox.value = permissao.id_permissao;
            checkbox.checked = permissao.selecionada;
            checkbox.className = 'checkbox-permissao';

            const descricao = document.createElement('span');
            descricao.textContent = permissao.descricao_permissao;

            linha.append(checkbox, descricao);
            grupo.appendChild(linha);
        });

        containerPermissoes.appendChild(grupo);
    });
}

// SALVAR PERMISSÕES
async function salvarPermissoesCargo() {
    if (cargoSelecionadoPermissoes === null) return;

    const caixasMarcadas = containerPermissoes.querySelectorAll(
        '.checkbox-permissao:checked'
    );

    const idsPermissoes = Array.from(caixasMarcadas).map(
        checkbox => Number(checkbox.value)
    );

    try {
        const dados = await requisicao(
            `${API}/gerenciar/${cargoSelecionadoPermissoes}/permissoes`,
            {
                method: 'PUT',
                body: JSON.stringify({
                    permissoes: idsPermissoes
                })
            }
        );

        alert(dados.mensagem);

        // ATUALIZAR A LISTA DE PERMISSÕES
        await abrirPermissoes(
            cargos.find(cargo =>
                Number(cargo.id_cargo) === Number(cargoSelecionadoPermissoes)
            )
        );

    } catch (error) {
        alert(error.message);
    }
}

// FECHAR ÁREA DE PERMISSÕES
function fecharAreaPermissoes() {
    areaPermissoes.hidden = true;
    cargoSelecionadoPermissoes = null;
    permissoesCarregadas = [];
}

// EVENTOS
botaoNovoCargo.addEventListener('click', abrirCadastro);

formularioCargo.addEventListener('submit', salvarCargo);

fecharFormulario.addEventListener('click', fecharAreaFormulario);
cancelarFormulario.addEventListener('click', fecharAreaFormulario);

fecharPermissoes.addEventListener('click', fecharAreaPermissoes);

filtroStatus.addEventListener('change', renderizarCargos);

salvarPermissoes.addEventListener('click', salvarPermissoesCargo);

// INICIAR A PÁGINA
carregarCargos();
