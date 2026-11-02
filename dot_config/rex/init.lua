rex.bind("cmd+ctrl+h", "pane.focus.left")
rex.bind("cmd+ctrl+j", "pane.focus.down")
rex.bind("cmd+ctrl+k", "pane.focus.up")
rex.bind("cmd+ctrl+l", "pane.focus.right")

rex.bind("ctrl+a>h", "pane.split.left")
rex.bind("ctrl+a>j", "pane.split.down")
rex.bind("ctrl+a>k", "pane.split.up")
rex.bind("ctrl+a>l", "pane.split.right")
rex.bind("ctrl+a>f", "pane.zoom")
rex.bind("ctrl+a>n", "session.new")
rex.bind("ctrl+a>s", "session.switch")
rex.bind("ctrl+a>shift+n", "client.tab.new")
for i = 1, 9 do
  rex.bind("ctrl+a>shift+" .. i, "client.tab.goto", { index = i })
end
rex.bind("ctrl+a>ctrl+a", "pane.send_key", { key = "ctrl+a" })

local shell = "com.superlogical.terminal.shell"

local function sessionByLabel(label)
  for _, session in ipairs(rex.call("session.list", {}).sessions or {}) do
    if session.label == label then
      return session.session_id
    end
  end
end

local function must(result, err)
  if err then error(err, 0) end
  return result
end

rex.action{
  name = "k9s_show",
  title = "Show k9s Session",
  run = function(ctx, args)
    local session_id = sessionByLabel("k9s")
    if not session_id then
      error("no k9s session", 0)
    end
    rex.client.queue("session.select", { session_id = session_id })
  end,
}

rex.action{
  name = "k9s",
  title = "Open k9s",
  args = { context = "string" },
  run = function(ctx, args)
    local label = args.context:match("[^:]+$")
    local layout = rex.layout.block{
      flavor = shell,
      options = { command = { "k9s", "--context", args.context } },
    }
    local session_id = sessionByLabel("k9s")
    local window_id
    if session_id then
      local view = must(rex.call("session.attach", { session_id = session_id })).view
      for _, window in ipairs(view.windows or {}) do
        if window.label == label then
          window_id = window.window_id
        end
      end
      if not window_id then
        window_id = must(rex.session.new_window{ session_id = session_id, window_label = label, layout = layout }).window_id
      end
    else
      local session = must(rex.call("session.create", {
        label = "k9s",
        initial_windows = { { window_label = label, layout = layout } },
      }))
      session_id = session.session_id
      window_id = session.initial_windows[1].window_id
    end
    rex.client.queue("session.select", { session_id = session_id, window_id = window_id })
  end,
}

rex.action{
  name = "shell_show",
  title = "Show Shell Session",
  run = function(ctx, args)
    local session_id
    for _, session in ipairs(rex.call("session.list", {}).sessions or {}) do
      if session.label ~= "k9s" then
        session_id = session.session_id
        break
      end
    end
    if not session_id then
      session_id = must(rex.call("session.create", {
        initial_windows = { { layout = rex.layout.block{ flavor = shell } } },
      })).session_id
    end
    rex.client.queue("session.select", { session_id = session_id })
  end,
}
