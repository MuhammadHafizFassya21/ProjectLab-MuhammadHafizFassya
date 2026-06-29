# ProjectLab — Muhammad Hafiz Fassya

ProjectLab adalah website portfolio statis yang didesain khusus untuk menampilkan dokumentasi project dengan pendekatan **Case Study Profesional**. Website ini menyoroti bagaimana sebuah masalah didefinisikan, alur solusi yang dibangun, teknologi yang digunakan, hingga hasil dan pembelajaran yang didapat dari project tersebut.

Website ini ditargetkan untuk dibaca oleh Recruiter, Dosen, serta Calon Kolaborator guna memberikan pemahaman yang komprehensif mengenai pola pikir, metodologi, dan technical skills.

## 🚀 Fitur Utama
- **Featured Projects**: Menyoroti 3 project unggulan di halaman beranda.
- **Project Catalog & Filtering**: Daftar lengkap semua project yang bisa difilter berdasarkan kategori (Data Engineering, Machine Learning, Web Development, dll).
- **Search System**: Pencarian project secara real-time berdasarkan kata kunci, judul, maupun tech stack.
- **Detailed Case Study Pages**: Halaman detail dinamis untuk setiap project (di-render via JavaScript dari data JSON).
- **Fully Responsive**: Nyaman diakses melalui desktop, tablet, maupun mobile.

## 📂 Struktur Folder
```text
ProjectLab/
│
├── index.html         # Halaman Beranda (Hero, Featured, Categories, Process)
├── projects.html      # Halaman Katalog Project (Search & Filter)
├── detail.html        # Halaman Detail Project (Case Study layout)
│
├── css/
│   └── style.css      # File CSS Global (Desain modern, variabel warna, responsivitas)
│
├── js/
│   ├── main.js        # Utilitas global (Navbar toggle, footer logic)
│   ├── projects.js    # Logic render katalog, filter, dan search
│   └── detail.js      # Logic parsing parameter URL dan merender detail dari JSON
│
├── data/
│   └── projects.json  # "Database" tunggal website berisi array object project
│
└── assets/
    └── images/
        └── projects/  # Folder aset gambar screenshot project
```

## 💻 Teknologi yang Digunakan
- **HTML5** & **CSS3** (Tanpa framework, custom styling, Flexbox & CSS Grid)
- **Vanilla JavaScript** (Fetch API, DOM Manipulation, URLSearchParams)
- **JSON** (Sebagai sumber data statis, tanpa backend)

## 🛠️ Cara Menjalankan Secara Lokal (Development)
Karena website ini menggunakan Fetch API untuk memuat file `projects.json`, Anda harus menjalankannya melalui local server.
1. Buka folder project ini di Visual Studio Code.
2. Install extension **Live Server** (oleh Ritwick Dey).
3. Klik tombol **Go Live** di pojok kanan bawah VS Code.
4. Website akan terbuka di browser secara otomatis.

## 🌐 Cara Deploy ke GitHub Pages
Website ini sudah dioptimasi menggunakan path relatif, sehingga sangat aman untuk di-hosting di subdirektori (seperti GitHub Pages).
1. Buat repository baru di GitHub.
2. Push semua file dari folder ini ke repository tersebut (pastikan branch utama bernama `main`).
3. Buka repository Anda di GitHub, pergi ke tab **Settings** > **Pages**.
4. Pada bagian **Build and deployment**, pilih Source: **Deploy from a branch**.
5. Pilih branch `main`, folder `/ (root)`, lalu klik **Save**.
6. Tunggu beberapa menit, website Anda siap diakses di URL `https://<username>.github.io/<nama-repo>`.

# ProjectLab — Muhammad Hafiz Fassya

ProjectLab adalah website dokumentasi project berbasis case study yang menampilkan berbagai project dalam bidang Data Engineering, Machine Learning, Artificial Intelligence, Web Development, Mobile Development, dan Research.

Website ini dibuat untuk menjelaskan setiap project secara lebih lengkap, mulai dari masalah yang diselesaikan, tujuan project, peran pengembang, teknologi yang digunakan, fitur utama, alur sistem, hasil akhir, tantangan, solusi, hingga rencana pengembangan berikutnya.

## Features

* Homepage dengan featured projects
* Halaman daftar semua project
* Search project berdasarkan nama, kategori, teknologi, role, status, dan tahun
* Filter project berdasarkan kategori
* Halaman detail project berbasis case study
* Project summary
* Tech stack badge
* System flow
* Challenges and solutions
* Screenshot gallery
* Project links
* Responsive design
* GitHub Pages ready

## Tech Stack

* HTML5
* CSS3
* JavaScript
* JSON
* GitHub Pages

## Folder Structure

```text
project-lab/
├── index.html
├── projects.html
├── detail.html
├── README.md
├── css/
│   └── style.css
├── js/
│   ├── main.js
│   ├── projects.js
│   └── detail.js
├── data/
│   └── projects.json
└── assets/
    ├── images/
    │   ├── projects/
    │   └── icons/
    └── documents/
```

## How to Run

1. Clone or download this repository.
2. Open the folder in Visual Studio Code.
3. Install the Live Server extension.
4. Right click `index.html`.
5. Select `Open with Live Server`.

## Deployment

This website can be deployed using GitHub Pages.

Steps:

1. Push the project to GitHub.
2. Open repository settings.
3. Go to Pages.
4. Select branch `main`.
5. Select root folder.
6. Save and wait for the deployment URL.

## Purpose

This project was built as a personal project showcase website to support professional branding, academic documentation, and career preparation.

