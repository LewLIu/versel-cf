export const config = {
  runtime: 'edge'
}

const ALLOWED_METHODS = ['GET', 'POST', 'OPTIONS']

export default async function handler(req) {
  const TARGET_WORKER = process.env.TARGET_WORKER
  const AUTH_KEY = process.env.AUTH_KEY

  if (!TARGET_WORKER) {
    return new Response('TARGET_WORKER not set', { status: 500 })
  }

  if (!ALLOWED_METHODS.includes(req.method)) {
    return new Response('Method Not Allowed', { status: 405 })
  }

  // OPTIONS 预检直接返回
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: buildSafeHeaders(new Headers())
    })
  }

  // 鉴权
  if (AUTH_KEY) {
    const urlObj = new URL(req.url)
    const auth =
      req.headers.get('auth')
      || req.headers.get('Authorization')
      || urlObj.searchParams.get('auth')

    if (!auth || (auth !== AUTH_KEY && auth !== `Bearer ${AUTH_KEY}`)) {
      return new Response('Unauthorized', { status: 401 })
    }
  }

  try {
    const { path } = req.query || {}
    const urlObj = new URL(req.url)
    const target = new URL(path ? path.join('/') : '', TARGET_WORKER)
    target.search = urlObj.search

    const res = await fetch(target, {
      method: req.method,
      headers: cleanHeaders(req.headers, target.host),
      body: req.body
    })

    return new Response(res.body, {
      status: res.status,
      headers: buildSafeHeaders(res.headers)
    })
  } catch (err) {
    return new Response('Proxy error: ' + err.message, { status: 500 })
  }
}

function cleanHeaders(headers, host) {
  const h = new Headers(headers)
  h.set('Host', host)
  h.delete('cf-connecting-ip')
  h.delete('cf-ray')
  return h
}

function buildSafeHeaders(headers) {
  const h = new Headers(headers)
  h.set('Access-Control-Allow-Origin', '*')
  h.set('Access-Control-Allow-Methods', 'GET,POST,OPTIONS')
  h.set('Access-Control-Allow-Headers', 'Content-Type,auth,Authorization')
  h.delete('content-security-policy')
  return h
}
