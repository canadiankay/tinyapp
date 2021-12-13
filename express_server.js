const PORT = 8080;
const express = require("express");
const app = express(); //create express app
const bodyParser = require("body-parser"); //body-parser library will convert the request body from a Buffer into string that we can read.
//const cookieParser = require('cookie-parser'); //no longer need this as it's not safe
const cookieSession = require('cookie-session')
const bcrypt = require('bcryptjs'); //used to hash passwords
const salt = bcrypt.genSaltSync(10);//thiswill generate the salt that will be combinediwtho our password...10 is the duration counter
const { 
  generateRandomString, 
  findUserByEmail, 
  urlsForUser
} = require("./helpers"); //Helper functions moved to helpers file

app.set('view engine', 'ejs');
//----------------------------------------------------------------MIDDLEWARE----> will run for every request
app.use(bodyParser.urlencoded({extended: true}));
//app.use(cookieParser()); //no longer need this 
app.use(cookieSession({
  name: 'session', //this is the name of the cookie
  keys: ['key1', 'key2'] //in the future, create random strings to be keys for security purposes, doesnt matter rn
}))

// ----------------------------------------------------------------DATA ----------------------------> 
//this object is used to keep track of all the URLs- shortURL keys and longURL values
const urlDatabase = {
  "b2xVn2": {
    longURL: "http://www.lighthouselabs.ca",
    userID: "userRandomID"
  },
  "9sm5xK": {
    longURL: "http://www.google.com",
    userID:"aJvfe3"
  }
};

// because we are encrypting the passwords, we can't use these passowrds to log in  anymore => use hashsync
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
  res.send("Hello!"); //respond with hello when client enters home
});

//SHOWS THE URLS THAT ARE AVAILABLE
app.get("/urls.json", (req, res) => {
  res.json(urlDatabase); //this will print a JSON string representing all the items for the urlDatabase Object
});

//// DISPLAY OF THE CURRENT URLs IN DATABASE
app.get("/urls", (req, res) => {
  //const user_id = req.cookies.user_id;
  const user_id = req.session.user_id;
  //console.log("This is the user Id of the client:", user_id);
  if (!user_id) { // if a user is not logged in, they cannot see the url page displaying the URLS
    res.redirect("/login");
    return;
  }

  let customURLDatabase = urlsForUser(user_id, urlDatabase); //custom URL database for each user
  const templateVars = {
    //urls: urlDatabase, // we no longer want each user to have acess to entire database, just the ones that match their userid/that they put in
    urls: customURLDatabase,
    user: users[user_id] //shows user now
  };
  console.log(templateVars); //this gives me the object of all the urls belonging to the specific user in my console

  res.render("urls_index", templateVars);//template to display all the URLs and their shortened forms
});

//we need the data from the form to be submitted and place somwewhere
app.post("/urls", (req, res) => {
  // const user_id = req.cookies.user_id;
  const user_id = req.session.user_id;
  
  if (user_id) { 
    const newShortURL = generateRandomString(); ////generate a random string for our new long URL
    const newLongURL = { 
      longURL: req.body.longURL, 
      userID: user_id
    }; //need to add the user to the database as well so it's linked to the newURL
    urlDatabase[newShortURL] = newLongURL;  //this gives random string id to the new long URL that client provided

    //console.log(urlDatabase);
  
    res.redirect(`/urls/${newShortURL}`);//will redirect to the longURL page of that randomstring
 
  // a non-logged in user cannot add a new url
  } else {
    res.status(403).send("Sorry but you cannot access this page if you are not logged. Please log in or register for an account");
  }
});

//FORM TO CREATE NEW URL ------ this will render/create the page to create new urls and show it to the client/user
app.get("/urls/new", (req, res) => {
  //const user_id = req.cookies.user_id;
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
  //const user_id = req.cookies.user_id;
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
    res.render("urls_show", templateVars); //urls_show is the page where we see the the long url, short url and edit form on the bottom
  } else {
    //if not, say : you are not authorized to access this url
    res.status(400).send("You are not authorized to access this url");
  }

});

// REDIRECTS US TO THE website OF THE SHORT URL KEY
app.get("/u/:shortURL", (req, res) => {
  const longURL = urlDatabase[req.params.shortURL].longURL;
  //req.param is anything passed as a parameter anythign after the colon ...via :shortURL
  //can be rewritten as urlDatabase.req.params.shortURL.longURL
  res.redirect(longURL);
});


