var Item = require("../models/item");
var Category = require("../models/category");
var Brand = require("../models/brand");
var async = require("async");
const { body, validationResult } = require("express-validator");

exports.index = function (req, res) {
  async.parallel(
    {
      item_count: function (callback) {
        Item.countDocuments({}, callback); // Pass an empty object as match condition to find all documents of this collection
      },
      category_count: function (callback) {
        Category.countDocuments({}, callback);
      },
      brand_count: function (callback) {
        Brand.countDocuments({}, callback);
      },
    },
    function (err, results) {
      res.render("index", { title: "Inventory Home", error: err, data: results });
    }
  );
};

// Display list of all Items.
exports.item_list = function (req, res) {
  Item.find({}, "name description category price brand amount_stock sku")
    .populate("brand category")
    .exec(function (err, list_items) {
      if (err) {
        return next(err);
      }
      //Successful, so render
      res.render("item_list", { title: "Item List", item_list: list_items });
    });
};

// Display detail page for a specific Item.
exports.item_detail = function (req, res, next) {
  async.parallel(
    {
      item: function (callback) {
        Item.findById(req.params.id).populate("brand category").exec(callback);
      },
    },
    function (err, results) {
      if (err) {
        return next(err);
      }
      if (results.item == null) {
        // No results.
        var err = new Error("Item not found");
        err.status = 404;
        return next(err);
      }
      // Successful, so render.
      res.render("item_detail", { title: results.item.title, item: results.item });
    }
  );
};

// Display Item create form on GET.
exports.item_create_get = function (req, res, next) {
  // Get all categories and brands, which we can use for adding to our item.
  async.parallel(
    {
      categories: function (callback) {
        Category.find(callback);
      },
      brands: function (callback) {
        Brand.find(callback);
      },
    },
    function (err, results) {
      if (err) {
        return next(err);
      }
      res.render("item_form", {
        title: "Create Item",
        categories: results.categories,
        brands: results.brands,
        item: "",
        errors: "",
      });
    }
  );
};

// Handle Item create on POST.
exports.item_create_post = [
  // Convert the brand to an array.
  (req, res, next) => {
    if (!(req.body.brand instanceof Array)) {
      if (typeof req.body.brand === "undefined") req.body.brand = [];
      else req.body.brand = new Array(req.body.brand);
    }
    next();
  },

  // Validate and sanitise fields.
  body("name", "Name must not be empty.").trim().isLength({ min: 1 }).escape(),
  body("description", "Description must not be empty.").trim().isLength({ min: 1 }).escape(),
  body("category.*").escape(),
  body("price", "Price must not be empty").trim().isLength({ min: 1 }).isNumeric().escape(),
  body("brand.*").escape(),
  body("amount_stock", "Amount must not be empty").trim().isLength({ min: 1 }).isNumeric().escape(),
  body("sku", "sku must not be empty").trim().isLength({ min: 1 }).escape(),

  // Process request after validation and sanitization.
  (req, res, next) => {
    // Extract the validation errors from a request.
    const errors = validationResult(req);

    // Create a Item object with escaped and trimmed data.
    var item = new Item({
      name: req.body.name,
      description: req.body.description,
      category: req.body.category,
      price: req.body.price,
      brand: req.body.brand,
      amount_stock: req.body.amount_stock,
      sku: req.body.sku,
    });

    if (!errors.isEmpty()) {
      // There are errors. Render form again with sanitized values/error messages.

      // Get all brands and categories for form.
      async.parallel(
        {
          brands: function (callback) {
            Brand.find(callback);
          },
          categories: function (callback) {
            Category.find(callback);
          },
        },
        function (err, results) {
          if (err) {
            return next(err);
          }
          res.render("item_form", {
            title: "Create Item",
            categories: results.categories,
            brands: results.brands,
            item: item,
            errors: errors.array(),
          });
        }
      );
      return;
    } else {
      // Data from form is valid. Save item.
      item.save(function (err) {
        if (err) {
          return next(err);
        }
        //successful - redirect to new item record.
        res.redirect(item.url);
      });
    }
  },
];

