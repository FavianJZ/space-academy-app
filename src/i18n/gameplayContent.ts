import type { Language } from "../types/game.types";

export interface Question {
  id: number;
  question: string;
  options: { label: string; text: string }[];
  correctAnswer: string;
  explanation: string;
}

export interface PipelineStep {
  id: number;
  correctStep: number;
  title: string;
  subtitle: string;
  icon: string;
  tag: string;
}

export interface PipelineChallenge {
  id: number;
  title: string;
  category: string;
  description: string;
  steps: PipelineStep[];
}

export interface FlowchartChallenge {
  id: number;
  description: string;
  startBlock: string;
  decisionBlock: string;
  endBlock: string;
  correctPath: "true" | "false";
  explanation: string;
}

export interface LogicLevel {
  id: number;
  scenario: string;
  factValue: number | string;
  conditionText: string;
  correctPath: "true" | "false";
  explanation: string;
}


export const getQuizQuestions = (lang: Language): Question[] => {
  if (lang === "en") {
    return [
      {
        id: 1,
        question: 'What is a "bug" in software engineering?',
        options: [
          { label: "a", text: "An unexpected error or defect in code causing unintended behavior" },
          { label: "b", text: "A biological insect trapped inside hardware" },
          { label: "c", text: "A special high-speed processor instruction" },
          { label: "d", text: "A new feature requested by clients" },
        ],
        correctAnswer: "a",
        explanation: "A software bug is an error, flaw, or fault in a computer program that causes it to produce an incorrect or unexpected result.",
      },
      {
        id: 2,
        question: "What is the main purpose of version control systems like Git?",
        options: [
          { label: "a", text: "To compile and compress 3D game models" },
          { label: "b", text: "To track code history and enable seamless team collaboration" },
          { label: "c", text: "To provide electrical power to servers" },
          { label: "d", text: "To automatically design UI color themes" },
        ],
        correctAnswer: "b",
        explanation: "Version control systems like Git track code changes, allow developers to revert mistakes, and coordinate work across distributed teams.",
      },
      {
        id: 3,
        question: "What is an API (Application Programming Interface)?",
        options: [
          { label: "a", text: "A bridge that allows different software applications to communicate" },
          { label: "b", text: "A physical cable connecting your keyboard to computer" },
          { label: "c", text: "A database table encryption format" },
          { label: "d", text: "An operating system background wallpaper" },
        ],
        correctAnswer: "a",
        explanation: "An API defines rules and protocols that allow different applications, services, and microservices to exchange data smoothly.",
      },
      {
        id: 4,
        question: "Which principle states that a module should have only one reason to change?",
        options: [
          { label: "a", text: "Open/Closed Principle" },
          { label: "b", text: "Single Responsibility Principle" },
          { label: "c", text: "Dependency Inversion Principle" },
          { label: "d", text: "Interface Segregation Principle" },
        ],
        correctAnswer: "b",
        explanation: "The Single Responsibility Principle (SRP) states that a module should have only one reason to change, promoting code organization.",
      },
      {
        id: 5,
        question: "What is refactoring in software development?",
        options: [
          { label: "a", text: "Fixing bugs in production" },
          { label: "b", text: "Improving code structure without changing functionality" },
          { label: "c", text: "Adding new features to the application" },
          { label: "d", text: "Testing the entire codebase" },
        ],
        correctAnswer: "b",
        explanation: "Refactoring is the process of restructuring code to improve its quality and maintainability without altering its functionality.",
      },
      {
        id: 6,
        question: "What does HTML stand for?",
        options: [
          { label: "a", text: "Hyper Text Markup Language" },
          { label: "b", text: "High Tech Modern Language" },
          { label: "c", text: "Hyper Transfer Markup Language" },
          { label: "d", text: "Home Tool Markup Language" },
        ],
        correctAnswer: "a",
        explanation: "HTML stands for Hyper Text Markup Language. It is the standard markup language for creating web pages.",
      },
      {
        id: 7,
        question: "Which data structure uses FIFO (First In, First Out)?",
        options: [
          { label: "a", text: "Stack" },
          { label: "b", text: "Queue" },
          { label: "c", text: "Tree" },
          { label: "d", text: "Graph" },
        ],
        correctAnswer: "b",
        explanation: "A Queue uses FIFO ordering — the first element added is the first one removed. Stacks use LIFO (Last In, First Out).",
      },
      {
        id: 8,
        question: "What is the time complexity of binary search?",
        options: [
          { label: "a", text: "O(n)" },
          { label: "b", text: "O(n²)" },
          { label: "c", text: "O(log n)" },
          { label: "d", text: "O(1)" },
        ],
        correctAnswer: "c",
        explanation: "Binary search has O(log n) time complexity because it halves the search space with each comparison.",
      },
      {
        id: 9,
        question: "What does CSS stand for?",
        options: [
          { label: "a", text: "Cascading Style Sheets" },
          { label: "b", text: "Computer Style System" },
          { label: "c", text: "Creative Styling Solution" },
          { label: "d", text: "Code Syntax Structure" },
        ],
        correctAnswer: "a",
        explanation: "CSS stands for Cascading Style Sheets, used for styling the presentation of HTML documents.",
      },
      {
        id: 10,
        question: "What is the purpose of unit testing in software development?",
        options: [
          { label: "a", text: "To test individual functions or components in isolation" },
          { label: "b", text: "To test whole application deployment on servers" },
          { label: "c", text: "To check internet network latency" },
          { label: "d", text: "To measure CPU processor temperature" },
        ],
        correctAnswer: "a",
        explanation: "Unit testing verifies that small isolated units of code (like individual functions) produce expected outcomes for various inputs.",
      },
    ];
  }


  return [
    {
      id: 1,
      question: 'Apa arti istilah "bug" dalam rekayasa perangkat lunak?',
      options: [
        { label: "a", text: "Kesalahan atau cacat tak terduga pada kode yang menyebabkan perilaku aneh" },
        { label: "b", text: "Serangga biologis yang terperangkap di dalam perangkat keras" },
        { label: "c", text: "Instruksi prosesor khusus berkecepatan tinggi" },
        { label: "d", text: "Fitur baru yang diminta oleh klien" },
      ],
      correctAnswer: "a",
      explanation: "Bug perangkat lunak adalah kesalahan, cacat, atau kegagalan pada program komputer yang membuatnya menghasilkan output yang salah atau tidak terduga.",
    },
    {
      id: 2,
      question: "Apa tujuan utama dari sistem kontrol versi seperti Git?",
      options: [
        { label: "a", text: "Mengompilasi dan mengompresi model game 3D" },
        { label: "b", text: "Melacak riwayat kode dan memfasilitasi kolaborasi tim yang mulus" },
        { label: "c", text: "Menyediakan daya listrik untuk server" },
        { label: "d", text: "Mendesain tema warna UI secara otomatis" },
      ],
      correctAnswer: "b",
      explanation: "Sistem kontrol versi seperti Git mencatat perubahan kode, memungkinkan pemulihan saat ada error, dan mengoordinasikan pekerjaan tim pengembang.",
    },
    {
      id: 3,
      question: "Apa fungsi dari API (Application Programming Interface)?",
      options: [
        { label: "a", text: "Jembatan protokol yang memungkinkan aplikasi perangkat lunak saling berkomunikasi" },
        { label: "b", text: "Kabel fisik penghubung papan ketik ke komputer" },
        { label: "c", text: "Format enkripsi tabel basis data" },
        { label: "d", text: "Gambar latar belakang sistem operasi" },
      ],
      correctAnswer: "a",
      explanation: "API mendefinisikan aturan dan protokol agar aplikasi, layanan web, dan modul yang berbeda dapat bertukar data dengan aman dan efisien.",
    },
    {
      id: 4,
      question: "Prinsip mana yang menyatakan bahwa sebuah modul hanya boleh memiliki satu alasan untuk berubah?",
      options: [
        { label: "a", text: "Open/Closed Principle" },
        { label: "b", text: "Single Responsibility Principle (SRP)" },
        { label: "c", text: "Dependency Inversion Principle" },
        { label: "d", text: "Interface Segregation Principle" },
      ],
      correctAnswer: "b",
      explanation: "Single Responsibility Principle (SRP) menyatakan bahwa tiap modul atau kelas harus memiliki satu tanggung jawab spesifik agar kode mudah dirawat.",
    },
    {
      id: 5,
      question: "Apa yang dimaksud dengan refactoring dalam pengembangan software?",
      options: [
        { label: "a", text: "Memperbaiki bug darurat di server produksi" },
        { label: "b", text: "Meningkatkan struktur kode tanpa mengubah fungsi dan perilakunya" },
        { label: "c", text: "Menambahkan fitur-fitur baru ke dalam aplikasi" },
        { label: "d", text: "Menguji seluruh basis kode aplikasi" },
      ],
      correctAnswer: "b",
      explanation: "Refactoring adalah restrukturisasi kode untuk meningkatkan keterbacaan, efisiensi, dan kemudahan pemeliharaan tanpa mengubah fungsionalitas eksternal.",
    },
    {
      id: 6,
      question: "Kepanjangan dari HTML adalah...",
      options: [
        { label: "a", text: "Hyper Text Markup Language" },
        { label: "b", text: "High Tech Modern Language" },
        { label: "c", text: "Hyper Transfer Markup Language" },
        { label: "d", text: "Home Tool Markup Language" },
      ],
      correctAnswer: "a",
      explanation: "HTML adalah Hyper Text Markup Language, bahasa standar untuk menyusun struktur dokumen dan halaman web di internet.",
    },
    {
      id: 7,
      question: "Struktur data mana yang menganut prinsip FIFO (First In, First Out)?",
      options: [
        { label: "a", text: "Stack (Tumpukan)" },
        { label: "b", text: "Queue (Antrean)" },
        { label: "c", text: "Tree (Pohon)" },
        { label: "d", text: "Graph (Graf)" },
      ],
      correctAnswer: "b",
      explanation: "Queue menggunakan aturan FIFO (First In, First Out) — elemen yang masuk pertama kali akan diproses dan dikeluarkan pertama kali. Stack memakai LIFO.",
    },
    {
      id: 8,
      question: "Berapakah kompleksitas waktu (time complexity) dari algoritma Binary Search?",
      options: [
        { label: "a", text: "O(n)" },
        { label: "b", text: "O(n²)" },
        { label: "c", text: "O(log n)" },
        { label: "d", text: "O(1)" },
      ],
      correctAnswer: "c",
      explanation: "Binary search memiliki kompleksitas O(log n) karena ruang pencarian selalu dibagi dua pada setiap langkah perbandingan.",
    },
    {
      id: 9,
      question: "Kepanjangan dari CSS adalah...",
      options: [
        { label: "a", text: "Cascading Style Sheets" },
        { label: "b", text: "Computer Style System" },
        { label: "c", text: "Creative Styling Solution" },
        { label: "d", text: "Code Syntax Structure" },
      ],
      correctAnswer: "a",
      explanation: "CSS adalah Cascading Style Sheets, bahasa yang digunakan untuk mengatur tata letak, warna, dan tampilan visual halaman web.",
    },
    {
      id: 10,
      question: "Apa tujuan utama dilakukannya unit testing dalam rekayasa perangkat lunak?",
      options: [
        { label: "a", text: "Menguji fungsi atau komponen terkecil secara terisolasi" },
        { label: "b", text: "Menguji peluncuran seluruh aplikasi ke server cloud" },
        { label: "c", text: "Memeriksa latensi jaringan internet" },
        { label: "d", text: "Mengukur suhu prosesor komputer pengguna" },
      ],
      correctAnswer: "a",
      explanation: "Unit testing memastikan bahwa unit terkecil kode (seperti fungsi atau method) menghasilkan keluaran yang benar secara terisolasi sebelum diintegrasikan.",
    },
  ];
};


