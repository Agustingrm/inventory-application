var Brand = require("../models/brand");
var Item = require("../models/item");
var async = require("async");
const { body, validationResult } = require("express-validator");

// Display list of all Brands.
exports.brand_list = function (req, res) {
  Brand.find({}, "name").exec(function (err, list_brands) {
    if (err) {
      return next(err);
    }
    //Successful, so render
    res.render("brand_list", { title: "Brand List", brand_list: list_brands });
  });
};

// Display detail page for a specific Brand.
exports.brand_detail = function (req, res, next) {
  async.parallel(
    {
      brand: function (callback) {
        Brand.findById(req.params.id).exec(callback);
      },

      brand_items: function (callback) {
        Item.find({ brand: req.params.id }).exec(callback);
      },
    },
    function (err, results) {
      if (err) {
        return next(err);
      }
      if (results.brand == null) {
        // No results.
        var err = new Error("Brand not found");
        err.status = 404;
        return next(err);
      }
      // Successful, so render
      res.render("brand_detail", { title: "Brand Detail", brand: results.brand, brand_items: results.brand_items });
    }
  );
};
// Display Brand create form on GET.
exports.brand_create_get = function (req, res, next) {
  res.render("brand_form", { title: "Create Brand", brand: "", errors: "" });
};

// Handle Brand create on POST.
exports.brand_create_post = [
  // Validate and santize the name field.
  body("name", "Brand name required").trim().isLength({ min: 1 }).escape(),

  // Process request after validation and sanitization.
  (req, res, next) => {
    // Extract the validation errors from a request.
    const errors = validationResult(req);

    // Create a brand object with escaped and trimmed data.
    var brand = new Brand({ name: req.body.name });

    if (!errors.isEmpty()) {
      // There are errors. Render the form again with sanitized values/error messages.
      res.render("brand_form", { title: "Create Brand", brand: brand, errors: errors.array() });
      return;
    } else {
      // Data from form is valid.
      // Check if Brand with same name already exists.
      Brand.findOne({ name: req.body.name }).exec(function (err, found_brand) {
        if (err) {
          return next(err);
        }

        if (found_brand) {
          // Brand exists, redirect to its detail page.
          res.redirect(found_brand.url);
        } else {
          brand.save(function (err) {
            if (err) {
              return next(err);
            }
            // Brand saved. Redirect to brand detail page.
            res.redirect(brand.url);
          });
        }
      });
    }
  },
];

// Display Brand delete form on GET.
exports.brand_delete_get = function (req, res) {
  async.parallel(
    {
      brand: function (callback) {
        Brand.findById(req.params.id).exec(callback);
      },
      brand_items: function (callback) {
        Item.find({ brand: req.params.id }).exec(callback);
      },
    },
    function (err, results) {
      if (err) {
        return next(err);
      }
      if (results.brand == null) {
        // No results.
        res.redirect("/catalog/brands");
      }
      // Successful, so render.
      res.render("brand_delete", { title: "Delete brand", brand: results.brand, brand_items: results.brand_items });
    }
  );
};

// Handle Brand delete on POST.
exports.brand_delete_post = function (req, res) {
  async.parallel(
    {
      brand: function (callback) {
        Brand.findById(req.body.brandid).exec(callback);
      },
      brand_items: function (callback) {
        Item.find({ brand: req.body.brandid }).exec(callback);
      },
    },
    function (err, results) {
      if (err) {
        return next(err);
      }
      // Success
      if (results.brand_items.length > 0) {
        // Brand has items. Render in same way as for GET route.
        res.render("brand_delete", { title: "Delete Brand", brand: results.brand, brand_items: results.brands_items });
        return;
      } else {
        // Brand has no items. Delete object and redirect to the list of brands.
        Brand.findByIdAndRemove(req.body.brandid, function deleteBrand(err) {
          if (err) {
            return next(err);
          }
          // Success - go to brand list
          res.redirect("/catalog/brands");
        });
      }
    }
  );
};

// Display Brand update form on GET.
exports.brand_update_get = function (req, res, next) {
  // Get item, brands and brands for form.
  async.parallel(
    {
      brand: function (callback) {
        Brand.findById(req.params.id).exec(callback);
      },
    },
    function (err, results) {
      if (err) {
        return next(err);
      }
      if (results.brand == null) {
        // No results.
        var err = new Error("Brand not found");
        err.status = 404;
        return next(err);
      }
      // Success.
      res.render("brand_form", {
        title: "Update Brand",
        brand: results.brand,
        item: "",
        errors: "",
      });
    }
  );
};

// Handle Brand update on POST.
exports.brand_update_post = [
  // Validate and sanitise fields.
  body("name", "Brand name required").trim().isLength({ min: 1 }).escape(),
  // Process request after validation and sanitization.
  (req, res, next) => {
    // Extract the validation errors from a request.
    const errors = validationResult(req);

    // Create a Brand object with escaped/trimmed data and old id.
    var brand = new Brand({
      name: req.body.name,
      _id: req.params.id, //This is required, or a new ID will be assigned!
    });

    if (!errors.isEmpty()) {
      // There are errors. Render form again with sanitized values/error messages.

      // Get all info for form.
      async.parallel(
        {
          item: function (callback) {
            Item.find(callback);
          },
          brand: function (callback) {
            Brand.find(callback);
          },
        },
        function (err, results) {
          if (err) {
            return next(err);
          }

          res.render("brand_form", {
            title: "Update Brand",
            brand: results.brand,
            item: results.item,
            errors: errors.array(),
          });
        }
      );
      return;
    } else {
      // Data from form is valid. Update the record.
      Brand.findByIdAndUpdate(req.params.id, brand, {}, function (err, thebrand) {
        if (err) {
          return next(err);
        }
        // Successful - redirect to brand detail page.
        res.redirect(thebrand.url);
      });
    }
  },
];
