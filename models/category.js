var mongoose = require("mongoose");

var Schema = mongoose.Schema;

var CategorySchema = new Schema({
  name: { type: String, required: true, minLength: 2, maxLength: 100 },
  description: { type: String, required: true, minLength: 15, maxLength: 150 },
});

// Virtual for Genre's URL
CategorySchema.virtual("url").get(function () {
  return "/catalog/category/" + this._id;
});

//Export model
module.exports = mongoose.model("Category", CategorySchema);