export const getPipelineChallenges = (lang: Language): PipelineChallenge[] => {
  if (lang === "en") {
    return [
      {
        id: 1,
        title: "SDLC Lifecycle Sequence",
        category: "SOFTWARE DEVELOPMENT LIFECYCLE",
        description: "Arrange the industry-standard SDLC phases in their correct chronological order (Phase 1 through 4):",
        steps: [
          {
            id: 101,
            correctStep: 1,
            title: "Requirement Analysis",
            subtitle: "Analyze user needs, project scope & system specifications",
            icon: "📋",
            tag: "PHASE 01",
          },
          {
            id: 102,
            correctStep: 2,
            title: "System Architecture",
            subtitle: "Design UML diagrams, database schemas & modularity",
            icon: "🏛️",
            tag: "PHASE 02",
          },
          {
            id: 103,
            correctStep: 3,
            title: "Implementation (Coding)",
            subtitle: "Write clean, type-safe, and modular production code",
            icon: "💻",
            tag: "PHASE 03",
          },
          {
            id: 104,
            correctStep: 4,
            title: "Testing & QA Audit",
            subtitle: "Run unit tests, integration suites, and ensure zero defects",
            icon: "🛡️",
            tag: "PHASE 04",
          },
        ],
      },
      {
        id: 2,
        title: "Client-Server Request Architecture",
        category: "ENTERPRISE WEB DATA FLOW",
        description: "Arrange the end-to-end data transmission flow from user action to persistent server storage:",
        steps: [
          {
            id: 201,
            correctStep: 1,
            title: "UI Event Trigger",
            subtitle: "User clicks an interactive action button on the client frontend",
            icon: "👆",
            tag: "STEP 01",
          },
          {
            id: 202,
            correctStep: 2,
            title: "API Gateway Dispatch",
            subtitle: "Transmits encrypted JSON payload over secure HTTPS",
            icon: "🌐",
            tag: "STEP 02",
          },
          {
            id: 203,
            correctStep: 3,
            title: "Backend Business Logic",
            subtitle: "Server validates auth tokens, permissions & executes computations",
            icon: "⚙️",
            tag: "STEP 03",
          },
          {
            id: 204,
            correctStep: 4,
            title: "Database Commit",
            subtitle: "Executes ACID transactions & saves records persistently",
            icon: "💾",
            tag: "STEP 04",
          },
        ],
      },
      {
        id: 3,
        title: "Modern DevOps & CI/CD Pipeline",
        category: "CLOUD AUTOMATION & DEPLOYMENT",
        description: "Arrange the continuous delivery pipeline sequence from developer branch to production cloud:",
        steps: [
          {
            id: 301,
            correctStep: 1,
            title: "Git Commit & Push",
            subtitle: "Engineer commits atomic changes and pushes to feature branch",
            icon: "📦",
            tag: "STAGE 01",
          },
          {
            id: 302,
            correctStep: 2,
            title: "Automated Build & Lint",
            subtitle: "Runner verifies TypeScript types, linter checks & compiles bundle",
            icon: "⚡",
            tag: "STAGE 02",
          },
          {
            id: 303,
            correctStep: 3,
            title: "Automated Test Suite",
            subtitle: "Executes unit and integration tests; enforces 100% pass threshold",
            icon: "🧪",
            tag: "STAGE 03",
          },
          {
            id: 304,
            correctStep: 4,
            title: "Cloud Container Deploy",
            subtitle: "Deploys verified container image to live Kubernetes cluster",
            icon: "🚀",
            tag: "STAGE 04",
          },
        ],
      },
      {
        id: 4,
        title: "Microservices Event-Driven Stream",
        category: "DISTRIBUTED CLOUD ARCHITECTURE",
        description: "Arrange the asynchronous event streaming flow across distributed microservices:",
        steps: [
          {
            id: 401,
            correctStep: 1,
            title: "Event Producer Emission",
            subtitle: "Order service publishes transactional event message",
            icon: "📢",
            tag: "NODE 01",
          },
          {
            id: 402,
            correctStep: 2,
            title: "Message Broker Queue",
            subtitle: "Kafka / RabbitMQ stores partitioned message log securely",
            icon: "📬",
            tag: "NODE 02",
          },
          {
            id: 403,
            correctStep: 3,
            title: "Consumer Microservice",
            subtitle: "Notification service consumes event and processes notification",
            icon: "📥",
            tag: "NODE 03",
          },
          {
            id: 404,
            correctStep: 4,
            title: "Realtime Socket Sync",
            subtitle: "Pushes live status update to user client via WebSocket",
            icon: "🔔",
            tag: "NODE 04",
          },
        ],
      },
    ];
  }


  return [
    {
      id: 1,
      title: "Urutan Siklus Hidup SDLC",
      category: "SOFTWARE DEVELOPMENT LIFECYCLE",
      description: "Susun tahapan SDLC berstandar industri berikut dalam urutan proses yang benar (Tahap 1 s.d. 4):",
      steps: [
        {
          id: 101,
          correctStep: 1,
          title: "Analisis Kebutuhan",
          subtitle: "Analisis kebutuhan pengguna, ruang lingkup proyek & spesifikasi sistem",
          icon: "📋",
          tag: "TAHAP 01",
        },
        {
          id: 102,
          correctStep: 2,
          title: "Arsitektur Sistem",
          subtitle: "Rancang diagram UML, skema database ERD & rancangan modularitas",
          icon: "🏛️",
          tag: "TAHAP 02",
        },
        {
          id: 103,
          correctStep: 3,
          title: "Implementasi (Coding)",
          subtitle: "Menulis kode yang bersih, type-safe, dan terstruktur secara modular",
          icon: "💻",
          tag: "TAHAP 03",
        },
        {
          id: 104,
          correctStep: 4,
          title: "Testing & Audit QA",
          subtitle: "Jalankan unit test, integrasi, dan pastikan sistem bebas dari bug",
          icon: "🛡️",
          tag: "TAHAP 04",
        },
      ],
    },
    {
      id: 2,
      title: "Arsitektur Permintaan Klien-Server",
      category: "ALIRAN DATA WEB ENTERPRISE",
      description: "Susun alur transmisi data dari interaksi pengguna hingga penyimpanan permanen di server:",
      steps: [
        {
          id: 201,
          correctStep: 1,
          title: "Pemicu Event UI",
          subtitle: "Pengguna mengklik tombol aksi interaktif pada antarmuka aplikasi",
          icon: "👆",
          tag: "LANGKAH 01",
        },
        {
          id: 202,
          correctStep: 2,
          title: "Pengiriman API Gateway",
          subtitle: "Mengirim payload JSON terenkripsi melalui protokol HTTPS yang aman",
          icon: "🌐",
          tag: "LANGKAH 02",
        },
        {
          id: 203,
          correctStep: 3,
          title: "Logika Bisnis Backend",
          subtitle: "Server memvalidasi auth token, hak akses & mengeksekusi komputasi",
          icon: "⚙️",
          tag: "LANGKAH 03",
        },
        {
          id: 204,
          correctStep: 4,
          title: "Komit ke Basis Data",
          subtitle: "Mengeksekusi transaksi query SQL & menyimpan data secara permanen",
          icon: "💾",
          tag: "LANGKAH 04",
        },
      ],
    },
    {
      id: 3,
      title: "Pipeline Otomasi DevOps & CI/CD",
      category: "CLOUD AUTOMATION & DEPLOYMENT",
      description: "Susun alur rilis kode otomatis dari cabang developer ke cloud server produksi:",
      steps: [
        {
          id: 301,
          correctStep: 1,
          title: "Git Commit & Push",
          subtitle: "Developer mengunggah commit kode terbaru ke branch repositori",
          icon: "📦",
          tag: "STAGE 01",
        },
        {
          id: 302,
          correctStep: 2,
          title: "Build & Linter Otomatis",
          subtitle: "Sistem memvalidasi type check TypeScript & mengompilasi bundel",
          icon: "⚡",
          tag: "STAGE 02",
        },
        {
          id: 303,
          correctStep: 3,
          title: "Eksekusi Test Suite",
          subtitle: "Menjalankan unit test & integration test untuk memastikan bebas bug",
          icon: "🧪",
          tag: "STAGE 03",
        },
        {
          id: 304,
          correctStep: 4,
          title: "Deploy Container Cloud",
          subtitle: "Merilis image container ke cluster server Kubernetes produksi",
          icon: "🚀",
          tag: "STAGE 04",
        },
      ],
    },
    {
      id: 4,
      title: "Aliran Data Event-Driven Stream",
      category: "DISTRIBUTED CLOUD ARCHITECTURE",
      description: "Susun alur transmisi event asinkron antar layanan microservice terdistribusi:",
      steps: [
        {
          id: 401,
          correctStep: 1,
          title: "Emisi Pesan Event",
          subtitle: "Layanan utama mempublikasikan payload event transaksi",
          icon: "📢",
          tag: "NODE 01",
        },
        {
          id: 402,
          correctStep: 2,
          title: "Antrean Message Broker",
          subtitle: "Broker Kafka / RabbitMQ menampung antrean pesan terpartisi",
          icon: "📬",
          tag: "NODE 02",
        },
        {
          id: 403,
          correctStep: 3,
          title: "Konsumsi Microservice",
          subtitle: "Layanan pekerja mengambil pesan dan memproses instruksi bisnis",
          icon: "📥",
          tag: "NODE 03",
        },
        {
          id: 404,
          correctStep: 4,
          title: "Sinkronisasi Realtime",
          subtitle: "Mengirim pembaruan status langsung ke klien pengguna lewat WebSocket",
          icon: "🔔",
          tag: "NODE 04",
        },
      ],
    },
  ];
};


