const Author = require("../models/author");
const Book = require("../models/book");
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
    console.log(`Attempting to get author with ID: ${req.params.id}`);
    const [author, allBooksByAuthor] = await Promise.all([
      Author.findById(req.params.id).exec(),
      Book.find({ author: req.params.id }, "title summary").exec(),
    ]);

    if (author === null) {
      console.log("Author not found");
      res.redirect("/catalog/authors");
      return;
    }

    console.log(`Author: ${JSON.stringify(author)}, Books: ${JSON.stringify(allBooksByAuthor)}`);
    res.render("author_delete", {
      title: "Видалити автора",
      author: author,
      author_books: allBooksByAuthor,
    });
  } catch (err) {
    console.error(`Error in author_delete_get: ${err.stack}`);
    next(err);
  }
});

// Handle Author delete on POST
exports.author_delete_post = asyncHandler(async (req, res, next) => {
  try {
    console.log(`Attempting to delete author with ID: ${req.body.authorid}`);
    const [author, allBooksByAuthor] = await Promise.all([
      Author.findById(req.params.id).exec(),
      Book.find({ author: req.params.id }, "title summary").exec(),
    ]);

    if (!author) {
      console.log("Author not found");
      res.redirect("/catalog/authors");
      return;
    }

    if (allBooksByAuthor.length > 0) {
      console.log(`Books found: ${JSON.stringify(allBooksByAuthor)}`);
      res.render("author_delete", {
        title: "Видалити автора",
        author: author,
        author_books: allBooksByAuthor,
      });
      return;
    }

    if (!req.body.authorid) {
      console.log("No authorid provided in form");
      throw new Error("Invalid form submission: authorid missing");
    }

    await Author.findByIdAndDelete(req.body.authorid);
    console.log(`Author deleted with ID: ${req.body.authorid}`);
    res.redirect("/catalog/authors");
  } catch (err) {
    console.error(`Error in author_delete_post: ${err.stack}`);
    next(err);
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