import acme from 'acme-client'
import { Mutex } from 'async-mutex'

import { getAccountUrl, getAcmeAccountPkey } from './utils.js'

const ACME_CLIENT: acme.Client | null = null
const ACME_CLIENT_MUTEX = new Mutex()

export function getAcmeClient(certDir: string): Promise<acme.Client> {
    return ACME_CLIENT_MUTEX.runExclusive(async () => {
        if (ACME_CLIENT === null) {
            const pkey = await getAcmeAccountPkey(certDir)

            return new acme.Client({
                directoryUrl: acme.directory.letsencrypt.production,
                accountUrl: getAccountUrl(certDir),
                accountKey: pkey
            })
        }

        return ACME_CLIENT
    })
}
