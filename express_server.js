const express = require("express");
const app = express();
const PORT = 8080; // default port 8080
const bcrypt = require("bcryptjs");
const cookieSession = require("cookie-session");
const {
  generateRandomString,
  getUserByEmail,
  urlsForUser
} = require("./helpers"); // helper functions
const {
  urlDatabase,
  users
} = require("./database"); //constants

app.set("view engine", "ejs");

app.use(express.urlencoded({ extended: true }));
app.use(cookieSession({
  name: 'session',
  keys: ['key1'],

  // Cookie Options
  maxAge: 24 * 60 * 60 * 1000 // 24 hours
}));

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
  if (users[req.session.user_id]) {
    const templateVars = {
      user: users[req.session.user_id],
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
  const userID = req.session.user_id;
  if (users[userID]) {
    const urls = urlsForUser(userID, urlDatabase);
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
  if (users[req.session.user_id]) {
    const templateVars = {
      user: users[req.session.user_id],
      urls: urlsForUser(req.session.user_id, urlDatabase),
      id: req.params.id
    };
    res.render("urls_index", templateVars);
  } else {
    res.status(403).send('Please Login.')
  }
});

app.get("/register", (req, res) => {
  if (users[req.session.user_id]) {
    res.redirect("/urls");
  } else {
    const templateVars = {
      user: null
    };
    res.render("user_registration", templateVars);
  }
});

app.get("/login", (req, res) => {
  if (users[req.session.user_id]) {
    res.redirect("/urls");
  } else {
    const templateVars = {
      user: users[req.session.user_id]
    };
    res.render("login", templateVars);
  }
});

//------POST------
app.post("/urls/:id/delete", (req, res) => {
  const id = req.params.id;

  const userID = req.session.user_id;
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
  const userID = req.session.user_id;
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
  if (users[req.session.user_id]) {
    const id = generateRandomString();
    urlDatabase[id] = {
      longURL: req.body.longURL,
      userID: req.session.user_id
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
  if (getUserByEmail(email, users)) {
    res.status(400).send("This email is already in use.");
    return;
  }

  users[user_id] = { id: user_id, email, hashedPassword };
  req.session.user_id = user_id;
  res.redirect("/urls");
})

app.post("/login", (req, res) => {
  const user = getUserByEmail(req.body.email, users);

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

  // If both checks pass, set the user_id cookie with the matching user's random ID, then redirect to /urls.
  req.session.user_id = user.id;
  res.redirect("/urls");
});

app.post("/logout", (req, res) => {
  res.clearCookie("session");
  res.clearCookie("session.sig");
  res.redirect("/login");
});
