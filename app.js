require("dotenv").config(); // Додаємо для завантаження змінних середовища

const express = require("express");
const path = require("path");
const mongoose = require("mongoose");
const compression = require("compression"); // Додаємо для стиснення відповідей
const helmet = require("helmet"); // Додаємо для захисту
const RateLimit = require("express-rate-limit"); // Додаємо для обмеження швидкості
const indexRouter = require("./routes/index");
const usersRouter = require("./routes/users");
const catalogRouter = require("./routes/catalog");

const app = express();

// Налаштування підключення до MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB connected successfully");
  } catch (err) {
    console.error("Database connection failed:", err);
    process.exit(1);
  }
};

connectDB();

// Налаштування обмеження швидкості
const limiter = RateLimit({
  windowMs: 1 * 60 * 1000, // 1 хвилина
  max: 20,
});
app.use(limiter);

// Налаштування helmet для безпеки
app.use(
  helmet.contentSecurityPolicy({
    directives: {
      "script-src": ["'self'", "code.jquery.com", "cdn.jsdelivr.net"],
    },
  })
);

// Налаштування compression для стиснення відповідей
app.use(compression());

// Налаштування проміжного програмного забезпечення
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, "public"))); // Оновлюємо шлях для статичних файлів

// Налаштування Pug
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "pug");

// Додавання маршрутів до ланцюжка проміжного програмного забезпечення
app.use("/", indexRouter);
app.use("/users", usersRouter);
app.use("/catalog", catalogRouter);

// Запуск сервера
app.listen(3000, () => {
  console.log("Server is running on port 3000");
});