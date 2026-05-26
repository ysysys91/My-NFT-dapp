export const runtime = 'nodejs'

const PINATA_FILE_ENDPOINT = 'https://api.pinata.cloud/pinning/pinFileToIPFS'
const PINATA_JSON_ENDPOINT = 'https://api.pinata.cloud/pinning/pinJSONToIPFS'

function getJwt() {
  const jwt = process.env.PINATA_JWT
  if (!jwt) throw new Error('Missing PINATA_JWT')
  return jwt.trim()
}

export async function POST(request: Request) {
  try {
    const incoming = await request.formData()
    const file = incoming.get('file')
    const name = String(incoming.get('name') ?? '').trim()
    const description = String(incoming.get('description') ?? '').trim()

    if (!(file instanceof File)) {
      return Response.json({ error: 'file is required' }, { status: 400 })
    }
    if (!name) {
      return Response.json({ error: 'name is required' }, { status: 400 })
    }

    const jwt = getJwt()

    const pinFileForm = new FormData()
    pinFileForm.append('file', file, file.name || 'nft-asset')

    const fileRes = await fetch(PINATA_FILE_ENDPOINT, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${jwt}`,
      },
      body: pinFileForm,
    })

    if (!fileRes.ok) {
      const text = await fileRes.text().catch(() => '')
      return Response.json(
        { error: 'pinFileToIPFS failed', detail: text || fileRes.statusText },
        { status: 502 },
      )
    }

    const fileJson = (await fileRes.json()) as { IpfsHash?: string }
    const fileHash = fileJson.IpfsHash
    if (!fileHash) {
      return Response.json(
        { error: 'pinFileToIPFS missing IpfsHash' },
        { status: 502 },
      )
    }

    const metadata = {
      name,
      description,
      image: `ipfs://${fileHash}`,
    }

    const jsonRes = await fetch(PINATA_JSON_ENDPOINT, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${jwt}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(metadata),
    })

    if (!jsonRes.ok) {
      const text = await jsonRes.text().catch(() => '')
      return Response.json(
        { error: 'pinJSONToIPFS failed', detail: text || jsonRes.statusText },
        { status: 502 },
      )
    }

    const jsonOut = (await jsonRes.json()) as { IpfsHash?: string }
    const metadataHash = jsonOut.IpfsHash
    if (!metadataHash) {
      return Response.json(
        { error: 'pinJSONToIPFS missing IpfsHash' },
        { status: 502 },
      )
    }

    return Response.json({
      image: {
        ipfs: `ipfs://${fileHash}`,
        gateway: `https://gateway.pinata.cloud/ipfs/${fileHash}`,
        hash: fileHash,
      },
      metadata: {
        ipfs: `ipfs://${metadataHash}`,
        gateway: `https://gateway.pinata.cloud/ipfs/${metadataHash}`,
        hash: metadataHash,
      },
    })
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Unknown error'
    return Response.json({ error: message }, { status: 500 })
  }
}
