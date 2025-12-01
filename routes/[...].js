import { readBody, getQuery, getRequestHeaders, getMethod } from 'h3'
import { ofetch } from 'ofetch'

const apiFetch = ofetch.create({
  baseURL: 'https://api.peachbitcoin.com',
  // force JSON parsing so you always get a JS object, not raw bytes
  responseType: 'json',
  async onRequest({ request, options }) {
    console.log('[peach fetch request]', request, options)
  },
  async onResponse({ request, response, options }) {
    console.log('[peach fetch response]', request, response.status)
  },
  async onRequestError({ request, error }) {
    console.log('[peach fetch request error]', request, error)
  },
  async onResponseError({ request, response }) {
    console.log('[peach fetch response error]', request, response._data)
  }
})

export default defineEventHandler(async (event) => {
  const method = getMethod(event)
  const params = event.context.params._      // e.g. "v1/info/paymentMethods"
  const query = getQuery(event)

  // Start from incoming headers…
  const incomingHeaders = getRequestHeaders(event)

  // …but DO NOT forward everything blindly.
  // Strip problematic ones so Node/ofetch can handle compression and
  // let Nitro set correct response headers.
  const headers = {
    ...incomingHeaders,
    host: 'api.peachbitcoin.com',
    accept: 'application/json'
  }

  delete headers['accept-encoding']
  delete headers['content-length']
  delete headers['connection']
  delete headers['origin']
  delete headers['referer']

  let body
  if (method !== 'GET' && method !== 'HEAD') {
    body = await readBody(event)
  }

  const data = await apiFetch(`/${params}`, {
    method,
    headers,
    query,
    body
  })

  return data
})

