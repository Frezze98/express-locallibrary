const Genre = require("../models/genre");
const Book = require("../models/book"); // Додаємо імпорт моделі Book
const { body, validationResult } = require("express-validator");
const asyncHandler = require("express-async-handler");

// Display list of all Genres
exports.genre_list = asyncHandler(async (req, res, next) => {
  const allGenres = await Genre.find().sort({ name: 1 }).exec();
  res.render("genre_list", { title: "Список жанрів", genre_list: allGenres });
});

// Display detail page for a specific Genre
exports.genre_detail = asyncHandler(async (req, res, next) => {
  const [genre, booksInGenre] = await Promise.all([
    Genre.findById(req.params.id).exec(),
    Book.find({ genre: req.params.id }, "title summary").exec(),
  ]);

  if (genre === null) {
    const err = new Error("Жанр не знайдено");
    err.status = 404;
    return next(err);
  }

  res.render("genre_detail", {
    title: "Деталі жанру",
    genre: genre,
    genre_books: booksInGenre,
  });
});

// Display Genre create form on GET
exports.genre_create_get = (req, res, next) => {
  res.render("genre_form", { title: "Створити жанр" });
};

// Handle Genre create on POST
exports.genre_create_post = [
  // Валідація та очищення поля name
  body("name")
    .trim()
    .isLength({ min: 3 })
    .escape()
    .withMessage("Назва жанру повинна містити щонайменше 3 символи.")
    .isAlphanumeric()
    .withMessage("Назва жанру містить неалфанумерні символи."),

  // Обробка запиту після валідації
  asyncHandler(async (req, res, next) => {
    const errors = validationResult(req);

    // Перевірка наявності жанру в базі
    const existingGenre = await Genre.findOne({ name: req.body.name }).collation({ locale: "en", strength: 2 }).exec();
    if (existingGenre) {
      res.redirect(existingGenre.url);
      return;
    }

    const genre = new Genre({ name: req.body.name });

    if (!errors.isEmpty()) {
      res.render("genre_form", {
        title: "Створити жанр",
        genre: genre,
        errors: errors.array(),
      });
      return;
    } else {
      await genre.save();
      res.redirect(genre.url);
    }
  }),
];

// Display Genre delete form on GET
exports.genre_delete_get = asyncHandler(async (req, res, next) => {
  const genre = await Genre.findById(req.params.id).exec();
  if (!genre) {
    const err = new Error("Genre not found");
    err.status = 404;
    return next(err);
  }
  res.render("genre_delete", { title: "Delete Genre", genre });
});

// Handle Genre delete on POST
exports.genre_delete_post = asyncHandler(async (req, res, next) => {
  const genre = await Genre.findByIdAndDelete(req.params.id).exec();
  if (!genre) {
    const err = new Error("Genre not found");
    err.status = 404;
    return next(err);
  }
  res.redirect("/catalog/genres");
});

// Display Genre update form on GET
exports.genre_update_get = asyncHandler(async (req, res, next) => {
  const genre = await Genre.findById(req.params.id).exec();
  if (!genre) {
    const err = new Error("Genre not found");
    err.status = 404;
    return next(err);
  }
  res.render("genre_form", { title: "Update Genre", genre });
});

// Handle Genre update on POST
exports.genre_update_post = asyncHandler(async (req, res, next) => {
  if (!req.body.name) {
    const err = new Error("Genre name is required");
    err.status = 404;
    return next(err);
  }
  const genre = await Genre.findByIdAndUpdate(
    req.params.id,
    { name: req.body.name },
    { new: true }
  ).exec();
  if (!genre) {
    const err = new Error("Genre not found");
    err.status = 404;
    return next(err);
  }
  res.redirect("/catalog/genres");
});

module.exports = exports;