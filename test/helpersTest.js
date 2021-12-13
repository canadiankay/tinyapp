const { assert } = require('chai');

const { findUserByEmail } = require('../helpers.js');

const testUsers = {
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

describe('findUserByEmail', function() {

  it('should return a user with valid email', function() {
    const user = findUserByEmail("user@example.com", testUsers)
    const expectedUserID = testUsers.userRandomID;;
    assert.equal(user, expectedUserID)
  });

  
  it('should return null/undefined if the email isnt in the database', function() {
    const user = findUserByEmail("invalid@example.com", testUsers);
    const expectedResult = undefined;
    assert.equal(user, expectedResult);
  });
  
  




});