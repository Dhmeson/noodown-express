# noodown-express

Observability middleware for Express.js that sends HTTP request logs to the Noodown service.

## Installation

```bash
npm install noodown-express
```

## Requirements

- Node.js >= 18.0.0
- Express.js >= 4.18.0

## Configuration

Before using the middleware, you need to configure the `SERVER_KEY` environment variable with your Noodown server key.

### Using dotenv

Create a `.env` file in the root of your project:

```env
SERVER_KEY=your_key_here
```

The middleware automatically loads environment variables using `dotenv`.


## Usage

The package supports both CommonJS and ES Modules. Use the appropriate import syntax for your project.

### ES Modules (ESM)

If your project uses ES Modules (has `"type": "module"` in `package.json` or uses `.mjs` files):

```javascript
import express from 'express';
import observabilityRoutes from 'noodown-express';

const app = express();

// Use the observability middleware
app.use(observabilityRoutes);

// Your routes here
app.get('/', (req, res) => {
  res.json({ hello: 'world' });
});

app.listen(3000, () => {
  console.log('Server running on port 3000');
});
```

### CommonJS

If your project uses CommonJS (default Node.js modules):

```javascript
const express = require('express');
const observabilityRoutes = require('noodown-express');

const app = express();

// Use the observability middleware
app.use(observabilityRoutes);

// Your routes here
app.get('/', (req, res) => {
  res.json({ hello: 'world' });
});

app.listen(3000, () => {
  console.log('Server running on port 3000');
});
```

The package automatically detects which module system you're using and provides the correct build.

## Collected Data

The middleware automatically collects the following data from each request:

- **method**: HTTP method (GET, POST, etc.)
- **path**: Request path
- **status**: HTTP response status code
- **duration_ms**: Request duration in milliseconds
- **timestamp**: Request date and time (ISO 8601)
- **client_ip**: Client IP (extracted from headers like `x-forwarded-for`, `x-real-ip`, etc.)
- **user_agent**: Client user agent
- **origin**: Origin header
- **referer**: Referer header
- **host**: Host header
- **content_type**: Request Content-Type

## How It Works

1. The middleware runs before each request
2. Records the start time using `process.hrtime.bigint()`
3. When the response is finished (`close` event), builds the log with all the data
4. Sends the log asynchronously to the Noodown API using `fetch` with `keepalive: true`
5. Does not block the request response (errors are silently ignored)

# Dashboard
https://www.noodown.com

## License

MIT

