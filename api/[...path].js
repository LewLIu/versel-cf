export const config = {
  runtime: 'edge'
}

// 👇 这里改成你自己的 Cloudflare Worker 完整地址！！！
const TARGET_WORKER = 'https://你的worker地址.workers.dev'

export default async function handler(request) {
  // 👇 改成你自己的密钥，比如"my-secret-key-123"
  const AUTH_KEY = "my-secret-key-123"
  const authHeader = request.headers.get("Authorization") || request.headers.get("auth")
  if (!authHeader || authHeader !== `Bearer ${AUTH_KEY}` && authHeader !== AUTH_KEY) {
    return new Response("Unauthorized", { status: 401 })
  }
  try {
    const { path } = request.query || {}
    const url = new URL(request.url)

    // 拼接完整目标地址
    const targetUrl = new URL(
      path ? path.join('/') : '',
      TARGET_WORKER
    )
    targetUrl.search = url.search

    // 转发请求到Cloudflare Worker
    const res = await fetch(targetUrl, {
      method: request.method,
      headers: createRequestHeaders(request.headers),
      body: request.body,
      redirect: 'follow'
    })

    // 返回结果，自动解决跨域
    return new Response(res.body, {
      status: res.status,
      headers: createResponseHeaders(res.headers)
    })
  } catch (err) {
    return new Response(`Proxy Error: ${err.message}`, {
      status: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'text/plain; charset=utf-8'
      }
    })
  }
}

// 处理请求头，修正Host避免Worker报错
function createRequestHeaders(headers) {
  const h = new Headers(headers)
  h.set('Host', new URL(TARGET_WORKER).host)
  // 移除可能导致问题的头
  h.delete('cf-connecting-ip')
  h.delete('cf-ray')
  return h
}

// 处理响应头，解决跨域、跳转等问题
function createResponseHeaders(headers) {
  const h = new Headers(headers)
  h.set('Access-Control-Allow-Origin', '*')
  h.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  h.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, *')
  h.set('Access-Control-Max-Age', '86400')
  // 移除可能导致浏览器拦截的安全头
  h.delete('content-security-policy')
  h.delete('x-frame-options')
  h.delete('x-content-type-options')
  return h
}
