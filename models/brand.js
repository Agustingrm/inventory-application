var mongoose = require("mongoose");

var Schema = mongoose.Schema;

var BrandSchema = new Schema({
  name: { type: String, required: true, minLength: 2, maxLength: 100 },
});

// Virtual for Genre's URL
BrandSchema.virtual("url").get(function () {
  return "/catalog/brand/" + this._id;
});

//Export model
module.exports = mongoose.model("Brand", BrandSchema);
