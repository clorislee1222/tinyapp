const express = require("express");
const app = express();
const PORT = 8080; // default port 8080
const cookieParser = require('cookie-parser');
const bcrypt = require("bcryptjs");

app.set("view engine", "ejs");

const urlDatabase = {
  b6UTxQ: {
    longURL: "https://www.tsn.ca",
    userID: "aJ48lW",
  },
  i3BoGr: {
    longURL: "https://www.google.ca",
    userID: "userRandomID",
  },
};

const users = {
  userRandomID: {
    id: "userRandomID",
    email: "user@example.com",
    password: "purple-monkey-dinosaur",
    hashedPassword: bcrypt.hashSync("purple-monkey-dinosaur", 10)
  },
  user2RandomID: {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk",
    hashedPassword: bcrypt.hashSync("dishwasher-funk", 10)
  },
};

app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

//------GET------
app.get("/", (req, res) => {
  res.send("Hello!");
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/urls/new", (req, res) => {
  if (users[req.cookies["user_id"]]) {
    const templateVars = {
      user: users[req.cookies["user_id"]],
      id: req.params.id,
      longURL: req.body.longURL
    };
    res.render("urls_new", templateVars);
  } else {
    res.redirect("/login");
  }
});

app.get("/urls/:id", (req, res) => {
  //Users Can Only See Their Own Shortened URLs
  const id = req.params.id;
  const userID = req.cookies["user_id"];
  if (users[userID]) {
    const urls = urlsForUser(userID);
    const templateVars = {
      user: users[userID],
      longURL: urlDatabase[id]["longURL"],
      id,
      urls
    };

    if (urls[id]["userID"] === userID) {
      res.render("urls_show", templateVars);
    } else {
      res.status(403).send("Sorry, you do not have access to this URL.");
      //The individual URL pages should not be accesible if the URL does not belong to them.
    }
  } else {
    res.status(403).send("Please login.");
    //The individual URL pages should not be accessible to users who are not logged in.
  }
});

app.get("/u/:id", (req, res) => {
  if (urlDatabase[req.params.id]) {
    const longURL = urlDatabase[req.params.id].longURL;
    res.redirect(longURL);
  } else {
    res.send(403).send("The shortened url does not exist.");
    return;
  }
});

app.get("/urls", (req, res) => {
  if (users[req.cookies["user_id"]]) {
    const templateVars = {
      user: users[req.cookies["user_id"]],
      urls: urlsForUser(req.cookies["user_id"]),
      id: req.params.id
    };
    res.render("urls_index", templateVars);
  } else {
    res.status(403).send('Please Login.')
  }
});

app.get("/register", (req, res) => {
  if (users[req.cookies["user_id"]]) {
    res.redirect("/urls");
  } else {
    const templateVars = {
      user: null
    };
    res.render("user_registration", templateVars);
  }
});

app.get("/login", (req, res) => {
  if (users[req.cookies["user_id"]]) {
    res.redirect("/urls");
  } else {
    const templateVars = {
      user: users[req.cookies["user_id"]]
    };
    res.render("login", templateVars);
  }
});

//------POST------
app.post("/urls/:id/delete", (req, res) => {
  const id = req.params.id;

  const userID = req.cookies["user_id"];
  if (users[userID]) {
    if (urlDatabase[id]["userID"] === userID) {
      delete urlDatabase[id];
      res.redirect("/urls");
    } else {
      res.status(403).send("Sorry, you do not have access to this URL.")
    }
  } else {
    res.status(403).send("Id does not exist.");
  }
});

app.post("/urls/:id", (req, res) => {
  const id = req.params.id;
  const userID = req.cookies["user_id"];
  if (users[userID]) {
    if (urls[id]["userID"] === userID) {
      urlDatabase[req.params.id].longURL = req.body.longURL;
      res.redirect("/urls");
    } else {
      res.status(403).send("Sorry, you do not have access to this URL.")
    }
  } else {
    res.status(403).send("Id does not exist.");
  }
});

app.post("/urls", (req, res) => {
  if (users[req.cookies["user_id"]]) {
    const id = generateRandomString();
    urlDatabase[id] = {
      longURL: req.body.longURL,
      userID: req.cookies["user_id"]
    };
    res.redirect(`/urls/${id}`);
  } else {
    res.status(403).send("Please login before shorten URLs.");
  }
});

app.post("/register", (req, res) => {
  const userRandomID = generateRandomString();
  const user_id = userRandomID;
  let email = req.body.email;
  let hashedPassword = bcrypt.hashSync(req.body.password, 10);

  //If the e-mail or password are empty strings, send back a response with the 400 status code.
  if (!email || !(req.body.password)) {
    res.status(400).send("Please enter both email and password.");
    return;
  }

  //If someone tries to register with an email that is already in the users object, send back a response with the 400 status code.
  if (userLookup(email)) {
    res.status(400).send("This email is already in use.");
    return;
  }

  users[user_id] = { id: user_id, email, hashedPassword };
  res.cookie("user_id", user_id);
  res.redirect("/urls");
})

app.post("/login", (req, res) => {
  const user = userLookup(req.body.email);

  // If a user with that e-mail cannot be found, return a response with a 403 status code.
  if (!user) {
    res.status(403).send("A user with the given email cannot be found.");
    return;
  }

  // If a user with that e-mail address is located, compare the password given in the form with the existing user's password. If it does not match, return a response with a 403 status code.
  if (!bcrypt.compareSync(req.body.password, user.hashedPassword)) {
    res.status(403).send("Password incorrect.");
    return;
  }
  console.log(user.hashedPassword);
  // If both checks pass, set the user_id cookie with the matching user's random ID, then redirect to /urls.
  res.cookie("user_id", user.id);
  res.redirect("/urls");
});

app.post("/logout", (req, res) => {
  res.clearCookie("user_id");
  res.redirect("/login");
});

//---Helper functions---
function generateRandomString() {
  return Math.random().toString(36).slice(2, 8);
};

function userLookup(email) {
  for (const user in users) {
    if (users[user].email === email) {
      return users[user];
    }
  }
  return null;
}

function urlsForUser(id) {
  let urls = {};
  for (const url in urlDatabase) {
    if (urlDatabase[url]["userID"] === id) {
      urls[url] = urlDatabase[url];
    }
  }
  return urls;
}