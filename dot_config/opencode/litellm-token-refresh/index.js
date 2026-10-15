import { execFile as execFileCb } from "node:child_process";
import { join } from "node:path";
import { promisify } from "node:util";

const execFile = promisify(execFileCb);

const ENTRA_CLI_AUTH = join(process.env.HOME ?? "", ".local/bin/entra-cli-auth");
const EXPIRY_BUFFER_MS = 5 * 60 * 1000;

let cachedToken = "";
let tokenExpiry = 0;
let refreshPromise = null;

function parseExpiry(token) {
  try {
    const payload = JSON.parse(
      Buffer.from(token.split(".")[1], "base64url").toString(),
    );
    return payload.exp ? payload.exp * 1000 : 0;
  } catch {
    return 0;
  }
}

async function ensureToken() {
  if (cachedToken && Date.now() < tokenExpiry - EXPIRY_BUFFER_MS) {
    return cachedToken;
  }
  if (refreshPromise) return refreshPromise;

  try {
    const { stdout } = await execFile(ENTRA_CLI_AUTH);
    const token = stdout.trim();
    if (token) {
      cachedToken = token;
      tokenExpiry = parseExpiry(token);
    }
  } catch (err) {
    console.error("[litellm-token-refresh]", err.message);
  } finally {
    refreshPromise = null;
  }
  return cachedToken;
}

export default {
  id: "litellm-token-refresh",
  async setup(ctx) {
    await ensureToken();

    await ctx.session.hook(
      "model.request",
      async (event) => {
        const token = await ensureToken();
        if (token) {
          event.headers["Authorization"] = `Bearer ${token}`;
        }
      },
      { providerID: "litellm" },
    );

    await ctx.session.hook("retry", async (event) => {
      if (event.error?.status === 401) {
        cachedToken = "";
        tokenExpiry = 0;
        await ensureToken();
        event.decision = { retry: true, delay: 1000 };
      }
    });
  },
};
