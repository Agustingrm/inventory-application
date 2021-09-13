#! /usr/bin/env node

console.log(
  "This script populates items, categories and brands to your database. Specified database as argument - e.g.: populatedb mongodb+srv://cooluser:coolpassword@cluster0.a9azn.mongodb.net/local_library?retryWrites=true"
);

// Get arguments passed on command line
var userArgs = process.argv.slice(2);
/*
if (!userArgs[0].startsWith('mongodb')) {
    console.log('ERROR: You need to specify a valid mongodb URL as the first argument');
    return
}
*/
var async = require("async");
var Item = require("./models/item");
var Category = require("./models/category");
var Brand = require("./models/brand");

var mongoose = require("mongoose");
var mongoDB = userArgs[0];
mongoose.connect(mongoDB, { useNewUrlParser: true, useUnifiedTopology: true });
mongoose.Promise = global.Promise;
var db = mongoose.connection;
db.on("error", console.error.bind(console, "MongoDB connection error:"));

var items = [];
var categories = [];
var brands = [];

function itemCreate(name, description, category, price, brand, amount_stock, sku, cb) {
  itemdetail = { name: name, description: description, category: category, price: price, brand: brand, sku: sku, amount_stock: amount_stock };

  if (brand != false) itemdetail.brand = brand;

  var item = new Item(itemdetail);

  item.save(function (err) {
    if (err) {
      cb(err, null);
      return;
    }
    console.log("New Item: " + item);
    items.push(item);
    cb(null, item);
  });
}

function brandCreate(name, cb) {
  var brand = new Brand({ name: name });

  brand.save(function (err) {
    if (err) {
      cb(err, null);
      return;
    }
    console.log("New Brand: " + brand);
    brands.push(brand);
    cb(null, brand);
  });
}

function categoryCreate(name, description, cb) {
  categorydetail = {
    name: name,
    description: description,
  };

  var category = new Category(categorydetail);
  category.save(function (err) {
    if (err) {
      cb(err, null);
      return;
    }
    console.log("New Category: " + category);
    categories.push(category);
    cb(null, category);
  });
}

function createCategoriesBrand(cb) {
  async.series(
    [
      function (callback) {
        categoryCreate("Shoes", "Find everything to wear in your feet", callback);
      },
      function (callback) {
        categoryCreate("Hats", "Find everything to get protectiom from the sun", callback);
      },
      function (callback) {
        categoryCreate("Trousers", "Find here everything to wear in your legs", callback);
      },
      function (callback) {
        categoryCreate("Shirts", "Find all diferent type of shirts", callback);
      },
      function (callback) {
        brandCreate("Adidas", callback);
      },
      function (callback) {
        brandCreate("Nike", callback);
      },
      function (callback) {
        brandCreate("Reebok", callback);
      },
      function (callback) {
        brandCreate("Under Armour", callback);
      },
    ],
    // optional callback
    cb
  );
}

function createItems(cb) {
  async.parallel(
    [
      function (callback) {
        itemCreate(
          "Superstar",
          "Originally made for basketball courts in the '70s. Celebrated by hip hop royalty in the '80s. The adidas Superstar shoe is now a lifestyle staple for streetwear enthusiasts. The world-famous shell toe feature remains, providing style and protection. Just like it did on the B-ball courts back in the day.",
          categories[0],
          99,
          brands[0],
          5,
          "cd4521",
          callback
        );
      },
      function (callback) {
        itemCreate("Air Max", "Pants to wear everyday. Check them out", categories[2], 39, brands[1], 8, "pj1893", callback);
      },
      function (callback) {
        itemCreate("Renegade", "Best hat to wear when playing golf. Made out of silk", categories[1], 19, brands[3], 20, "ol0987", callback);
      },
      function (callback) {
        itemCreate("Feather Shirt", "The lightest shirt on earth", categories[3], 29, brands[2], 18, "ty9821", callback);
      },
    ],
    // optional callback
    cb
  );
}

async.series(
  [createCategoriesBrand, createItems],
  // Optional callback
  function (err, results) {
    if (err) {
      console.log("FINAL ERR: " + err);
    } else {
      console.log("Done!");
    }
    // All done, disconnect from database
    mongoose.connection.close();
  }
);
