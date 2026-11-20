const bcrypt = require('bcrypt');

async function gerarHash() {
    const senha = 'gerente1234';

    const senhaHash = await bcrypt.hash(senha, 10);

    console.log('Senha protegida:', senhaHash);
}

gerarHash();