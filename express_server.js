const express = require("express");
const app = express();
const PORT = 8080; // default port 8080
const cookieParser = require('cookie-parser');

app.set("view engine", "ejs");

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

const users = {
  userRandomID: {
    id: "userRandomID",
    email: "user@example.com",
    password: "purple-monkey-dinosaur",
  },
  user2RandomID: {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk",
  },
};

app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.get("/", (req, res) => {
  res.send("Hello!");
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

app.get("/urls", (req, res) => {
  const templateVars = { 
    user: users[req.cookies["user_id"]],
    urls: urlDatabase 
  };
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  const templateVars = { 
    user: users[req.cookies["user_id"]],
    id: req.params.id, 
    longURL: urlDatabase[req.params.id]};
  res.render("urls_new", templateVars);
});

app.get("/urls/:id", (req, res) => {
  const templateVars = { 
    user: users[req.cookies["user_id"]],
    id: req.params.id, 
    longURL: urlDatabase[req.params.id]};
  res.render("urls_show", templateVars);
});

app.post("/urls", (req, res) => {
  const id = generateRandomString();
  urlDatabase[id] = req.body.longURL;
  res.redirect(`/urls/${id}`);
});

app.get("/u/:id", (req, res) => {
  const longURL = urlDatabase[req.params.id];
  res.redirect(longURL);
});

app.post("/urls/:id/delete", (req, res) => {
  delete urlDatabase[req.params.id];
  res.redirect("/urls");
});

app.post("/urls/:id", (req, res) => {
  urlDatabase[req.params.id] = req.body.longURL;
  res.redirect("/urls");
});

app.get("/login", (req, res) => {
  const templateVars = { 
    email: req.body.email,
    password: req.body.password,
    user: users[req.cookies["user_id"]]
  };
  res.render("login", templateVars);
});

app.post("/login", (req, res) => {
  const user = userLookup(req.body.email);

// If a user with that e-mail cannot be found, return a response with a 403 status code.
  if (!user) {
    res.status(403).send("A user with the given email cannot be found.");
    return;
  } 

// If a user with that e-mail address is located, compare the password given in the form with the existing user's password. If it does not match, return a response with a 403 status code.
  if (user.password !== req.body.password) {
    res.status(403).send("Password incorrect.");
    return;
  }

// If both checks pass, set the user_id cookie with the matching user's random ID, then redirect to /urls.
  res.cookie("user_id", user.id);
  res.redirect("/urls");
});

app.post("/logout", (req, res) => {
  res.clearCookie("user_id");
  res.redirect("/login");
});

app.get("/register", (req, res) => {
  const templateVars = { 
    user: null
  };
  res.render("user_registration", templateVars);
});

app.post("/register", (req, res) => {
  const userRandomID = generateRandomString();
  const user_id = userRandomID;
  let email = req.body.email;
  let password = req.body.password;

  //If the e-mail or password are empty strings, send back a response with the 400 status code.
   if (!email || !password) {
     res.status(400).send("Please enter email and password.");
     return;
   }

  //If someone tries to register with an email that is already in the users object, send back a response with the 400 status code.
  if (userLookup(email)) {
    res.status(400).send("This email is already in use.");
    return;
  }

  users[user_id] = { id: user_id, email, password };
  res.cookie("user_id", user_id);
  res.redirect("/urls");
})


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