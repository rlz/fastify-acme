import fastify from 'fastify'

import { fastifyAcmeSecurePlugin, fastifyAcmeUnsecurePlugin, getCertAndKey } from '../src/plugin'

const certDir = './cert'
const domain = 'example.com'

// Always create unsecure server first, it needs for unsecure server
// to start if certificate is not exist or expired
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
