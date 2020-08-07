const express = require("express");
const app = express();
const PORT = 8080; // default port 8080
const cookieParser = require('cookie-parser');
const bodyParser = require("body-parser");
const bcrypt = require('bcrypt');
const cookieSession = require('cookie-session');

const  { generateRandomString, findUserUrl, getUserByEmail, checkAccountExists, createValidUser, checkDuplicateEmail, userNotLoggedIn, userOwnsUrl, users, urlDatabase } = require("./helper");

app.set("view engine", "ejs");
app.use(cookieParser());
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieSession({
  name: 'session',
  keys: ['key1', 'key2']
}));


//Home page: if user is logged in, redirects to users /urls, if not redirects to login
app.get("/", (req, res) => {
  if (req.session.user_id) {
    res.redirect("/urls");
  } else {
    res.redirect("/login");
  }
});
  
//Displays urls if logged in, if user is not logged in, an error message will appear.
app.get("/urls", (req, res) => {
  if (users[req.session.user_id] === undefined) {
    let templateVars = { user: users[req.session.user_id], message: "ERROR 403: Please Login!" };
    res.render("errors", templateVars);
  } else {
    let userUrls = findUserUrl(users[req.session.user_id]);
    let templateVars = { user: users[req.session.user_id], urls: userUrls };
    res.render("urls_index", templateVars);
  }
});

//If logged in, will allow user to generate a short URL, and saves new short url and original long URL to associated user.
app.post("/urls", (req, res) => {
  let longURL = req.body.longURL;
  let shortURL = generateRandomString();
  urlDatabase[shortURL] = { longURL, userID: req.session.user_id};
  res.redirect(`/urls/${shortURL}`);
});

//If user is logged in, it will display a page to create new URL, if not then the user will be redirected to login page.
app.get("/urls/new", (req, res) => {
  let templateVars = { user: users[req.session.user_id]};
  if (users[req.session.user_id] === undefined) {
    res.redirect("/login");
  } else {
    res.render("urls_new", templateVars);
  }
});

//If user is logged in and owns the given URL, the URL will be updated and then redirected to /urls. If not logged in, error message will appear.
app.post("/urls/:id", (req, res) => {
  if (users[req.session.user_id].id !== urlDatabase[req.params.id].userID) {
    let templateVars = { user: users[req.session.user_id], message: "ERROR 403: Please login!" };
    res.render("errors", templateVars);
  } else {
    urlDatabase[req.params.id].longURL = req.body.longURL;
    res.redirect(`/urls/${req.params.id}`);
  }
});


app.post("/urls/:id/edit", (req, res) => {
  res.redirect(`/urls/${req.params.id}`);
});

//Displays short URL page. If user is not logged in, if short URL does not exist, or if URL doesn't belong to user, an error will appear.
app.get("/urls/:shortURL", (req, res) => {
  if (userNotLoggedIn(req)) {
    let templateVars = { user: users[req.session.user_id], message: "ERROR 403: Please Login or Register!" };
    res.render("errors", templateVars);
  }
  if (!urlDatabase[req.params.shortURL]) {
    let templateVars = { user: users[req.session.user_id], message: "ERROR 403: URL doesn't exist!"};
    res.render("errors", templateVars);
  } else {
    if (!userOwnsUrl(req)) {
      let templateVars = { user: users[req.session.user_id], message: "ERROR 403: Can't Access URL!" };
      res.render("errors", templateVars);
    } else {
      let templateVars = { user: users[req.session.user_id], shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL]};
      res.render("urls_show", templateVars);
    }
  }
});

//Allows logged in users to delete saved URLS
app.post("/urls/:shortURL/delete", (req, res) => {
  if (req.session.user_id !== urlDatabase[req.params.shortURL].userID) {
    let templateVars = { user: users[req.session.user_id], message: "ERROR 403: Please login"};
    res.render("errors", templateVars);
  } else {
    delete urlDatabase[req.params.shortURL];
    res.redirect("/urls");
  }
});

//Displays website of a saved short URL (accessible for users who are not logged in)
app.get("/u/:shortURL", (req, res) => {
  const longURL = urlDatabase[req.params.shortURL].longURL;
  res.redirect(longURL);
});

//Displays login page
app.get("/login", (req, res) => {
  let templateVars = { user: users[req.session.user_id] };
  res.render("urls_login", templateVars);
});

//Allows users to login. If there is an incorrect username or password, an error will be displayed.
app.post("/login", (req, res) => {
  if (!checkDuplicateEmail(req.body.email)) {
    let templateVars = { user: users[req.session.user_id], message: "ERROR 403: There is no user with that email. Please try again."};
    res.render("errors", templateVars);
  } else if (!checkAccountExists(req.body.email, req.body.password)) {
    let templateVars = { user: users[req.session.user_id], message: "ERROR 403: The email or password is incorrect."};
    res.render("errors", templateVars);
  } else {
    let newID = getUserByEmail(req.body.email, users);
    req.session.user_id = newID;
    res.redirect("/urls");
  }
});

//Allows users to logout and cookies to be wiped.
app.post("/logout", (req, res) => {
  req.session.user_id = null;
  res.redirect("/login");
});

//Displays registration page for new users.
app.get("/register", (req, res) => {
  let templateVars = { user: users[req.session.user_id] };
  res.render("urls_register", templateVars);
});

//Allows users to create a new account. If user attempts to make account with an email alreadu registered, or a Password/Email field is empty, and error will occur,
app.post("/register", (req, res) => {
  const hashedPassword = bcrypt.hashSync(req.body.password, 10);
  if (!createValidUser(req.body.email, req.body.password)) {
    let templateVars = { user: users[req.session.user_id], message: "ERROR 400: Please fill in the Password and/or Email field."};
    res.render("errors", templateVars);
  }
  if (checkDuplicateEmail(req.body.email)) {
    let templateVars = { user: users[req.session.user_id], message: "ERROR 400: User already exists"};
    res.render("errors", templateVars);
  } else {
    const user = generateRandomString();
    users[user] = {
      id: user,
      email: req.body.email,
      password: hashedPassword
    };
    req.session.user_id = user;
    res.redirect("/urls");
  }
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

