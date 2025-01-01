# fastify-acme

Implement ACME protocol (plugin) for Fastify.

## Installation

```bash
npm install fastify-acme
```

## Register ACME Account

Before running the server, you need to register an ACME account. You can do this by installing the package globally and using the `fastify-acme-reg` CLI or programmatically by calling `registerAcmeAccount`.

### Using CLI

```bash
npm install -g fastify-acme
fastify-acme-reg
```

### Programmatically

```typescript
import { registerAcmeAccount } from 'fastify-acme'

const certDir = './cert'
const email = 'your-email@example.com'

await registerAcmeAccount(certDir, email)
```

## Usage

### HTTP Server Example

```typescript
import fastify from 'fastify'
import { fastifyAcmeSecurePlugin, fastifyAcmeUnsecurePlugin, getCertAndKey } from 'fastify-acme'

const certDir = './cert'
const domain = 'example.com'

const unsecure = fastify()
unsecure.register(fastifyAcmeUnsecurePlugin)

void unsecure.listen({ port: 80 })

const certAndKey = await getCertAndKey(certDir, domain)
const secure = fastify({
    https: {
        key: certAndKey.pkey,
        cert: certAndKey.cert
    }
})
secure.register(fastifyAcmeSecurePlugin, { certDir, domain })

secure.get('/', {}, async (_req, resp) => {
    resp.send('Hello, World!')
})

void secure.listen({ port: 443 })
```

### HTTP/2 Server Example

```typescript
import fastify from 'fastify'
import { fastifyAcmeSecurePlugin, fastifyAcmeUnsecurePlugin, getCertAndKey } from 'fastify-acme'

const certDir = './cert'
const domain = 'example.com'

const unsecure = fastify()
unsecure.register(fastifyAcmeUnsecurePlugin)
void unsecure.listen({ port: 80 })

const certAndKey = await getCertAndKey(certDir, domain)
const secure = fastify({
    http2: true,
    https: {
        allowHTTP1: true,
        key: certAndKey.pkey,
        cert: certAndKey.cert
    }
})
secure.register(fastifyAcmeSecurePlugin, { certDir, domain })

secure.get('/', {}, async (_req, resp) => {
    resp.send('Hello, World!')
})

void secure.listen({ port: 443 })
```

## License

ISC
