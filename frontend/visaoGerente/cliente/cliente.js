
// ENDEREÇO DA API
const URL_API = 'http://127.0.0.1:3001';

// ELEMENTOS DA PÁGINA
const listaClientes = document.getElementById('lista-clientes');
const totalClientes = document.getElementById('total-clientes');
const campoPesquisa = document.getElementById('pesquisa-cliente');

// ELEMENTOS DO FORMULÁRIO DE CADASTRO
const botaoAbrirFormulario = document.getElementById('abrir-formulario-cliente');
const secaoFormulario = document.getElementById('formulario-cliente');
const botaoCancelarCadastro = document.getElementById('cancelar-cadastro-cliente');
const formularioCadastro = document.getElementById('form-cadastro-cliente');
const mensagemCadastro = document.getElementById('mensagem-cadastro-cliente');

// ARMAZENAR OS CLIENTES CARREGADOS
let clientes = [];

// CARREGAR TODOS OS CLIENTES
async function carregarClientes() {

    try {

        listaClientes.innerHTML = `
            <tr>
                <td colspan="5">Carregando clientes...</td>
            </tr>
        `;

        const resposta = await fetch(
            `${URL_API}/api/clientes/gerenciar/listar`,
            {
                method: 'GET',
                credentials: 'include'
            }
        );

        const dados = await resposta.json();

        if (!resposta.ok) {
            throw new Error(
                dados.mensagem || 'Não foi possível carregar os clientes.'
            );
        }

        clientes = dados.clientes;

        totalClientes.textContent =
            `${clientes.length} clientes`;

        // MOSTRAR OS CLIENTES NA TABELA
        mostrarClientes(clientes);

    } catch (erro) {

        console.error('Erro ao carregar clientes:', erro);

        listaClientes.innerHTML = `
            <tr>
                <td colspan="5">
                    ${erro.message}
                </td>
            </tr>
        `;

    }

}

// MOSTRAR CLIENTES NA TABELA
function mostrarClientes(lista) {

    listaClientes.innerHTML = lista.map(cliente => {

        const dataCadastro = new Date(
            cliente.data_cadastro_cliente
        ).toLocaleDateString('pt-BR');

        return `
            <tr>
                <td>${cliente.nome_pessoa}</td>
                <td>${cliente.cpf_pessoa}</td>
                <td>${cliente.email_pessoa}</td>
                <td>${dataCadastro}</td>
                <td>
                    <button
                        type="button"
                        class="botao-detalhes"
                        data-cpf="${cliente.cpf_pessoa}"
                    >
                        Ver detalhes
                    </button>
                </td>
            </tr>
        `;

    }).join('');

    if (lista.length === 0) {
        listaClientes.innerHTML = `
            <tr>
                <td colspan="5">Nenhum cliente encontrado.</td>
            </tr>
        `;
    }
}

// PESQUISAR CLIENTES POR NOME OU CPF
campoPesquisa.addEventListener('input', () => {

    const pesquisa = campoPesquisa.value.toLowerCase().trim();

    const clientesFiltrados = clientes.filter(cliente => {

        const nome = cliente.nome_pessoa.toLowerCase();
        const cpf = cliente.cpf_pessoa;

        return nome.includes(pesquisa) || cpf.includes(pesquisa);

    });

    mostrarClientes(clientesFiltrados);

});

// IDENTIFICAR O CLIQUE NO BOTÃO DE DETALHES
listaClientes.addEventListener('click', (evento) => {

    const botao = evento.target.closest('.botao-detalhes');

    if (!botao) {
        return;
    }

    const cpf = botao.dataset.cpf;

    visualizarDetalhesCliente(cpf);

});