//EDIT FORM-- this will update the resource (i.e. the long url associated with the key)
app.post("/urls/:id", (req, res) => {
  // ^ id = the short url key
  //const user_id = req.cookies.user_id;
  const user_id = req.session.user_id;
  if (!user_id) { //// if a user is not logged in, they cannot see the url page displaying the URLS
    res.redirect("/login");
    return;
  }
  
  const shortURL = req.params.id;
  const fullURL = req.body.longURL;
  urlDatabase[shortURL].longURL = fullURL;
  // console.log("This is the shortURL:", shortURL);
  // console.log("This is the fullURL:", fullURL);

  // check if the shortURL belongs to the user
  if (urlDatabase[shortURL].userID === user_id) {
    res.redirect("/urls");
  } else {
    //if not, say : you are not authorized to access this url
    res.status(400).send("You are not authorized to edit this url");
  }
});

//------------------ DELETE-------------------------------
//updated delete button (in index) and operation
app.post("/urls/:shortURL/delete", (req, res) => {
  // delete urlDatabase[req.params.shortURL]; //looks for specific key/shorturl and deletes it
  
  //update so that only the creater of the URL can delete specific urls
  // check if the shortURL belongs to the user
  //const user_id = req.cookies.user_id;
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
app.get("/register", (req, res) => { //endpoint
  const templateVars = {
    user: null //since we haven't logged in yet here, user would be null here
  };
  res.render("register", templateVars); // render registration page
  res.status(404);
});


//receive info from the registration page- registration handler
app.post("/register", (req, res) => { //when I submit register form I want the info to be receive that info from
  
  // Extract the user info from the incoming form after client clicks register -- using req.body (body parser of express)
  const email = req.body.email; //this matches the email attribute form the register form
  const password = req.body.password;

  //handle registration errors - if email and/or password are blank
  if (email === "" || password === "") {
    return res.status(400).send("Please ensure both fields are filled. Enter both a valid email address and/or password.");
  }

  //handle registration errors - if email already exists-- use function we created above ---- moved to helper functions
    
  const userEmail = findUserByEmail(email,users);
  // ^we want to find the user using their email through the usersdb
  if (userEmail) { //if user already exists then no need to create a new user
    res.status(403).send('User already exists! Please head to the login page to log in.');
    return;
  }

  //generate a new user id
  const id = generateRandomString();

  //create new user (object) AND add their name, email, password to our users database
  const newUser = { //This endpoint should add a new user object to the global users object
    id: id,
    email: email,
    password: bcrypt.hashSync(password, salt) //encrypt this password
      //password is the password we're receiving in plain text from client
      //salt is already defined in the glboal scope
  };
  

  // add the new user to our users obj database (i.e. we need to ascribe it to a key value and in our case the random generated string)
  users[id] = newUser; //we're gonna add the newuser to the users database 

  //set the cookie-- we want to the browser keep the user id in the cookie
  //res.cookie("user_id", id); //<--- modify this
  req.session.user_id = id; // alternative syntax =>  req.session['user_id'] = id

  //redirect to '/urls'
  res.redirect("/urls");
});

//----------------------------------------------------------------LOGIN --------------------->
// temporaray route to show all the users in the users database
app.get('/users.json', (req, res) => {
  res.json(users);
});

app.get("/login", (req, res) => { //endpoint-- render registration page
  const templateVars = {
    user: null //since we haven't logged in yet here, user would be null here
  };
  res.render("login", templateVars);
});

//authenticate the user
app.post("/login", (req, res) => {
  //extract the user info from the form
  const email = req.body.email; //this matches the email attribute form the register form
  const password = req.body.password;

  //handle registration errors - if email and/or password are blank
  if (email === "" || password === "") {
    return res.status(400).send("Please ensure both fields are filled. Enter both a valid email address and/or password.");
  }

  //retrive the user with that email from the users database
  //chcek if user exists-- use for in loop that we made previously to check if email is there
  const user = findUserByEmail(email, users);

  //if user exists and password in the db matches what they gave us in the form
  //if (user && user.password === password) { //then user is authenticated == if yes, then we want to log them in
    // now that we've hashed user.password, this will never be equal so we need bcrypt to match the hashed passwrod
  if (user && bcrypt.compareSync(password, user.password)) { //we need it to compare the password from the form to the user's password in plaintext
    //we want broswer to store the user id in a cookie
    //res.cookie('user_id', user.id); //set cookie to their user id
    req.session.user_id = user.id; 
    res.redirect("/urls");
    return;
  }

  //user is not authenticated
  res.status(403).send("Could not find an account associated with that email. Please register and create an account.");


});

app.post("/logout", (req, res) => {
  //const user_id = req.cookies.user_id;
  const user_id = req.session.user_id;

  //clear cookie
  //res.clearCookie("user_id", user_id);
  req.session["user_id"] = null;
  res.redirect("/urls");
});

//-------------------------------LISTEN-------------------------------------------
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});