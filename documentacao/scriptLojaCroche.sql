-- =========================================
-- 1. EXCLUSÃO DAS TABELAS ANTERIORES
-- =========================================

DROP TABLE IF EXISTS
	item_devolucao,
	devolucao,
    pagamento,
    item_pedido,
    pedido,
    item_carrinho,
    carrinho,
    produto,
    funcionario,
    cliente,
    forma_pagamento,
    pessoa,
    cargo;


-- =========================================
-- 2. TABELAS DE PESSOAS E FUNCIONÁRIOS
-- =========================================

CREATE TABLE cargo (
    id_cargo SERIAL PRIMARY KEY,
    nome_cargo VARCHAR(80) NOT NULL
);

CREATE TABLE pessoa (
    cpf_pessoa VARCHAR(11) PRIMARY KEY,
    nome_pessoa VARCHAR(100) NOT NULL,
    data_nascimento_pessoa DATE,
    endereco_pessoa VARCHAR(100),
    senha_pessoa VARCHAR(255) NOT NULL,
    email_pessoa VARCHAR(75) NOT NULL UNIQUE
);

CREATE TABLE cliente (
    pessoa_cpf_pessoa VARCHAR(11) PRIMARY KEY,
    data_cadastro_cliente DATE DEFAULT CURRENT_DATE,
	FOREIGN KEY (pessoa_cpf_pessoa) REFERENCES pessoa(cpf_pessoa)
);

CREATE TABLE funcionario (
    pessoa_cpf_pessoa VARCHAR(11) PRIMARY KEY,
    salario_funcionario DECIMAL(10,2),
    cargo_id_cargo INTEGER,
    porcentagem_comissao_funcionario DECIMAL(5,2),
    FOREIGN KEY (pessoa_cpf_pessoa) REFERENCES pessoa(cpf_pessoa),
    FOREIGN KEY (cargo_id_cargo) REFERENCES cargo(id_cargo)
);


-- =========================================
-- 3. TABELAS DE PRODUTOS E PAGAMENTO
-- =========================================

CREATE TABLE produto (
    id_produto SERIAL PRIMARY KEY,
    nome_produto VARCHAR(80) NOT NULL,
    quantidade_estoque_produto INTEGER NOT NULL,
    preco_unitario_produto DECIMAL(10,2) NOT NULL,
    categoria_produto VARCHAR(50),
    ativo_produto BOOLEAN DEFAULT TRUE,
    CHECK (quantidade_estoque_produto >= 0),
    CHECK (preco_unitario_produto >= 0)
);

CREATE TABLE forma_pagamento (
    id_forma_pagamento SERIAL PRIMARY KEY,
    nome_forma_pagamento VARCHAR(50) NOT NULL
);


-- =========================================
-- 4. TABELAS DO CARRINHO
-- =========================================

CREATE TABLE carrinho (
    id_carrinho SERIAL PRIMARY KEY,
    cliente_cpf VARCHAR(11) NOT NULL UNIQUE,
    data_criacao_carrinho TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (cliente_cpf) REFERENCES cliente(pessoa_cpf_pessoa)
);

CREATE TABLE item_carrinho (
    carrinho_id INTEGER NOT NULL,
    produto_id INTEGER NOT NULL,
    quantidade_item_carrinho INTEGER NOT NULL,
    PRIMARY KEY (carrinho_id, produto_id),
    FOREIGN KEY (carrinho_id) REFERENCES carrinho(id_carrinho),
	FOREIGN KEY (produto_id) REFERENCES produto(id_produto),
    CHECK (quantidade_item_carrinho > 0)
);


-- =========================================
-- 5. TABELAS DOS PEDIDOS
-- =========================================

CREATE TABLE pedido (
    id_pedido SERIAL PRIMARY KEY,
    data_pedido TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    cliente_cpf VARCHAR(11) NOT NULL,
    valor_total DECIMAL(10,2) NOT NULL DEFAULT 0,
    status_pedido VARCHAR(30) NOT NULL DEFAULT 'Aguardando pagamento',
    FOREIGN KEY (cliente_cpf) REFERENCES cliente(pessoa_cpf_pessoa),
    CHECK (valor_total >= 0)
);

