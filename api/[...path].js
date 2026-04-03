export const config = {
  runtime: 'edge'
}

export default async function handler(request) {
  try {
    // 从环境变量读取，代码里完全不暴露
    const TARGET_WORKER = process.env.TARGET_WORKER
    const AUTH_KEY = process.env.AUTH_KEY

    // 强制鉴权（可选但强烈建议）
    const userAuth = request.headers.get('auth')
    if (AUTH_KEY && userAuth !== AUTH_KEY) {
      return new Response('Unauthorized', { status: 401 })
    }

    const { path } = request.query || {}
    const url = new URL(request.url)

    const targetUrl = new URL(
      path ? path.join('/') : '',
      TARGET_WORKER
    )
    targetUrl.search = url.search

    const res = await fetch(targetUrl, {
      method: request.method,
      headers: createRequestHeaders(request.headers, TARGET_WORKER),
      body: request.body
    })

    return new Response(res.body, {
      status: res.status,
      headers: createResponseHeaders(res.headers)
    })
  } catch (err) {
    return new Response('Proxy error', { status: 500 })
  }
}

function createRequestHeaders(headers, target) {
  const h = new Headers(headers)
  h.set('Host', new URL(target).host)
  return h
}

function createResponseHeaders(headers) {
  const h = new Headers(headers)
  h.set('Access-Control-Allow-Origin', '*')
  h.set('Access-Control-Allow-Methods', 'GET,POST,OPTIONS')
  return h
}
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
