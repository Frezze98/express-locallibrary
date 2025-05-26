const Book = require("../models/book");
const Author = require("../models/author");
const Genre = require("../models/genre");
const BookInstance = require("../models/bookinstance");
const { body, validationResult } = require("express-validator"); // Додаємо express-validator
const asyncHandler = require("express-async-handler");

// Display home page with library stats
exports.index = asyncHandler(async (req, res, next) => {
  const [bookCount, authorCount, genreCount, bookInstanceCount] = await Promise.all([
    Book.countDocuments().exec(),
    Author.countDocuments().exec(),
    Genre.countDocuments().exec(),
    BookInstance.countDocuments().exec(),
  ]);

  res.render("index", {
    title: "Local Library Home",
    book_count: bookCount,
    author_count: authorCount,
    genre_count: genreCount,
    book_instance_count: bookInstanceCount,
  });
});

// Display list of all books
exports.book_list = asyncHandler(async (req, res, next) => {
  const books = await Book.find().populate("author").populate("genre").sort({ title: 1 }).exec();
  res.render("book_list", { title: "Book List", book_list: books });
});

// Display detail page for a specific book
exports.book_detail = asyncHandler(async (req, res, next) => {
  const [book, bookInstances] = await Promise.all([
    Book.findById(req.params.id).populate("author").populate("genre").exec(),
    BookInstance.find({ book: req.params.id }).exec(),
  ]);

  if (book === null) {
    const err = new Error("Книгу не знайдено");
    err.status = 404;
    return next(err);
  }

  res.render("book_detail", {
    title: book.title,
    book: book,
    book_instances: bookInstances,
  });
});

// Display book create form on GET
exports.book_create_get = asyncHandler(async (req, res, next) => {
  const [allAuthors, allGenres] = await Promise.all([
    Author.find().sort({ family_name: 1 }).exec(),
    Genre.find().sort({ name: 1 }).exec(),
  ]);

  res.render("book_form", {
    title: "Створити книгу",
    authors: allAuthors,
    genres: allGenres,
  });
});

// Handle book create on POST
exports.book_create_post = [
  // Перетворення жанру на масив
  (req, res, next) => {
    if (!Array.isArray(req.body.genre)) {
      req.body.genre =
        typeof req.body.genre === "undefined" ? [] : [req.body.genre];
    }
    next();
  },

  // Валідація та очищення полів
  body("title", "Назва не повинна бути порожньою.")
    .trim()
    .isLength({ min: 1 })
    .escape(),
  body("author", "Автор не повинен бути порожнім.")
    .trim()
    .isLength({ min: 1 })
    .escape(),
  body("summary", "Опис не повинен бути порожнім.")
    .trim()
    .isLength({ min: 1 })
    .escape(),
  body("isbn", "ISBN не повинен бути порожнім.")
    .trim()
    .isLength({ min: 1 })
    .escape(),
  body("genre.*").escape(),

  // Обробка запиту після валідації
  asyncHandler(async (req, res, next) => {
    const errors = validationResult(req);

    const book = new Book({
      title: req.body.title,
      author: req.body.author,
      summary: req.body.summary,
      isbn: req.body.isbn,
      genre: req.body.genre,
    });

    if (!errors.isEmpty()) {
      const [allAuthors, allGenres] = await Promise.all([
        Author.find().sort({ family_name: 1 }).exec(),
        Genre.find().sort({ name: 1 }).exec(),
      ]);

      for (const genre of allGenres) {
        if (book.genre.includes(genre._id)) {
          genre.checked = "true";
        }
      }

      res.render("book_form", {
        title: "Створити книгу",
        authors: allAuthors,
        genres: allGenres,
        book: book,
        errors: errors.array(),
      });
    } else {
      await book.save();
      res.redirect(book.url);
    }
  }),
];

// Display book delete form on GET
exports.book_delete_get = asyncHandler(async (req, res, next) => {
  const book = await Book.findById(req.params.id).exec();
  if (!book) {
    const err = new Error("Book not found");
    err.status = 404;
    return next(err);
  }
  res.render("book_delete", { title: "Delete Book", book });
});

// Handle book delete on POST
exports.book_delete_post = asyncHandler(async (req, res, next) => {
  const book = await Book.findByIdAndDelete(req.params.id).exec();
  if (!book) {
    const err = new Error("Book not found");
    err.status = 404;
    return next(err);
  }
  res.redirect("/catalog/books");
});

// Display book update form on GET
exports.book_update_get = asyncHandler(async (req, res, next) => {
  const [book, authors, genres] = await Promise.all([
    Book.findById(req.params.id).populate("author").populate("genre").exec(),
    Author.find().sort({ family_name: 1 }).exec(),
    Genre.find().sort({ name: 1 }).exec(),
  ]);
  if (!book) {
    const err = new Error("Book not found");
    err.status = 404;
    return next(err);
  }
  res.render("book_form", { title: "Update Book", book, authors, genres });
});

// Handle book update on POST
exports.book_update_post = asyncHandler(async (req, res, next) => {
  if (!req.body.title || !req.body.author || !req.body.summary || !req.body.isbn) {
    return res.status(400).json({ error: "Title, author, summary, and ISBN are required" });
  }
  const book = await Book.findByIdAndUpdate(
    req.params.id,
    {
      title: req.body.title,
      author: req.body.author,
      summary: req.body.summary,
      isbn: req.body.isbn,
      genre: req.body.genre || [],
    },
    { new: true }
  ).exec();
  if (!book) {
    const err = new Error("Book not found");
    err.status = 404;
    return next(err);
  }
  res.redirect("/catalog/books");
});

module.exports = exports;