#! /usr/bin/env node

console.log(
    'This script populates some test items and categories to your database. Specified database as argument - e.g.: node populatedb "mongodb+srv://cooluser:coolpassword@cluster0.lz91hw2.mongodb.net/local_library?retryWrites=true&w=majority"'
  );
  
  // Get arguments passed on command line
  const userArgs = process.argv.slice(2);
  
  const Item = require("./models/item");
  const Category = require("./models/category");
  
  const items = [];
  const categories = [];
  
  const mongoose = require("mongoose");
  mongoose.set("strictQuery", false);
  
  const mongoDB = userArgs[0];
  
  main().catch((err) => console.log(err));
  
  async function main() {
    console.log("Debug: About to connect");
    await mongoose.connect(mongoDB);
    console.log("Debug: Should be connected?");
    await createCategories();
    await createItems();
    console.log("Debug: Closing mongoose");
    mongoose.connection.close();
  }
  
  // We pass the index to the ...Create functions so that, for example,
  // genre[0] will always be the Fantasy genre, regardless of the order
  // in which the elements of promise.all's argument complete.
  async function categoryCreate(index, name, description) {
    const category = new Category({ name: name, description: description });
    await category.save();
    categories[index] = category;
    console.log(`Added category: ${name}`);
  }
  
  async function itemCreate(index, name, description, category, price, numberInStock) {
    const itemdetail = {
      name: name,
      description: description,
      category: category,
      price: price,
      numberInStock: numberInStock,
    };
    if (category != false) itemdetail.category = category;
  
    const item = new Item(itemdetail);
    await item.save();
    items[index] = item;
    console.log(`Added item: ${name}`);
  }
  
  async function createCategories() {
    console.log("Adding categories");
    await Promise.all([
      categoryCreate(0, "Motherboards", "A list of motherboards"),
      categoryCreate(1, "Peripherals", "A list of peripherals e.g.mouse"),
      categoryCreate(2, "Graphics cards", "A list of GPUs"),
    ]);
  }
  
  async function createItems() {
    console.log("Adding Items");
    await Promise.all([
      itemCreate(0,
        "Motherboard, #1",
        "The best motherboard in the world.",
        [categories[0]],
        "1000",
        "1"
      ),
      itemCreate(1,
        "Heavy Mouse",
        "Why so heavy?",
        [categories[1]],
        "35",
        "98"
      ),
      itemCreate(2,
        "Ok Graphics Card",
        "I mean its alright.",
        [categories[2]],
        "155",
        "43"
      ),
    ]);
  }