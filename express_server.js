const express = require("express");
const app = express();
const PORT = 8080; // default port 8080
const cookieParser = require('cookie-parser');
const bodyParser = require("body-parser");
const bcrypt = require('bcrypt');

app.set("view engine", "ejs");
app.use(cookieParser());
app.use(bodyParser.urlencoded({extended: true}));

//generates random string used for shortURL and to generate a userID
function generateRandomString() {
  let id = Math.random().toString(36).slice(2,8);
  return id;
};

//Database holding shorturl, the longURL, and the userID to specify which link belongs to which account
const urlDatabase = {
  "b2xVn2": { longURL: "http://www.lighthouselabs.ca", userID: "userRandomID" },
  "9sm5xK": { longURL: "http://www.google.com", userID: "user2RandomID" }
};


//User Database
const users = { 
  // "userRandomID": {
  //   id: "userRandomID", 
  //   email: "user@example.com", 
  //   password: "purple-monkey-dinosaur",
    // hashedPassword: bcrypt.hashSync(users., 10)
  // },
//  "user2RandomID": {
//     id: "user2RandomID", 
//     email: "user2@example.com", 
//     password: "dishwasher-funk",
//     hashedPassword: bcrypt.hashSync("dishwasher-funk", 10)
//   }
};

// //Loops through the urlDatatbase to pull shortURL and longURL when the arg (user) matches the userID
const findUserUrl = (user) => {
  userUrls = {}
  for (let url in urlDatabase) {
    if (user.id == urlDatabase[url].userID) {
      userUrls[url] = urlDatabase[url] 
    }
  }
  return userUrls
 };

//finds userID for corresponding email
const findUserId = (email) => {
  for (let id in users) {
    if (email === users[id].email) {
      return id;
    }
  }
};

//confirms if a given users email matches the password
const checkAccountExists = (email, password) => {
  for(let user in users) {
    if(email === users[user].email && bcrypt.compareSync(password, users[user].password)) {
      return true
    }
  }
}
 
//checks if the submitted password or email fields are empty
const createValidUser = (submittedEmail, submittedPassword) => {
  if (submittedEmail === '' || submittedPassword === ''){
    return false
  } else {
    return true
  };
}

//checks if the user email is already registered
const checkDuplicateEmail = (email) => {
  for (let id in users) {
    if (email === users[id].email) {
      // console.log(`user id: ${users[id].id}`)
      return users[id];
    }
  }
  return false;
};

 //home page ***create new page that prompts register or login** 
app.get("/", (req, res) => {   
  res.send("Hello!");
});
  
//allows users who are logged in to retrieve their saved URLS
app.get("/urls", (req, res) => {
  if (users[req.cookies["user_id"]] === undefined){
    res.send("error:Please login")
  } else {
    let userUrls = findUserUrl(users[req.cookies["user_id"]])
    let templateVars = { user: users[req.cookies["user_id"]], urls: userUrls }
    res.render("urls_index", templateVars);
  }
});


app.post("/urls", (req, res) => {
  let longURL = req.body.longURL;
  let shortURL = generateRandomString();
  urlDatabase[shortURL] = { longURL, userID: req.cookies["user_id"]};
  res.redirect(`/urls/${shortURL}`);
});

app.get("/urls/new", (req, res) => {
  let templateVars = { user: users[req.cookies["user_id"]]}
  if (users[req.cookies["user_id"]] === undefined){
    res.redirect("/login")
  } else {
    res.render("urls_new", templateVars);
  }
});

app.post("/urls/:id", (req, res) => {
  console.log(users[req.cookies["user_id"]] , urlDatabase[req.params.id].userID)
  if (users[req.cookies["user_id"]] !== urlDatabase[req.params.id].userID) {
    res.send("error:Please login")
  } else {
    urlDatabase[req.params.id].longURL = req.body.longURL;
    res.redirect(`/urls/${req.params.id}`);
  }
  console.log(urlDatabase[url].userID)
});

// app.post("/urls/:id/edit", (req, res) => {
//   res.redirect(`/urls/${req.params.id}`);
// });

app.get("/urls/:shortURL", (req, res) => {
  let templateVars = { user: users[req.cookies["user_id"]], shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL]};
  res.render("urls_show", templateVars);
});

app.post("/urls/:shortURL/delete", (req, res) => {
  if (users[req.cookies["user_id"]] !== urlDatabase[req.params.shortURL].userID) {
    res.send("error:Please login")
  } else {
    delete urlDatabase[req.params.shortURL];
    res.redirect("/urls");
  }
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
  res.clearCookie("user_id")
  res.redirect("/login")
});

app.get("/register", (req, res) => {
  let templateVars = { user: users[req.cookies["user_id"]] }
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
      res.cookie("user_id", user);
      res.redirect("/urls")
    }
   

});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

