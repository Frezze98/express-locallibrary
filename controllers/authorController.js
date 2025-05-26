const Author = require("../models/author");
const Book = require("../models/book"); // Додаємо імпорт моделі Book
const { body, validationResult } = require("express-validator");
const asyncHandler = require("express-async-handler");

// Display list of all Authors
exports.author_list = asyncHandler(async (req, res, next) => {
  const allAuthors = await Author.find().sort({ family_name: 1 }).exec();
  res.render("author_list", {
    title: "Список авторів",
    author_list: allAuthors,
  });
});

// Display detail page for a specific Author
exports.author_detail = asyncHandler(async (req, res, next) => {
  try {
    const [author, allBooksByAuthor] = await Promise.all([
      Author.findById(req.params.id).exec(),
      Book.find({ author: req.params.id }, "title summary").exec(),
    ]);

    if (author === null) {
      const err = new Error("Автора не знайдено");
      err.status = 404;
      return next(err);
    }

    res.render("author_detail", {
      title: "Деталі автора",
      author: author,
      author_books: allBooksByAuthor,
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch author", details: err.message });
  }
});

// Display Author create form on GET
exports.author_create_get = (req, res, next) => {
  res.render("author_form", { title: "Створити автора" });
};

// Handle Author create on POST
exports.author_create_post = [
  // Валідація та очищення полів
  body("first_name")
    .trim()
    .isLength({ min: 1 })
    .escape()
    .withMessage("Ім'я повинно бути вказано.")
    .isAlphanumeric()
    .withMessage("Ім'я містить неалфанумерні символи."),
  body("family_name")
    .trim()
    .isLength({ min: 1 })
    .escape()
    .withMessage("Прізвище повинно бути вказано.")
    .isAlphanumeric()
    .withMessage("Прізвище містить неалфанумерні символи."),
  body("date_of_birth", "Недійсна дата народження")
    .optional({ values: "falsy" })
    .isISO8601()
    .toDate(),
  body("date_of_death", "Недійсна дата смерті")
    .optional({ values: "falsy" })
    .isISO8601()
    .toDate(),

  // Обробка запиту після валідації
  asyncHandler(async (req, res, next) => {
    const errors = validationResult(req);

    const author = new Author({
      first_name: req.body.first_name,
      family_name: req.body.family_name,
      date_of_birth: req.body.date_of_birth,
      date_of_death: req.body.date_of_death,
    });

    if (!errors.isEmpty()) {
      res.render("author_form", {
        title: "Створити автора",
        author: author,
        errors: errors.array(),
      });
      return;
    } else {
      await author.save();
      res.redirect(author.url);
    }
  }),
];

// Display Author delete form on GET
exports.author_delete_get = asyncHandler(async (req, res, next) => {
  try {
    const author = await Author.findById(req.params.id);
    if (!author) {
      return res.status(404).json({ error: "Author not found" });
    }
    res.render("author_delete", { title: "Delete Author", author });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch author", details: err.message });
  }
});

// Handle Author delete on POST
exports.author_delete_post = asyncHandler(async (req, res, next) => {
  try {
    const author = await Author.findByIdAndDelete(req.params.id);
    if (!author) {
      return res.status(404).json({ error: "Author not found" });
    }
    res.json({ message: "Author deleted" });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete author", details: err.message });
  }
});

// Display Author update form on GET
exports.author_update_get = asyncHandler(async (req, res, next) => {
  try {
    const author = await Author.findById(req.params.id);
    if (!author) {
      return res.status(404).json({ error: "Author not found" });
    }
    res.render("author_form", { title: "Update Author", author });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch author", details: err.message });
  }
});

// Handle Author update on POST
exports.author_update_post = asyncHandler(async (req, res, next) => {
  try {
    if (!req.body.first_name || !req.body.family_name) {
      return res.status(400).json({ error: "First name and family name are required" });
    }
    const author = await Author.findByIdAndUpdate(
      req.params.id,
      {
        first_name: req.body.first_name,
        family_name: req.body.family_name,
        date_of_birth: req.body.date_of_birth,
        date_of_death: req.body.date_of_death,
      },
      { new: true }
    );
    if (!author) {
      return res.status(404).json({ error: "Author not found" });
    }
    res.json({ message: "Author updated", author });
  } catch (err) {
    res.status(400).json({ error: "Failed to update author", details: err.message });
  }
});

module.exports = exports;