CREATE TABLE item_pedido (
    pedido_id INTEGER NOT NULL,
    produto_id INTEGER NOT NULL,
    quantidade_item_pedido INTEGER NOT NULL,
    preco_unitario_item_pedido DECIMAL(10,2) NOT NULL,
    PRIMARY KEY (pedido_id, produto_id),
    FOREIGN KEY (pedido_id) REFERENCES pedido(id_pedido),
    FOREIGN KEY (produto_id) REFERENCES produto(id_produto),
    CHECK (quantidade_item_pedido > 0),
    CHECK (preco_unitario_item_pedido >= 0)
);


-- =========================================
-- 6. TABELA DE PAGAMENTO
-- =========================================

CREATE TABLE pagamento (
    id_pagamento SERIAL PRIMARY KEY,
    pedido_id INTEGER NOT NULL,
    forma_pagamento_id INTEGER NOT NULL,
    data_pagamento TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    valor_pagamento DECIMAL(10,2) NOT NULL,
    status_pagamento VARCHAR(30) NOT NULL DEFAULT 'Pendente',
    FOREIGN KEY (pedido_id) REFERENCES pedido(id_pedido),
    FOREIGN KEY (forma_pagamento_id) REFERENCES forma_pagamento(id_forma_pagamento),
    CHECK (valor_pagamento >= 0)
);

-- =========================================
-- 7. TABELAS DE DEVOLUÇÕES
-- =========================================

CREATE TABLE devolucao (
    id_devolucao SERIAL PRIMARY KEY,
    pedido_id INTEGER NOT NULL,
    data_devolucao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    motivo_devolucao VARCHAR(200) NOT NULL,
    status_devolucao VARCHAR(30) NOT NULL DEFAULT 'Em análise',
    FOREIGN KEY (pedido_id) REFERENCES pedido(id_pedido),
    UNIQUE (id_devolucao, pedido_id),
    CHECK (
        status_devolucao IN (
            'Em análise',
            'Aprovada',
            'Recusada',
            'Concluída'
        )
    )
);

CREATE TABLE item_devolucao (
    devolucao_id INTEGER NOT NULL,
    pedido_id INTEGER NOT NULL,
    produto_id INTEGER NOT NULL,
    quantidade_devolvida INTEGER NOT NULL,
    condicao_produto VARCHAR(30) NOT NULL,
    estoque_processado BOOLEAN DEFAULT FALSE,
    PRIMARY KEY (devolucao_id, produto_id),
    FOREIGN KEY (devolucao_id, pedido_id) REFERENCES devolucao(id_devolucao, pedido_id),
    FOREIGN KEY (pedido_id, produto_id) REFERENCES item_pedido(pedido_id, produto_id),
	CHECK (quantidade_devolvida > 0),
    CHECK (
        condicao_produto IN (
            'Em perfeito estado',
            'Com defeito',
            'Danificado'
        )
    )
);

-- =========================================
-- 8. INSERT DE VALORES
-- =========================================

INSERT INTO cargo (nome_cargo)
VALUES
    ('Gerente'),
    ('Atendente'),
    ('Vendedor'),
    ('Artesão'),
    ('Estoquista'),
    ('Assistente administrativo'),
    ('Embalador');

INSERT INTO forma_pagamento (nome_forma_pagamento)
VALUES
    ('PIX'),
    ('Cartão de crédito'),
    ('Cartão de débito');

