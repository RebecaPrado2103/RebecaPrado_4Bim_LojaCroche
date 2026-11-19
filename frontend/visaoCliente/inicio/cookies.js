// ELEMENTOS DO AVISO DE COOKIES
const avisoCookies = document.getElementById('aviso-cookies');
const botaoAceitar = document.getElementById('aceitar-cookies');
const botaoNecessarios = document.getElementById('somente-necessarios');

// VERIFICA SE O USUÁRIO JÁ ESCOLHEU UMA OPÇÃO
function verificarConsentimento() {

    const consentimento = document.cookie
        .split('; ')
        .find(cookie => cookie.startsWith('entreLacosCookies='));

    if (consentimento) {
        avisoCookies.style.display = 'none';
    } else {
        avisoCookies.style.display = 'flex';
    }

}

// SALVA A ESCOLHA DO USUÁRIO
function salvarConsentimento(escolha) {

    document.cookie =
        `entreLacosCookies=${escolha}; max-age=${60 * 60 * 24 * 180}; path=/; SameSite=Lax`;

    avisoCookies.style.display = 'none';

}

// BOTÃO ACEITAR COOKIES
botaoAceitar.addEventListener('click', function () {
    salvarConsentimento('aceito');
});

// BOTÃO SOMENTE NECESSÁRIOS
botaoNecessarios.addEventListener('click', function () {
    salvarConsentimento('necessarios');
});

// INICIA A VERIFICAÇÃO
verificarConsentimento();