export const config = {
  runtime: 'edge'
}

export default async function handler(req) {
  const TARGET_WORKER = process.env.TARGET_WORKER
  const AUTH_KEY = process.env.AUTH_KEY

  // 鉴权
  const url = new URL(req.url)
  const auth = url.searchParams.get('auth')
  if (AUTH_KEY && auth !== AUTH_KEY) {
    return new Response('Unauthorized', { status: 401 })
  }

  // 直接把完整路径拼过去
  const targetUrl = TARGET_WORKER.replace(/\/$/, '') + url.pathname + url.search

  const res = await fetch(targetUrl, {
    method: req.method,
    headers: req.headers,
    body: req.body
  })

  return new Response(res.body, {
    status: res.status,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET,POST,OPTIONS'
    }
  })
}
