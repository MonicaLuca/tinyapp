
const bcrypt = require('bcrypt');
//Database holding shorturl, the longURL, and the userID to specify which link belongs to which account
const urlDatabase = {
  "b2xVn2": { longURL: "http://www.lighthouselabs.ca", userID: "userRandomID" },
  "9sm5xK": { longURL: "http://www.google.com", userID: "ecvssl" }
};


//User Database
const users = { 
  ecvssl: { 
    id: 'ecvssl',
    email: '123@gmail.com',
    password: bcrypt.hashSync("123", 10)
  }

}

//generates random string used for shortURL and to generate a userID
function generateRandomString() {
  let id = Math.random().toString(36).slice(2,8);
  return id;
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



module.exports = { generateRandomString, findUserUrl, findUserId, checkAccountExists, createValidUser, checkDuplicateEmail, users, urlDatabase }