require("dotenv").config();

const express = require("express");
const path = require("path");
const mongoose = require("mongoose");
const compression = require("compression");
const helmet = require("helmet");
const RateLimit = require("express-rate-limit");
const indexRouter = require("./routes/index");
const usersRouter = require("./routes/users");
const catalogRouter = require("./routes/catalog");

const app = express();

// Логування MONGO_URI для перевірки
console.log("MONGO_URI:", process.env.MONGO_URI || "undefined");

// Налаштування підключення до MongoDB
const connectDB = async () => {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error("MONGO_URI is not defined in environment variables");
    }
    console.log("Attempting to connect to MongoDB...");
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB connected successfully");
  } catch (err) {
    console.error("Database connection failed:", err.message || err);
    process.exit(1);
  }
};

connectDB();

// Логування всіх вхідних запитів
app.use((req, res, next) => {
  console.log(`Received ${req.method} request to ${req.url}`);
  next();
});

// Налаштування обмеження швидкості
const limiter = RateLimit({
  windowMs: 45 * 60 * 1000, // 45 хвилин
  max: 1000,
});
app.use(limiter);

// Налаштування helmet для безпеки
app.use(
  helmet.contentSecurityPolicy({
    directives: {
      "script-src": ["'self'", "code.jquery.com", "cdn.jsdelivr.net"]
    }
  })
);

// Налаштування compression для стиснення відповідей
app.use(compression());

// Налаштування проміжного програмного забезпечення
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, "public")));

// Налаштування Pug
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "pug");

// Додавання маршрутів до ланцюжка проміжного програмного забезпечення
app.use("/", indexRouter);
app.use("/users", usersRouter);
app.use("/catalog", catalogRouter);

// Додаткове логування для перевірки маршрутів
console.log("Routes mounted successfully");

// Обробник помилок для Express
app.use((err, req, res, next) => {
  console.error("Express error:", err.stack);
  res.status(500).send("Something broke!");
});

// Запуск сервера
const port = process.env.PORT || 8080;
app.listen(port, '0.0.0.0', () => {
  console.log(`Server is running on port ${port}`);
});