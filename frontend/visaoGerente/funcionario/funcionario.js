
// ENDEREÇO DO SERVIDOR
const API = 'http://127.0.0.1:3001';

// ELEMENTOS DA PÁGINA
const listaFuncionarios = document.getElementById('lista-funcionarios');
const totalFuncionarios = document.getElementById('total-funcionarios');
const campoPesquisa = document.getElementById('pesquisa-funcionario');

// ELEMENTOS DOS DETALHES
const secaoDetalhes = document.getElementById('detalhes-funcionario');
const informacoesFuncionario = document.getElementById('informacoes-funcionario');
const botaoFecharDetalhes = document.getElementById('fechar-detalhes-funcionario');

// ELEMENTOS DO FORMULÁRIO DE EDIÇÃO
const secaoEdicao = document.getElementById('formulario-edicao-funcionario');
const formularioEdicao = document.getElementById('form-edicao-funcionario');
const botaoCancelarEdicao = document.getElementById('cancelar-edicao-funcionario');
const mensagemEdicao = document.getElementById('mensagem-edicao-funcionario');

// ARMAZENAR O CPF DO FUNCIONÁRIO SELECIONADO
let cpfFuncionarioEdicao = null;

// ELEMENTOS DO FORMULÁRIO
const botaoAbrirFormulario = document.getElementById('abrir-formulario-funcionario');
const secaoFormulario = document.getElementById('formulario-funcionario');
const formularioCadastro = document.getElementById('form-cadastro-funcionario');
const botaoCancelarCadastro = document.getElementById('cancelar-cadastro-funcionario');
const campoCargo = document.getElementById('cargo-funcionario');
const mensagemCadastro = document.getElementById('mensagem-cadastro-funcionario');

// ARMAZENAR FUNCIONÁRIOS
let funcionarios = [];

// CARREGAR FUNCIONÁRIOS
async function carregarFuncionarios() {

    try {

        const resposta = await fetch(
            `${API}/api/funcionarios/gerenciar/listar`,
            {
                credentials: 'include'
            }
        );

        const dados = await resposta.json();

        if (!resposta.ok) {
            throw new Error(dados.mensagem || 'Erro ao carregar funcionários.');
        }

        funcionarios = dados.funcionarios;

        totalFuncionarios.textContent = funcionarios.length;

        mostrarFuncionarios(funcionarios);

    } catch (erro) {

        console.error('Erro:', erro);

        listaFuncionarios.innerHTML = `
            <tr>
                <td colspan="5">
                    Não foi possível carregar os funcionários.
                </td>
            </tr>
        `;

    }

}

// MOSTRAR FUNCIONÁRIOS NA TABELA
function mostrarFuncionarios(lista) {

    listaFuncionarios.innerHTML = '';

    if (lista.length === 0) {

        listaFuncionarios.innerHTML = `
            <tr>
                <td colspan="6">
                    Nenhum funcionário encontrado.
                </td>
            </tr>
        `;

        return;
    }

    lista.forEach(funcionario => {

        const linha = document.createElement('tr');

        const nome = document.createElement('td');
        nome.textContent = funcionario.nome_pessoa;

        const cpf = document.createElement('td');
        cpf.textContent = funcionario.cpf_pessoa;

        const email = document.createElement('td');
        email.textContent = funcionario.email_pessoa;

        const cargo = document.createElement('td');
        cargo.textContent = funcionario.nome_cargo;

        // SITUAÇÃO DO FUNCIONÁRIO
        const situacao = document.createElement('td');

        situacao.textContent = funcionario.ativo_funcionario
            ? 'Ativo'
            : 'Inativo';

        situacao.classList.add(
            funcionario.ativo_funcionario
                ? 'situacao-ativa'
                : 'situacao-inativa'
        );

        const acoes = document.createElement('td');

        const botaoDetalhes = document.createElement('button');

        botaoDetalhes.textContent = 'Ver detalhes';
        botaoDetalhes.type = 'button';
        botaoDetalhes.classList.add('botao-detalhes');

        botaoDetalhes.addEventListener('click', () => {
            visualizarDetalhesFuncionario(funcionario.cpf_pessoa);
        });

        acoes.appendChild(botaoDetalhes);

        // BOTÃO PARA DESATIVAR FUNCIONÁRIO
        if (funcionario.ativo_funcionario && Number(funcionario.id_cargo) !== 1) {

            const botaoDesativar = document.createElement('button');

            botaoDesativar.textContent = 'Desativar';
            botaoDesativar.type = 'button';
            botaoDesativar.classList.add('botao-desativar');

            botaoDesativar.addEventListener('click', () => {
                desativarFuncionario(funcionario.cpf_pessoa);
            });

            acoes.appendChild(botaoDesativar);
        }

        // BOTÃO PARA REATIVAR FUNCIONÁRIO
        if (!funcionario.ativo_funcionario && Number(funcionario.id_cargo) !== 1) {

            const botaoReativar = document.createElement('button');

            botaoReativar.textContent = 'Reativar';
            botaoReativar.type = 'button';
            botaoReativar.classList.add('botao-reativar');

            botaoReativar.addEventListener('click', () => {
                reativarFuncionario(funcionario.cpf_pessoa);
            });

            acoes.appendChild(botaoReativar);
        }

        linha.append(nome, cpf, email, cargo, situacao, acoes);

        listaFuncionarios.appendChild(linha);

    });

}

