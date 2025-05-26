const mongoose = require("mongoose");
const { DateTime } = require("luxon");

const Schema = mongoose.Schema;

const AuthorSchema = new Schema({
  first_name: { type: String, required: true, maxLength: 100 },
  family_name: { type: String, required: true, maxLength: 100 },
  date_of_birth: { type: Date },
  date_of_death: { type: Date },
});

AuthorSchema.virtual("name").get(function () {
  let fullname = "";
  if (this.first_name && this.family_name) {
    fullname = `${this.family_name}, ${this.first_name}`;
  }
  return fullname;
});

AuthorSchema.virtual("url").get(function () {
  return `/catalog/author/${this._id}`;
});

// Оновлюємо віртуальну властивість lifespan
AuthorSchema.virtual("lifespan").get(function () {
  let dob = this.date_of_birth
    ? DateTime.fromJSDate(this.date_of_birth)
        .setLocale("uk")
        .toFormat("d MMMM yyyy 'року'")
    : "н/д";
  let dod = this.date_of_death
    ? DateTime.fromJSDate(this.date_of_death)
        .setLocale("uk")
        .toFormat("d MMMM yyyy 'року'")
    : "н/д";
  return `${dob} - ${dod}`;
});

module.exports = mongoose.model("Author", AuthorSchema);