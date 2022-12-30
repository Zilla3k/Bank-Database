const { response, request } = require('express');
const express = require('express');

// Gerador de numero randomico
const { v4: uuidV4 } = require('uuid');

const app = express();

app.use(express.json());

// Banco de dados ficticio
const customers = [];

// Middleware
function verifyIfExistAccountCPF(request, response, next) {
  const { cpf } = request.headers;

  // Faz a verificacao se possui um cliente pelos dados do cpf
  // comparando com o do banco de dados
  const customer = customers.find((customer) => customer.cpf === cpf);

  // Cliente nao existe?
  if (!customer) {
    // Caso nao exista retorna status 400 com a mensagem
    // "Cliente nao encontrado no banco de dados"
    return response
      .status(400)
      .json({ message: 'Customer not found in database' });
  }

  request.customer = customer;

  return next();
}

function getBalance(statement) {
  const balance = statement.reduce((acc, operation) => {
    if (operation.type === 'credit') {
      return acc + operation.type;
    } else {
      return acc + operation.amount;
    }
  }, 0);
}

app.post('/account', (request, response) => {
  // Pega o CPF e o Nome no body
  const { cpf, name } = request.body;

  // Faz uma busca e retorna um true ou false,
  // de acordo com os parametros passados
  const customerAlreadyExists = customers.some(
    (customers) => customers.cpf === cpf,
  );

  if (customerAlreadyExists) {
    return response.status(400).json({ error: 'Customer already exists!' });
  }

  // Insercao dos dados recebidos
  customers.push({
    cpf,
    name,
    // Gera um ID
    id: uuidV4(),
    statement: [],
  });

  // Retorna que deu tudo certo,
  // status 201 e para quando um dado for criado
  return response.status(201).send();
});

app.get('/statement', verifyIfExistAccountCPF, (request, response) => {
  const { customer } = request;
  return response.json(customer.statement);
});

app.post('/deposit', verifyIfExistAccountCPF, (request, response) => {
  // Pega a descricao e o valor do deposito
  const { description, amount } = request.body;

  const { customer } = request;
  // Insere os valores de descricao, valor, data de quando foi depositado
  // e o tipo
  const statementOperation = {
    description,
    amount,
    create_at: new Date(),
    type: 'credit',
  };

  // E insere no banco de dados do imsomnia ficticio
  customer.statement.push(statementOperation);

  return response.status(201).send();
});

app.post('/withdraw', verifyIfExistAccountCPF, (request, response) => {
  // Pega a descricao e o valor do deposito
  const { description, amount } = request.body;
  const { customer } = request;

  const balance = getBalance(customer.statement);

  // Verifica se o saldo e menor do que o saque
  if (balance < amount) {
    // status 400 com mensagem de
    // "Saldo insuficiente!"
    return response.status(400).json({ erro: 'Insifficiente funds!' });
  }

  // Insere o valor do saque, data do saque
  // e o tipo que e debito.
  const statementOperation = {
    amount,
    create_at: new Date(),
    type: 'debit',
  };

  // E insere no banco de dados os valores atuais
  customer.statement.push(statementOperation);

  return response.status(201).send();
});

app.get('/statement/date', verifyIfExistAccountCPF, (request, response) => {
  const { customer } = request;
  const { date } = request.query;

  const dateFormat = new Date(date + ' 00:00');

  // 20/02/2022
  const statement = customer.statement.filter(
    (statement) =>
      statement.create_at.toDateString() ===
      new Date(dateFormat).toDateString(),
  );

  return response.json(statement);
});

app.put('/account', verifyIfExistAccountCPF, (request, response) => {
  const { name } = request.body;
  const { customer } = request;

  customer.name = name;

  return response.status(201).send();
});

app.get('/account', verifyIfExistAccountCPF, (request, response) => {
  const { customer } = request;

  return response.json(customer);
});

app.delete('/account', verifyIfExistAccountCPF, (request, response) => {
  const { customer } = request;

  customers.splice(customer, 1);

  return response.status(200).json(customers);
});

app.get('/balance', verifyIfExistAccountCPF, (request, response) => {
  const { customer } = request;

  const balance = getBalance(customer.statement);

  return response.json(balance);
});

app.listen(3031);
