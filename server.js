// Import library
const express = require("express");
const mongoose = require("mongoose");
const session = require("express-session");
const bcrypt = require("bcrypt");
const path = require("path");

const User = require("./models/user");
const Note = require("./models/note");

const app = express();

// ====== Koneksi ke MongoDB ======
mongoose.connect("mongodb://127.0.0.1:27017/catatanharian")
  .then(() => console.log("✅ Koneksi MongoDB berhasil"))
  .catch(err => console.error("❌ Koneksi MongoDB gagal:", err));

// ====== Middleware ======
app.use(express.urlencoded({ extended: true }));
app.use(session({
  secret: "rahasia",
  resave: false,
  saveUninitialized: true
}));

// ====== Folder public untuk file HTML, CSS, JS ======
app.use(express.static(path.join(__dirname, "public")));

// ====== ROUTE ======

// Registrasi
app.post("/register", async (req, res) => {
  const { name, email, password } = req.body;
  const hashed = await bcrypt.hash(password, 10);
  await User.create({ name, email, password: hashed });
  res.redirect("/login.html");
});

// Login
app.post("/login", async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (user && await bcrypt.compare(password, user.password)) {
    req.session.userId = user._id;
    res.redirect("/dashboard.html");
  } else {
    res.send("Login gagal! Email atau password salah.");
  }
});

// Ambil semua catatan user yang login
app.get("/notes/list", async (req, res) => {
  if (!req.session.userId) return res.json([]);
  const notes = await Note.find({ userId: req.session.userId }).sort({ date: -1 });
  res.json(notes);
});

// Tambah catatan
app.post("/notes/add", async (req, res) => {
  if (!req.session.userId) return res.redirect("/login.html");
  const { title, content } = req.body;
  await Note.create({ userId: req.session.userId, title, content });
  res.redirect("/dashboard.html");
});

// Edit catatan
app.post("/notes/edit/:id", async (req, res) => {
  const { title, content } = req.body;
  await Note.findByIdAndUpdate(req.params.id, { title, content });
  res.redirect("/dashboard.html");
});

// Hapus catatan
app.get("/notes/delete/:id", async (req, res) => {
  await Note.findByIdAndDelete(req.params.id);
  res.redirect("/dashboard.html");
});

// Logout
app.get("/logout", (req, res) => {
  req.session.destroy();
  res.redirect("/login.html");
});

// ====== Jalankan server ======
const PORT = process.env.PORT || 3000; // Render/Vercel pakai PORT otomatis
app.listen(PORT, () => {
  console.log(`🚀 Server berjalan di http://localhost:${PORT}`);
});
