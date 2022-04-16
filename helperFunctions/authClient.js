import jsSHA from 'jssha';

function hashingPassword(password) {
  // initialise the SHA object
  const shaObj = new jsSHA('SHA-512', 'TEXT', { encoding: 'UTF8' });
  // input the password from the request to the SHA object
  shaObj.update(password);
  // get the hashed password as output from the SHA object
  const hashedPassword = shaObj.getHash('HEX');

  return hashedPassword;
}

function hashingCookie(user, salt = process.env.salt) {
  // Create an unhashed cookie string based on user ID and salt
  const unHashedCookieString = `${user}+${salt}`;
  const hashedCookieString = hashingPassword(unHashedCookieString);

  return hashedCookieString;
}

function hashingTransaction(user, date, salt = process.env.transaction) {
  const unhashingTransaction = `${user}*${date}+${salt}`;
  const hashedTransaction = hashingPassword(unhashingTransaction).substring(0, 20).toUpperCase();

  return hashedTransaction;
}

function authMiddleware(request, response, next) {
  request.isUserLoggedIn = false;

  const sessionCookie = request.cookies.sessionID;
  const { userId } = request.cookies;

  if (sessionCookie && userId) {
    const verifyHashCookie = hashingCookie(userId);

    if (verifyHashCookie === sessionCookie) {
      console.log('Cookie Verified');
      next();
    } else {
      response.status(403).send('User not logged in');
    }
  }
}

export default {
  hashingPassword,
  hashingCookie,
  hashingTransaction,
  authMiddleware,
};
