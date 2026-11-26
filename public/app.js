const statusText = document.getElementById("status");
const message = document.getElementById("message");

async function sendForm(url, form) {
  const data = Object.fromEntries(new FormData(form).entries());
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  });
  const result = await response.json();
  statusText.textContent = result.mensaje || "Solicitud terminada.";
  if (response.ok && url.endsWith("/login")) {
    message.textContent = "Sesión iniciada como " + result.usuario.email;
  }
}

document.getElementById("registerForm").addEventListener("submit", async (event) => {
  event.preventDefault();
  try { await sendForm("/api/auth/register", event.target); }
  catch { statusText.textContent = "No se pudo conectar con el servidor."; }
});

document.getElementById("loginForm").addEventListener("submit", async (event) => {
  event.preventDefault();
  try { await sendForm("/api/auth/login", event.target); }
  catch { statusText.textContent = "No se pudo conectar con el servidor."; }
});

document.getElementById("profileBtn").addEventListener("click", async () => {
  try {
    const response = await fetch("/api/perfil");
    const result = await response.json();
    message.textContent = response.ok
      ? result.mensaje + " Usuario: " + result.usuario.email
      : result.mensaje;
    statusText.textContent = "Estado de la solicitud: " + response.status;
  } catch { statusText.textContent = "No se pudo conectar con el servidor."; }
});

document.getElementById("logoutBtn").addEventListener("click", async () => {
  try {
    const response = await fetch("/api/auth/logout", { method: "POST" });
    const result = await response.json();
    message.textContent = "Has cerrado tu sesión.";
    statusText.textContent = result.mensaje;
  } catch { statusText.textContent = "No se pudo conectar con el servidor."; }
});
