const BookInstance = require("../models/bookinstance");
const Book = require("../models/book");
const { body, validationResult } = require("express-validator");
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
      const err = new Error("Примірник книги не знайдено");
      err.status = 404;
      return next(err);
    }
    res.render("bookinstance_detail", {
      title: "Екземпляр книги",
      bookinstance: bookinstance,
    });
  } catch (err) {
    console.error(`Error in bookinstance_detail: ${err.stack}`);
    next(err);
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
    console.log(`Attempting to get book instance with ID: ${req.params.id}`);
    const bookInstance = await BookInstance.findById(req.params.id).populate("book").exec();

    if (bookInstance === null) {
      console.log("Book instance not found");
      res.redirect("/catalog/bookinstances");
      return;
    }

    console.log(`Book instance: ${JSON.stringify(bookInstance)}`);
    res.render("bookinstance_delete", {
      title: "Видалити примірник книги",
      book_instance: bookInstance,
    });
  } catch (err) {
    console.error(`Error in bookinstance_delete_get: ${err.stack}`);
    next(err);
  }
});

// Handle BookInstance delete on POST
exports.bookinstance_delete_post = asyncHandler(async (req, res, next) => {
  try {
    console.log(`Attempting to delete book instance with ID: ${req.body.bookinstanceid}`);
    if (!req.body.bookinstanceid) {
      console.log("No bookinstanceid provided in form");
      throw new Error("Invalid form submission: bookinstanceid missing");
    }

    const bookInstance = await BookInstance.findByIdAndDelete(req.body.bookinstanceid);
    if (!bookInstance) {
      console.log("Book instance not found");
      res.redirect("/catalog/bookinstances");
      return;
    }

    console.log(`Book instance deleted with ID: ${req.body.bookinstanceid}`);
    res.redirect("/catalog/bookinstances");
  } catch (err) {
    console.error(`Error in bookinstance_delete_post: ${err.stack}`);
    next(err);
  }
});

// Display BookInstance update form on GET
exports.bookinstance_update_get = asyncHandler(async (req, res, next) => {
  try {
    console.log(`Attempting to get book instance with ID: ${req.params.id}`);
    const [bookInstance, allBooks] = await Promise.all([
      BookInstance.findById(req.params.id).populate("book").exec(),
      Book.find().sort({ title: 1 }).exec(),
    ]);

    if (bookInstance === null) {
      console.log("Book instance not found");
      const err = new Error("Примірник книги не знайдено");
      err.status = 404;
      return next(err);
    }

    res.render("bookinstance_form", {
      title: "Оновити примірник книги",
      bookinstance: bookInstance,
      books: allBooks,
    });
  } catch (err) {
    console.error(`Error in bookinstance_update_get: ${err.stack}`);
    next(err);
  }
});

// Handle BookInstance update on POST
exports.bookinstance_update_post = [
  body("book", "Книга не повинна бути порожньою.")
    .trim()
    .isLength({ min: 1 })
    .escape(),
  body("imprint", "Видавництво не повинно бути порожнім.")
    .trim()
    .isLength({ min: 1 })
    .escape(),
  body("status", "Статус не повинен бути порожнім.")
    .trim()
    .isLength({ min: 1 })
    .escape(),
  body("due_back", "Недійсна дата повернення")
    .optional({ values: "falsy" })
    .isISO8601()
    .toDate(),

  asyncHandler(async (req, res, next) => {
    const errors = validationResult(req);

    const bookInstance = new BookInstance({
      book: req.body.book,
      imprint: req.body.imprint,
      status: req.body.status,
      due_back: req.body.due_back,
      _id: req.params.id,
    });

    if (!errors.isEmpty()) {
      const allBooks = await Book.find().sort({ title: 1 }).exec();
      res.render("bookinstance_form", {
        title: "Оновити примірник книги",
        bookinstance: bookInstance,
        books: allBooks,
        errors: errors.array(),
      });
      return;
    }

    const updatedBookInstance = await BookInstance.findByIdAndUpdate(req.params.id, bookInstance, {});
    console.log(`Book instance updated with ID: ${req.params.id}`);
    res.redirect(updatedBookInstance.url);
  }),
];

module.exports = exports;