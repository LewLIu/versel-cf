export const config = {
  runtime: 'edge'
}

const ALLOWED_METHODS = ['GET', 'POST', 'OPTIONS']

export default async function handler(req) {
  const TARGET_WORKER = process.env.TARGET_WORKER
  const AUTH_KEY = process.env.AUTH_KEY

  // 1. 只允许常用方法
  if (!ALLOWED_METHODS.includes(req.method)) {
    return new Response('Method Not Allowed', { status: 405 })
  }

  // 2. 强制鉴权（没有 AUTH_KEY 就不启用）
  if (AUTH_KEY) {
    const auth = req.headers.get('auth') 
             || req.headers.get('Authorization')
             || new URL(req.url).searchParams.get('auth')

    if (!auth || auth !== AUTH_KEY && auth !== `Bearer ${AUTH_KEY}`) {
      return new Response('Unauthorized', { status: 401 })
    }
  }

  // 3. 拼接路径
  const { path } = req.query || {}
  const url = new URL(req.url)
  const target = new URL(path ? path.join('/') : '', TARGET_WORKER)
  target.search = url.search

  // 4. 转发请求
  const res = await fetch(target, {
    method: req.method,
    headers: cleanHeaders(req.headers, target.host),
    body: req.method === 'OPTIONS' ? null : req.body
  })

  // 5. 安全返回
  return new Response(res.body, {
    status: res.status,
    headers: buildSafeHeaders(res.headers)
  })
}

// 清理请求头
function cleanHeaders(headers, host) {
  const h = new Headers(headers)
  h.set('Host', host)
  h.delete('cf-connecting-ip')
  h.delete('cf-ray')
  return h
}

// 安全响应头 + 跨域
function buildSafeHeaders(headers) {
  const h = new Headers(headers)
  h.set('Access-Control-Allow-Origin', '*')
  h.set('Access-Control-Allow-Methods', 'GET,POST,OPTIONS')
  h.set('Access-Control-Allow-Headers', 'Content-Type,auth')
  h.delete('content-security-policy')
  return h
}
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