export const getFlowchartChallenges = (lang: Language): FlowchartChallenge[] => {
  if (lang === "en") {
    return [
      {
        id: 1,
        description: "Check if the input number is greater than 5",
        startBlock: "START: Input = 8",
        decisionBlock: "Is Input > 5?",
        endBlock: "Output: TRUE",
        correctPath: "true",
        explanation: "Since 8 is greater than 5, the TRUE path is correct.",
      },
      {
        id: 2,
        description: "Determine if a variable is even",
        startBlock: "START: Number = 7",
        decisionBlock: "Is Number % 2 == 0?",
        endBlock: "Output: EVEN/ODD",
        correctPath: "false",
        explanation: "7 is odd, so 7 % 2 != 0, making the FALSE path correct.",
      },
      {
        id: 3,
        description: "Check if username is valid",
        startBlock: 'START: Username = "admin123"',
        decisionBlock: "Length >= 5?",
        endBlock: "Output: VALID",
        correctPath: "true",
        explanation: '"admin123" has 8 characters, which is >= 5, so TRUE is correct.',
      },
      {
        id: 4,
        description: "Check if age qualifies for voting",
        startBlock: "START: Age = 16",
        decisionBlock: "Is Age >= 18?",
        endBlock: "Output: ELIGIBLE",
        correctPath: "false",
        explanation: "16 is less than 18, so the FALSE path is correct — not yet eligible.",
      },
      {
        id: 5,
        description: "Verify password length requirement",
        startBlock: 'START: Password = "sec3"',
        decisionBlock: "Length >= 8?",
        endBlock: "Output: REJECTED",
        correctPath: "false",
        explanation: '"sec3" has only 4 characters (< 8), so FALSE path leads to REJECTED.',
      },
      {
        id: 6,
        description: "Check if score passes the threshold",
        startBlock: "START: Score = 85",
        decisionBlock: "Is Score >= 70?",
        endBlock: "Output: PASS",
        correctPath: "true",
        explanation: "85 is greater than 70, so TRUE path leads to PASS.",
      },
      {
        id: 7,
        description: "Determine if temperature is freezing",
        startBlock: "START: Temp = -3°C",
        decisionBlock: "Is Temp <= 0?",
        endBlock: "Output: FREEZING",
        correctPath: "true",
        explanation: "-3 is less than or equal to 0, so the TRUE path is correct.",
      },
      {
        id: 8,
        description: "Check if discount applies for bulk purchase",
        startBlock: "START: Quantity = 45",
        decisionBlock: "Is Quantity > 50?",
        endBlock: "Output: DISCOUNT",
        correctPath: "false",
        explanation: "45 is not greater than 50, so FALSE — no bulk discount applies.",
      },
    ];
  }


  return [
    {
      id: 1,
      description: "Periksa apakah nilai masukan lebih besar dari 5",
      startBlock: "MULAI: Masukan = 8",
      decisionBlock: "Apakah Masukan > 5?",
      endBlock: "Keluaran: BENAR",
      correctPath: "true",
      explanation: "Karena 8 lebih besar dari 5, maka jalur BENAR (TRUE) adalah yang tepat.",
    },
    {
      id: 2,
      description: "Tentukan apakah suatu bilangan adalah bilangan genap",
      startBlock: "MULAI: Bilangan = 7",
      decisionBlock: "Apakah Bilangan % 2 == 0?",
      endBlock: "Keluaran: GENAP / GANJIL",
      correctPath: "false",
      explanation: "7 adalah bilangan ganjil (sisa bagi 1), sehingga jalur SALAH (FALSE) adalah jawaban benar.",
    },
    {
      id: 3,
      description: "Periksa apakah nama pengguna memenuhi panjang minimum",
      startBlock: 'MULAI: Username = "admin123"',
      decisionBlock: "Panjang Karakter >= 5?",
      endBlock: "Keluaran: VALID",
      correctPath: "true",
      explanation: '"admin123" memiliki 8 karakter (>= 5), sehingga jalur BENAR (TRUE) adalah yang tepat.',
    },
    {
      id: 4,
      description: "Periksa kelayakan usia untuk hak pilih kadet",
      startBlock: "MULAI: Usia = 16",
      decisionBlock: "Apakah Usia >= 18?",
      endBlock: "Keluaran: LAYAK",
      correctPath: "false",
      explanation: "16 kurang dari 18, sehingga jalur SALAH (FALSE) adalah tepat — belum memenuhi syarat.",
    },
    {
      id: 5,
      description: "Verifikasi standar keamanan panjang kata sandi",
      startBlock: 'MULAI: Sandi = "sec3"',
      decisionBlock: "Panjang Karakter >= 8?",
      endBlock: "Keluaran: DITOLAK",
      correctPath: "false",
      explanation: '"sec3" hanya memiliki 4 karakter (< 8), sehingga jalur SALAH (FALSE) mengarah ke penolakan.',
    },
    {
      id: 6,
      description: "Periksa apakah skor ujian kadet melampaui batas kelulusan",
      startBlock: "MULAI: Skor = 85",
      decisionBlock: "Apakah Skor >= 70?",
      endBlock: "Keluaran: LULUS",
      correctPath: "true",
      explanation: "85 melampaui ambang batas 70, sehingga jalur BENAR (TRUE) membawa status LULUS.",
    },
    {
      id: 7,
      description: "Tentukan apakah suhu reaktor berada di bawah titik beku",
      startBlock: "MULAI: Suhu = -3°C",
      decisionBlock: "Apakah Suhu <= 0°C?",
      endBlock: "Keluaran: MEMBEKU",
      correctPath: "true",
      explanation: "-3 lebih kecil atau sama dengan 0, sehingga jalur BENAR (TRUE) adalah yang tepat.",
    },
    {
      id: 8,
      description: "Periksa apakah pesanan memenuhi kuota diskon borongan",
      startBlock: "MULAI: Jumlah = 45",
      decisionBlock: "Apakah Jumlah > 50?",
      endBlock: "Keluaran: DISKON",
      correctPath: "false",
      explanation: "45 tidak lebih besar dari 50, sehingga jalur SALAH (FALSE) — kuota diskon belum tercapai.",
    },
  ];
};


