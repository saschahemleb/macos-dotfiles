import { spawn } from "node:child_process";
import { homedir } from "node:os";
import { createInterface } from "node:readline";

function windowLabel(minutes, fallback) {
  if (minutes === 10080) return "Weekly";
  if (!Number.isFinite(minutes) || minutes <= 0) return fallback;
  return minutes % 60 === 0 ? `${minutes / 60}h` : `${minutes}m`;
}

export function parseLimits(result) {
  const buckets = Object.values(result?.rateLimitsByLimitId ?? {});
  if (buckets.length === 0 && result?.rateLimits) {
    buckets.push(result.rateLimits);
  }
  const windows = buckets.flatMap((bucket, index) => {
    if (!bucket) return [];
    return ["primary", "secondary"].flatMap((key) => {
      const window = bucket[key];
      if (!Number.isFinite(window?.usedPercent)) return [];
      const label = windowLabel(window.windowDurationMins, key);
      const prefix =
        bucket.limitId && bucket.limitId !== "codex"
          ? `${bucket.limitName || bucket.limitId} · `
          : "";
      return [
        {
          id: `${bucket.limitId ?? index}:${key}`,
          label: `${prefix}${label}`,
          remainingPercent: Math.max(
            0,
            Math.min(100, 100 - window.usedPercent),
          ),
          resetsAt: Number.isFinite(window.resetsAt) ? window.resetsAt : null,
        },
      ];
    });
  });
  if (windows.length === 0) {
    throw new Error(
      "No subscription limits returned. Check your Codex CLI login.",
    );
  }
  return { windows, checkedAt: Date.now() };
}

export function formatReset(resetsAt, now = Date.now()) {
  if (!Number.isFinite(resetsAt)) return "Reset unknown";
  const minutes = Math.ceil((resetsAt * 1000 - now) / 60_000);
  if (minutes <= 0) return "Reset due";
  if (minutes < 60) return `Resets in ${minutes}m`;
  if (minutes < 1440)
    return `Resets in ${Math.floor(minutes / 60)}h ${minutes % 60}m`;
  return `Resets in ${Math.floor(minutes / 1440)}d ${Math.floor((minutes % 1440) / 60)}h`;
}

export function readLimits({
  signal,
  timeoutMs = 15_000,
  spawnProcess = spawn,
} = {}) {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new Error("Codex usage check cancelled."));
      return;
    }
    const child = spawnProcess("codex", ["app-server"], {
      cwd: homedir(),
      stdio: ["pipe", "pipe", "ignore"],
    });
    const lines = createInterface({ input: child.stdout });
    let settled = false;
    let bytes = 0;
    const finish = (error, result) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      signal?.removeEventListener("abort", abort);
      lines.close();
      child.stdin.destroy();
      child.stdout.destroy();
      child.kill("SIGKILL");
      if (error) reject(error);
      else resolve(result);
    };
    const abort = () => finish(new Error("Codex usage check cancelled."));
    const timer = setTimeout(
      () => finish(new Error("Codex usage check timed out.")),
      timeoutMs,
    );
    const send = (message) => child.stdin.write(`${JSON.stringify(message)}\n`);

    signal?.addEventListener("abort", abort, { once: true });
    child.on("error", (error) =>
      finish(
        new Error(
          error.code === "ENOENT"
            ? "Codex CLI not found on OpenCode's PATH."
            : "Could not start Codex CLI.",
        ),
      ),
    );
    child.stdin.on("error", () =>
      finish(new Error("Codex CLI connection closed.")),
    );
    child.on("close", () =>
      finish(new Error("Codex CLI exited before returning limits.")),
    );
    child.stdout.on("data", (chunk) => {
      bytes += chunk.length;
      if (bytes > 1_048_576)
        finish(new Error("Codex CLI response exceeded the size limit."));
    });
    lines.on("line", (line) => {
      if (settled) return;
      try {
        const message = JSON.parse(line);
        if (message.id !== 1 && message.id !== 2) return;
        if (message.error) {
          finish(
            new Error(
              "Could not read Codex limits. Check `codex login status` in your terminal.",
            ),
          );
        } else if (message.id === 1) {
          send({ method: "initialized", params: {} });
          send({ method: "account/rateLimits/read", id: 2 });
        } else {
          finish(null, parseLimits(message.result));
        }
      } catch {
        finish(new Error("Codex CLI returned unsupported usage data."));
      }
    });
    send({
      method: "initialize",
      id: 1,
      params: {
        clientInfo: {
          name: "opencode_codex_usage",
          title: "OpenCode Codex Usage",
          version: "1.0.0",
        },
      },
    });
  });
}
