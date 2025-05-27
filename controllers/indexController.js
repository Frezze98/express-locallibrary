const Book = require("../models/book");
const BookInstance = require("../models/bookinstance");
const Author = require("../models/author");
const Genre = require("../models/genre");
const asyncHandler = require("express-async-handler");

exports.index = asyncHandler(async (req, res, next) => {
  try {
    console.log("Fetching library statistics for /catalog");
    const [
      numBooks,
      numInstances,
      numAvailableInstances,
      numAuthors,
      numGenres,
    ] = await Promise.all([
      Book.countDocuments({}).exec(),
      BookInstance.countDocuments({}).exec(),
      BookInstance.countDocuments({ status: "Available" }).exec(),
      Author.countDocuments({}).exec(),
      Genre.countDocuments({}).exec(),
    ]);

    console.log("Statistics:", {
      book_count: numBooks,
      book_instance_count: numInstances,
      book_instance_available_count: numAvailableInstances,
      author_count: numAuthors,
      genre_count: numGenres,
    });

    res.render("index", {
      title: "Місцева бібліотека",
      book_count: numBooks,
      book_instance_count: numInstances,
      book_instance_available_count: numAvailableInstances || 0,
      author_count: numAuthors,
      genre_count: numGenres,
    });
  } catch (err) {
    console.error(`Error in indexController: ${err.stack}`);
    next(err);
  }
});

module.exports = exports;