const PORT = 8080;
const express = require("express");
const app = express(); 
const bodyParser = require('body-parser');
const cookieSession = require('cookie-session');
const bcrypt = require('bcryptjs'); //used to hash passwords
const salt = bcrypt.genSaltSync(10);//this will generate the salt that will be combinediwtho our password...
const {
  generateRandomString,
  findUserByEmail,
  urlsForUser
} = require('./helpers'); //Helper functions moved to helpers file

app.set('view engine', 'ejs');

//----------------------------------------------------------------MIDDLEWARE----> will run for every request
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieSession({
  name: 'session',
  keys: ['key1', 'key2']
}));

// ----------------------------------------------------------------DATA ---------------------------->
const urlDatabase = {
  "b2xVn2": {
    longURL: "http://www.lighthouselabs.ca",
    userID: "aJvfe3"
  },
  "9sm5xK": {
    longURL: "http://www.google.com",
    userID:"aJvfe3"
  }
};

const users = {
  "userRandomID": {
    id: "userRandomID",
    email: "ilove@baking.com",
    password: bcrypt.hashSync("sugar", salt)
  },
  "user2RandomID": {
    id: "user2RandomID",
    email: "cookies@everyday.com",
    password: bcrypt.hashSync("chocolate", salt)
  }
};

//------------------------------------------------------END POINTS & ROUTES ----------------------------->
//HOMEPAGE
app.get("/", (req, res) => {
  //res.send("Hello!"); //respond with hello when client enters home
  
  const user_id = req.session.user_id;
    
  //if user is not logged in: redirect to /login
  if (!user_id) {
    res.redirect("/login");
    return;
  } else {
  //if user is logged in: redirect to /urls 
    res.redirect("/urls");
  }
});





//SHOWS THE URLS THAT ARE AVAILABLE
app.get("/urls.json", (req, res) => {
  res.json(urlDatabase); //this will print a JSON string representing all the items for the urlDatabase Object
});

// DISPLAY OF THE CURRENT URLs IN DATABASE
app.get("/urls", (req, res) => {
  const user_id = req.session.user_id;
  //console.log("This is the user ID of the client:", user_id);

  // if a user is not logged in, they should not see the url page displaying the URLS
  if (!user_id) { 
    res.redirect("/login");
    return;
  }

  //custom URL database for each user
  let customURLDatabase = urlsForUser(user_id, urlDatabase); 

  const templateVars = {
    urls: customURLDatabase,
    user: users[user_id]
  };

  res.render("urls_index", templateVars);//template to display all the URLs and their shortened forms
});

// THIS WILL DISPLAY THE DATA SUBMITTED BY THE CREATE SHORT FORM 
app.post("/urls", (req, res) => {
  const user_id = req.session.user_id;
  
  if (user_id) {
    const newShortURL = generateRandomString(); ////generate a random string for our new long URL
    const newLongURL = {
      longURL: req.body.longURL,
      userID: user_id
    }; 
    
    //need to add the user to the database as well so it's linked to the newURL
    urlDatabase[newShortURL] = newLongURL;  //this gives random string id to the new long URL that client provided
  
    res.redirect(`/urls/${newShortURL}`);//will redirect to the longURL page of that randomstring
 
  // a non-logged in user cannot add a new url
  } else {
    res.status(403).send("Sorry but you cannot access this page if you are not logged. Please log in or register for an account");
  }
});

//FORM TO CREATE NEW URL ------ this will render/create the page to create new urls and show it to the client/user
app.get("/urls/new", (req, res) => {
  const user_id = req.session.user_id;

  //if we do not have a user logged in, then redirect them to the login page
  if (!user_id) {
    res.redirect("/login");
    return;
  }
  const templateVars = {
    user: users[user_id]
  };
  res.render("urls_new", templateVars);
});


//PAGE WITH THE SHORT URL, its LONG URL and edit form on the bottom
app.get("/urls/:shortURL", (req, res) => {
  const user_id = req.session.user_id;
  const shortURL = req.params.shortURL;
  const templateVars = {
    shortURL,
    longURL: urlDatabase[req.params.shortURL].longURL,
    user: users[user_id]
  };

  // check if the shortURL belongs to the user
  if (urlDatabase[shortURL].userID === user_id) {

    // if the user owns the url, render urls_show
    res.render("urls_show", templateVars); 

  } else {
    //if not, say : you are not authorized to access this url
    res.status(400).send("You are not authorized to access this url");
  }

});

