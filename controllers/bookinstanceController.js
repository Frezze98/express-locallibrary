const BookInstance = require("../models/bookinstance");
const Book = require("../models/book");
const { body, validationResult } = require("express-validator");
const asyncHandler = require("express-async-handler");
const mongoose = require("mongoose");

// Display list of all BookInstances
exports.bookinstance_list = asyncHandler(async (req, res, next) => {
  console.log("Fetching all book instances");
  const allBookInstances = await BookInstance.find()
    .populate("book")
    .sort({ "book.title": 1 })
    .exec();
  console.log(`Found ${allBookInstances.length} book instances`);

  res.render("bookinstance_list", {
    title: "Список екземплярів книг",
    bookinstance_list: allBookInstances,
  });
});

// Display detail page for a specific BookInstance
exports.bookinstance_detail = asyncHandler(async (req, res, next) => {
  try {
    console.log(`Fetching book instance with ID: ${req.params.id}`);
    const bookinstance = await BookInstance.findById(req.params.id).populate("book").exec();
    if (!bookinstance) {
      console.log("Book instance not found");
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
  try {
    console.log("Fetching all books for BookInstance create form");
    const allBooks = await Book.find({}, "title").sort({ title: 1 }).exec();
    console.log(`Found ${allBooks.length} books`);

    if (allBooks.length === 0) {
      console.warn("No books found in database");
      res.render("bookinstance_form", {
        title: "Створити екземпляр книги",
        book_list: [],
        errors: [{ msg: "Немає доступних книг. Спочатку створіть книгу." }],
      });
      return;
    }

    res.render("bookinstance_form", {
      title: "Створити екземпляр книги",
      book_list: allBooks,
      bookinstance: null,
    });
  } catch (err) {
    console.error(`Error in bookinstance_create_get: ${err.stack}`);
    next(err);
  }
});

// Handle BookInstance create on POST
exports.bookinstance_create_post = [
  // Валідація та очищення полів
  body("book")
    .trim()
    .notEmpty()
    .withMessage("Книга не повинна бути порожньою.")
    .custom((value) => {
      if (!mongoose.Types.ObjectId.isValid(value)) {
        throw new Error("Невалідний ID книги");
      }
      return true;
    }),
  body("imprint", "Видавництво не повинно бути порожнім.")
    .trim()
    .notEmpty()
    .escape(),
  body("status", "Статус не повинен бути порожнім.")
    .trim()
    .notEmpty()
    .isIn(["Maintenance", "Available", "Loaned", "Reserved"])
    .withMessage("Невалідний статус"),
  body("due_back", "Недійсна дата повернення")
    .optional({ values: "falsy" })
    .isISO8601()
    .toDate(),

  // Обробка запиту після валідації
  asyncHandler(async (req, res, next) => {
    try {
      console.log("Received POST data:", req.body);
      const errors = validationResult(req);

      const bookInstance = new BookInstance({
        book: req.body.book,
        imprint: req.body.imprint,
        status: req.body.status,
        due_back: req.body.due_back || undefined,
      });

      if (!errors.isEmpty()) {
        console.log("Validation errors:", errors.array());
        const allBooks = await Book.find({}, "title").sort({ title: 1 }).exec();
        console.log(`Rendering form with ${allBooks.length} books`);
        res.render("bookinstance_form", {
          title: "Створити екземпляр книги",
          book_list: allBooks,
          bookinstance: bookInstance,
          errors: errors.array(),
        });
        return;
      }

      // Перевірка існування книги
      const bookExists = await Book.findById(req.body.book).exec();
      if (!bookExists) {
        console.log(`Book with ID ${req.body.book} not found`);
        const allBooks = await Book.find({}, "title").sort({ title: 1 }).exec();
        res.render("bookinstance_form", {
          title: "Створити екземпляр книги",
          book_list: allBooks,
          bookinstance: bookInstance,
          errors: [{ msg: "Вибрана книга не існує" }],
        });
        return;
      }

      console.log("Saving book instance:", bookInstance);
      await bookInstance.save();
      console.log(`Book instance saved with ID: ${bookInstance._id}`);
      res.redirect(bookInstance.url);
    } catch (err) {
      console.error(`Error in bookinstance_create_post: ${err.stack}`);
      next(err);
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
      Book.find({}, "title").sort({ title: 1 }).exec(),
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
    .notEmpty()
    .escape(),
  body("imprint", "Видавництво не повинно бути порожнім.")
    .trim()
    .notEmpty()
    .escape(),
  body("status", "Статус не повинен бути порожнім.")
    .trim()
    .notEmpty()
    .escape(),
  body("due_back", "Недійсна дата повернення")
    .optional({ values: "falsy" })
    .isISO8601()
    .toDate(),

  asyncHandler(async (req, res, next) => {
    try {
      console.log("Received POST data for update:", req.body);
      const errors = validationResult(req);

      const bookInstance = new BookInstance({
        book: req.body.book,
        imprint: req.body.imprint,
        status: req.body.status,
        due_back: req.body.due_back || undefined,
        _id: req.params.id,
      });

      if (!errors.isEmpty()) {
        console.log("Validation errors:", errors.array());
        const allBooks = await Book.find({}, "title").sort({ title: 1 }).exec();
        res.render("bookinstance_form", {
          title: "Оновити примірник книги",
          bookinstance: bookInstance,
          books: allBooks,
          errors: errors.array(),
        });
        return;
      }

      console.log("Updating book instance:", bookInstance);
      const updatedBookInstance = await BookInstance.findByIdAndUpdate(req.params.id, bookInstance, {});
      console.log(`Book instance updated with ID: ${req.params.id}`);
      res.redirect(updatedBookInstance.url);
    } catch (err) {
      console.error(`Error in bookinstance_update_post: ${err.stack}`);
      next(err);
    }
  }),
];

module.exports = exports;