// VISUALIZAR DETALHES DE UM FUNCIONÁRIO
async function visualizarDetalhesFuncionario(cpf) {

    try {

        const resposta = await fetch(
            `${API}/api/funcionarios/gerenciar/${cpf}`,
            {
                credentials: 'include'
            }
        );

        const dados = await resposta.json();

        if (!resposta.ok) {
            throw new Error(dados.mensagem || 'Erro ao buscar funcionário.');
        }

        const funcionario = dados.funcionario;

        informacoesFuncionario.innerHTML = '';

        const informacoes = [
            ['Nome', funcionario.nome_pessoa],
            ['CPF', funcionario.cpf_pessoa],
            ['Data de nascimento', funcionario.data_nascimento_pessoa],
            ['E-mail', funcionario.email_pessoa],
            ['Endereço', funcionario.endereco_pessoa],
            ['Cargo', funcionario.nome_cargo],
            ['Salário', Number(funcionario.salario_funcionario).toLocaleString('pt-BR', {
                style: 'currency',
                currency: 'BRL'
            })],
            ['Comissão', `${funcionario.porcentagem_comissao_funcionario}%`]
        ];

        informacoes.forEach(([titulo, valor]) => {

            const paragrafo = document.createElement('p');
            const rotulo = document.createElement('strong');

            rotulo.textContent = `${titulo}: `;
            paragrafo.append(rotulo, document.createTextNode(valor ?? 'Não informado'));

            informacoesFuncionario.appendChild(paragrafo);

        });

        // BOTÃO PARA EDITAR FUNCIONÁRIO
        const botaoEditar = document.createElement('button');

        botaoEditar.type = 'button';
        botaoEditar.textContent = 'Editar funcionário';
        botaoEditar.classList.add('botao-editar');

        botaoEditar.addEventListener('click', async () => {

            cpfFuncionarioEdicao = funcionario.cpf_pessoa;

            // PREENCHER DADOS PESSOAIS
            document.getElementById('edicao-nome-funcionario').value =
                funcionario.nome_pessoa;

            document.getElementById('edicao-cpf-funcionario').value =
                funcionario.cpf_pessoa;

            document.getElementById('edicao-nascimento-funcionario').value =
                funcionario.data_nascimento_pessoa
                    ? funcionario.data_nascimento_pessoa.substring(0, 10)
                    : '';

            document.getElementById('edicao-email-funcionario').value =
                funcionario.email_pessoa;

            document.getElementById('edicao-endereco-funcionario').value =
                funcionario.endereco_pessoa || '';

            // PREENCHER DADOS PROFISSIONAIS
            document.getElementById('edicao-salario-funcionario').value =
                funcionario.salario_funcionario;

            document.getElementById('edicao-comissao-funcionario').value =
                funcionario.porcentagem_comissao_funcionario;

            secaoEdicao.hidden = false;

            secaoEdicao.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });

        });

        informacoesFuncionario.appendChild(botaoEditar);

        await carregarCargosEdicao(funcionario.id_cargo);

        secaoDetalhes.hidden = false;

        secaoDetalhes.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
        });

    } catch (erro) {

        console.error('Erro:', erro);
        alert(erro.message);

    }

}

