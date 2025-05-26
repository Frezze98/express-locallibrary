const BookInstance = require("../models/bookinstance");
const Book = require("../models/book");
const { body, validationResult } = require("express-validator"); // Додаємо express-validator
const asyncHandler = require("express-async-handler");

// Display list of all BookInstances
exports.bookinstance_list = asyncHandler(async (req, res, next) => {
  const allBookInstances = await BookInstance.find()
    .populate("book")
    .sort({ "book.title": 1 })
    .exec();

  res.render("bookinstance_list", {
    title: "Список екземплярів книг",
    bookinstance_list: allBookInstances,
  });
});

// Display detail page for a specific BookInstance
exports.bookinstance_detail = asyncHandler(async (req, res, next) => {
  try {
    const bookinstance = await BookInstance.findById(req.params.id).populate("book");
    if (!bookinstance) {
      return res.status(404).json({ error: "BookInstance not found" });
    }
    res.render("bookinstance_detail", { title: "Book Instance", bookinstance });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch bookinstance", details: err.message });
  }
});

// Display BookInstance create form on GET
exports.bookinstance_create_get = asyncHandler(async (req, res, next) => {
  const allBooks = await Book.find().sort({ title: 1 }).exec();
  res.render("bookinstance_form", {
    title: "Створити екземпляр книги",
    book_list: allBooks,
  });
});

// Handle BookInstance create on POST
exports.bookinstance_create_post = [
  // Валідація та очищення полів
  body("book", "Книга не повинна бути порожньою.")
    .trim()
    .isLength({ min: 1 })
    .escape(),
  body("imprint", "Видавництво не повинно бути порожнім.")
    .trim()
    .isLength({ min: 1 })
    .escape(),
  body("status").escape(),
  body("due_back", "Недійсна дата повернення")
    .optional({ values: "falsy" })
    .isISO8601()
    .toDate(),

  // Обробка запиту після валідації
  asyncHandler(async (req, res, next) => {
    const errors = validationResult(req);

    const bookInstance = new BookInstance({
      book: req.body.book,
      imprint: req.body.imprint,
      status: req.body.status,
      due_back: req.body.due_back,
    });

    if (!errors.isEmpty()) {
      const allBooks = await Book.find().sort({ title: 1 }).exec();
      res.render("bookinstance_form", {
        title: "Створити екземпляр книги",
        book_list: allBooks,
        bookinstance: bookInstance,
        errors: errors.array(),
      });
    } else {
      await bookInstance.save();
      res.redirect(bookInstance.url);
    }
  }),
];

// Display BookInstance delete form on GET
exports.bookinstance_delete_get = asyncHandler(async (req, res, next) => {
  try {
    const bookinstance = await BookInstance.findById(req.params.id).populate("book");
    if (!bookinstance) {
      return res.status(404).json({ error: "BookInstance not found" });
    }
    res.render("bookinstance_delete", { title: "Delete Book Instance", bookinstance });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch bookinstance", details: err.message });
  }
});

// Handle BookInstance delete on POST
exports.bookinstance_delete_post = asyncHandler(async (req, res, next) => {
  try {
    const bookinstance = await BookInstance.findByIdAndDelete(req.params.id);
    if (!bookinstance) {
      return res.status(404).json({ error: "BookInstance not found" });
    }
    res.redirect("/catalog/bookinstances");
  } catch (err) {
    res.status(500).json({ error: "Failed to delete bookinstance", details: err.message });
  }
});

// Display BookInstance update form on GET
exports.bookinstance_update_get = asyncHandler(async (req, res, next) => {
  try {
    const bookinstance = await BookInstance.findById(req.params.id).populate("book");
    const books = await Book.find().sort({ title: 1 });
    if (!bookinstance) {
      return res.status(404).json({ error: "BookInstance not found" });
    }
    res.render("bookinstance_form", { title: "Update Book Instance", bookinstance, books });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch bookinstance or books", details: err.message });
  }
});

// Handle BookInstance update on POST
exports.bookinstance_update_post = asyncHandler(async (req, res, next) => {
  try {
    if (!req.body.book || !req.body.imprint || !req.body.status) {
      return res.status(400).json({ error: "Book, imprint, and status are required" });
    }
    const bookinstance = await BookInstance.findByIdAndUpdate(
      req.params.id,
      {
        book: req.body.book,
        imprint: req.body.imprint,
        status: req.body.status,
        due_back: req.body.due_back || undefined,
      },
      { new: true }
    );
    if (!bookinstance) {
      return res.status(404).json({ error: "BookInstance not found" });
    }
    res.redirect("/catalog/bookinstances");
  } catch (err) {
    res.status(400).json({ error: "Failed to update bookinstance", details: err.message });
  }
});

module.exports = exports;