const express = require("express");
const router = express.Router();
const connection = require("./config");
const { check, validationResult } = require('express-validator');
const crypto = require('crypto');

// Validasi untuk email, nama, dan password saat registrasi
const validateRegisterEdit = [
  check('nama').not().isEmpty().withMessage('Nama tidak boleh kosong'),
  check('email').isEmail().withMessage('Email tidak valid'),
  check('password').isLength({ min: 8 }).withMessage('Password harus minimal 8 karakter')
];

// Validasi untuk email dan password saat login
const validateLogin = [
  check('email').isEmail().withMessage('Email tidak valid'),
  check('password').notEmpty().withMessage('Password tidak boleh kosong')
];

// Register user
router.post("/register", validateRegisterEdit, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { nama, email, password} = req.body;

    // Periksa apakah email sudah terdaftar
    const [existingUser] = await connection.promise().query("SELECT * FROM user WHERE email = ?", [email]);
    if (existingUser.length > 0) {
      return res.status(400).json({ message: 'Email sudah terdaftar' });
    }

    // Enkripsi password menggunakan MD5
    const hashedPassword = crypto.createHash('md5').update(password).digest('hex');

    // Execute query ke database untuk menambahkan user baru
    const command = "INSERT INTO user (nama, email, password) VALUES (?, ?, ?)";
    await connection.promise().query(command, [nama, email, hashedPassword]);

    // mengirimkan respons jika berhasil
    res.status(201).json({
      status: "Success",
      message: "Berhasil menambahkan pengguna",
    });
  } catch (error) {
    // mengirimkan respons jika gagal
    res.status(error.statusCode || 500).json({
      status: "Error",
      message: error.message,
    });
  }
});

// Login user
router.get("/login", validateLogin, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ status: "Error", message: errors.array().map(error => error.msg) });
    }
    const { email, password } = req.body;

    // Enkripsi password menggunakan MD5
    const hashedPassword = crypto.createHash('md5').update(password).digest('hex');

    // Periksa apakah email dan password sesuai
    const [user] = await connection.promise().query("SELECT * FROM user WHERE email = ? AND password = ?", [email, hashedPassword]);
    if (user.length === 0) {
      return res.status(401).json({ message: 'Email atau password salah' });
    }

    // mengirimkan respons jika berhasil
    res.status(200).json({
      status: "Success",
      message: "Login berhasil",
      user: user[0] // Mengirimkan data user sebagai respons
    });
  } catch (error) {
    // mengirimkan respons jika gagal
    res.status(error.statusCode || 500).json({
      status: "Error",
      message: error.message,
    });
  }
});

router.put("/:id", validateRegisterEdit, async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ status: "Error", message: errors.array().map(error => error.msg) });
      }
  
      const { id } = req.params;
      const { nama, email, password } = req.body;
  
      // Enkripsi password menggunakan MD5 jika disediakan
      let hashedPassword = null;
      if (password) {
        hashedPassword = crypto.createHash('md5').update(password).digest('hex');
      }
  
      // Periksa apakah user dengan ID yang diberikan ada
      const [existingUser] = await connection.promise().query("SELECT * FROM user WHERE id = ?", [id]);
      if (existingUser.length === 0) {
        return res.status(404).json({ message: 'User tidak ditemukan' });
      }
  
      // Update data user sesuai dengan input yang diberikan
      let query = "UPDATE user SET nama = ?, email = ?";
      const values = [nama, email];
      if (hashedPassword) {
        query += ", password = ?";
        values.push(hashedPassword);
      }
      query += " WHERE id = ?";
      values.push(id);
  
      // Execute query ke database untuk mengedit data user
      await connection.promise().query(query, values);
  
      // mengirimkan respons jika berhasil
      res.status(200).json({
        status: "Success",
        message: "Berhasil mengedit data user",
      });
    } catch (error) {
      // mengirimkan respons jika gagal
      res.status(error.statusCode || 500).json({
        status: "Error",
        message: error.message,
      });
    }
  });

  

module.exports = router;