// FECHAR DETALHES
botaoFecharDetalhes.addEventListener('click', () => {
    secaoDetalhes.hidden = true;
});

// CANCELAR EDIÇÃO
botaoCancelarEdicao.addEventListener('click', () => {

    formularioEdicao.reset();

    secaoEdicao.hidden = true;

    mensagemEdicao.textContent = '';

    cpfFuncionarioEdicao = null;

});

// EDITAR FUNCIONÁRIO
formularioEdicao.addEventListener('submit', async (evento) => {

    evento.preventDefault();

    if (!cpfFuncionarioEdicao) {
        mensagemEdicao.textContent = 'Nenhum funcionário selecionado.';
        mensagemEdicao.style.color = 'red';
        return;
    }

    // REUNIR OS DADOS DO FORMULÁRIO
    const funcionario = {
        nome: document.getElementById('edicao-nome-funcionario').value.trim(),
        dataNascimento: document.getElementById('edicao-nascimento-funcionario').value,
        email: document.getElementById('edicao-email-funcionario').value.trim(),
        endereco: document.getElementById('edicao-endereco-funcionario').value.trim(),
        cargoId: document.getElementById('edicao-cargo-funcionario').value,
        salario: document.getElementById('edicao-salario-funcionario').value,
        comissao: document.getElementById('edicao-comissao-funcionario').value
    };

    try {

        const resposta = await fetch(
            `${API}/api/funcionarios/gerenciar/${cpfFuncionarioEdicao}`,
            {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify(funcionario)
            }
        );

        const dados = await resposta.json();

        if (!resposta.ok) {
            throw new Error(dados.mensagem || 'Não foi possível atualizar.');
        }

        mensagemEdicao.textContent = dados.mensagem;
        mensagemEdicao.style.color = 'green';

        // ATUALIZAR A LISTAGEM
        await carregarFuncionarios();

        // ATUALIZAR OS DETALHES
        await visualizarDetalhesFuncionario(cpfFuncionarioEdicao);

        secaoEdicao.hidden = true;
        formularioEdicao.reset();
        cpfFuncionarioEdicao = null;

    } catch (erro) {

        console.error('Erro ao editar funcionário:', erro);

        mensagemEdicao.textContent = erro.message;
        mensagemEdicao.style.color = 'red';

    }

});

// PESQUISAR FUNCIONÁRIOS
campoPesquisa.addEventListener('input', () => {

    const pesquisa = campoPesquisa.value
        .toLowerCase()
        .trim();

    const resultado = funcionarios.filter(funcionario => {

        const nome = funcionario.nome_pessoa.toLowerCase();
        const cpf = funcionario.cpf_pessoa;

        return nome.includes(pesquisa) || cpf.includes(pesquisa);

    });

    mostrarFuncionarios(resultado);

});


// ABRIR FORMULÁRIO
botaoAbrirFormulario.addEventListener('click', async () => {

    secaoFormulario.hidden = false;
    mensagemCadastro.textContent = '';

    await carregarCargos();

    secaoFormulario.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
    });

});

// CARREGAR CARGOS DO BANCO
async function carregarCargos() {

    try {

        const resposta = await fetch(
            `${API}/api/funcionarios/gerenciar/cargos`,
            { credentials: 'include' }
        );

        const dados = await resposta.json();

        if (!resposta.ok) {
            throw new Error(dados.mensagem || 'Erro ao carregar cargos.');
        }

        campoCargo.innerHTML = '<option value="">Selecione um cargo</option>';

        dados.cargos
            // Reservar o cargo de gerente para a conta de gerenciamento atual
            .filter(cargo => Number(cargo.id_cargo) !== 1)
            .forEach(cargo => {

                const opcao = document.createElement('option');

                opcao.value = cargo.id_cargo;
                opcao.textContent = cargo.nome_cargo;

                campoCargo.appendChild(opcao);

            });

    } catch (erro) {

        console.error('Erro ao carregar cargos:', erro);

        campoCargo.innerHTML = '<option value="">Não foi possível carregar os cargos</option>';

        mensagemCadastro.textContent = erro.message;

    }

}