// VISUALIZAR DETALHES DO CLIENTE
async function visualizarDetalhesCliente(cpf) {

    const secaoDetalhes = document.getElementById('detalhes-cliente');
    const conteudoDetalhes = document.getElementById('conteudo-detalhes-cliente');

    try {

        conteudoDetalhes.innerHTML = '<p>Carregando detalhes...</p>';
        secaoDetalhes.hidden = false;

        const resposta = await fetch(
            `${URL_API}/api/clientes/gerenciar/${cpf}`,
            {
                method: 'GET',
                credentials: 'include'
            }
        );

        const dados = await resposta.json();

        if (!resposta.ok) {
            throw new Error(
                dados.mensagem || 'Não foi possível carregar os detalhes.'
            );
        }

        const cliente = dados.cliente;
        const pedidos = dados.pedidos;

        const dataNascimento = new Date(
            cliente.data_nascimento_pessoa
        ).toLocaleDateString('pt-BR');

        const dataCadastro = new Date(
            cliente.data_cadastro_cliente
        ).toLocaleDateString('pt-BR');

        conteudoDetalhes.innerHTML = `
            <div class="informacoes-cliente">

                <p><strong>Nome:</strong> ${cliente.nome_pessoa}</p>
                <p><strong>CPF:</strong> ${cliente.cpf_pessoa}</p>
                <p><strong>E-mail:</strong> ${cliente.email_pessoa}</p>
                <p><strong>Data de nascimento:</strong> ${dataNascimento}</p>
                <p><strong>Endereço:</strong> ${cliente.endereco_pessoa}</p>
                <p><strong>Data de cadastro:</strong> ${dataCadastro}</p>

            </div>

            <div class="historico-pedidos">

                <h4>Histórico de pedidos</h4>

                ${
                    pedidos.length === 0
                    ? '<p>Este cliente ainda não possui pedidos.</p>'
                    : `
                        <table>
                            <thead>
                                <tr>
                                    <th>Pedido</th>
                                    <th>Data</th>
                                    <th>Valor</th>
                                    <th>Status</th>
                                </tr>
                            </thead>

                            <tbody>
                                ${pedidos.map(pedido => `
                                    <tr>
                                        <td>#${pedido.id_pedido}</td>
                                        <td>${new Date(pedido.data_pedido).toLocaleDateString('pt-BR')}</td>
                                        <td>${Number(pedido.valor_total).toLocaleString('pt-BR', {
                                            style: 'currency',
                                            currency: 'BRL'
                                        })}</td>
                                        <td>${pedido.status_pedido}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    `
                }

            </div>
        `;

        secaoDetalhes.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
        });

    } catch (erro) {

        console.error('Erro ao visualizar detalhes:', erro);

        conteudoDetalhes.innerHTML = `
            <p>${erro.message}</p>
        `;

    }

}

// ABRIR FORMULÁRIO DE CADASTRO
botaoAbrirFormulario.addEventListener('click', () => {

    secaoFormulario.hidden = false;

    secaoFormulario.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
    });

});

// CANCELAR CADASTRO
botaoCancelarCadastro.addEventListener('click', () => {

    secaoFormulario.hidden = true;

});

// CADASTRAR CLIENTE PELA VISÃO DO GERENTE
formularioCadastro.addEventListener('submit', async (evento) => {

    evento.preventDefault();

    mensagemCadastro.textContent = 'Cadastrando cliente...';

    const cliente = {
        nome: document.getElementById('nome-cliente').value.trim(),
        cpf: document.getElementById('cpf-cliente').value.trim(),
        dataNascimento: document.getElementById('nascimento-cliente').value,
        email: document.getElementById('email-cliente').value.trim(),
        endereco: document.getElementById('endereco-cliente').value.trim(),
        senha: document.getElementById('senha-cliente').value
    };

    try {

        const resposta = await fetch(
            `${URL_API}/api/clientes/gerenciar/cadastrar`,
            {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(cliente)
            }
        );

        const dados = await resposta.json();

        if (!resposta.ok) {
            throw new Error(
                dados.mensagem || 'Não foi possível cadastrar o cliente.'
            );
        }

        mensagemCadastro.textContent = dados.mensagem;
        mensagemCadastro.style.color = '#56805c';

        formularioCadastro.reset();

        await carregarClientes();

    } catch (erro) {

        console.error('Erro ao cadastrar cliente:', erro);

        mensagemCadastro.textContent = erro.message;
        mensagemCadastro.style.color = '#b34f4f';

    }

});

// CARREGAR CLIENTES AO ABRIR A PÁGINA
carregarClientes();
