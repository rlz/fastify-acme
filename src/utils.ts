import fs from 'node:fs/promises'
import readline from 'node:readline/promises'

import acme from 'acme-client'
import { readFileSync, writeFileSync } from 'fs'
import path from 'path'

import { getAcmeClient } from './acme.js'

/**
 * Get the filename for the account URL
 *
 * @param certDir Directory where the account URL is stored
 * @returns The filename
 */
export function acmeAccountUrlFilename(certDir: string) {
    return path.join(certDir, 'acmeAccountUrl')
}

/**
 * Get the filename for the account key
 *
 * @param certDir Directory where the account key is stored
 * @returns The filename
 */
export function acmePkeyFilename(certDir: string) {
    return path.join(certDir, 'acmePkey.pem')
}

/**
 * Get the filename for the certificate
 *
 * @param certDir Directory where the certificate is stored
 * @returns The filename
 */
export function certFilename(certDir: string) {
    return path.join(certDir, 'cert.pem')
}

/**
 * Get the filename for the private key
 *
 * @param certDir Directory where the certificate private key is stored
 * @returns The filename
 */
export function certPkeyFilename(certDir: string) {
    return path.join(certDir, 'certPkey.pem')
}

/**
 * Read the account URL for the ACME client.
 * If account URL does not exist, you can create it with `registerAcmeAccount`
 *
 * @param certDir Directory where the certificate is stored
 * @returns The account URL or undefined if it does not exist
 */
export function getAccountUrl(certDir: string): string | undefined {
    try {
        return readFileSync(acmeAccountUrlFilename(certDir), 'ascii')
    } catch {
    }
}

/**
 * Register an account with the ACME server and store the account URL
 *
 * @param certDir Directory where the certificate is stored
 * @param email Account admin email
 * @returns Account URL
 */
export async function registerAcmeAccount(certDir: string, email: string): Promise<string> {
    const acmeClient = await getAcmeClient(certDir)

    const account = await acmeClient.createAccount({
        contact: [`mailto:${email}`],
        termsOfServiceAgreed: true
    })

    if (account.status !== 'valid') {
        throw Error('Can not register account')
    }

    const accountUrl = acmeClient.getAccountUrl()
    writeFileSync(acmeAccountUrlFilename(certDir), accountUrl, 'ascii')

    return accountUrl
}

/**
 * Read or create the account key for the ACME client
 *
 * @param certDir Directory wehere the account key is stored
 * @returns The account key
 */
export async function getAcmeAccountPkey(certDir: string): Promise<Buffer> {
    try {
        return readFileSync(acmePkeyFilename(certDir))
    } catch {
        return createAcmeAccountPkey(certDir)
    }
}

/**
 * Create a new account key for the ACME client
 *
 * @param certDir Directory wehere the account key is stored
 * @returns The account key
 */
export async function createAcmeAccountPkey(certDir: string): Promise<Buffer> {
    const pkey = await acme.crypto.createPrivateKey()
    writeFileSync(acmePkeyFilename(certDir), pkey.toString('ascii'))
    return pkey
}

export interface CertAndKey {
    pkey: Buffer
    cert: Buffer
}

/**
 * Read the TLS certificate and private key
 *
 * @param certDir Directory where the certificate is stored
 * @returns The TLS certificate and private key or undefined if they do not exist
 */
export async function getCert(certDir: string): Promise<CertAndKey | undefined> {
    try {
        const pkey = readFileSync(certPkeyFilename(certDir))
        const cert = readFileSync(certFilename(certDir))

        return { pkey, cert }
    } catch {
        return undefined
    }
}

type AddChallendgeFn = (token: string, content: string) => void
type RemoveChallendgeFn = (token: string) => void

/**
 * Create a new TLS certificate. You do not need to call this function directly.
 * Use `getCertAndKey` and fastify plugins instead.
 *
 * @param certDir Directory where the certificate is stored
 * @param domain Domain for the certificate
 * @param addChallendge Add challenge function
 * @param removeChallendge Remove challenge function
 * @returns New TLS certificate and private key
 */
export async function getNewCert(certDir: string, domain: string, addChallendge: AddChallendgeFn, removeChallendge: RemoveChallendgeFn): Promise<CertAndKey> {
    const acmeClient = await getAcmeClient(certDir)

    const [pkey, csr] = await acme.crypto.createCsr({
        commonName: domain
    })

    const cert = await acmeClient.auto({
        csr,
        challengePriority: ['http-01'],
        async challengeCreateFn(_, c, contents) {
            addChallendge(c.token, contents)
        },
        async challengeRemoveFn(_, c) {
            removeChallendge(c.token)
        }
    })

    writeFileSync(certPkeyFilename(certDir), pkey)
    writeFileSync(certFilename(certDir), cert, { encoding: 'ascii' })

    return { pkey, cert: Buffer.from(cert, 'ascii') }
}

/**
 * Get expiry date of a TLS certificate
 *
 * @param cert TLS certificate
 * @returns Date when the certificate expires
 */
export function getCertExpiry(cert: Buffer): Date {
    return acme.crypto.readCertificateInfo(cert).notAfter
}

/**
 * Check if a TLS certificate should be renewed
 *
 * @param cert TLS certificate
 * @returns True if the certificate should be renewed
 */
export function shouldRenewCert(cert?: Buffer): boolean {
    if (cert === undefined) {
        return true
    }

    const nowMillis = Date.now()
    const expiryMillis = getCertExpiry(cert).getTime()
    const millisLeft = expiryMillis - nowMillis
    return millisLeft < 30 * 24 * 60 * 60 * 1000 // 30 days
}

/**
 * CLI tool to register an ACME account
 */
export async function registerAcmeAccountCli() {
    const rl = readline.createInterface(process.stdin, process.stdout)

    const certDirAnswer = await rl.question('Certificate directory [./cert]: ')
    const certDir = certDirAnswer === '' ? './cert' : certDirAnswer

    try {
        await fs.access(certDir)
    } catch {
        process.stdout.write('Certificate directory does not exist. Creating...\n')
        await fs.mkdir(certDir, { recursive: true })
    }

    if (getAccountUrl(certDir) !== undefined) {
        process.stdout.write('Account already created\n\n')
        process.stdout.write('If you need a new account, delete the account files\n')
        process.exit(1)
    }

    const email = await rl.question('E-mail: ')

    await registerAcmeAccount(certDir, email)

    process.stdout.write('Success!')
    process.exit()
}
