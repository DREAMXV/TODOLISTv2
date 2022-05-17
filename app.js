//jshint esversion:6
// Mongoose
const mongoose = require("mongoose");
mongoose.connect("mongodb://localhost:27017/todolistDB");
const express = require("express");
const bodyParser = require("body-parser");
const _ = require("lodash");

const app = express();

app.set("view engine", "ejs");

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

// Schema
const itemSchema = {
  name: {
    type: String,
    required: [true, "Item Name is Required!"],
  },
};
// Model
const Item = mongoose.model("Item", itemSchema);
// Default Data
const item1 = new Item({
  name: "Welcome to your To Do List",
});
const item2 = new Item({
  name: "Hit the + button to add a new item",
});
const item3 = new Item({
  name: "<-- Hit this to delete an item",
});
const defaultItem = [item1, item2, item3];

// List Schema

const listSchema = {
  name: String,
  items: [itemSchema],
};

// List Model
const List = mongoose.model("List", listSchema);

app.get("/", function (req, res) {
  Item.find({}, (err, results) => {
    if (err) {
      console.log(err);
    } else if (results.length === 0) {
      Item.insertMany(defaultItem, function (err) {
        if (err) {
          console.log(err);
        } else {
          console.log("Data Inserted!");
        }
      });
      res.redirect("/");
    } else {
      res.render("list", { listTitle: "Today", newListItems: results });
    }
  });
});

app.post("/", function (req, res) {
  const itemName = req.body.newItem;
  const listName = req.body.list;

  const item = new Item({
    name: itemName,
  });
  if (listName === "Today") {
    item.save();
    res.redirect("/");
  }else{
    List.findOne({name:listName}, function(err,foundList){
      foundList.items.push(item);
      foundList.save();
      res.redirect("/" + listName);
    });
  }
});

app.post("/delete", (req, res) => {
  const checkItemID = req.body.checkbox;
  const listName = req.body.listName;

  if(listName === "Today"){
    Item.findByIdAndRemove(checkItemID, function (err) {
      if (err) {
        console.log(err);
      } else {
        console.log("Item Removed");
        res.redirect("/");
      }
    });
  }else{
    List.findOneAndUpdate({name:listName} , {$pull:{items: {_id:checkItemID}}} , function(err,foundList){
      if(!err){
        res.redirect("/" + listName);
      }
    })
  }

});

app.get("/:customeListName", (req, res) => {
  const customListName = _.capitalize(req.params.customeListName);

  List.findOne({ name: customListName }, function (err, foundList) {
    if (!err) {
      if (!foundList) {
        //  Create New List
        const list = new List({
          name: customListName,
          items: defaultItem,
        });
        list.save();
        res.redirect("/" + customListName);
      } else {
        //  Display exising list
        res.render("list", {
          listTitle: foundList.name,
          newListItems: foundList.items,
        });
      }
    }
  });
});

app.get("/about", function (req, res) {
  res.render("about");
});

app.listen(3000, function () {
  console.log("Server started on port 3000");
});
