# noodown-express

Middleware de observabilidade para Express.js que envia logs de requisições HTTP para o serviço Noodown.

## Instalação

```bash
npm install noodown-express
```

## Requisitos

- Node.js >= 18.0.0
- Express.js >= 4.18.0

## Configuração

Antes de usar o middleware, você precisa configurar a variável de ambiente `SERVER_KEY` com sua chave de servidor do Noodown.

### Usando dotenv

Crie um arquivo `.env` na raiz do seu projeto:

```env
SERVER_KEY=sua_chave_aqui
```

O middleware carrega automaticamente as variáveis de ambiente usando `dotenv`.

### Configuração manual

Você também pode definir a variável de ambiente diretamente:

```bash
export SERVER_KEY=sua_chave_aqui
```

Ou no Windows:

```cmd
set SERVER_KEY=sua_chave_aqui
```

## Uso

```javascript
import express from 'express';
import observabilityRoutes from 'noodown-express';

const app = express();

// Use o middleware de observabilidade
app.use(observabilityRoutes);

// Suas rotas aqui
app.get('/', (req, res) => {
  res.json({ hello: 'world' });
});

app.listen(3000, () => {
  console.log('Servidor rodando na porta 3000');
});
```

## Dados Coletados

O middleware coleta automaticamente os seguintes dados de cada requisição:

- **method**: Método HTTP (GET, POST, etc.)
- **path**: Caminho da requisição
- **status**: Código de status HTTP da resposta
- **duration_ms**: Duração da requisição em milissegundos
- **timestamp**: Data e hora da requisição (ISO 8601)
- **client_ip**: IP do cliente (extraído de headers como `x-forwarded-for`, `x-real-ip`, etc.)
- **user_agent**: User agent do cliente
- **origin**: Header Origin
- **referer**: Header Referer
- **host**: Header Host
- **content_type**: Content-Type da requisição

## Como Funciona

1. O middleware é executado antes de cada requisição
2. Registra o tempo de início usando `process.hrtime.bigint()`
3. Quando a resposta é finalizada (evento `close`), constrói o log com todos os dados
4. Envia o log de forma assíncrona para a API do Noodown usando `fetch` com `keepalive: true`
5. Não bloqueia a resposta da requisição (erros são silenciosamente ignorados)

## Licença

MIT