INSERT INTO pessoa (cpf_pessoa, nome_pessoa, data_nascimento_pessoa, endereco_pessoa, senha_pessoa, email_pessoa)
VALUES
	('90000000001', 'Ana Clara Martins', '2002-04-15', 'Rua das Flores, 120', 'senha_teste', 'ana.martins@example.com'),
    ('90000000002', 'Beatriz Oliveira', '1998-08-21', 'Rua Paraná, 45', 'senha_teste', 'beatriz.oliveira@example.com'),
    ('90000000003', 'Camila Rodrigues', '2005-02-10', 'Avenida Brasil, 300', 'senha_teste', 'camila.rodrigues@example.com'),
    ('90000000004', 'Daniela Ferreira', '1995-11-03', 'Rua das Acácias, 80', 'senha_teste', 'daniela.ferreira@example.com'),
    ('90000000005', 'Eduarda Lima', '2001-06-27', 'Rua São Paulo, 210', 'senha_teste', 'eduarda.lima@example.com'),
    ('90000000006', 'Fernanda Costa', '1999-09-12', 'Rua Ipê, 65', 'senha_teste', 'fernanda.costa@example.com'),
    ('90000000007', 'Gabriela Souza', '2004-01-19', 'Rua das Palmeiras, 90', 'senha_teste', 'gabriela.souza@example.com'),
    ('90000000008', 'Helena Almeida', '1997-12-05', 'Avenida Central, 150', 'senha_teste', 'helena.almeida@example.com'),
	('90000000009', 'Igor Mendes', '1990-03-14', 'Rua Minas Gerais, 70', 'senha_teste', 'igor.mendes@example.com'),
    ('90000000010', 'Juliana Ribeiro', '1993-07-22', 'Rua Bahia, 110', 'senha_teste', 'juliana.ribeiro@example.com'),
    ('90000000011', 'Lucas Carvalho', '1988-05-09', 'Rua Goiás, 35', 'senha_teste', 'lucas.carvalho@example.com'),
    ('90000000012', 'Mariana Lopes', '1996-10-18', 'Rua Rio de Janeiro, 200', 'senha_teste', 'mariana.lopes@example.com'),
    ('90000000013', 'Nicolas Barros', '1992-02-25', 'Rua Santa Catarina, 55', 'senha_teste', 'nicolas.barros@example.com'),
    ('90000000014', 'Olivia Mendes', '1994-04-30', 'Avenida das Flores, 400', 'senha_teste', 'olivia.mendes@example.com'),
    ('90000000015', 'Pedro Henrique Alves', '1989-08-16', 'Rua Paraná, 95', 'senha_teste', 'pedro.alves@example.com'),
    ('90000000016', 'Rafaela Gomes', '1997-01-08', 'Rua dos Pinheiros, 130', 'senha_teste', 'rafaela.gomes@example.com'),
	 ('90000000017', 'Sofia Nunes', '2000-05-11', 'Rua das Orquídeas, 25', 'senha_teste', 'sofia.nunes@example.com'),
    ('90000000018', 'Thiago Moreira', '1991-06-23', 'Rua XV de Novembro, 180', 'senha_teste', 'thiago.moreira@example.com'),
    ('90000000019', 'Valentina Dias', '1998-09-07', 'Rua das Violetas, 60', 'senha_teste', 'valentina.dias@example.com'),
    ('90000000020', 'William Freitas', '1993-12-29', 'Avenida Paraná, 250', 'senha_teste', 'william.freitas@example.com'),
	('90000000021', 'Yasmin Castro', '2003-03-17', 'Rua dos Lírios, 40', 'senha_teste', 'yasmin.castro@example.com'),
    ('90000000022', 'Arthur Pires', '2001-07-04', 'Rua das Rosas, 75', 'senha_teste', 'arthur.pires@example.com'),
    ('90000000023', 'Larissa Monteiro', '1996-11-26', 'Avenida Brasil, 500', 'senha_teste', 'larissa.monteiro@example.com'),
    ('90000000024', 'Matheus Azevedo', '1999-02-13', 'Rua das Margaridas, 100', 'senha_teste', 'matheus.azevedo@example.com');

INSERT INTO cliente (pessoa_cpf_pessoa)
VALUES 
	('90000000001'),
    ('90000000002'),
    ('90000000003'),
    ('90000000004'),
    ('90000000005'),
    ('90000000006'),
    ('90000000007'),
    ('90000000008'),
    ('90000000017'),
    ('90000000018'),
    ('90000000019'),
    ('90000000020');

INSERT INTO funcionario (pessoa_cpf_pessoa, salario_funcionario, cargo_id_cargo, porcentagem_comissao_funcionario)
VALUES
    ('90000000009', 4500.00, 1, 0.00),
    ('90000000010', 2200.00, 2, 0.00),
    ('90000000011', 2500.00, 3, 5.00),
    ('90000000012', 2400.00, 4, 0.00),
    ('90000000013', 2300.00, 5, 0.00),
    ('90000000014', 2800.00, 6, 0.00),
    ('90000000015', 2100.00, 7, 0.00),
    ('90000000016', 2400.00, 4, 0.00),
    ('90000000017', 2500.00, 3, 5.00),
    ('90000000018', 2200.00, 2, 0.00),
    ('90000000019', 2400.00, 4, 0.00),
    ('90000000020', 2300.00, 5, 0.00);