// Display Item delete form on GET.
exports.item_delete_get = function (req, res) {
  async.parallel(
    {
      item: function (callback) {
        Item.findById(req.params.id).exec(callback);
      },
    },
    function (err, results) {
      if (err) {
        return next(err);
      }
      // Successful, so render.
      res.render("item_delete", { title: "Delete Item", item: results.item });
    }
  );
};

// Handle Item delete on POST.
exports.item_delete_post = function (req, res) {
  async.parallel(
    {
      item: function (callback) {
        Item.findById(req.body.itemid).exec(callback);
      },
    },
    function (err, results) {
      if (err) {
        return next(err);
      }
      //Delete object and redirect to the list of itemss.
      Item.findByIdAndRemove(req.body.itemid, function deleteItem(err) {
        if (err) {
          return next(err);
        }
        // Success - go to category list
        res.redirect("/catalog/items");
      });
    }
  );
};

// Display Item update form on GET.
exports.item_update_get = function (req, res, next) {
  // Get item, brands and categories for form.
  async.parallel(
    {
      item: function (callback) {
        Item.findById(req.params.id).populate("category").populate("brand").exec(callback);
      },
      brands: function (callback) {
        Brand.find(callback);
      },
      categories: function (callback) {
        Category.find(callback);
      },
    },
    function (err, results) {
      if (err) {
        return next(err);
      }
      if (results.item == null) {
        // No results.
        var err = new Error("Item not found");
        err.status = 404;
        return next(err);
      }
      // Success.
      res.render("item_form", {
        title: "Update Item",
        categories: results.categories,
        brands: results.brands,
        item: results.item,
        errors: "",
      });
    }
  );
};

// Handle Item update on POST.
exports.item_update_post = [
  // Convert the brand to an array
  (req, res, next) => {
    if (!(req.body.brand instanceof Array)) {
      if (typeof req.body.brand === "undefined") req.body.brand = [];
      else req.body.brand = new Array(req.body.brand);
    }
    next();
  },

  // Validate and sanitise fields.
  body("name", "Name must not be empty.").trim().isLength({ min: 1 }).escape(),
  body("description", "Description must not be empty.").trim().isLength({ min: 1 }).escape(),
  body("category.*").escape(),
  body("price", "Price must not be empty").trim().isLength({ min: 1 }).isNumeric().escape(),
  body("brand.*").escape(),
  body("amount_stock", "Amount must not be empty").trim().isLength({ min: 1 }).isNumeric().escape(),
  body("sku", "sku must not be empty").trim().isLength({ min: 1 }).escape(),

  // Process request after validation and sanitization.
  (req, res, next) => {
    // Extract the validation errors from a request.
    const errors = validationResult(req);

    // Create a Item object with escaped/trimmed data and old id.
    var item = new Item({
      name: req.body.name,
      description: req.body.description,
      category: req.body.category,
      price: req.body.price,
      brand: typeof req.body.brand === "undefined" ? [] : req.body.brand,
      amount_stock: req.body.amount_stock,
      _id: req.params.id, //This is required, or a new ID will be assigned!
    });

    if (!errors.isEmpty()) {
      // There are errors. Render form again with sanitized values/error messages.

      // Get all categories and brands for form.
      async.parallel(
        {
          categories: function (callback) {
            Category.find(callback);
          },
          brands: function (callback) {
            Brand.find(callback);
          },
        },
        function (err, results) {
          if (err) {
            return next(err);
          }

          res.render("item_form", {
            title: "Update Item",
            categories: results.categories,
            brands: results.brands,
            item: item,
            errors: errors.array(),
          });
        }
      );
      return;
    } else {
      // Data from form is valid. Update the record.
      Item.findByIdAndUpdate(req.params.id, item, {}, function (err, theitem) {
        if (err) {
          return next(err);
        }
        // Successful - redirect to item detail page.
        res.redirect(theitem.url);
      });
    }
  },
];
