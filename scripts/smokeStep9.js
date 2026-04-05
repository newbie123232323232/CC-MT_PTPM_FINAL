async function call(url, options = {}) {
  const res = await fetch(url, options);
  let body = null;
  try {
    body = await res.json();
  } catch (_) {
    body = await res.text();
  }
  return { status: res.status, body };
}

async function main() {
  const base = process.env.SMOKE_BASE_URL || 'http://localhost:5000';

  const checks = [];
  checks.push(await call(`${base}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'unknown@example.com', password: 'x' }),
  }));
  checks.push(await call(`${base}/profiles`));
  checks.push(await call(`${base}/movies/random`));

  const ok1 = checks[0].status === 401 || checks[0].status === 500;
  const ok2 = checks[1].status === 401;
  const ok3 = checks[2].status === 401;

  console.log('Smoke /auth/login (invalid):', checks[0].status);
  console.log('Smoke /profiles (no token):', checks[1].status);
  console.log('Smoke /movies/random (no token):', checks[2].status);

  if (!(ok1 && ok2 && ok3)) {
    process.exitCode = 1;
    throw new Error('Smoke checks failed');
  }
}

main().catch((err) => {
  console.error(err.message || err);
  process.exitCode = 1;
});