INSERT INTO produto (nome_produto, quantidade_estoque_produto, preco_unitario_produto, categoria_produto)
VALUES
    ('Bolsa de Crochê Floral', 8, 89.90, 'Bolsas'),
    ('Bolsa Tiracolo Bege', 12, 75.00, 'Bolsas'),
    ('Bolsa Colorida de Verão', 5, 110.00, 'Bolsas'),
    ('Ursinho Amigurumi', 10, 65.00, 'Amigurumis'),
    ('Coelhinho Amigurumi', 7, 59.90, 'Amigurumis'),
    ('Boneca Amigurumi', 6, 95.00, 'Amigurumis'),
    ('Polvo Amigurumi', 15, 45.00, 'Amigurumis'),
    ('Sousplat de Crochê', 20, 32.00, 'Decoração'),
    ('Capa de Almofada', 9, 78.00, 'Decoração'),
    ('Porta-Vaso de Crochê', 14, 35.00, 'Decoração'),
    ('Jogo de Tapetes', 4, 120.00, 'Decoração'),
    ('Tiara de Crochê', 18, 25.00, 'Acessórios'),
    ('Scrunchie de Crochê', 25, 12.00, 'Acessórios'),
    ('Chaveiro de Flor', 30, 15.00, 'Acessórios'),
    ('Top de Crochê', 6, 85.00, 'Roupas'),
    ('Blusa de Crochê', 4, 150.00, 'Roupas'),
    ('Cardigã de Crochê', 3, 220.00, 'Roupas'),
    ('Colete de Crochê', 5, 135.00, 'Roupas'),
	('Mini Bolsa Rosa', 7, 68.00, 'Bolsas'),
    ('Ecobag de Crochê', 10, 82.00, 'Bolsas'),
    ('Sapinho Amigurumi', 8, 55.00, 'Amigurumis'),
    ('Polvinho Colorido', 12, 48.00, 'Amigurumis'),
    ('Caminho de Mesa', 6, 95.00, 'Decoração'),
    ('Enfeite de Parede', 9, 58.00, 'Decoração'),
    ('Presilha de Flor', 20, 18.00, 'Acessórios'),
    ('Chapéu Bucket', 8, 65.00, 'Acessórios'),
    ('Colete Colorido', 5, 125.00, 'Roupas'),
    ('Saia de Crochê', 4, 145.00, 'Roupas'),
    ('Cropped Branco', 7, 79.90, 'Roupas'),
    ('Bolsa Saco', 6, 92.00, 'Bolsas');

INSERT INTO carrinho (cliente_cpf)
SELECT pessoa_cpf_pessoa
FROM cliente
ORDER BY pessoa_cpf_pessoa;

INSERT INTO item_carrinho (
    carrinho_id,
    produto_id,
    quantidade_item_carrinho
)
SELECT
    c.id_carrinho,
    p.id_produto,
    v.quantidade
FROM (
    VALUES
        ('90000000001', 'Bolsa de Crochê Floral', 1),
        ('90000000001', 'Chaveiro de Flor', 2),
        ('90000000001', 'Ursinho Amigurumi', 1),
        ('90000000002', 'Bolsa Tiracolo Bege', 1),
        ('90000000002', 'Tiara de Crochê', 2),
        ('90000000003', 'Coelhinho Amigurumi', 1),
        ('90000000003', 'Sousplat de Crochê', 4),
        ('90000000004', 'Capa de Almofada', 2),
        ('90000000004', 'Porta-Vaso de Crochê', 1),
        ('90000000004', 'Scrunchie de Crochê', 3),
        ('90000000005', 'Top de Crochê', 1),
        ('90000000005', 'Chaveiro de Flor', 3),
        ('90000000006', 'Bolsa Colorida de Verão', 1),
        ('90000000006', 'Polvo Amigurumi', 2),
        ('90000000007', 'Jogo de Tapetes', 1),
        ('90000000007', 'Presilha de Flor', 2),
        ('90000000008', 'Blusa de Crochê', 1),
        ('90000000008', 'Caminho de Mesa', 1),
        ('90000000017', 'Mini Bolsa Rosa', 1),
        ('90000000017', 'Sapinho Amigurumi', 2),
        ('90000000017', 'Chapéu Bucket', 1),
        ('90000000018', 'Ecobag de Crochê', 1),
        ('90000000018', 'Enfeite de Parede', 1),
        ('90000000019', 'Colete Colorido', 1),
        ('90000000019', 'Cropped Branco', 2),
        ('90000000020', 'Cardigã de Crochê', 1),
        ('90000000020', 'Saia de Crochê', 1),
        ('90000000020', 'Bolsa Saco', 1),
        ('90000000009', 'Boneca Amigurumi', 1),
        ('90000000010', 'Polvinho Colorido', 2)
) AS v(cpf, nome_produto, quantidade)
INNER JOIN carrinho c
    ON c.cliente_cpf = v.cpf
