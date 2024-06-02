const express = require("express");
const router = express.Router();
const connection = require("./config");
const { check, validationResult } = require('express-validator');
const multer = require('multer');
const { Storage } = require('@google-cloud/storage');
const crypto = require('crypto');

// Inisialisasi Google Cloud Storage
const storage = new Storage({
    projectId: 'a-08-414813',
    keyFilename: 'a-08-414813-9b87eacf8a04.json' 
});
const bucketName = 'gambar-poster'; 

// Konfigurasi Multer untuk mengelola upload file
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 5 * 1024 * 1024 // Batasan ukuran file: 5 MB
    },
    fileFilter: (req, file, cb) => {
        // Menyaring hanya file dengan ekstensi jpg atau png
        if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/png') {
            cb(null, true);
        } else {
            cb(new Error('Hanya file dengan format JPG atau PNG yang diizinkan!'));
        }
    }
});

// Validasi untuk input film
const validateFilmInput = [
    check('id_user').notEmpty().withMessage('ID User tidak boleh kosong'),
    check('judul').notEmpty().withMessage('Judul tidak boleh kosong'),
    check('tahun_rilis').isInt({ min: 1000, max: new Date().getFullYear() }).withMessage('Tahun terbit harus dalam format tahun'),
    check('direktor').notEmpty().withMessage('Direktor tidak boleh kosong'),
    check('genre').notEmpty().withMessage('Genre tidak boleh kosong'),
    check('plot').notEmpty().withMessage('Plot tidak boleh kosong')
];

// Menampilkan semua film
router.get("/", async (req, res) => {
    try {
        // Execute query ke database untuk mendapatkan semua film
        const [films] = await connection.promise().query("SELECT * FROM film");

        // Mengirimkan respons dengan daftar semua film
        res.status(200).json({
            status: "Success",
            data: films,
        });
    } catch (error) {
        // mengirimkan respons jika gagal
        res.status(error.statusCode || 500).json({
            status: "Error",
            message: error.message,
        });
    }
});

// Menambahkan film baru
router.post("/", upload.single('poster'), validateFilmInput, async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { id_user, judul, tahun_rilis, direktor, genre, plot } = req.body;
        const posterFile = req.file;

        // Generate nama unik untuk file poster menggunakan timestamp dan MD5
        const posterFileName = generateFileName(posterFile.originalname);

        // Upload gambar poster ke Google Cloud Storage
        const posterUrl = await uploadPosterToCloudStorage(posterFile, posterFileName);

        // Execute query ke database
        const command = "INSERT INTO film (id_user, judul, tahun_rilis, direktor, genre, plot, poster) VALUES (?, ?, ?, ?, ?, ?, ?)";
        await connection.promise().query(command, [id_user, judul, tahun_rilis, direktor, genre, plot, posterUrl]);

        // mengirimkan respons jika berhasil
        res.status(201).json({
            status: "Success",
            message: "Berhasil menambahkan film",
        });
    } catch (error) {
        // mengirimkan respons jika gagal
        res.status(error.statusCode || 500).json({
            status: "Error",
            message: error.message,
        });
    }
});

// Menampilkan semua genre film
router.get("/genres", async (req, res) => {
    try {
        // Execute query ke database untuk mendapatkan semua genre film yang tersedia
        const [genres] = await connection.promise().query("SELECT DISTINCT genre FROM film");

        // Mengirimkan respons dengan daftar genre yang ditemukan
        res.status(200).json({
            status: "Success",
            data: genres.map(genre => genre.genre),
        });
    } catch (error) {
        // mengirimkan respons jika gagal
        res.status(error.statusCode || 500).json({
            status: "Error",
            message: error.message,
        });
    }
});

// Menampilkan film berdasarkan genre tertentu
router.get("/genre/:genre", async (req, res) => {
    try {
        const { genre } = req.params;

        // Execute query ke database untuk mendapatkan film berdasarkan genre
        const [films] = await connection.promise().query("SELECT * FROM film WHERE genre = ?", [genre]);

        // Mengirimkan respons dengan film yang ditemukan
        if (films.length === 0) {
            return res.status(404).json({ message: 'Tidak ada film dengan genre tersebut' });
        }

        res.status(200).json({
            status: "Success",
            data: films,
        });
    } catch (error) {
        // mengirimkan respons jika gagal
        res.status(error.statusCode || 500).json({
            status: "Error",
            message: error.message,
        });
    }
});

// Menampilkan film berdasarkan ID film
router.get("/:id", async (req, res) => {
    try {
        const { id } = req.params;

        // Execute query ke database untuk mendapatkan film berdasarkan ID
        const [film] = await connection.promise().query("SELECT * FROM film WHERE id_film = ?", [id]);

        // Mengirimkan respons dengan film yang ditemukan
        if (film.length === 0) {
            return res.status(404).json({ message: 'Film tidak ditemukan' });
        }

        res.status(200).json({
            status: "Success",
            data: film[0],
        });
    } catch (error) {
        // mengirimkan respons jika gagal
        res.status(error.statusCode || 500).json({
            status: "Error",
            message: error.message,
        });
    }
});

// Edit film berdasarkan ID film
router.put("/:id", validateFilmInput, async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { id } = req.params;
        const { id_user, judul, tahun_rilis, direktor, genre, plot } = req.body;

        // Periksa apakah film dengan ID yang diberikan ada
        const [existingFilm] = await connection.promise().query("SELECT * FROM film WHERE id_film = ?", [id]);
        if (existingFilm.length === 0) {
            return res.status(404).json({ message: 'Film tidak ditemukan' });
        }

        // Update data film sesuai dengan input yang diberikan
        const command = "UPDATE film SET id_user = ?, judul = ?, tahun_rilis = ?, direktor = ?, genre = ?, plot = ? WHERE id_film = ?";
        await connection.promise().query(command, [id_user, judul, tahun_rilis, direktor, genre, plot, id]);

        // mengirimkan respons jika berhasil
        res.status(200).json({
            status: "Success",
            message: "Berhasil mengedit film",
        });
    } catch (error) {
        // mengirimkan respons jika gagal
        res.status(error.statusCode || 500).json({
            status: "Error",
            message: error.message,
        });
    }
});




// Fungsi untuk mengacak nama file poster menggunakan timestamp dan MD5
function generateFileName(originalFileName) {
    const timestamp = Date.now();
    const randomString = crypto.randomBytes(16).toString('hex');
    const fileNameWithoutExtension = originalFileName.split('.').slice(0, -1).join('.');
    const fileExtension = originalFileName.split('.').pop();
    const fileName = `${fileNameWithoutExtension}-${timestamp}-${randomString}.${fileExtension}`;
    return fileName;
}

// Fungsi untuk mengupload gambar poster ke Google Cloud Storage
async function uploadPosterToCloudStorage(posterFile, posterFileName) {
    const fileBuffer = posterFile.buffer;

    const file = storage.bucket(bucketName).file(posterFileName);
    await file.save(fileBuffer);

    // Mendapatkan URL publik untuk akses gambar poster
    const posterUrl = `https://storage.googleapis.com/gambar-poster/${bucketName}/${posterFileName}`;

    return posterUrl;
}


module.exports = router;
