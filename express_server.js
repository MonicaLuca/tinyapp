const express = require("express");
const app = express();
const PORT = 8080; // default port 8080
const cookieParser = require('cookie-parser');
const bodyParser = require("body-parser");
const e = require("express");

app.set("view engine", "ejs");
app.use(cookieParser());
app.use(bodyParser.urlencoded({extended: true}));


function generateRandomString() {
  let id = Math.random().toString(36).slice(2,8);
  return id;
}

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

const users = { 
  "userRandomID": {
    id: "userRandomID", 
    email: "user@example.com", 
    password: "purple-monkey-dinosaur"
  },
 "user2RandomID": {
    id: "user2RandomID", 
    email: "user2@example.com", 
    password: "dishwasher-funk"
  }
}

const findUserId = (email) => {
  for (let id in users){
    if (email === users[id].email){
      return id
    }
  }
}

const checkAccountExists = (email, password) => {
  for(let user in users) {
    if(email === users[user].email && password === users[user].password) {
      return true
    }
  }
}
  
const createValidUser = (submittedEmail, submittedPassword) => {
  if (submittedEmail === '' || submittedPassword === ''){
    return false
  } else {
    return true
  };
}

const checkDuplicateEmail = (email) => {
  for (let id in users) {
    if (email === users[id].email) {
      // console.log(`user id: ${users[id].id}`)
      return users[id]
    }
  }
  return false
};

  
app.get("/", (req, res) => {   
  res.send("Hello!");
});
  

// app.get("/urls.json", (req, res) => {
//   res.json(urlDatabase);
// })

app.get("/urls", (req, res) => {
  let templateVars = { user: users[req.cookies["user_id"]], urls: urlDatabase };
  res.render("urls_index", templateVars);
});

app.post("/urls", (req, res) => {
  let longURL = req.body.longURL;
  let shortURL = generateRandomString();
  urlDatabase[shortURL] = longURL;
  res.redirect(`/urls/${shortURL}`);
});

app.get("/urls/new", (req, res) => {
  let templateVars = { user: users[req.cookies["user_id"]]}
  res.render("urls_new", templateVars);
});

app.post("/urls/:id", (req, res) => {
  urlDatabase[req.params.id] = req.body.longURL;
  res.redirect(`/urls/${req.params.id}`);
});

app.post("/urls/:id/edit", (req, res) => {
  res.redirect(`/urls/${req.params.id}`);
});

app.get("/urls/:shortURL", (req, res) => {
  let templateVars = { user: users[req.cookies["user_id"]], shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL]};
  res.render("urls_show", templateVars);
});

app.post("/urls/:shortURL/delete", (req, res) => {
  delete urlDatabase[req.params.shortURL];
  res.redirect("/urls");
});

app.get("/u/:shortURL", (req, res) => {
  const longURL = urlDatabase[req.params.shortURL];
  res.redirect(longURL);
});

app.get("/login", (req, res) => {
  let templateVars = { user: users[req.cookies["user_id"]] }
  res.render("urls_login", templateVars)
})

app.post("/login", (req, res) => {
  if(!checkDuplicateEmail(req.body.email)){
    res.status(403).json({error:"There is no user with that email"})
  } else if(!checkAccountExists(req.body.email, req.body.password)){
      res.status(403).json({error:"The email and password do not match"})
  } else {
    let newID = findUserId(req.body.email)
    res.cookie('user_id', newID);
    res.redirect("/urls") 
  }
});


app.post("/logout", (req, res) => {
  res.clearCookie('user_id')
  res.redirect("/urls")
});

app.get("/register", (req, res) => {
  let templateVars = { user: users[req.cookies["user_id"]] }
  res.render("urls_register", templateVars)
})

app.post("/register", (req, res) => {
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
        password: req.body.password
      }
      res.cookie("user_id", user);
      res.redirect("/urls")
    }
   

});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

