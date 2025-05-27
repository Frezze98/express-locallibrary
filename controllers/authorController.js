const Author = require("../models/author");
const Book = require("../models/book");
const asyncHandler = require("express-async-handler");
const { body, validationResult } = require("express-validator");

// Display list of all Authors
exports.author_list = asyncHandler(async (req, res, next) => {
  console.log("Fetching all authors");
  const allAuthors = await Author.find().sort({ family_name: 1 }).exec();
  console.log(`Found ${allAuthors.length} authors`);
  res.render("author_list", {
    title: "Список авторів",
    author_list: allAuthors,
  });
});

// Display detail page for a specific Author
exports.author_detail = asyncHandler(async (req, res, next) => {
  try {
    console.log(`Fetching author with ID: ${req.params.id}`);
    const [author, authorBooks] = await Promise.all([
      Author.findById(req.params.id).exec(),
      Book.find({ author: req.params.id }, "title summary").exec(),
    ]);

    if (author === null) {
      console.log("Author not found");
      const err = new Error("Автора не знайдено");
      err.status = 404;
      return next(err);
    }

    console.log(`Author: ${author.name}, Books: ${authorBooks.length}`);
    res.render("author_detail", {
      title: "Деталі автора",
      author: author,
      author_books: authorBooks,
    });
  } catch (err) {
    console.error(`Error in author_detail: ${err.stack}`);
    next(err);
  }
});

// Display Author create form on GET
exports.author_create_get = asyncHandler(async (req, res, next) => {
  try {
    console.log("Rendering author create form");
    res.render("author_form", { title: "Створити автора", author: null });
  } catch (err) {
    console.error(`Error in author_create_get: ${err.stack}`);
    next(err);
  }
});

// Handle Author create on POST
exports.author_create_post = [
  // Валідація та очищення полів
  body("first_name")
    .trim()
    .notEmpty()
    .withMessage("Ім’я не повинно бути порожнім.")
    .isLength({ max: 100 })
    .withMessage("Ім’я занадто довге (макс. 100 символів).")
    .escape(),
  body("family_name")
    .trim()
    .notEmpty()
    .withMessage("Прізвище не повинно бути порожнім.")
    .isLength({ max: 100 })
    .withMessage("Прізвище занадто довге (макс. 100 символів).")
    .escape(),
  body("date_of_birth", "Недійсна дата народження")
    .optional({ values: "falsy" })
    .isISO8601()
    .toDate(),
  body("date_of_death", "Недійсна дата смерті")
    .optional({ values: "falsy" })
    .isISO8601()
    .toDate(),

  asyncHandler(async (req, res, next) => {
    try {
      console.log("Received POST data for author creation:", req.body);
      const errors = validationResult(req);

      const author = new Author({
        first_name: req.body.first_name,
        family_name: req.body.family_name,
        date_of_birth: req.body.date_of_birth || undefined,
        date_of_death: req.body.date_of_death || undefined,
      });

      if (!errors.isEmpty()) {
        console.log("Validation errors:", errors.array());
        res.render("author_form", {
          title: "Створити автора",
          author: author,
          errors: errors.array(),
        });
        return;
      }

      // Перевірка унікальності автора (опціонально)
      const existingAuthor = await Author.findOne({
        first_name: req.body.first_name,
        family_name: req.body.family_name,
      })
        .collation({ locale: "en", strength: 2 })
        .exec();
      if (existingAuthor) {
        console.log(`Author already exists: ${existingAuthor.name}`);
        res.render("author_form", {
          title: "Створити автора",
          author: author,
          errors: [{ msg: "Автор з таким ім’ям і прізвищем уже існує" }],
        });
        return;
      }

      console.log("Saving author:", author);
      await author.save();
      console.log(`Author saved with ID: ${author._id}`);
      res.redirect(author.url);
    } catch (err) {
      console.error(`Error in author_create_post: ${err.stack}`);
      next(err);
    }
  }),
];

// Display Author delete form on GET
exports.author_delete_get = asyncHandler(async (req, res, next) => {
  try {
    console.log(`Fetching author with ID: ${req.params.id}`);
    const [author, allBooksByAuthor] = await Promise.all([
      Author.findById(req.params.id).exec(),
      Book.find({ author: req.params.id }, "title summary").exec(),
    ]);

    if (author === null) {
      console.log("Author not found");
      res.redirect("/catalog/authors");
      return;
    }

    console.log(`Author: ${author.name}, Books: ${allBooksByAuthor.length}`);
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
      console.log(`Books found: ${allBooksByAuthor.length}`);
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
    console.log(`Fetching author with ID: ${req.params.id}`);
    const author = await Author.findById(req.params.id).exec();

    if (author === null) {
      console.log("Author not found");
      const err = new Error("Автора не знайдено");
      err.status = 404;
      return next(err);
    }

    res.render("author_form", {
      title: "Оновити автора",
      author: author,
    });
  } catch (err) {
    console.error(`Error in author_update_get: ${err.stack}`);
    next(err);
  }
});

// Handle Author update on POST
exports.author_update_post = [
  body("first_name")
    .trim()
    .notEmpty()
    .withMessage("Ім’я не повинно бути порожнім.")
    .isLength({ max: 100 })
    .withMessage("Ім’я занадто довге (макс. 100 символів).")
    .escape(),
  body("family_name")
    .trim()
    .notEmpty()
    .withMessage("Прізвище не повинно бути порожнім.")
    .isLength({ max: 100 })
    .withMessage("Прізвище занадто довге (макс. 100 символів).")
    .escape(),
  body("date_of_birth", "Недійсна дата народження")
    .optional({ values: "falsy" })
    .isISO8601()
    .toDate(),
  body("date_of_death", "Недійсна дата смерті")
    .optional({ values: "falsy" })
    .isISO8601()
    .toDate(),

  asyncHandler(async (req, res, next) => {
    try {
      console.log("Received POST data for author update:", req.body);
      const errors = validationResult(req);

      const author = new Author({
        first_name: req.body.first_name,
        family_name: req.body.family_name,
        date_of_birth: req.body.date_of_birth || undefined,
        date_of_death: req.body.date_of_death || undefined,
        _id: req.params.id,
      });

      if (!errors.isEmpty()) {
        console.log("Validation errors:", errors.array());
        res.render("author_form", {
          title: "Оновити автора",
          author: author,
          errors: errors.array(),
        });
        return;
      }

      console.log("Updating author:", author);
      const updatedAuthor = await Author.findByIdAndUpdate(req.params.id, author, {});
      console.log(`Author updated with ID: ${req.params.id}`);
      res.redirect(updatedAuthor.url);
    } catch (err) {
      console.error(`Error in author_update_post: ${err.stack}`);
      next(err);
    }
  }),
];

module.exports = exports;