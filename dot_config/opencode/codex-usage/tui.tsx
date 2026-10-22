import { Plugin } from "@opencode/plugin/tui";
import { For, Show } from "solid-js";
import { formatReset, readLimits } from "./usage.js";

type UsageWindow = {
  id: string;
  label: string;
  remainingPercent: number;
  resetsAt: number | null;
};

export default Plugin.define({
  id: "local.codex-usage",
  setup(ctx) {
    const [state, update] = ctx.storage.memory<{
      windows: UsageWindow[];
      checkedAt: number | null;
      error: string | null;
      now: number;
    }>("usage", {
      initial: { windows: [], checkedAt: null, error: null, now: Date.now() },
    });
    const controller = new AbortController();
    let pending: Promise<void> | undefined;

    function refresh() {
      if (pending) return pending;
      pending = readLimits({ signal: controller.signal })
        .then((snapshot) => {
          if (controller.signal.aborted) return;
          update((draft) => {
            draft.windows = snapshot.windows;
            draft.checkedAt = snapshot.checkedAt;
            draft.error = null;
            draft.now = Date.now();
          });
        })
        .catch((error) => {
          if (!controller.signal.aborted) {
            update((draft) => {
              draft.error = error.message;
            });
          }
        })
        .finally(() => {
          pending = undefined;
        });
      return pending;
    }

    const removeSlot = ctx.ui.slot({
      append: "sidebar.content",
      render: () => (
        <box flexDirection="column" gap={1}>
          <text fg={ctx.theme.text.base}>
            <b>Codex usage{state.error && state.checkedAt ? " (stale)" : ""}</b>
          </text>
          <For each={state.windows}>
            {(window) => (
              <box flexDirection="column">
                <text fg={ctx.theme.text.base}>
                  {window.label}: {Math.round(window.remainingPercent)}% left
                </text>
                <text fg={ctx.theme.text.muted}>
                  {formatReset(window.resetsAt, state.now)}
                </text>
              </box>
            )}
          </For>
          <Show when={state.error || !state.checkedAt}>
            <text fg={ctx.theme.text.muted}>{state.error ?? "Loading…"}</text>
          </Show>
        </box>
      ),
    });
    ctx.keymap.layer(() => ({
      mode: "global",
      commands: [
        {
          id: "local.codex-usage.refresh",
          title: "Refresh Codex CLI usage",
          group: "Codex",
          palette: true,
          slash: { name: "codex-usage" },
          run: () => refresh(),
        },
      ],
    }));
    const poll = setInterval(() => void refresh(), 90_000);
    const clock = setInterval(
      () =>
        update((draft) => {
          draft.now = Date.now();
        }),
      60_000,
    );
    void refresh();

    return () => {
      controller.abort();
      clearInterval(poll);
      clearInterval(clock);
      removeSlot();
    };
  },
});
