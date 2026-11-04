// Tiny response helpers (owner: Claude A). Errors are always {error:"plain words"}.
export const json = (res, status, body) => { res.statusCode = status; res.setHeader("content-type", "application/json; charset=utf-8"); res.setHeader("cache-control", status === 200 ? "public, max-age=60, s-maxage=60" : "no-store"); res.end(JSON.stringify(body)); };
export const fail = (res, status, msg) => json(res, status, { error: msg });
