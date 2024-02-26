const { body, validationResult } = require("express-validator");
const Item = require("../models/item");
const Category = require("../models/category");

const asyncHandler = require("express-async-handler");

exports.index = asyncHandler(async (req, res, next) => {
  // Get details of items, item instances, and category counts (in parallel)
  const [
    numItems,
    numCategories,
  ] = await Promise.all([
    Item.countDocuments({}).exec(),
    Category.countDocuments({}).exec(),
  ]);

  res.render("index", {
    title: "Inventory Home",
    item_count: numItems,
    category_count: numCategories,
  });
});


// Display list of all items.
exports.item_list = asyncHandler(async (req, res, next) => {
    const allItems = await Item.find({}, "name category")
      .sort({ name: 1 })
      .populate("category")
      .exec();
  
    res.render("item_list", { title: "Item List", item_list: allItems });
  });  

// Display detail page for a specific item.
exports.item_detail = asyncHandler(async (req, res, next) => {
    // Get details of items 
    const item = await 
      Item.findById(req.params.id).populate("category").exec();
  
    if (item === null) {
      // No results.
      const err = new Error("Item not found");
      err.status = 404;
      return next(err);
    }
  
    res.render("item_detail", {
      title: item.name,
      item: item,
    });
});  

// Display item create form on GET.
exports.item_create_get = asyncHandler(async (req, res, next) => {
    // Get all categories, which we can use for adding to our item.
    const allCategories = await 
      Category.find().sort({ name: 1 }).exec();
  
    res.render("item_form", {
      title: "Create Item",
      categories: allCategories,
    });
});  

// Handle item create on POST.
exports.item_create_post = [
    // Convert the category to an array.
    (req, res, next) => {
      if (!Array.isArray(req.body.category)) {
        req.body.category =
          typeof req.body.category === "undefined" ? [] : [req.body.category];
      }
      next();
    },
  
    // Validate and sanitize fields.
    body("name", "Name must not be empty.")
      .trim()
      .isLength({ min: 1 })
      .escape(),
    body("numberInStock", "Number in stock must not be empty.")
      .trim()
      .isLength({ min: 1 })
      .escape(),
    body("description", "Description must not be empty.")
      .trim()
      .isLength({ min: 1 })
      .escape(),
    body("price", "Price must not be empty").trim().isLength({ min: 1 }).escape(),
    body("category.*").escape(),
    // Process request after validation and sanitization.
  
    asyncHandler(async (req, res, next) => {
      // Extract the validation errors from a request.
      const errors = validationResult(req);
  
      // Create a Item object with escaped and trimmed data.
      const item = new Item({
        name: req.body.name,
        description: req.body.description,
        category: req.body.category,
        numberInStock: req.body.numberInStock,
        price: req.body.price,
      });
  
      if (!errors.isEmpty()) {
        // There are errors. Render form again with sanitized values/error messages.
  
        // Get all categories for form.
        const allCategories = await 
            Category.find().sort({ name: 1 }).exec();
  
        // Mark our selected categories as checked.
        for (const category of allCategories) {
          if (item.category.includes(category._id)) {
            category.checked = "true";
          }
        }
        res.render("item_form", {
          title: "Create Item",
          categories: allCategories,
          item: item,
          errors: errors.array(),
        });
      } else {
        // Data from form is valid. Save item.
        await item.save();
        res.redirect(item.url);
      }
    }),
  ];

// Display item delete form on GET.
exports.item_delete_get = asyncHandler(async (req, res, next) => {
  // Get details of item
  const item = await 
    Item.findById(req.params.id).exec();

  if (item === null) {
    // No results.
    res.redirect("/inventory/items");
  }

  res.render("item_delete", {
    title: "Delete Item",
    item: item,
  });
});

// Handle item delete on POST.
exports.item_delete_post = asyncHandler(async (req, res, next) => {
  // Get details of item and all their items
  const item = await 
    Item.findById(req.params.id).exec();
    
    // Delete object and redirect to the list of items.
    await Item.findByIdAndDelete(req.body.itemid);
    res.redirect("/inventory/items");
});

// Display item update form on GET.
exports.item_update_get = asyncHandler(async (req, res, next) => {
  // Get items and categories for form.
  const [item, allCategories] = await Promise.all([
    Item.findById(req.params.id).exec(),
    Category.find().sort({ name: 1 }).exec(),
  ]);

  if (item === null) {
    // No results.
    const err = new Error("Item not found");
    err.status = 404;
    return next(err);
  }

  // Mark our selected categories as checked.
  allCategories.forEach((category) => {
    if (item.category.includes(category._id)) category.checked = "true";
  });

  res.render("item_form", {
    title: "Update Item",
    categories: allCategories,
    item: item,
  });
});


// Handle item update on POST.
exports.item_update_post = [
  // Convert the category to an array.
  (req, res, next) => {
    if (!Array.isArray(req.body.category)) {
      req.body.category =
        typeof req.body.category === "undefined" ? [] : [req.body.category];
    }
    next();
  },

  // Validate and sanitize fields.
  // Validate and sanitize fields.
    body("name", "Name must not be empty.")
      .trim()
      .isLength({ min: 1 })
      .escape(),
    body("numberInStock", "Number in stock must not be empty.")
      .trim()
      .isLength({ min: 1 })
      .escape(),
    body("description", "Description must not be empty.")
      .trim()
      .isLength({ min: 1 })
      .escape(),
    body("price", "Price must not be empty").trim().isLength({ min: 1 }).escape(),
    body("category.*").escape(),

  // Process request after validation and sanitization.
  asyncHandler(async (req, res, next) => {
    // Extract the validation errors from a request.
    const errors = validationResult(req);

    // Create a Item object with escaped/trimmed data and old id.
    const item = new Item({
        name: req.body.name,
        description: req.body.description,
        category: typeof req.body.category === "undefined" ? [] : req.body.category,
        numberInStock: req.body.numberInStock,
        price: req.body.price,
        _id: req.params.id, // This is required, or a new ID will be assigned!
      });

    if (!errors.isEmpty()) {
      // There are errors. Render form again with sanitized values/error messages.

      // Get all categories for form.
        const allCategories = await 
            Category.find().sort({ name: 1 }).exec();
  
        // Mark our selected categories as checked.
        for (const category of allCategories) {
          if (item.category.indexOf(category._id) > -1) {
            category.checked = "true";
          }
        }
        res.render("item_form", {
          title: "Create Item",
          categories: allCategories,
          item: item,
          errors: errors.array(),
        });
      return;
    } else {
      // Data from form is valid. Update the record.
      const updatedItem = await Item.findByIdAndUpdate(req.params.id, item, {});
      // Redirect to book detail page.
      res.redirect(updatedItem.url);
    }
  }),
];