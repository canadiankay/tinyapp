//res.render ("name of template", an object with a bunch of key/value pairs)
//so that in our template, we can access each of these key/value pairs

const express = require("express");
const app = express();
const PORT = 8080; // default port 8080

//// tells the Express app to use EJS as its templating/ 'view' engine.
app.set('view engine', 'ejs');

//this object is used to keep track of all the shortened URLs
const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

app.get("/", (req, res) => {
  res.send("Hello!");
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
}); //this will print a JSON string representing the urlDatabase Object

app.get("/urls", (req, res) => {
  const templateVars = { urls: urlDatabase };
  res.render("urls_index", templateVars);
});

app.get("/urls/:shortURL", (req, res) => {
  const templateVars = { 
    shortURL: req.params.shortURL, 
    longURL: urlDatabase[req.params.shortURL] 
  };
  res.render("urls_show", templateVars);
});

//response can contain HTML code, which would be rendered in the client browser.
app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});


app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});