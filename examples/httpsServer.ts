import fastify from 'fastify'

import { fastifyAcmeSecurePlugin, fastifyAcmeUnsecurePlugin, getCertAndKey } from '../src/plugin'

const certDir = './cert'
const domain = 'example.com'

const unsecure = fastify()
unsecure.register(fastifyAcmeUnsecurePlugin, { redirectDomain: domain })

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
