/* MY NOTES
res.render ("name of template", an object with a bunch of key/value pairs) so that in our template, we can access each of these key/value pairs 
if you have the urls it'll be on the index page
setCookie has two parameters (cookie name, the value you want associated to the cookie )
clearCookies takes one parameter (cookie name)
instead of doing console log of the user database, we can alternatively do domain'/users.json' as that will list them all as well
since the header is shown across all of the ejs pages, and we use the variable 'user' in the header, we need user to be in every single app.get that renders these pages
//therefore need a templateVars everywhere with the user key anywhere we are rendering a file

*/
const PORT = 8080;
const express = require("express");
const app = express(); //create express app
const bodyParser = require("body-parser"); //body-parser library will convert the request body from a Buffer into string that we can read.
const cookieParser = require('cookie-parser');

//// tells the Express app to use EJS as its templating/ 'view' engine.
app.set('view engine', 'ejs');

//----------------------------------------------------------------MIDDLEWARE----> will run for every request
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());


// ----------------------------------------------------------------DATA -----> //in memory database
//this object is used to keep track of all the shortened URLs
const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};
//we want to go to our users object and see if the address in the email key already exists

const users = { 
  "userRandomID": {
    id: "userRandomID", 
    email: "user@example.com", 
    password: "brownsugar"
  },
 "user2RandomID": {
    id: "user2RandomID", 
    email: "user2@example.com", 
    password: "chocolatechips"
  }
}

// ---------------------------------------------------------------- HELPER FUNCTIONS-----> 
// generate random six-character userID key for our urls in the database
const generateRandomString = function(length=6){
    return Math.random().toString(36).substr(2, length)
};
console.log(generateRandomString());

//handle registration error - if email already exists, do not re-register them
//function that will look at the email and scroll through the users object database
const findUserByEmail = (email, userDatabase) => {
  // for (let key in database)
  for (let id in userDatabase) {
    const user = users[id]; // => retrieve the value that's in id 

    if (user.email === email) { // check if email from form === email from the database
      return user;
    }
  }
    return false;
};

//------------------------------------------------------END POINTS & ROUTES ----------------------------->
app.get("/", (req, res) => {
  res.send("Hello!"); //respond with hello when client enters home
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase); //this will print a JSON string representing all the items for the urlDatabase Object
}); 

app.get("/urls", (req, res) => {
  const user_id = req.cookies.user_id
  const templateVars = { 
    urls: urlDatabase, 
    //username: req.cookies["username"] //shows username in header
    user: users[user_id] //shows user now
  }; 
  res.render("urls_index", templateVars); 
});

//we need the data from the form to be submitted and place somwewhere 
app.post("/urls", (req, res) => {
  console.log(req.body);  //what did my client request from me and let me show them what they requested so will showthem all the ursl// Log the POST request body to the console.. will log as an object with keyvalue pair{longuRL: 'enteredURL'}
  //res.send("Ok");         // Respond to the client with 'Ok' (we will replace this)

  //generate a random string for our new long URL
  //shortURL-longURL key-value pair are saved to the urlDatabase with our randomnly generated string
  const randomString = generateRandomString();
  urlDatabase[randomString] = req.body.longURL; //save key-value pairs to data base when we get a post request
  //this gives random string generated to a new URL that client provided
  console.log(urlDatabase);
  
  res.redirect(`/urls/${randomString}`);//will redirect to the longURL page of that randomstring
});

//this will render/create the page with the form and show it to the client/user
app.get("/urls/new", (req, res) => {
  //get user id from cookie
  const user_id = req.cookies.user_id
  //const templateVars = {username: req.cookies["username"]}; //added this so that username at the top still shows in header
  const templateVars = {
    user: users[user_id]
  }; //added this so that username at the top still shows in header
  res.render("urls_new", templateVars); 
});


//should render and send us back to the show page with all of the urls
app.get("/urls/:shortURL", (req, res) => {
  const user_id = req.cookies.user_id
  const templateVars = {
    shortURL: req.params.shortURL,
    longURL: urlDatabase[req.params.shortURL],
    //username: req.cookies["username"]
    user: users[user_id]
  };
  res.render("urls_show", templateVars);
}); 

