(function () {
  "use strict";

  const API_URL = "http://localhost:3000/api/chat";
  const chatMessages = document.getElementById("chatMessages");
  const messageInput = document.getElementById("messageInput");
  const sendBtn = document.getElementById("sendBtn");

  let isLoading = false;

  function setLoading(loading) {
    isLoading = loading;
    sendBtn.disabled = loading;
  }

  function scrollToBottom() {
    chatMessages.scrollTo({
      top: chatMessages.scrollHeight,
      behavior: "smooth",
    });
  }

  function createMessageRow(role, content) {
    const row = document.createElement("div");
    row.className = "message-row " + role;
    row.setAttribute("data-role", role);

    const avatar = document.createElement("div");
    avatar.className = "message-avatar";
    avatar.textContent = role === "user" ? "You" : "AI";

    const bubble = document.createElement("div");
    bubble.className = "message-bubble";

    if (typeof content === "string") {
      bubble.textContent = content;
    } else {
      bubble.appendChild(content);
    }

    row.appendChild(avatar);
    row.appendChild(bubble);
    return row;
  }

  function createTypingIndicator() {
    const row = document.createElement("div");
    row.className = "message-row ai typing-row";
    row.setAttribute("data-role", "typing");
    row.setAttribute("aria-live", "polite");
    row.setAttribute("aria-label", "AI is thinking");

    const avatar = document.createElement("div");
    avatar.className = "message-avatar";
    avatar.textContent = "AI";

    const bubble = document.createElement("div");
    bubble.className = "message-bubble";
    const dots = document.createElement("div");
    dots.className = "typing-indicator";
    dots.innerHTML =
      '<span class="typing-dot"></span><span class="typing-dot"></span><span class="typing-dot"></span>';
    bubble.appendChild(dots);

    row.appendChild(avatar);
    row.appendChild(bubble);
    return row;
  }

  function appendUserMessage(text) {
    const row = createMessageRow("user", text);
    chatMessages.appendChild(row);
    scrollToBottom();
  }

  function appendAiMessage(text) {
    const row = createMessageRow("ai", text);
    chatMessages.appendChild(row);
    scrollToBottom();
  }

  function removeTypingIndicator() {
    const typing = chatMessages.querySelector(".typing-row");
    if (typing) typing.remove();
  }

  function showTypingIndicator() {
    const row = createTypingIndicator();
    chatMessages.appendChild(row);
    scrollToBottom();
  }

  async function sendMessage() {
    const text = messageInput.value.trim();
    if (!text || isLoading) return;

    messageInput.value = "";
    resizeInput();

    appendUserMessage(text);
    showTypingIndicator();
    setLoading(true);

    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      });

      removeTypingIndicator();

      if (!res.ok) {
        const errBody = await res.text();
        let errMsg = "Something went wrong.";
        try {
          const j = JSON.parse(errBody);
          if (j.error) errMsg = j.error;
        } catch (_) {}
        appendAiMessage("Error: " + errMsg);
        return;
      }

      const data = await res.json();
      const reply = data.reply != null ? String(data.reply) : "No response.";
      appendAiMessage(reply);
    } catch (err) {
      removeTypingIndicator();
      appendAiMessage("Error: " + (err.message || "Network error."));
    } finally {
      setLoading(false);
      messageInput.focus();
    }
  }

  function resizeInput() {
    messageInput.style.height = "auto";
    messageInput.style.height = Math.min(messageInput.scrollHeight, 200) + "px";
  }

  sendBtn.addEventListener("click", sendMessage);

  messageInput.addEventListener("keydown", function (e) {
    if (e.key !== "Enter") return;
    if (e.shiftKey) return;
    e.preventDefault();
    sendMessage();
  });

  messageInput.addEventListener("input", resizeInput);

  messageInput.addEventListener("paste", function () {
    requestAnimationFrame(resizeInput);
  });

  messageInput.focus();
})();
