import jsSHA from 'jssha';
import { pool } from './initClient.js';

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
  let validateUserId;
  if (request.params.index) {
    const { index } = request.params;
    validateUserId = index;
  } else {
    const { userId } = request.cookies;
    validateUserId = userId;
  }

  request.isUserLoggedIn = false;

  const sessionCookie = request.cookies.sessionID;

  if (sessionCookie && validateUserId) {
    const verifyHashCookie = hashingCookie(validateUserId);

    if (verifyHashCookie === sessionCookie) {
      console.log('Cookie Verified');
      next();
    } else {
      response.status(403).send('Error 403 : Invalid Request');
    }
  }
}

function checkUsername(request, response, next) {
  const { phone } = request.body;
  let message;
  pool
    .query('SELECT * from authenticate WHERE phone=$1', [phone])
    .then((results) => {
      if (results.rows.length !== 0) {
        message = 'Phone number exists';
        response.locals.message = message;
      }
      next();
    });
}

function checkAccountNo(request, response, next) {
  const { payeeBankAccountId } = request.body;
  console.log('***');
  console.log(request.body);
  let message;
  pool
    .query('SELECT * from users_bank_accounts WHERE bankaccountid=$1', [payeeBankAccountId])
    .then((results) => {
      console.log('********************');
      console.log(results.rows);
      if (results.rows.length === 0) {
        message = 'Bank Account does not exist';
        response.locals.message = message;
        next();
      }
      const query = pool.query('SELECT * from users_favourite WHERE payeeaccountid=$1', [payeeBankAccountId]);
      return query
        .then((result) => {
          if (result.rows.length !== 0) {
            message = 'Bank Account has been added before';
            response.locals.message = message;
          }
          next();
        });
    });
}

export default {
  hashingPassword,
  hashingCookie,
  hashingTransaction,
  authMiddleware,
  checkUsername,
  checkAccountNo,
};
