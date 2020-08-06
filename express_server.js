const express = require("express");
const app = express();
const PORT = 8080; // default port 8080
const cookieParser = require('cookie-parser');
const bodyParser = require("body-parser");
const bcrypt = require('bcrypt');
const cookieSession = require('cookie-session')

const  { generateRandomString, findUserUrl, findUserId, checkAccountExists, createValidUser, checkDuplicateEmail, users, urlDatabase } = require("./helper")

app.set("view engine", "ejs");
app.use(cookieParser());
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieSession({
  name: 'session',
  keys: ['key1', 'key2']
}))


 //home page ***create new page that prompts register or login** 
app.get("/", (req, res) => {   
  res.send("Hello!");
});
  
//allows users who are logged in to retrieve their saved URLS
app.get("/urls", (req, res) => {
  if (users[req.session.user_id] === undefined) {
    res.send("error:Please login")
  } else {
    let userUrls = findUserUrl(users[req.session.user_id])
    let templateVars = { user: users[req.session.user_id], urls: userUrls }
    res.render("urls_index", templateVars);
  }
});


app.post("/urls", (req, res) => {
  let longURL = req.body.longURL;
  let shortURL = generateRandomString();
  urlDatabase[shortURL] = { longURL, userID: req.session.user_id};
  res.redirect(`/urls/${shortURL}`);
});

app.get("/urls/new", (req, res) => {
  let templateVars = { user: users[req.session.user_id]}
  if (users[req.session.user_id] === undefined){
    res.redirect("/login")
  } else {
    res.render("urls_new", templateVars);
  }
});

app.post("/urls/:id", (req, res) => {
  console.log(users[req.session.user_id] , urlDatabase[req.params.id].userID)
  if (users[req.session.user_id] !== urlDatabase[req.params.id].userID) {
    res.send("error:Please login")
  } else {
    urlDatabase[req.params.id].longURL = req.body.longURL;
    res.redirect(`/urls/${req.params.id}`);
  }
  console.log(urlDatabase[url].userID)
});

app.post("/urls/:id/edit", (req, res) => {
  res.redirect(`/urls/${req.params.id}`);
});

app.get("/urls/:shortURL", (req, res) => {
  let templateVars = { user: users[req.session.user_id], shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL]};
  res.render("urls_show", templateVars);
});

app.post("/urls/:shortURL/delete", (req, res) => {
  console.log(req.session.user_id)
  console.log(urlDatabase[req.params.shortURL]) 
  if (req.session.user_id !== urlDatabase[req.params.shortURL].userID) {
    res.send("error:Please login")
  } else {
    delete urlDatabase[req.params.shortURL];
    res.redirect("/urls");
  }
});

app.get("/u/:shortURL", (req, res) => {
  const longURL = urlDatabase[req.params.shortURL].longURL;
  res.redirect(longURL);
});

app.get("/login", (req, res) => {
  let templateVars = { user: users[req.session.user_id] }
  res.render("urls_login", templateVars)
})

app.post("/login", (req, res) => {
  if(!checkDuplicateEmail(req.body.email)){
    res.status(403).json({error:"There is no user with that email"})
  } else if(!checkAccountExists(req.body.email, req.body.password)){
    res.status(403).json({error:"The email and password do not match"})
  } else {
    let newID = findUserId(req.body.email)
    req.session.user_id = newID
    res.redirect("/urls") 
  }
});

app.post("/logout", (req, res) => {
  req.session.user_id = null
  res.redirect("/login")
});

app.get("/register", (req, res) => {
  let templateVars = { user: users[req.session.user_id] }
  res.render("urls_register", templateVars)
})

app.post("/register", (req, res) => {
  const hashedPassword = bcrypt.hashSync(req.body.password, 10)
  if(!createValidUser(req.body.email, req.body.password)){
    res.status(400).json({error:"password and email can't be blank"})
  }
    if(checkDuplicateEmail(req.body.email)){
      res.status(400).json({error:'error 400 user exists'})
    } else {
    const user = generateRandomString();
      users[user] = {
        id: user,
        email: req.body.email,
        password: hashedPassword
      }
      console.log(users)
      req.session.user_id = user;
      res.redirect("/urls")
    }
   

});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

