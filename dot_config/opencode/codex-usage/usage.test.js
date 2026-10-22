import assert from "node:assert/strict";
import { EventEmitter } from "node:events";
import { PassThrough } from "node:stream";
import test from "node:test";
import { formatReset, parseLimits, readLimits } from "./usage.js";

const limits = {
  limitId: "codex",
  primary: { usedPercent: 25, windowDurationMins: 300, resetsAt: 2000 },
  secondary: { usedPercent: 100, windowDurationMins: 10080, resetsAt: 3000 },
};

function mockCodex(onRequest = () => {}) {
  const child = new EventEmitter();
  child.stdin = new PassThrough();
  child.stdout = new PassThrough();
  child.killed = false;
  child.kill = () => {
    child.killed = true;
  };
  const requests = [];
  child.stdin.on("data", (chunk) => {
    const request = JSON.parse(chunk.toString());
    requests.push(request);
    queueMicrotask(() => onRequest(request, child));
  });
  const reply = (message) => child.stdout.write(`${JSON.stringify(message)}\n`);
  const spawnProcess = (command, args, options) => {
    assert.equal(command, "codex");
    assert.deepEqual(args, ["app-server"]);
    assert.deepEqual(options.stdio, ["pipe", "pipe", "ignore"]);
    return child;
  };
  return { child, requests, reply, spawnProcess };
}

test("parses quota windows, including a fully used allowance", () => {
  const snapshot = parseLimits({ rateLimits: limits });
  assert.deepEqual(snapshot.windows, [
    { id: "codex:primary", label: "5h", remainingPercent: 75, resetsAt: 2000 },
    {
      id: "codex:secondary",
      label: "Weekly",
      remainingPercent: 0,
      resetsAt: 3000,
    },
  ]);
  assert.ok(snapshot.checkedAt > 0);
});

test("prefers multi-bucket limits without duplicating the legacy view", () => {
  const snapshot = parseLimits({
    rateLimits: limits,
    rateLimitsByLimitId: {
      codex: limits,
      other: {
        limitId: "other",
        limitName: "Other model",
        primary: { usedPercent: 0, windowDurationMins: 15 },
      },
    },
  });
  assert.equal(snapshot.windows.length, 3);
  assert.deepEqual(snapshot.windows[2], {
    id: "other:primary",
    label: "Other model · 15m",
    remainingPercent: 100,
    resetsAt: null,
  });
});

test("omits missing and invalid windows instead of inventing quota", () => {
  assert.throws(
    () => parseLimits({ rateLimits: { primary: { usedPercent: "25" } } }),
    /No subscription limits/,
  );
  assert.throws(() => parseLimits({}), /No subscription limits/);
  const snapshot = parseLimits({ rateLimits: { secondary: limits.secondary } });
  assert.equal(snapshot.windows.length, 1);
  assert.equal(snapshot.windows[0].label, "Weekly");
});

test("clamps percentages to the display range", () => {
  const snapshot = parseLimits({
    rateLimits: {
      primary: { usedPercent: -1 },
      secondary: { usedPercent: 101 },
    },
  });
  assert.deepEqual(
    snapshot.windows.map((window) => window.remainingPercent),
    [100, 0],
  );
});

test("formats future, expired, and unknown reset times", () => {
  assert.equal(formatReset(null, 0), "Reset unknown");
  assert.equal(formatReset(0, 0), "Reset due");
  assert.equal(formatReset(61, 0), "Resets in 2m");
  assert.equal(formatReset(3660, 0), "Resets in 1h 1m");
  assert.equal(formatReset(90000, 0), "Resets in 1d 1h");
});

test("initializes before reading limits and never starts a model turn", async () => {
  const mock = mockCodex((request) => {
    if (request.id === 1) {
      mock.reply({ method: "account/updated", params: {} });
      mock.reply({ id: 1, result: {} });
    }
    if (request.id === 2) mock.reply({ id: 2, result: { rateLimits: limits } });
  });
  const result = await readLimits({ spawnProcess: mock.spawnProcess });
  assert.equal(result.windows[0].remainingPercent, 75);
  assert.deepEqual(
    mock.requests.map((request) => request.method),
    ["initialize", "initialized", "account/rateLimits/read"],
  );
  assert.equal(mock.child.killed, true);
  assert.equal(mock.child.stdin.destroyed, true);
});

test("handles split JSON lines", async () => {
  const mock = mockCodex((request, child) => {
    if (request.id === 1) {
      child.stdout.write('{"id":1,"res');
      child.stdout.write('ult":{}}\n');
    }
    if (request.id === 2) mock.reply({ id: 2, result: { rateLimits: limits } });
  });
  assert.equal(
    (await readLimits({ spawnProcess: mock.spawnProcess })).windows.length,
    2,
  );
});

test("does not expose server error details", async () => {
  const mock = mockCodex(() =>
    mock.reply({ id: 1, error: { message: "sensitive server detail" } }),
  );
  await assert.rejects(
    readLimits({ spawnProcess: mock.spawnProcess }),
    (error) => {
      assert.match(error.message, /codex login status/);
      assert.doesNotMatch(error.message, /sensitive/);
      return true;
    },
  );
  assert.equal(mock.child.killed, true);
});

test("reports a missing CLI", async () => {
  const mock = mockCodex(() => {
    mock.child.emit(
      "error",
      Object.assign(new Error("missing"), { code: "ENOENT" }),
    );
  });
  await assert.rejects(
    readLimits({ spawnProcess: mock.spawnProcess }),
    /not found/,
  );
});

test("times out and terminates the child process", async () => {
  const mock = mockCodex();
  await assert.rejects(
    readLimits({ spawnProcess: mock.spawnProcess, timeoutMs: 10 }),
    /timed out/,
  );
  assert.equal(mock.child.killed, true);
});

test("cancels an active request and terminates the child process", async () => {
  const controller = new AbortController();
  const mock = mockCodex(() => controller.abort());
  await assert.rejects(
    readLimits({ spawnProcess: mock.spawnProcess, signal: controller.signal }),
    /cancelled/,
  );
  assert.equal(mock.child.killed, true);
});

test("does not spawn when already cancelled", async () => {
  await assert.rejects(
    readLimits({
      signal: AbortSignal.abort(),
      spawnProcess: () => assert.fail("must not spawn"),
    }),
    /cancelled/,
  );
});

test("rejects invalid protocol output", async () => {
  const mock = mockCodex((_, child) => child.stdout.write("not json\n"));
  await assert.rejects(
    readLimits({ spawnProcess: mock.spawnProcess }),
    /unsupported usage data/,
  );
});

test("reports an early exit", async () => {
  const mock = mockCodex((_, child) => child.emit("close", 1));
  await assert.rejects(
    readLimits({ spawnProcess: mock.spawnProcess }),
    /exited before/,
  );
});
