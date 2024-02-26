const { body, validationResult } = require("express-validator");
const Item = require("../models/item");
const Category = require("../models/category");
const asyncHandler = require("express-async-handler");

// Display list of all Categories.
exports.category_list = asyncHandler(async (req, res, next) => {
    const allCategories = await Category.find().sort({ name: 1 }).exec();
    res.render("category_list", {
      title: "Category List",
      category_list: allCategories,
    });
});  

// Display detail page for a specific Category.
exports.category_detail = asyncHandler(async (req, res, next) => {
    // Get details of category and all associated items (in parallel)
    const [category, itemsInCategory] = await Promise.all([
      Category.findById(req.params.id).exec(),
      Item.find({ category: req.params.id }, "name description").exec(),
    ]);
    if (category === null) {
      // No results.
      const err = new Error("Category not found");
      err.status = 404;
      return next(err);
    }
  
    res.render("category_detail", {
      title: "Category Detail",
      category: category,
      category_items: itemsInCategory,
    });
});  

// Display Category create form on GET.
exports.category_create_get = (req, res, next) => {
    res.render("category_form", { title: "Create Category" });
};  

// Handle Category create on POST.
exports.category_create_post = [
    // Validate and sanitize the name field.
    body("name", "Category name must contain at least 3 characters")
      .trim()
      .isLength({ min: 3 })
      .escape(),
    body("description", "Description must not be empty.")
      .trim()
      .isLength({ min: 1 })
      .escape(),
  
    // Process request after validation and sanitization.
    asyncHandler(async (req, res, next) => {
      // Extract the validation errors from a request.
      const errors = validationResult(req);
  
      // Create a category object with escaped and trimmed data.
      const category = new Category({
        name: req.body.name,
        description: req.body.description,
      });
  
      if (!errors.isEmpty()) {
        // There are errors. Render the form again with sanitized values/error messages.
        res.render("category_form", {
          title: "Create Category",
          category: category,
          errors: errors.array(),
        });
        return;
      } else {
        // Data from form is valid.
        // Check if Category with same name already exists.
        const categoryExists = await Category.findOne({ name: req.body.name }).exec();
        if (categoryExists) {
          // Genre exists, redirect to its detail page.
          res.redirect(categoryExists.url);
        } else {
          await category.save();
          // New genre saved. Redirect to genre detail page.
          res.redirect(category.url);
        }
      }
    }),
];

// Display Category delete form on GET.
exports.category_delete_get = asyncHandler(async (req, res, next) => {
  // Get details of category
  const [category, allItemsInCategory] = await Promise.all([
    Category.findById(req.params.id).exec(),
    Item.find({ category: req.params.id }, "name description").exec(),
  ]);

  if (category === null) {
    // No results.
    res.redirect("/inventory/category");
  }

  res.render("category_delete", {
    title: "Delete Category",
    category: category,
    category_items: allItemsInCategory,
  });
});

// Handle Category delete on POST.
exports.category_delete_post = asyncHandler(async (req, res, next) => {
  // Get details of category and all their items (in parallel)
  const [category, allItemsInCategory] = await Promise.all([
    Category.findById(req.params.id).exec(),
    Item.find({ category: req.params.id }, "name description").exec(),
  ]);

  if (allItemsInCategory.length > 0) {
    // Genre has books. Render in same way as for GET route.
    res.render("category_delete", {
      title: "Delete Category",
      category: category,
      category_items: allItemsInCategory,
    });
    return;
  } else {
    // Category has no books. Delete object and redirect to the list of categories.
    await Category.findByIdAndDelete(req.body.categoryid);
    res.redirect("/inventory/categories");
  }
});

// Display Category update form on GET.
exports.category_update_get = asyncHandler(async (req, res, next) => {
  // Get categories for form.
  const category = await 
    Category.findById(req.params.id).exec();

  if (category === null) {
    // No results.
    const err = new Error("Category not found");
    err.status = 404;
    return next(err);
  }

  res.render("category_form", {
    title: "Update Category",
    category: category,
  });
});

// Handle category update on POST.
exports.category_update_post = [

  // Validate and sanitize the name field.
    body("name", "Category name must contain at least 3 characters")
      .trim()
      .isLength({ min: 3 })
      .escape(),
    body("description", "Description must not be empty.")
      .trim()
      .isLength({ min: 1 })
      .escape(),

  // Process request after validation and sanitization.
  asyncHandler(async (req, res, next) => {
    // Extract the validation errors from a request.
    const errors = validationResult(req);

    // Create a Category object with escaped/trimmed data and old id.
    const category = new Category({
      name: req.body.name,
      description: req.body.description,
      _id: req.params.id, // This is required, or a new ID will be assigned!
    });

    if (!errors.isEmpty()) {
      // There are errors. Render form again with sanitized values/error messages.
      res.render("category_form", {
        title: "Update Category",
        category: category,
        errors: errors.array(),
      });
      return;
    } else {
      // Data from form is valid. Update the record.
      const updatedCategory = await Category.findByIdAndUpdate(req.params.id, category, {});
      // Redirect to book detail page.
      res.redirect(updatedCategory.url);
    }
  }),
];