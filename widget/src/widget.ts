(function () {
  if ((window as any).__BOTFORGE_WIDGET_INITIALIZED__) {
    return;
  }
  (window as any).__BOTFORGE_WIDGET_INITIALIZED__ = true;

  // 1. Resolve configuration from script tag
  const currentScript =
    (document.currentScript as HTMLScriptElement) ||
    (function () {
      const scripts = document.getElementsByTagName("script");
      for (let i = scripts.length - 1; i >= 0; i--) {
        if (scripts[i].getAttribute("data-public-key")) {
          return scripts[i];
        }
      }
      return null;
    })();

  if (!currentScript) {
    console.error("BotForge Widget: Could not locate initialization <script> tag.");
    return;
  }

  const publicKey = currentScript.getAttribute("data-public-key") || "";
  if (!publicKey) {
    console.error("BotForge Widget: 'data-public-key' attribute is missing on script tag.");
    return;
  }

  // Determine API base URL
  let apiUrl = currentScript.getAttribute("data-api-url") || "";
  if (!apiUrl && currentScript.src) {
    try {
      const parsedUrl = new URL(currentScript.src);
      apiUrl = parsedUrl.origin;
    } catch {
      apiUrl = "http://localhost:8000";
    }
  }
  if (!apiUrl) {
    apiUrl = "http://localhost:8000";
  }
  apiUrl = apiUrl.replace(/\/$/, "");

  const position = (currentScript.getAttribute("data-position") || "right").toLowerCase();
  const primaryColor = currentScript.getAttribute("data-color") || "#2563eb";
  const overrideTitle = currentScript.getAttribute("data-title") || "";

  // 2. Types & Storage keys
  interface Message {
    role: "user" | "assistant";
    content: string;
    timestamp: number;
  }

  const SESSION_KEY = `bf_session_${publicKey}`;
  const HISTORY_KEY = `bf_history_${publicKey}`;

  let sessionId: string | null = localStorage.getItem(SESSION_KEY);
  let messages: Message[] = [];
  try {
    const cached = localStorage.getItem(HISTORY_KEY);
    if (cached) {
      messages = JSON.parse(cached);
    }
  } catch {
    messages = [];
  }

  let isOpen = false;
  let isLoading = false;
  let companyName = overrideTitle || "AI Support";
  let botName = "Assistant";
  let welcomeMessage = "Hi there! 👋 How can I help you today?";

  // 3. Create host element and Shadow Root for style isolation
  const host = document.createElement("div");
  host.id = "botforge-widget-container";
  document.body.appendChild(host);

  const shadow = host.attachShadow({ mode: "open" });

  // 4. Injected Styles
  const style = document.createElement("style");
  style.textContent = `
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      -webkit-font-smoothing: antialiased;
    }

    :host {
      --primary: ${primaryColor};
      --primary-hover: #1d4ed8;
      --bg-panel: #0f172a;
      --bg-header: #1e293b;
      --bg-bubble-user: #2563eb;
      --bg-bubble-bot: #1e293b;
      --text-main: #f8fafc;
      --text-muted: #94a3b8;
      --border-color: #334155;
      z-index: 2147483647;
      position: fixed;
      ${position === "left" ? "left: 24px;" : "right: 24px;"}
      bottom: 24px;
    }

    /* Launcher Button */
    .bf-launcher {
      width: 58px;
      height: 58px;
      border-radius: 50%;
      background: linear-gradient(135deg, var(--primary), #3b82f6);
      box-shadow: 0 8px 24px rgba(37, 99, 235, 0.45), 0 2px 6px rgba(0, 0, 0, 0.2);
      border: none;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #ffffff;
      transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.25s ease;
      outline: none;
      user-select: none;
    }

    .bf-launcher:hover {
      transform: scale(1.06);
      box-shadow: 0 12px 30px rgba(37, 99, 235, 0.55), 0 4px 10px rgba(0, 0, 0, 0.25);
    }

    .bf-launcher:active {
      transform: scale(0.96);
    }

    .bf-launcher svg {
      width: 26px;
      height: 26px;
      transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
    }

    /* Chat Panel */
    .bf-panel {
      position: absolute;
      bottom: 74px;
      ${position === "left" ? "left: 0;" : "right: 0;"}
      width: 380px;
      height: 560px;
      max-height: calc(100vh - 120px);
      background: var(--bg-panel);
      border: 1px solid var(--border-color);
      border-radius: 20px;
      box-shadow: 0 16px 48px rgba(0, 0, 0, 0.55), 0 0 0 1px rgba(255, 255, 255, 0.05);
      display: flex;
      flex-direction: column;
      overflow: hidden;
      opacity: 0;
      transform: translateY(16px) scale(0.96);
      pointer-events: none;
      transition: opacity 0.24s cubic-bezier(0.16, 1, 0.3, 1), transform 0.24s cubic-bezier(0.16, 1, 0.3, 1);
    }

    .bf-panel.bf-open {
      opacity: 1;
      transform: translateY(0) scale(1);
      pointer-events: auto;
    }

    /* Header */
    .bf-header {
      background: var(--bg-header);
      padding: 14px 18px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 1px solid var(--border-color);
    }

    .bf-header-info {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .bf-avatar {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      background: linear-gradient(135deg, #3b82f6, #1d4ed8);
      display: flex;
      align-items: center;
      justify-content: center;
      color: #fff;
      font-weight: 700;
      font-size: 15px;
      position: relative;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.25);
    }

    .bf-status-dot {
      width: 9px;
      height: 9px;
      background: #10b981;
      border-radius: 50%;
      position: absolute;
      bottom: -1px;
      right: -1px;
      border: 2px solid var(--bg-header);
    }

    .bf-title-area h3 {
      font-size: 14px;
      font-weight: 700;
      color: var(--text-main);
      line-height: 1.2;
    }

    .bf-title-area p {
      font-size: 11px;
      color: var(--text-muted);
      margin-top: 2px;
    }

    .bf-header-actions {
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .bf-icon-btn {
      background: transparent;
      border: none;
      color: var(--text-muted);
      cursor: pointer;
      width: 28px;
      height: 28px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: background 0.15s, color 0.15s;
    }

    .bf-icon-btn:hover {
      background: rgba(255, 255, 255, 0.1);
      color: var(--text-main);
    }

    /* Messages list */
    .bf-messages {
      flex: 1;
      padding: 16px;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: 12px;
      scroll-behavior: smooth;
    }

    .bf-messages::-webkit-scrollbar {
      width: 5px;
    }
    .bf-messages::-webkit-scrollbar-thumb {
      background: #334155;
      border-radius: 4px;
    }

    .bf-msg {
      max-width: 84%;
      font-size: 13.5px;
      line-height: 1.5;
      word-break: break-word;
      animation: bfFadeIn 0.2s ease-out;
    }

    @keyframes bfFadeIn {
      from { opacity: 0; transform: translateY(6px); }
      to { opacity: 1; transform: translateY(0); }
    }

    .bf-msg-user {
      align-self: flex-end;
      background: var(--bg-bubble-user);
      color: #ffffff;
      padding: 10px 14px;
      border-radius: 16px 16px 4px 16px;
      box-shadow: 0 2px 8px rgba(37, 99, 235, 0.3);
    }

    .bf-msg-bot {
      align-self: flex-start;
      background: var(--bg-bubble-bot);
      color: var(--text-main);
      padding: 10px 14px;
      border-radius: 16px 16px 16px 4px;
      border: 1px solid rgba(255, 255, 255, 0.06);
    }

    .bf-msg-bot p {
      margin-bottom: 6px;
    }
    .bf-msg-bot p:last-child {
      margin-bottom: 0;
    }
    .bf-msg-bot strong {
      color: #93c5fd;
    }
    .bf-msg-bot code {
      background: rgba(0, 0, 0, 0.35);
      padding: 2px 5px;
      border-radius: 4px;
      font-size: 12px;
    }
    .bf-msg-bot a {
      color: #60a5fa;
      text-decoration: underline;
    }

    /* Typing indicator */
    .bf-typing {
      display: flex;
      align-items: center;
      gap: 4px;
      padding: 10px 14px;
      background: var(--bg-bubble-bot);
      border-radius: 16px 16px 16px 4px;
      width: fit-content;
      border: 1px solid rgba(255, 255, 255, 0.06);
    }

    .bf-typing-dot {
      width: 6px;
      height: 6px;
      background: var(--text-muted);
      border-radius: 50%;
      animation: bfPulse 1.2s infinite ease-in-out;
    }
    .bf-typing-dot:nth-child(2) { animation-delay: 0.2s; }
    .bf-typing-dot:nth-child(3) { animation-delay: 0.4s; }

    @keyframes bfPulse {
      0%, 80%, 100% { transform: scale(0.7); opacity: 0.4; }
      40% { transform: scale(1.1); opacity: 1; }
    }

    /* Footer & Input */
    .bf-footer {
      border-top: 1px solid var(--border-color);
      background: var(--bg-header);
      padding: 10px 14px 8px;
    }

    .bf-input-box {
      display: flex;
      align-items: center;
      background: #0f172a;
      border: 1px solid #334155;
      border-radius: 12px;
      padding: 6px 8px 6px 12px;
      transition: border-color 0.2s, box-shadow 0.2s;
    }

    .bf-input-box:focus-within {
      border-color: #3b82f6;
      box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
    }

    .bf-textarea {
      flex: 1;
      background: transparent;
      border: none;
      outline: none;
      color: var(--text-main);
      font-size: 13.5px;
      resize: none;
      max-height: 90px;
      line-height: 1.4;
    }

    .bf-textarea::placeholder {
      color: var(--text-muted);
    }

    .bf-send-btn {
      background: var(--primary);
      border: none;
      color: #fff;
      width: 32px;
      height: 32px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      margin-left: 8px;
      transition: background 0.15s, opacity 0.15s;
    }

    .bf-send-btn:disabled {
      opacity: 0.4;
      cursor: not-allowed;
    }

    .bf-send-btn:hover:not(:disabled) {
      background: var(--primary-hover);
    }

    .bf-branding {
      text-align: center;
      font-size: 10.5px;
      color: #64748b;
      margin-top: 6px;
      user-select: none;
    }

    /* Mobile adjustments */
    @media (max-width: 480px) {
      .bf-panel {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        width: 100vw;
        height: 100vh;
        max-height: 100vh;
        border-radius: 0;
        border: none;
      }
    }
  `;
  shadow.appendChild(style);

  // 5. HTML Structure
  const wrapper = document.createElement("div");
  wrapper.innerHTML = `
    <!-- Launcher Button -->
    <button class="bf-launcher" id="bf-launcher" aria-label="Open chat">
      <svg id="bf-icon-chat" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
      </svg>
      <svg id="bf-icon-close" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display: none;">
        <line x1="18" y1="6" x2="6" y2="18"></line>
        <line x1="6" y1="6" x2="18" y2="18"></line>
      </svg>
    </button>

    <!-- Chat Panel -->
    <div class="bf-panel" id="bf-panel">
      <!-- Header -->
      <div class="bf-header">
        <div class="bf-header-info">
          <div class="bf-avatar" id="bf-avatar">
            <span>AI</span>
            <div class="bf-status-dot"></div>
          </div>
          <div class="bf-title-area">
            <h3 id="bf-title">${escapeHtml(companyName)}</h3>
            <p id="bf-subtitle">Online • Instant Answers</p>
          </div>
        </div>
        <div class="bf-header-actions">
          <button class="bf-icon-btn" id="bf-btn-reset" title="Reset conversation">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path>
              <path d="M3 3v5h5"></path>
            </svg>
          </button>
          <button class="bf-icon-btn" id="bf-btn-close" title="Close chat">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
      </div>

      <!-- Messages Body -->
      <div class="bf-messages" id="bf-messages"></div>

      <!-- Footer & Input -->
      <div class="bf-footer">
        <div class="bf-input-box">
          <textarea
            id="bf-input"
            class="bf-textarea"
            placeholder="Type a message..."
            rows="1"
          ></textarea>
          <button id="bf-send-btn" class="bf-send-btn" disabled aria-label="Send">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="22" y1="2" x2="11" y2="13"></line>
              <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
            </svg>
          </button>
        </div>
        <div class="bf-branding">
          ⚡ Powered by <strong>BotForge</strong>
        </div>
      </div>
    </div>
  `;
  shadow.appendChild(wrapper);

  // 6. DOM Element References
  const launcherBtn = shadow.getElementById("bf-launcher") as HTMLButtonElement;
  const iconChat = shadow.getElementById("bf-icon-chat") as unknown as SVGElement;
  const iconClose = shadow.getElementById("bf-icon-close") as unknown as SVGElement;
  const panel = shadow.getElementById("bf-panel") as HTMLDivElement;
  const closeBtn = shadow.getElementById("bf-btn-close") as HTMLButtonElement;
  const resetBtn = shadow.getElementById("bf-btn-reset") as HTMLButtonElement;
  const messagesContainer = shadow.getElementById("bf-messages") as HTMLDivElement;
  const textarea = shadow.getElementById("bf-input") as HTMLTextAreaElement;
  const sendBtn = shadow.getElementById("bf-send-btn") as HTMLButtonElement;
  const titleEl = shadow.getElementById("bf-title") as HTMLHeadingElement;
  const avatarEl = shadow.getElementById("bf-avatar") as HTMLDivElement;

  // 7. Markdown parsing helper
  function formatMarkdown(text: string): string {
    let clean = escapeHtml(text);
    // Bold: **text**
    clean = clean.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
    // Inline code: `text`
    clean = clean.replace(/`([^`]+)`/g, "<code>$1</code>");
    // Bullet list items: - item
    clean = clean.replace(/(?:^|\n)-\s+(.*)/g, "<br>• $1");
    // Paragraph newlines
    clean = clean.replace(/\n\n/g, "</p><p>");
    clean = clean.replace(/\n/g, "<br>");
    return `<p>${clean}</p>`;
  }

  function escapeHtml(str: string): string {
    return str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  // 8. Render message list
  function renderMessages() {
    messagesContainer.innerHTML = "";

    // If empty history, show welcome message
    if (messages.length === 0) {
      const welcomeEl = document.createElement("div");
      welcomeEl.className = "bf-msg bf-msg-bot";
      welcomeEl.innerHTML = formatMarkdown(welcomeMessage);
      messagesContainer.appendChild(welcomeEl);
    } else {
      messages.forEach((msg) => {
        const msgEl = document.createElement("div");
        msgEl.className = `bf-msg ${msg.role === "user" ? "bf-msg-user" : "bf-msg-bot"}`;
        msgEl.innerHTML =
          msg.role === "assistant" ? formatMarkdown(msg.content) : escapeHtml(msg.content);
        messagesContainer.appendChild(msgEl);
      });
    }

    if (isLoading) {
      const typingEl = document.createElement("div");
      typingEl.className = "bf-typing";
      typingEl.id = "bf-typing-indicator";
      typingEl.innerHTML = `
        <div class="bf-typing-dot"></div>
        <div class="bf-typing-dot"></div>
        <div class="bf-typing-dot"></div>
      `;
      messagesContainer.appendChild(typingEl);
    }

    // Scroll to bottom
    setTimeout(() => {
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }, 10);
  }

  // 9. Fetch Tenant Branding Config
  async function fetchConfig() {
    try {
      const res = await fetch(`${apiUrl}/api/v1/widget/config`, {
        method: "GET",
        headers: {
          "X-Public-Key": publicKey,
        },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.company_name && !overrideTitle) {
          companyName = data.company_name;
          titleEl.textContent = companyName;
          const initials = companyName
            .split(" ")
            .map((w: string) => w[0])
            .join("")
            .slice(0, 2)
            .toUpperCase();
          if (initials) {
            avatarEl.querySelector("span")!.textContent = initials;
          }
        }
        if (data.welcome_message) {
          welcomeMessage = data.welcome_message;
          if (messages.length === 0) {
            renderMessages();
          }
        }
      }
    } catch (err) {
      console.warn("BotForge Widget: Config fetch failed, using defaults.", err);
    }
  }

  // 10. Toggle Panel Open/Close
  function setOpen(open: boolean) {
    isOpen = open;
    if (isOpen) {
      panel.classList.add("bf-open");
      iconChat.style.display = "none";
      iconClose.style.display = "block";
      setTimeout(() => textarea.focus(), 100);
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    } else {
      panel.classList.remove("bf-open");
      iconChat.style.display = "block";
      iconClose.style.display = "none";
    }
  }

  // 11. Send Message
  async function sendMessage() {
    const text = textarea.value.trim();
    if (!text || isLoading) return;

    // Append user message
    const userMsg: Message = {
      role: "user",
      content: text,
      timestamp: Date.now(),
    };
    messages.push(userMsg);
    textarea.value = "";
    textarea.style.height = "auto";
    sendBtn.disabled = true;
    isLoading = true;
    renderMessages();

    try {
      const res = await fetch(`${apiUrl}/api/v1/widget/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Public-Key": publicKey,
        },
        body: JSON.stringify({
          message: text,
          session_id: sessionId || null,
        }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => null);
        throw new Error(errJson?.detail || `Server error (${res.status})`);
      }

      const data = await res.json();
      if (data.session_id) {
        sessionId = data.session_id;
        localStorage.setItem(SESSION_KEY, sessionId!);
      }

      const botMsg: Message = {
        role: "assistant",
        content: data.answer || "I apologize, but I could not formulate a response.",
        timestamp: Date.now(),
      };
      messages.push(botMsg);
      localStorage.setItem(HISTORY_KEY, JSON.stringify(messages.slice(-20)));
    } catch (err: any) {
      const errorMsg: Message = {
        role: "assistant",
        content: `⚠️ ${err.message || "Unable to reach assistant. Please try again later."}`,
        timestamp: Date.now(),
      };
      messages.push(errorMsg);
    } finally {
      isLoading = false;
      renderMessages();
      textarea.focus();
    }
  }

  // 12. Reset Conversation
  function resetConversation() {
    sessionId = null;
    messages = [];
    localStorage.removeItem(SESSION_KEY);
    localStorage.removeItem(HISTORY_KEY);
    renderMessages();
  }

  // 13. Event Listeners
  launcherBtn.addEventListener("click", () => setOpen(!isOpen));
  closeBtn.addEventListener("click", () => setOpen(false));
  resetBtn.addEventListener("click", () => resetConversation());

  textarea.addEventListener("input", () => {
    sendBtn.disabled = !textarea.value.trim() || isLoading;
    textarea.style.height = "auto";
    textarea.style.height = `${Math.min(textarea.scrollHeight, 90)}px`;
  });

  textarea.addEventListener("keydown", (e: KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });

  sendBtn.addEventListener("click", () => sendMessage());

  // 14. Initialize
  renderMessages();
  fetchConfig();
})();