INNER JOIN produto p
    ON p.nome_produto = v.nome_produto;

INSERT INTO pedido (data_pedido, cliente_cpf, valor_total, status_pedido)
VALUES
    ('2026-10-15 10:30:00', '90000000001', 159.90, 'Concluído'),
    ('2026-10-16 14:20:00', '90000000002', 100.00, 'Enviado'),
    ('2026-10-17 09:15:00', '90000000003', 187.00, 'Em preparação'),
    ('2026-10-18 16:45:00', '90000000004', 141.00, 'Concluído'),
    ('2026-10-19 11:10:00', '90000000005', 121.00, 'Confirmado'),
    ('2026-10-20 13:00:00', '90000000006', 206.00, 'Enviado'),
    ('2026-10-21 08:40:00', '90000000007', 156.00, 'Em preparação'),
    ('2026-10-22 17:25:00', '90000000008', 245.00, 'Concluído'),
    ('2026-10-23 12:30:00', '90000000017', 171.00, 'Confirmado'),
    ('2026-10-24 15:50:00', '90000000018', 130.00, 'Aguardando pagamento'),
    ('2026-10-25 10:05:00', '90000000019', 270.00, 'Enviado'),
    ('2026-10-26 14:35:00', '90000000020', 455.00, 'Em preparação'),
    ('2026-10-27 09:50:00', '90000000001', 125.00, 'Aguardando pagamento'),
    ('2026-10-28 16:15:00', '90000000003', 220.00, 'Concluído'),
    ('2026-10-29 11:45:00', '90000000005', 95.00, 'Confirmado');

INSERT INTO item_pedido (pedido_id, produto_id, quantidade_item_pedido, preco_unitario_item_pedido)
SELECT
    pe.id_pedido,
    pr.id_produto,
    v.quantidade,
    v.preco
FROM (
    VALUES
        (1, 'Bolsa de Crochê Floral', 1, 89.90),
        (1, 'Ursinho Amigurumi', 1, 65.00),
        (1, 'Scrunchie de Crochê', 1, 12.00),
        (2, 'Bolsa Tiracolo Bege', 1, 75.00),
        (2, 'Tiara de Crochê', 1, 25.00),
        (3, 'Boneca Amigurumi', 1, 95.00),
        (3, 'Coelhinho Amigurumi', 1, 59.90),
        (3, 'Chaveiro de Flor', 2, 15.00),
        (4, 'Capa de Almofada', 1, 78.00),
        (4, 'Porta-Vaso de Crochê', 1, 35.00),
        (4, 'Scrunchie de Crochê', 2, 14.00),
        (5, 'Top de Crochê', 1, 85.00),
        (5, 'Chaveiro de Flor', 2, 18.00),
        (6, 'Bolsa Colorida de Verão', 1, 110.00),
        (6, 'Polvo Amigurumi', 2, 48.00),
        (7, 'Jogo de Tapetes', 1, 120.00),
        (7, 'Presilha de Flor', 2, 18.00),
        (8, 'Blusa de Crochê', 1, 150.00),
        (8, 'Caminho de Mesa', 1, 95.00),
        (9, 'Mini Bolsa Rosa', 1, 68.00),
        (9, 'Sapinho Amigurumi', 1, 55.00),
        (9, 'Chapéu Bucket', 1, 48.00),
        (10, 'Ecobag de Crochê', 1, 82.00),
        (10, 'Enfeite de Parede', 1, 48.00),
        (11, 'Colete Colorido', 1, 125.00),
        (11, 'Cropped Branco', 1, 79.90),
        (11, 'Bolsa Saco', 1, 65.10),
        (12, 'Cardigã de Crochê', 1, 220.00),
        (12, 'Saia de Crochê', 1, 145.00),
        (12, 'Bolsa Saco', 1, 90.00),
        (13, 'Bolsa de Crochê Floral', 1, 89.90),
        (13, 'Colete de Crochê', 1, 35.10),
        (14, 'Cardigã de Crochê', 1, 220.00),
        (15, 'Capa de Almofada', 1, 78.00),
        (15, 'Presilha de Flor', 1, 17.00)
) AS v(id_pedido, nome_produto, quantidade, preco)
INNER JOIN pedido pe
    ON pe.id_pedido = v.id_pedido
