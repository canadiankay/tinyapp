//Helper Functions

// generate random six-character userID key for our urls in the database
const generateRandomString = (length = 6)=> Math.random().toString(36).substr(2, length)

//handle registration error - if email already exists, do not re-register them
//function that will look at the email and scroll through the users object database
const findUserByEmail = (email, users) => {
  // for (let key in database)
  for (let id in users) {
    const user = users[id]; // => retrieve the value that's in id

    if (user.email === email) { // check if email from form === email from the database
      return user;
    }
  }
  return null;
};

//create a helper function that searches through each url in the database, and only returns the urls that have that specific users userid
const urlsForUser = (id, urlDatabase) => {
  let userURLDatabase = {};
  //console.log(urlDatabase);
  for (let key in urlDatabase) {
    if (urlDatabase[key]["userID"] === id) { //if the userID in the database is equal to the id of the user signed in
      userURLDatabase[key] = urlDatabase[key];
    }
  }
  return userURLDatabase; //this will return a custom database obj
};


module.exports = {
  generateRandomString,
  findUserByEmail,
  urlsForUser };