/**
 * One-shot readiness: seed DB → start API → run integration tests → stop API.
 * Usage: npm run bootstrap:dev
 */
const path = require('path');
const { spawn, execSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
require('dotenv').config({ path: path.join(ROOT, '.env') });

const PORT = process.env.PORT || 5000;
const BASE_URL = `http://127.0.0.1:${PORT}`;
const EMAIL = process.env.INTEGRATION_EMAIL || 'seed-admin@zetflix.local';
const PASSWORD = process.env.INTEGRATION_PASSWORD || '12345678';

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function waitForApi(server, timeoutMs = 90000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    if (server.exitCode != null) {
      throw new Error(
        `Server process exited early (code ${server.exitCode}). Check MongoDB and PORT ${PORT}.`
      );
    }
    try {
      const res = await fetch(`${BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
      });
      if (res.status === 200) {
        const body = await res.json();
        if (body?.accessToken) return;
      }
    } catch (_) {
      /* connection refused until listen + DB */
    }
    await sleep(400);
  }
  throw new Error(`API not ready within ${timeoutMs}ms (${BASE_URL})`);
}

async function main() {
  if (!process.env.MONGO_URL || !process.env.SECRET_KEY) {
    console.error('Missing MONGO_URL or SECRET_KEY in .env');
    process.exitCode = 1;
    return;
  }

  console.log('[bootstrap:dev] seed:phase1');
  execSync('node scripts/seedPhase1.js', { stdio: 'inherit', cwd: ROOT });

  console.log(`[bootstrap:dev] starting API (${BASE_URL})`);
  const server = spawn(process.execPath, ['index.js'], {
    cwd: ROOT,
    stdio: 'inherit',
    env: { ...process.env, PORT: String(PORT) },
  });

  try {
    await waitForApi(server);
    console.log('[bootstrap:dev] integration test');
    execSync('node --test tests/integration-flow.test.js', {
      stdio: 'inherit',
      cwd: ROOT,
      env: {
        ...process.env,
        INTEGRATION_BASE_URL: BASE_URL,
        INTEGRATION_EMAIL: EMAIL,
        INTEGRATION_PASSWORD: PASSWORD,
      },
    });
    console.log('[bootstrap:dev] done');
  } catch (err) {
    console.error(err.message || err);
    process.exitCode = 1;
  } finally {
    if (server.pid && server.exitCode == null) {
      server.kill('SIGTERM');
      await sleep(800);
      if (server.exitCode == null) {
        server.kill('SIGKILL');
      }
    }
  }
}

main();
