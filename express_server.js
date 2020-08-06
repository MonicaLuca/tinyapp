const express = require("express");
const app = express();
const PORT = 8080; // default port 8080
const cookieParser = require('cookie-parser');
const bodyParser = require("body-parser");
const e = require("express");

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

//original database
// "b2xVn2": "http://www.lighthouselabs.ca",
// "9sm5xK": "http://www.google.com"
// };


//User Database
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
};

// //Loops through the urlDatatbase to pull shortURL and longURL when the arg (user) matches the userID
const findUserUrl = (user) => {
  userUrls = {}
  console.log(user)
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
    if(email === users[user].email && password === users[user].password) {
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
  
//the urls page for a user, if the user doesn't have an account, it will redirect to login, if there is an account, it will show all urls linked to their account
// app.get("/urls", (req, res) => {
//   // // let userUrls = findUserUrl(users[req.cookies["user_id"]].id)
//   // console.log(userUrls)
//   // let templateVars = { user: users[req.cookies["user_id"]], urls: userUrls };
//   // res.render("urls_index", templateVars);

//   // let templateVars = { user: users[req.cookies["user_id"]], urls: urlDatabase };
// //   // res.render("urls_index", templateVars);

//   let userUrls = findUserUrl(users[req.cookies["user_id"]].id)
//   let templateVars = { user: users[req.cookies["user_id"]], urls: userUrls }
//   if (users[req.cookies["user_id"]] === undefined){
//     res.send("error:Please login")
//   } else {
//     res.render("urls_index", templateVars);
//   }
  
  app.get("/urls", (req, res) => {

  if (users[req.cookies["user_id"]] === undefined){
    res.send("error:Please login")
  } else {
    let userUrls = findUserUrl(users[req.cookies["user_id"]])
    let templateVars = { user: users[req.cookies["user_id"]], urls: userUrls }
    res.render("urls_index", templateVars);
    console.log(userUrls)
  }
    // // let templateVars = { user: users[req.cookies["user_id"]], urls: urlDatabase };
    // res.render("urls_index", templateVars);
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
  urlDatabase[req.params.id].longURL = req.body.longURL;
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
  res.clearCookie("user_id")
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

