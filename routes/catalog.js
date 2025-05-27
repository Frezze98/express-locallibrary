const express = require("express");
const router = express.Router();

// Вимагаємо модулі контролерів
const index_controller = require("../controllers/indexController");
const book_controller = require("../controllers/bookController");
const author_controller = require("../controllers/authorController");
const genre_controller = require("../controllers/genreController");
const book_instance_controller = require("../controllers/bookinstanceController");

/// МАРШРУТИ КАТАЛОГУ /////

// GET домашньої сторінки каталогу
router.get("/", index_controller.index);

/// МАРШРУТИ КНИГ /////

// GET запит для створення книги
router.get("/book/create", book_controller.book_create_get);

// POST запит для створення книги
router.post("/book/create", book_controller.book_create_post);

// GET запит для видалення книги
router.get("/book/:id/delete", book_controller.book_delete_get);

// POST запит для видалення книги
router.post("/book/:id/delete", book_controller.book_delete_post);

// GET запит для оновлення книги
router.get("/book/:id/update", book_controller.book_update_get);

// POST запит для оновлення книги
router.post("/book/:id/update", book_controller.book_update_post);

// GET запит для однієї книги
router.get("/book/:id", book_controller.book_detail);

// GET запит для списку всіх книг
router.get("/books", book_controller.book_list);

/// МАРШРУТИ АВТОРІВ /////

// GET запит для створення автора
router.get("/author/create", author_controller.author_create_get);

// POST запит для створення автора
router.post("/author/create", author_controller.author_create_post);

// GET запит для видалення автора
router.get("/author/:id/delete", author_controller.author_delete_get);

// POST запит для видалення автора
router.post("/author/:id/delete", author_controller.author_delete_post);

// GET запит для оновлення автора
router.get("/author/:id/update", author_controller.author_update_get);

// POST запит для оновлення автора
router.post("/author/:id/update", author_controller.author_update_post);

// GET запит для одного автора
router.get("/author/:id", author_controller.author_detail);

// GET запит для списку всіх авторів
router.get("/authors", author_controller.author_list);

/// МАРШРУТИ ЖАНРІВ /////

// GET запит для створення жанру
router.get("/genre/create", genre_controller.genre_create_get);

// POST запит для створення жанру
router.post("/genre/create", genre_controller.genre_create_post);

// GET запит для видалення жанру
router.get("/genre/:id/delete", genre_controller.genre_delete_get);

// POST запит для видалення жанру
router.post("/genre/:id/delete", genre_controller.genre_delete_post);

// GET запит для оновлення жанру
router.get("/genre/:id/update", genre_controller.genre_update_get);

// POST запит для оновлення жанру
router.post("/genre/:id/update", genre_controller.genre_update_post);

// GET запит для одного жанру
router.get("/genre/:id", genre_controller.genre_detail);

// GET запит для списку всіх жанрів
router.get("/genres", genre_controller.genre_list);

/// МАРШРУТИ ЕКЗЕМПЛЯРІВ КНИГ /////

// GET запит для створення екземпляра книги
router.get("/bookinstance/create", book_instance_controller.bookinstance_create_get);

// POST запит для створення екземпляра книги
router.post("/bookinstance/create", book_instance_controller.bookinstance_create_post);

// GET запит для видалення екземпляра книги
router.get("/bookinstance/:id/delete", book_instance_controller.bookinstance_delete_get);

// POST запит для видалення екземпляра книги
router.post("/bookinstance/:id/delete", book_instance_controller.bookinstance_delete_post);

// GET запит для оновлення екземпляра книги
router.get("/bookinstance/:id/update", book_instance_controller.bookinstance_update_get);

// POST запит для оновлення екземпляра книги
router.post("/bookinstance/:id/update", book_instance_controller.bookinstance_update_post);

// GET запит для одного екземпляра книги
router.get("/bookinstance/:id", book_instance_controller.bookinstance_detail);

// GET запит для списку всіх екземплярів книг
router.get("/bookinstances", book_instance_controller.bookinstance_list);

module.exports = router;