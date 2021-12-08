//res.render ("name of template", an object with a bunch of key/value pairs)
//so that in our template, we can access each of these key/value pairs

const express = require("express");
const app = express();
const PORT = 8080; // default port 8080

const cookieParser = require('cookie-parser');
app.use(cookieParser());

//body-parser library will convert the request body from a Buffer into string that we can read.
const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: true}));

//this will create a random key of 6 characters (from any combo of numbers and letters) to be the key to our url for our database
const generateRandomString = function(length=6){
    return Math.random().toString(36).substr(2, length)
};
console.log(generateRandomString());

//ROUTES --->

//// tells the Express app to use EJS as its templating/ 'view' engine.
app.set('view engine', 'ejs');

//this object is used to keep track of all the shortened URLs
const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

//when client enters home then it should greet them with hello 
app.get("/", (req, res) => {
  res.send("Hello!"); //respond with hello
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
}); //this will print a JSON string representing all the items urlDatabase Object

app.get("/urls", (req, res) => {
  const templateVars = { 
    urls: urlDatabase, //object of all the urls
    username: req.cookies["username"]
  }; 
  res.render("urls_index", templateVars); //if you have the urls it'll be on the index page
});

//this will render/create the page with the form and show it to the client/user
app.get("/urls/new", (req, res) => {
  const templateVars = {username: req.cookies["username"]};
  res.render("urls_new", templateVars); 
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


//should render and send us back to the show page with all of the urls
app.get("/urls/:shortURL", (req, res) => {
  const templateVars = {
    shortURL: req.params.shortURL,
    longURL: urlDatabase[req.params.shortURL],
    username: req.cookies["username"]
  };
  res.render("urls_show", templateVars);
}); 

//redirects us to the longURL only when we're on the show page not when we submit the form
app.get("/u/:shortURL", (req, res) => {
  const longURL = urlDatabase[req.params.shortURL]; //object containing properties mapped to a named route parameters=
  //the long URL will look for its shortURL key in the database

  const templateVars = {username: req.cookies["username"]}

  //res.render("urls_show", templateVars);
  //redirect to longURL
  res.redirect(longURL, templateVars);
});

//login page
app.get("/login", (req, res) => {
})

//logout page
app.get("/logout", (req, res) => {
})
//register page
app.get("/register", (req, res) => {
  res.render("register");
  res.send("404")
});

//response can contain HTML code, which would be rendered in the client browser.
app.get("/hello", (req, res) => {
  const templateVars = {username: req.cookies["username"]}
  res.send("<html><body>Hello <b>World</b></body></html>\n", templateVars);
});

//updated delete button (in index) and operation
app.post("/urls/:shortURL/delete", (req, res) => {
  delete urlDatabase[req.params.shortURL]; //looks for specific key/shorturl and deletes it
  res.redirect("/urls");
})

//add an edit form + which will update the resource (i.e. the long url associated with the key)
app.post("/urls/:id", (req, res) => {
  let shortURL = req.params.id;
  let fullURL = req.body.longURL;
  console.log("editing", req.body);
  urlDatabase[shortURL] = fullURL;
  res.redirect("/urls");
});

//handle /login
app.post("/login", (req, res) => {
  const username = req.body.username; //whatever gets entered will be stored here
  res.cookie("username", username); // set cookie
  res.redirect("/urls");
});

app.post("/logout", (req, res) => {
  const username = req.body.username; //whatever gets entered will be stored here
  res.cookie("username", username); // set cookie
  res.clearCookie("username",username); // clear cookie
  res.redirect("/urls");
});

// app.post("/register", (req, res) => {
  
// });


app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});