require("dotenv").config();

const express = require("express");
const session = require("express-session");
const bcrypt = require("bcryptjs");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(session({
  name: "agrovida.sid",
  secret: process.env.SESSION_SECRET || "clave_temporal",
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: false, 
    sameSite: "lax",
    maxAge: 1000 * 60 * 30
  }
}));

//página web que está dentro de la carpeta public.
app.use(express.static(path.join(__dirname, "public")));

// Usuarios guardados 
const usuarios = [];
let siguienteId = 1;

// REGISTRO: POST 
app.post("/api/auth/register", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ mensaje: "Escribe tu correo y contraseña." });
    }

    const correo = String(email).trim().toLowerCase();
    if (usuarios.some(u => u.email === correo)) {
      return res.status(409).json({ mensaje: "Ese correo ya está registrado." });
    }

    const passwordHash = await bcrypt.hash(String(password), 10);
    const nuevoUsuario = { id: siguienteId++, email: correo, password: passwordHash };
    usuarios.push(nuevoUsuario);

    return res.status(201).json({
      mensaje: "Registro correcto. Ahora puedes iniciar sesión.",
      usuario: { id: nuevoUsuario.id, email: nuevoUsuario.email }
    });
  } catch (error) {
    return res.status(500).json({ mensaje: "Error al registrar el usuario." });
  }
});

// LOGIN: POST /api/auth/login
app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const correo = String(email || "").trim().toLowerCase();
    const usuario = usuarios.find(u => u.email === correo);

    if (!usuario || !await bcrypt.compare(String(password || ""), usuario.password)) {
      return res.status(401).json({ mensaje: "Correo o contraseña incorrectos." });
    }

    req.session.regenerate(error => {
      if (error) return res.status(500).json({ mensaje: "No se pudo iniciar la sesión." });

      req.session.userId = usuario.id;
      req.session.save(saveError => {
        if (saveError) return res.status(500).json({ mensaje: "No se pudo guardar la sesión." });
        return res.json({
          mensaje: "¡Bienvenido a AgroVida! Sesión iniciada.",
          usuario: { id: usuario.id, email: usuario.email }
        });
      });
    });
  } catch (error) {
    return res.status(500).json({ mensaje: "Error al iniciar sesión." });
  }
});

// MIDDLEWARE para proteger la página privada 
function authMiddleware(req, res, next) {
  if (req.session && req.session.userId) return next();
  return res.status(401).json({ mensaje: "Acceso no autorizado. Inicia sesión primero." });
}

// PERFIL PROTEGIDO:
app.get("/api/perfil", authMiddleware, (req, res) => {
  const usuario = usuarios.find(u => u.id === req.session.userId);
  if (!usuario) return res.status(404).json({ mensaje: "Usuario no encontrado." });

  res.json({
    mensaje: "Esta es tu sección privada de AgroVida.",
    usuario: { id: usuario.id, email: usuario.email },
    contenido: "Aquí puedes consultar información de tu cuenta."
  });
});

// LOGOUT: POST /api/auth/logout
app.post("/api/auth/logout", (req, res) => {
  if (!req.session) return res.json({ mensaje: "Sesión cerrada." });

  req.session.destroy(error => {
    if (error) return res.status(500).json({ mensaje: "No se pudo cerrar la sesión." });
    res.clearCookie("agrovida.sid", {
      httpOnly: true,
      secure: false,
      sameSite: "lax"
    });
    return res.json({ mensaje: "Sesión cerrada correctamente." });
  });
});

app.listen(PORT, () => {
  console.log(`AgroVida funcionando en http://localhost:${PORT}`);
});
