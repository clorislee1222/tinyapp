const { assert } = require('chai');

const { getUserByEmail } = require('../helpers.js');

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

describe('getUserByEmail', function() {
  it('should return a user with valid email', function() {
    const user = getUserByEmail("user@example.com", testUsers);
    // Write your assert statement here
    assert.equal(user, testUsers.userRandomID);
  });

  it('should return undefined with non-existing email', function() {
    const user = getUserByEmail("aaa@example.com", testUsers);
    // Write your assert statement here
    assert.equal(user, undefined);
  });
});

