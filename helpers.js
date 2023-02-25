//---Helper functions---

function generateRandomString() {
  return Math.random().toString(36).slice(2, 8);
};

function getUserByEmail(email, users) {
  for (const user in users) {
    if (users[user].email === email) {
      return users[user];
    }
  }
  return null;
}

function urlsForUser(id, urlDatabase) {
  let urls = {};
  for (const url in urlDatabase) {
    if (urlDatabase[url]["userID"] === id) {
      urls[url] = urlDatabase[url];
    }
  }
  return urls;
}


module.exports = {
  generateRandomString,
  getUserByEmail,
  urlsForUser
};