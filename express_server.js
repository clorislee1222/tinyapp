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

//------GET------

/*
GET /
  if user is logged in:
    (Minor) redirect to /urls
  if user is not logged in:
    (Minor) redirect to /login
*/
app.get("/", (req, res) => {
  if (users[req.session.user_id]) {
    res.redirect("/urls");
  } else {
    res.redirect("/login");
  }
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});



/*
GET /urls/new
  if user is logged in:
    returns HTML with:
    the site header (see Display Requirements above)
    a form which contains:
      a text input field for the original (long) URL
      a submit button which makes a POST request to /urls
  if user is not logged in:
    redirects to the /login page
*/
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



/*
GET /urls/:id
  if user is logged in and owns the URL for the given ID:
    returns HTML with:
    the site header (see Display Requirements above)
    the short URL (for the given ID)
    a form which contains:
      the corresponding long URL
      an update button which makes a POST request to /urls/:id
    (Stretch) the date the short URL was created
    (Stretch) the number of times the short URL was visited
    (Stretch) the number of unique visits for the short URL
  if a URL for the given ID does not exist:
    (Minor) returns HTML with a relevant error message
  if user is not logged in:
    returns HTML with a relevant error message
  if user is logged it but does not own the URL with the given ID:
    returns HTML with a relevant error message
*/
app.get("/urls/:id", (req, res) => {
  const id = req.params.id;
  const userID = req.session.user_id;
  //Check if the user is logged in
  if (users[userID]) {
    //Check if the given id is in the urlDatabase
    if (urlDatabase[id]) {
      const urls = urlsForUser(userID, urlDatabase);
      const templateVars = {
        user: users[userID],
        longURL: urlDatabase[id]["longURL"],
        id,
        urls
      };
      //Check if the user owns the url
      if (urlDatabase[id]["userID"] === userID) {
        res.render("urls_show", templateVars);
      } else {
        res.status(403).send(`Sorry, you do not have access to the URL with the ID: ${id}.`);
      }
    } else {
      res.status(403).send("The given ID does not exist.")
    }
  } else {
    res.status(403).send("Please login.");
  }
});



/*
GET /u/:id
  if URL for the given ID exists:
    redirects to the corresponding long URL
  if URL for the given ID does not exist:
    (Minor) returns HTML with a relevant error message
*/
app.get("/u/:id", (req, res) => {
  if (urlDatabase[req.params.id]) {
    const longURL = urlDatabase[req.params.id].longURL;
    res.redirect(longURL);
  } else {
    res.status(403).send("The given ID does not exist.");
    return;
  }
});



/*
GET /urls
  if user is logged in:
    returns HTML with:
    the site header (see Display Requirements above)
    a list (or table) of URLs the user has created, each list item containing:
      a short URL
      the short URL's matching long URL
      an edit button which makes a GET request to /urls/:id
      a delete button which makes a POST request to /urls/:id/delete
      (Stretch) the date the short URL was created
      (Stretch) the number of times the short URL was visited
      (Stretch) the number number of unique visits for the short URL
    (Minor) a link to "Create a New Short Link" which makes a GET request to /urls/new
  if user is not logged in:
    returns HTML with a relevant error message
*/
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



/*
GET /register
  if user is logged in:
    (Minor) redirects to /urls
  if user is not logged in:
    returns HTML with:
    a form which contains:
      input fields for email and password
      a register button that makes a POST request to /register
*/
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



/*
GET /login
  if user is logged in:
    (Minor) redirects to /urls
  if user is not logged in:
    returns HTML with:
    a form which contains:
      input fields for email and password
      submit button that makes a POST request to /login
*/
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

/*
POST /urls/:id/delete
  if user is logged in and owns the URL for the given ID:
    deletes the URL
    redirects to /urls
  if user is not logged in:
    (Minor) returns HTML with a relevant error message
  if user is logged it but does not own the URL for the given ID:
    (Minor) returns HTML with a relevant error message
*/
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



/*
POST /urls/:id
  if user is logged in and owns the URL for the given ID:
    updates the URL
    redirects to /urls
  if user is not logged in:
    (Minor) returns HTML with a relevant error message
  if user is logged it but does not own the URL for the given ID:
    (Minor) returns HTML with a relevant error message
*/
app.post("/urls/:id", (req, res) => {
  const id = req.params.id;
  const userID = req.session.user_id;
  if (users[userID]) {
    if (urlDatabase[id]["userID"] === userID) {
      if (req.body.longURL) {
        urlDatabase[req.params.id].longURL = req.body.longURL;
        res.redirect("/urls");
      } else {
        res.status(403).send("Please enter the URL.");
      }
    } else {
      res.status(403).send("Sorry, you do not have access to this URL.")
    }
  } else {
    res.status(403).send("Id does not exist.");
  }
});




/*
POST /urls
  if user is logged in:
    generates a short URL, saves it, and associates it with the user
    redirects to /urls/:id, where :id matches the ID of the newly saved URL
  if user is not logged in:
    (Minor) returns HTML with a relevant error message
*/
app.post("/urls", (req, res) => {
  if (users[req.session.user_id]) {
    if (req.body.longURL) {
      const id = generateRandomString();
      urlDatabase[id] = {
        longURL: req.body.longURL,
        userID: req.session.user_id
      };
      res.redirect(`/urls/${id}`);
    } else {
      res.status(403).send("Please enter the URL.");
    }
  } else {
    res.status(403).send("Please login before shorten URLs.");
  }
});



/*
POST /register
  if email or password are empty:
    returns HTML with a relevant error message
  if email already exists:
    returns HTML with a relevant error message
  otherwise:
    creates a new user
    encrypts the new user's password with bcrypt
    sets a cookie
    redirects to /urls
*/
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



/*
POST /login
  if email and password params match an existing user:
    sets a cookie
    redirects to /urls
  if email and password params don't match an existing user:
    returns HTML with a relevant error message
*/
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



/*
POST /logout
  deletes cookie
  redirects to /login
*/
app.post("/logout", (req, res) => {
  res.clearCookie("session");
  res.clearCookie("session.sig");
  res.redirect("/login");
});

//------Server starts------

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});