INNER JOIN produto pr
    ON pr.nome_produto = v.nome_produto;

INSERT INTO pagamento (pedido_id, forma_pagamento_id, data_pagamento, valor_pagamento, status_pagamento)
VALUES
	(1, 1, '2026-10-15 10:35:00', 166.90, 'Aprovado'),
	(2, 2, '2026-10-16 14:25:00', 100.00, 'Aprovado'),
	(3, 1, '2026-10-17 09:20:00', 100.00, 'Aprovado'),
	(3, 2, '2026-10-17 09:21:00', 84.90, 'Aprovado'),
	(4, 3, '2026-10-18 16:50:00', 141.00, 'Aprovado'),
	(5, 2, '2026-10-19 11:15:00', 121.00, 'Aprovado'),
	(6, 1, '2026-10-20 13:05:00', 106.00, 'Aprovado'),
	(6, 3, '2026-10-20 13:06:00', 100.00, 'Aprovado'),
	(7, 3, '2026-10-21 08:45:00', 156.00, 'Pendente'),
	(8, 2, '2026-10-22 17:30:00', 245.00, 'Aprovado'),
	(9, 1, '2026-10-23 12:35:00', 171.00, 'Aprovado'),
	(10, 1, '2026-10-24 15:55:00', 80.00, 'Aprovado'),
	(10, 2, '2026-10-24 15:56:00', 50.00, 'Aprovado'),
	(11, 2, '2026-10-25 10:10:00', 270.00, 'Aprovado'),
	(12, 1, '2026-10-26 14:40:00', 255.00, 'Aprovado'),
	(12, 2, '2026-10-26 14:41:00', 200.00, 'Aprovado'),
	(13, 3, '2026-10-27 09:55:00', 125.00, 'Pendente'),
	(14, 2, '2026-10-28 16:20:00', 220.00, 'Aprovado'),
	(15, 1, '2026-10-29 11:50:00', 95.00, 'Aprovado');

INSERT INTO devolucao (pedido_id, data_devolucao, motivo_devolucao, status_devolucao)
VALUES
	(1, '2026-11-01 09:30:00', 'Produto diferente do esperado', 'Em análise'),
	(1, '2026-11-01 10:15:00', 'Produto com defeito', 'Em análise'),
	(1, '2026-11-02 14:20:00', 'Desistência da compra', 'Recusada'),
	(4, '2026-11-03 11:00:00', 'Produto com defeito', 'Em análise'),
	(4, '2026-11-03 15:40:00', 'Produto danificado no transporte', 'Em análise'),
	(4, '2026-11-04 08:50:00', 'Produto diferente do esperado', 'Em análise'),
	(4, '2026-11-04 13:25:00', 'Produto com defeito', 'Recusada'),
	(8, '2026-11-05 10:10:00', 'Tamanho inadequado', 'Em análise'),
	(8, '2026-11-06 16:30:00', 'Desistência da compra', 'Em análise'),
	(14, '2026-11-07 12:45:00', 'Produto com defeito', 'Recusada');

INSERT INTO item_devolucao (devolucao_id, pedido_id, produto_id, quantidade_devolvida, condicao_produto)
SELECT
    v.devolucao_id,
    v.pedido_id,
    p.id_produto,
    v.quantidade,
    v.condicao
FROM (
    VALUES
    (1, 1, 'Bolsa de Crochê Floral', 1, 'Em perfeito estado'),
    (2, 1, 'Ursinho Amigurumi', 1, 'Com defeito'),
    (3, 1, 'Scrunchie de Crochê', 1, 'Em perfeito estado'),
    (4, 4, 'Capa de Almofada', 1, 'Com defeito'),
    (5, 4, 'Porta-Vaso de Crochê', 1, 'Danificado'),
    (6, 4, 'Scrunchie de Crochê', 1, 'Em perfeito estado'),
    (7, 4, 'Scrunchie de Crochê', 1, 'Com defeito'),
    (8, 8, 'Blusa de Crochê', 1, 'Em perfeito estado'),
    (9, 8, 'Caminho de Mesa', 1, 'Em perfeito estado'),
    (10, 14, 'Cardigã de Crochê', 1, 'Com defeito')
) AS v(devolucao_id, pedido_id, nome_produto, quantidade, condicao)
INNER JOIN produto p
    ON p.nome_produto = v.nome_produto;