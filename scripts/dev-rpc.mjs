// Dev helper: call a TanStack Start server fn over HTTP with the seroval body format.
// Usage: node scripts/dev-rpc.mjs <serverFnId> <jsonData> [cookieHeader]
// Prints the raw response body and, if present, the set-cookie header on stderr.
import { toJSONAsync } from 'seroval'

const [, , id, rawData = '{}', cookie = ''] = process.argv

if (!id) {
	console.error('Usage: node scripts/dev-rpc.mjs <serverFnId> <jsonData> [cookieHeader]')
	process.exit(1)
}

const payload = await toJSONAsync({ data: JSON.parse(rawData) })

const response = await fetch(`http://localhost:5173/_serverFn/${id}`, {
	method: 'POST',
	headers: {
		'content-type': 'application/json',
		'x-tsr-serverFn': 'true',
		accept: 'application/json',
		...(cookie ? { cookie } : {}),
	},
	body: JSON.stringify(payload),
})

const setCookie = response.headers.get('set-cookie')
if (setCookie) {
	console.error(`set-cookie: ${setCookie}`)
}

console.log(await response.text())
