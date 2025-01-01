import { httpErrors } from '@fastify/sensible'
import { FastifyInstance } from 'fastify'
import fp from 'fastify-plugin'
import { Server as HttpServer } from 'http'
import { Http2SecureServer } from 'http2'
import { Server as HttpsServer } from 'https'

import { CertAndKey, getAccountUrl, getCert, getCertExpiry, getNewCert, shouldRenewCert } from './utils'

const acmeTokens: Record<string, string> = {}

async function newCert(certDir: string, domain: string): Promise<CertAndKey> {
    return getNewCert(
        certDir,
        domain,
        (token, content) => {
            acmeTokens[token] = content
        },
        (token) => {
            delete acmeTokens[token]
        }
    )
}

/**
 * Get certificate and private key. If the certificate is not found or should be renewed, a new certificate is created.
 *
 * @param certDir Directory where the certificate is stored
 * @param domain Domain for the certificate
 * @returns Certificate and private key
 */
export async function getCertAndKey(certDir: string, domain: string): Promise<CertAndKey> {
    if (getAccountUrl(certDir) === undefined) {
        throw Error('Need ACME account (letsencript)')
    }

    const certAndkey = await getCert(certDir)

    if (certAndkey !== undefined && !shouldRenewCert(certAndkey.cert)) {
        return certAndkey
    }

    return newCert(
        certDir,
        domain
    )
}

/**
 * Fastify plugin to serve the ACME challenge
 */
export const fastifyAcmeUnsecurePlugin = fp(
    async function fastifyAcmeUnsecurePlugin(fastify: FastifyInstance<HttpServer>) {
        fastify.get(
            '/.well-known/acme-challenge/:token',
            {},
            async (req, _resp) => {
                if (!(
                    req.params !== null
                    && typeof req.params === 'object'
                    && 'token' in req.params
                    && typeof req.params.token === 'string'
                )) {
                    return httpErrors.badRequest()
                }

                const token = req.params.token

                const body = acmeTokens[token]

                if (body === undefined) {
                    return httpErrors.notFound()
                }

                return body
            }
        )
    }
)

interface FastifyAcmeSecurePluginOpts {
    certDir: string
    domain: string
}

/**
 * Fastify plugin to renew the certificate if needed
 */
export const fastifyAcmeSecurePlugin = fp(
    async function fastifyAcmeSecurePlugin<F extends FastifyInstance<HttpsServer | Http2SecureServer>>(fastify: F, opts: FastifyAcmeSecurePluginOpts) {
        const f = fastify

        setInterval(
            async () => {
                try {
                    f.log.debug('Checking if cert should be renewed')

                    const certAndkey = await getCert(opts.certDir)

                    if (certAndkey === undefined) {
                        throw Error('No cert found, while checking if cert should be renewed')
                    }

                    if (shouldRenewCert(certAndkey?.cert)) {
                        fastify.log.info({ expiry: getCertExpiry(certAndkey.cert) }, 'Renewing cert')

                        try {
                            const certAndKey = await newCert(opts.certDir, opts.domain)
                            fastify.server.setSecureContext({ cert: certAndKey.cert, key: certAndKey.pkey })

                            fastify.log.info({ expiry: getCertExpiry(certAndKey.cert) }, 'Cert renewed')
                        } catch (error) {
                            fastify.log.error({ error }, 'Failed to renew cert')
                        }
                    }
                } catch (error) {
                    fastify.log.error({ error }, 'Unexpected error while renewing cert')
                }
            },
            1000 * 60 * 60 // 1 hour
        )
    }
)