export const getLogicLevels = (lang: Language): LogicLevel[] => {
  if (lang === "en") {
    return [
      {
        id: 1,
        scenario: "Cloud Storage Quota Monitor",
        factValue: "Free Storage: 15 GB",
        conditionText: "Is Free Storage < 20 GB?",
        correctPath: "true",
        explanation: "15 GB is less than the 20 GB threshold. TRUE — storage warning triggered, auto-cleanup pipeline initiated.",
      },
      {
        id: 2,
        scenario: "API Server Rate Limiter",
        factValue: "Requests/sec: 380",
        conditionText: "Is Requests/sec > 500?",
        correctPath: "false",
        explanation: "380 is NOT greater than 500. FALSE — traffic is within safe limits, no throttling needed.",
      },
      {
        id: 3,
        scenario: "Security Token Expiration",
        factValue: "Token Age: 36 Hours",
        conditionText: "Is Token Age > 24 Hours?",
        correctPath: "true",
        explanation: "36 hours exceeds the 24-hour policy. TRUE — token expired, user must re-authenticate.",
      },
      {
        id: 4,
        scenario: "Database Connection Pool",
        factValue: "Active Connections: 85",
        conditionText: "Is Connections >= 100?",
        correctPath: "false",
        explanation: "85 is NOT >= 100. FALSE — connection pool still has capacity, no queue overflow.",
      },
      {
        id: 5,
        scenario: "Server Memory Usage Alert",
        factValue: "RAM Usage: 92%",
        conditionText: "Is RAM Usage > 90%?",
        correctPath: "true",
        explanation: "92% exceeds the 90% threshold. TRUE — critical memory alert, horizontal scaling triggered.",
      },
      {
        id: 6,
        scenario: "Firewall Intrusion Detection",
        factValue: "Failed Login Attempts: 12",
        conditionText: "Is Failed Attempts >= 10?",
        correctPath: "true",
        explanation: "12 >= 10. TRUE — suspicious activity detected, IP address quarantined by firewall.",
      },
      {
        id: 7,
        scenario: "Container Orchestrator Health",
        factValue: "Running Pods: 3 of 5",
        conditionText: "Is Running Pods < 4?",
        correctPath: "true",
        explanation: "3 is less than 4. TRUE — unhealthy cluster detected, Kubernetes auto-scaling initiated.",
      },
      {
        id: 8,
        scenario: "CI/CD Pipeline Gate",
        factValue: "Test Coverage: 72%",
        conditionText: "Is Coverage >= 80%?",
        correctPath: "false",
        explanation: "72% is NOT >= 80%. FALSE — deployment blocked, code coverage below quality gate.",
      },
    ];
  }


  return [
    {
      id: 1,
      scenario: "Monitor Kuota Penyimpanan Cloud",
      factValue: "Sisa Memori: 15 GB",
      conditionText: "Apakah Sisa Memori < 20 GB?",
      correctPath: "true",
      explanation: "15 GB lebih kecil dari ambang 20 GB. BENAR — peringatan kapasitas aktif, sistem pembersihan otomatis dimulai.",
    },
    {
      id: 2,
      scenario: "Pembatas Kecepatan (Rate Limiter) API",
      factValue: "Permintaan/detik: 380",
      conditionText: "Apakah Permintaan/detik > 500?",
      correctPath: "false",
      explanation: "380 TIDAK lebih besar dari 500. SALAH — lalu lintas jaringan aman, pembatasan akses tidak diperlukan.",
    },
    {
      id: 3,
      scenario: "Masa Kedaluwarsa Token Keamanan",
      factValue: "Usia Token: 36 Jam",
      conditionText: "Apakah Usia Token > 24 Jam?",
      correctPath: "true",
      explanation: "36 jam melebihi batas kebijakan 24 jam. BENAR — token kedaluwarsa, pengguna wajib login ulang.",
    },
    {
      id: 4,
      scenario: "Kapasitas Kolam Koneksi Basis Data",
      factValue: "Koneksi Aktif: 85",
      conditionText: "Apakah Koneksi Aktif >= 100?",
      correctPath: "false",
      explanation: "85 TIDAK >= 100. SALAH — kolam koneksi masih memiliki ruang kosong, tidak terjadi antrean overload.",
    },
    {
      id: 5,
      scenario: "Peringatan Beban Memori RAM Server",
      factValue: "Pemakaian RAM: 92%",
      conditionText: "Apakah Pemakaian RAM > 90%?",
      correctPath: "true",
      explanation: "92% melampaui batas ambang 90%. BENAR — sinyal peringatan memori kritis memicu penambahan instans server.",
    },
    {
      id: 6,
      scenario: "Deteksi Upaya Penyusupan Firewall",
      factValue: "Upaya Login Gagal: 12",
      conditionText: "Apakah Upaya Gagal >= 10?",
      correctPath: "true",
      explanation: "12 >= 10. BENAR — terdeteksi anomali mencurigakan, alamat IP otomatis diisolasi oleh firewall.",
    },
    {
      id: 7,
      scenario: "Kesehatan Orkestrasi Kontainer Cloud",
      factValue: "Pod Berjalan: 3 dari 5",
      conditionText: "Apakah Pod Berjalan < 4?",
      correctPath: "true",
      explanation: "3 lebih kecil dari 4. BENAR — cluster terindikasi tidak sehat, replikasi kontainer otomatis dipicu.",
    },
    {
      id: 8,
      scenario: "Gerbang Kelayakan Pipeline CI/CD",
      factValue: "Cakupan Test: 72%",
      conditionText: "Apakah Cakupan Test >= 80%?",
      correctPath: "false",
      explanation: "72% TIDAK >= 80%. SALAH — rilis ke produksi dicegah karena cakupan pengujian di bawah standar.",
    },
  ];
};
