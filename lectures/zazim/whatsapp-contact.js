(() => {
  "use strict";

  const WHATSAPP_PHONE = "972544956239";

  const container = document.getElementById("whatsappContact");
  const toggleButton = document.getElementById("whatsappToggle");
  const panel = document.getElementById("whatsappPanel");
  const form = document.getElementById("whatsappForm");
  const nameInput = document.getElementById("whatsappName");
  const messageInput = document.getElementById("whatsappMessage");
  const errorElement = document.getElementById("whatsappError");

  if (
    !container ||
    !toggleButton ||
    !panel ||
    !form ||
    !nameInput ||
    !messageInput ||
    !errorElement
  ) {
    console.error("WhatsApp contact form: required HTML elements are missing.");
    return;
  }

  function setPanelOpen(isOpen) {
    container.classList.toggle("is-open", isOpen);
    toggleButton.setAttribute("aria-expanded", String(isOpen));
    panel.setAttribute("aria-hidden", String(!isOpen));

    if (isOpen) {
      window.requestAnimationFrame(() => nameInput.focus());
    }
  }

  function showError(message) {
    errorElement.textContent = message;
  }

  toggleButton.addEventListener("click", () => {
    const isOpen = container.classList.contains("is-open");
    setPanelOpen(!isOpen);
  });

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    showError("");

    const name = nameInput.value.trim();
    const message = messageInput.value.trim();

    if (!name) {
      showError("יש להזין שם.");
      nameInput.focus();
      return;
    }

    if (!message) {
      showError("יש להזין הודעה.");
      messageInput.focus();
      return;
    }

    const whatsappMessage = `ליד מהאתר: ${name}\n${message}`;
    const whatsappUrl =
      `https://wa.me/${WHATSAPP_PHONE}?text=${encodeURIComponent(whatsappMessage)}`;

    const whatsappWindow = window.open(
      whatsappUrl,
      "_blank",
      "noopener,noreferrer"
    );

    if (!whatsappWindow) {
      console.error("WhatsApp contact form: the browser blocked the new window.");
      window.location.href = whatsappUrl;
    }

    setPanelOpen(false);
  });

  document.addEventListener("click", (event) => {
    if (
      container.classList.contains("is-open") &&
      !container.contains(event.target)
    ) {
      setPanelOpen(false);
    }
  });

  document.addEventListener("keydown", (event) => {
    if (
      event.key === "Escape" &&
      container.classList.contains("is-open")
    ) {
      setPanelOpen(false);
      toggleButton.focus();
    }
  });
})();