// CARREGAR CARGOS PARA EDIÇÃO
async function carregarCargosEdicao(cargoAtual) {

    const campoCargoEdicao = document.getElementById('edicao-cargo-funcionario');

    try {

        const resposta = await fetch(
            `${API}/api/funcionarios/gerenciar/cargos`,
            { credentials: 'include' }
        );

        const dados = await resposta.json();

        if (!resposta.ok) {
            throw new Error(dados.mensagem || 'Erro ao carregar cargos.');
        }

        campoCargoEdicao.innerHTML = '<option value="">Selecione um cargo</option>';

        dados.cargos.forEach(cargo => {

            const opcao = document.createElement('option');

            opcao.value = cargo.id_cargo;
            opcao.textContent = cargo.nome_cargo;

            campoCargoEdicao.appendChild(opcao);

        });

        // SELECIONAR O CARGO ATUAL
        campoCargoEdicao.value = cargoAtual;

    } catch (erro) {

        console.error('Erro ao carregar cargos:', erro);
        mensagemEdicao.textContent = erro.message;

    }

}

// CANCELAR CADASTRO
botaoCancelarCadastro.addEventListener('click', () => {

    formularioCadastro.reset();
    secaoFormulario.hidden = true;
    mensagemCadastro.textContent = '';

});

// CADASTRAR FUNCIONÁRIO
formularioCadastro.addEventListener('submit', async (evento) => {

    evento.preventDefault();

    const funcionario = {
        nome: document.getElementById('nome-funcionario').value.trim(),
        cpf: document.getElementById('cpf-funcionario').value.trim(),
        dataNascimento: document.getElementById('nascimento-funcionario').value,
        email: document.getElementById('email-funcionario').value.trim(),
        endereco: document.getElementById('endereco-funcionario').value.trim(),
        senha: document.getElementById('senha-funcionario').value,
        cargoId: campoCargo.value,
        salario: document.getElementById('salario-funcionario').value,
        comissao: document.getElementById('comissao-funcionario').value
    };

    try {

        const resposta = await fetch(
            `${API}/api/funcionarios/gerenciar/cadastrar`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify(funcionario)
            }
        );

        const dados = await resposta.json();

        if (!resposta.ok) {
            throw new Error(dados.mensagem || 'Não foi possível cadastrar.');
        }

        mensagemCadastro.textContent = dados.mensagem;
        mensagemCadastro.style.color = 'green';

        formularioCadastro.reset();

        await carregarFuncionarios();

    } catch (erro) {

        console.error('Erro:', erro);

        mensagemCadastro.textContent = erro.message;
        mensagemCadastro.style.color = 'red';

    }

});

// DESATIVAR FUNCIONÁRIO
async function desativarFuncionario(cpf) {

    const confirmar = confirm(
        'Tem certeza de que deseja desativar este funcionário?'
    );

    if (!confirmar) {
        return;
    }

    try {

        const resposta = await fetch(
            `http://127.0.0.1:3001/api/funcionarios/gerenciar/${cpf}/desativar`,
            {
                method: 'PATCH',
                credentials: 'include'
            }
        );

        const dados = await resposta.json();

        if (!resposta.ok) {
            alert(dados.mensagem || 'Não foi possível desativar o funcionário.');
            return;
        }

        alert(dados.mensagem);

        await carregarFuncionarios();

    } catch (erro) {

        console.error('Erro ao desativar funcionário:', erro);

        alert('Não foi possível conectar ao servidor.');

    }
}

// REATIVAR FUNCIONÁRIO
async function reativarFuncionario(cpf) {

    const confirmar = confirm(
        'Tem certeza de que deseja reativar este funcionário?'
    );

    if (!confirmar) {
        return;
    }

    try {

        const resposta = await fetch(
            `http://127.0.0.1:3001/api/funcionarios/gerenciar/${cpf}/reativar`,
            {
                method: 'PATCH',
                credentials: 'include'
            }
        );

        const dados = await resposta.json();

        if (!resposta.ok) {
            alert(dados.mensagem || 'Não foi possível reativar o funcionário.');
            return;
        }

        alert(dados.mensagem);

        await carregarFuncionarios();

    } catch (erro) {

        console.error('Erro ao reativar funcionário:', erro);

        alert('Não foi possível conectar ao servidor.');

    }
}

// INICIAR PÁGINA
carregarFuncionarios();