//redirects us to the longURL only when we're on the show page not when we submit the form
app.get("/u/:shortURL", (req, res) => {
  const longURL = urlDatabase[req.params.shortURL]; //object containing properties mapped to a named route parameters//the long URL will look for its shortURL key in the database
  const user_id = req.cookies.user_id
  //const templateVars = {username: req.cookies["username"]}
  const templateVars = {
    user: users[user_id]
  };
  //res.render("urls_show", templateVars);
  //redirect to longURL
  res.redirect(longURL, templateVars);
});


//add an edit form + which will update the resource (i.e. the long url associated with the key)
app.post("/urls/:id", (req, res) => {
  const shortURL = req.params.id;
  const fullURL = req.body.longURL;
  console.log("editing", req.body);
  urlDatabase[shortURL] = fullURL;
  res.redirect("/urls");
});

//----------------------------------------------Authentication Routes -------------------->
// --------------------------REGISTRATION-------------------> 
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
    return res.status(400).send("Please enter a valid email address and/or password");
  }
  //---------------------------------------------------------------- MOVED TO HELPER FUNCTIONS B/C WE REUSE THIS IN LOGIN
  // //function that will look at the email and scroll through the users object database
  // const findUserByEmail = (email, users) => {
  // // for (let key in database)
  //   for (let id in users) {
  //     const user = users[id]; // => retrieve the value that's in id 
  //     if (user.email === email) {
  //       return user;
  //     }
  //   }
  //   return false;
  // };

  //handle registration errors - if email already exists-- use function we created above ---- moved to helper functions
    
    const user = findUserByEmail(email,users);
    // ^we want to find the user using their email through the usersdb

    if (user) { //if user already exists then no need to create a new user
      res.status(403).send('Sorry, user already exists!');
      return;
    }

  //generate a new user id
  const id = generateRandomString();

  //create new user AND add their name, email, password to our users database
  const newUser = { //This endpoint should add a new user object to the global users object
    id: id,
    email: email,
    password: password
  }

  // add the new user to our users obj database (i.e. we need to ascribe it to a key value and in our case the random generated string)
  users[id] = newUser //we want it to be equal to new user object above 

  //set the cookie-- we want to the browser keep the user id in the cookie
  res.cookie("user_id", id); //test cookie in browswer

  //redirect to '/urls'
  res.redirect("/urls");
});

//----------------------------------------------------------------LOGIN ---------->
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

  //retrive the user with that email from the users database
  //chcek if user exists-- use for in loop that we made previously to check if email is there
  const user = findUserByEmail(email, users);

  //if user exists and password in the db matches what they gave us in the form
  if (user && user.password === password) { 
    //then user is authenticated == if yes, then we want to log them in
    res.cookie('user_id', user.id) //set cookie to their user id 
    res.redirect("/urls");
    return;

  }

  //user is not authenticated

  











  const user_id = req.cookies.user_id
  //const username = req.body.username; //whatever gets entered will be stored here
  user: users[user_id]
  res.cookie("user_id", user_id); // set cookie with the username
  res.redirect("/urls");
});

app.post("/logout", (req, res) => {
  //const username = req.body.username; //whatever gets entered will be stored here
  const user_id = req.cookies.user_id

  //clear cookie
  //res.clearCookie("username",username); // clear cookie with that username
  res.clearCookie("user_id"); 
  res.redirect("/urls");
});


//------------------ DELETE-------------------------------
//updated delete button (in index) and operation
app.post("/urls/:shortURL/delete", (req, res) => {
  delete urlDatabase[req.params.shortURL]; //looks for specific key/shorturl and deletes it
  res.redirect("/urls");
})

//-------
// //response can contain HTML code, which would be rendered in the client browser.
// app.get("/hello", (req, res) => {
//   const templateVars = {username: req.cookies["username"]}
//   res.send("<html><body>Hello <b>World</b></body></html>\n", templateVars);
// });

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});