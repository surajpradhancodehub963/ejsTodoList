const express = require("express");
const bodyParser = require("body-parser");
const methodOverride = require('method-override');
const { v4: uuidv4 } = require("uuid");
const { List, User } = require("./mongodb.js");
const bcrypt = require("bcrypt");
const saltRounds = 10;

const app = express();

app.use(express.static(__dirname + "/public"));

app.set("view engine", "ejs");

app.use(methodOverride('_method'));

app.use(bodyParser.urlencoded({ extended: true }));

let authId = "";

//Creating Document

const task1 = {
  work: "Make a Coffee",
  status: "notchecked",
};

const task2 = {
  work: "Sign in to Office",
  status: "notchecked",
};

const defaultTask = [task1, task2];

// Custom authentication middleware

const authenticationMiddleware = (req, res, next) => {
  if (authId != "") {
    next();
  } else {
    res.redirect("/login");
  }
};

app.get("/", authenticationMiddleware, (req, res) => {
  const conditions = {
    userId: authId,
    listTitle: "Today",
  };
  const projection = {
    userId: 1,
    listTitle: 1,
    tasks: 1,
  };
  List.find(conditions, projection, async (err, docs) => {
    if (!err) {
      if (docs.length === 0) {
        const list1 = new List({
          userId: authId,
          listTitle: "Today",
          tasks: [...defaultTask],
        });
        await list1.save();
        res.redirect("/");
      } else {
        let activetasks = docs[0].tasks.filter((a) => {
          return a.status === "notchecked";
        });

        let finishedtasks = docs[0].tasks.filter((a) => {
          return a.status === "checked";
        });
        res.render("index", {
          listTitle: "Today",
          alltasks: docs[0].tasks,
          activetasks: activetasks,
          finishedtasks: finishedtasks,
        });
      }
    } else {
      console.log(err);
    }
  });
});

//CustomList Creation
app.get("/add/:id", (req, res) => {
  const parameter = req.params.id;

  const conditions = {
    userId: authId,
    listTitle: parameter,
  };
  const projection = {
    userId: 1,
    listTitle: 1,
    tasks: 1,
  };

  List.find(conditions, projection, async (err, docs) => {
    if (!err) {
      if (docs.length === 0) {
        const list2 = new List({
          userId: authId,
          listTitle: parameter,
          tasks: [...defaultTask],
        });
        await list2.save();
        res.redirect("/add/" + parameter);
      } else {
        let activetasks = docs[0].tasks.filter((a) => {
          return a.status === "notchecked";
        });

        let finishedtasks = docs[0].tasks.filter((a) => {
          return a.status === "checked";
        });
        res.render("index", {
          listTitle: parameter,
          alltasks: docs[0].tasks,
          activetasks: activetasks,
          finishedtasks: finishedtasks,
        });
      }
    }
  });
});

app.get("/login", (req, res) => {
  res.render("login");
});

app.get("/signup", (req, res) => {
  res.render("signup");
});

app.post("/", (req, res) => {
  const listType = req.body.add;

  const conditions = {
    userId: authId,
    listTitle: listType,
  };
  const projection = {
    userId: 1,
    listTitle: 1,
    tasks: 1,
  };

  const newtask = {
    work: req.body.newtask,
    status: "notchecked",
  };

  if (listType === "Today") {
    List.findOne(conditions, projection, async (err, docs) => {
      if (!err) {
        docs.tasks.push(newtask);
        await docs.save();
        res.redirect("/");
      } else {
        console.log(err);
      }
    });
  } else {
    List.findOne(conditions, projection, async (err, docs) => {
      if (!err) {
        docs.tasks.push(newtask);
        await docs.save();
        res.redirect("/add/" + listType);
      } else {
        console.log(err);
      }
    });
  }
});

app.post("/login", (req, res) => {
  let email = req.body.loginEmail;
  let password = req.body.loginPassword;
  User.find({ email: email }, (err, docs) => {
    if (!err) {
      if (docs.length === 0) {
        res.redirect("/signup");
      } else {
        bcrypt.compare(password, docs[0].password, (err, result) => {
          if (!err) {
            if (result == true) {
              console.log("user found");
              authId = docs[0].id;
              res.redirect("/");
            } else {
              console.log("The password is incorrect");
              res.redirect("/login");
            }
          } else {
            console.log(err);
          }
        });
      }
    } else {
      console.log(err);
    }
  });
});
app.post("/signup", (req, res) => {
  let fullName = req.body.fullName;
  let email = req.body.userEmail;
  let password = req.body.userPassword;
  User.find({ email: email }, (err, docs) => {
    if (!err) {
      if (docs.length === 0) {
        bcrypt.hash(password, saltRounds, async (err, hash) => {
          // Store hash in your password DB.
          if (!err) {
            let authNum = uuidv4();
            const newuser = new User({
              id: authNum,
              name: fullName,
              email: email,
              password: hash,
            });
            await newuser.save();
            res.redirect("/login");
          } else {
            console.log(err);
          }
        });
      } else {
        res.redirect("/login");
      }
    } else {
      console.log(err);
    }
  });
});

app.delete("/delete", async (req, res) => {
  const tobeDeleteTask=req.body.taskName;
  const filter={
    listTitle:req.body.listType,
    userId:authId
  };
  const projection={
    _id:1,
    userId:1,
    listTitle:1,
    tasks:1
  }
  let data = await List.findOne(filter,projection);
  const docs=data._doc;
  let tasks=docs.tasks;
  const index=tasks.findIndex((a)=>{
    return a.work == tobeDeleteTask
  });
  tasks.splice(index,1);
  data.save();
  if(req.body.listType==="Today"){
    res.redirect("/");
  }else{
    res.redirect("/add/"+req.body.listType)
  }
});

app.listen(3003, () => {
  console.log(`The app is running at http://localhost:3003`);
});
