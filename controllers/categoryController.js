var Category = require('../models/category');
var Item = require("../models/item");
var async = require("async");

// Display list of all Categories.
exports.category_list = function (req, res) {
    Category.find({}, "name description")
      .exec(function (err, list_categories) {
        if (err) {
          return next(err);
        }
        //Successful, so render
        res.render("category_list", { title: "Category List", category_list: list_categories });
      });
  };

// Display detail page for a specific Category.
exports.category_detail = function (req, res, next) {
    async.parallel(
      {
        category: function (callback) {
          Category.findById(req.params.id).exec(callback);
        },
  
        category_items: function (callback) {
          Item.find({ category: req.params.id }).exec(callback);
        },
      },
      function (err, results) {
        if (err) {
          return next(err);
        }
        if (results.category == null) {
          // No results.
          var err = new Error("Category not found");
          err.status = 404;
          return next(err);
        }
        // Successful, so render
        res.render("category_detail", { title: "Category Detail", category: results.category, category_items: results.category_items });
      }
    );
  };
// Display Category create form on GET.
exports.category_create_get = function(req, res) {
    res.send('NOT IMPLEMENTED: Category create GET');
};

// Handle Category create on POST.
exports.category_create_post = function(req, res) {
    res.send('NOT IMPLEMENTED: Category create POST');
};

// Display Category delete form on GET.
exports.category_delete_get = function(req, res) {
    res.send('NOT IMPLEMENTED: Category delete GET');
};

// Handle Category delete on POST.
exports.category_delete_post = function(req, res) {
    res.send('NOT IMPLEMENTED: Category delete POST');
};

// Display Category update form on GET.
exports.category_update_get = function(req, res) {
    res.send('NOT IMPLEMENTED: Category update GET');
};

// Handle Category update on POST.
exports.category_update_post = function(req, res) {
    res.send('NOT IMPLEMENTED: Category update POST');
};