// REDIRECTS US TO THE WEBSITE OF THE SHORT URL KEY
app.get("/u/:shortURL", (req, res) => {
  const longURL = urlDatabase[req.params.shortURL].longURL;
  res.redirect(longURL);
});


//EDIT FORM-- this will update the resource (i.e. the long url associated with the key)
app.post("/urls/:id", (req, res) => {
  // ^ id = the short url key
  const user_id = req.session.user_id;
  // if a user is not logged in, they cannot see the url page displaying the URLS
  if (!user_id) { 
    res.redirect("/login");
    return;
  }
  
  const shortURL = req.params.id;
  const fullURL = req.body.longURL;
  urlDatabase[shortURL].longURL = fullURL;

  // check if the shortURL belongs to the user
  if (urlDatabase[shortURL].userID === user_id) {
    res.redirect("/urls");
  } else {
    //if not, say : you are not authorized to access this url
    res.status(400).send("You are not authorized to edit this url");
  }
});

//-------------------------- DELETE-------------------------------
//updated delete button (in index) and operation
app.post("/urls/:shortURL/delete", (req, res) => {  
  //update so that only the creater of the URL can delete specific urls
  // check if the shortURL belongs to the user
  const user_id = req.session.user_id;
  const shortURL = req.params.shortURL;
  if (urlDatabase[shortURL].userID === user_id) {
    delete urlDatabase[shortURL]; //looks for specific key/shorturl and deletes it
    res.redirect("/urls");
  } else {
    //if not, say : you are not authorized to access this url
    res.status(400).send("You are not authorized to delete this url");
  }
});

//-------------------------------------------------------------------Authentication Routes --------------------------------------------------------------------->
// -------------------------------------------REGISTRATION-------------------------------->
app.get("/register", (req, res) => { 
  const templateVars = {
    user: null
  };
  res.render("register", templateVars); // render registration page
  res.status(404);
});


//receive info from the registration page- registration handler
app.post("/register", (req, res) => { 
  
  // Extract the user info from the incoming form after client clicks register -- using req.body (body parser of express)
  const email = req.body.email; 
  const password = req.body.password;

  //handle registration errors - if email and/or password are blank
  if (email === "" || password === "") {
    return res.status(400).send("Please ensure both fields are filled. Enter both a valid email address and/or password.");
  }

  //handle registration errors - if email already exists-- use function we created above ---- moved to helper functions
    
  const userEmail = findUserByEmail(email,users);
  // ^we want to find the user using their email through the usersdb

  //if user already exists then no need to create a new user
  if (userEmail) { 
    res.status(403).send('User already exists! Please head to the login page to log in.');
    return;
  }

  //generate a new user id
  const id = generateRandomString();

  //create new user (object) AND add their name, email, password to our users database
  const newUser = { 
    id: id,
    email: email,
    password: bcrypt.hashSync(password, salt)
  };
  

  // add the new user to our users obj database (i.e. we need to ascribe it to a key value and in our case the random generated string)
  //we're gonna add the newuser to the users database
  users[id] = newUser; 

  //set the cookie-- we want to the browser keep the user id in the cookie
  req.session.user_id = id; // alternative syntax =>  req.session['user_id'] = id

  //redirect to '/urls'
  res.redirect("/urls");
});

//----------------------------------------------------------------LOGIN --------------------->
// temporary route to show all the users in the users database
app.get('/users.json', (req, res) => {
  res.json(users);
});

app.get("/login", (req, res) => { 
  const templateVars = {
    user: null
  };
  res.render("login", templateVars);
});

//authenticate the user
app.post("/login", (req, res) => {
  //extract the user info from the form
  const email = req.body.email; 
  const password = req.body.password;

  //handle registration errors - if email and/or password are blank
  if (email === "" || password === "") {
    return res.status(400).send("Please ensure both fields are filled. Enter both a valid email address and/or password.");
  }

  //retrive the user with that email from the users database
  const user = findUserByEmail(email, users);


   //if user is there, we need to also check that hteir password is
  if (user && bcrypt.compareSync(password, user.password)) { 
    req.session.user_id = user.id; //we want broswer to store the user id in a cookie
    res.redirect("/urls");
    return;

    //if the email exists but the password is incorrect
  } else if (user && !bcrypt.compareSync(password, user.password)) {
    res.send("Please type in the correct password associated with this account.");
  }

  //user is not authenticated
  res.status(401).send("Could not find an account associated with that email. Please register and create an account.")

});

app.post("/logout", (req, res) => {
  req.session = null; //clear cookie
  res.redirect("/urls");
});

//-------------------------------LISTEN-------------------------------------------
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});