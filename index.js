import express from 'express';
import methodOverride from 'method-override';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import path from 'path';
import moment from 'moment';
import multer from 'multer';
// Self created helper functions
// import { user } from 'pg/lib/defaults';
import { pool } from './helperFunctions/initClient.js';
import helper from './helperFunctions/authClient.js';
import logger from './helperFunctions/logger.js';
import idGenerator from './helperFunctions/idGenerator.js';

pool.connect();
// Configuring filepath & environment
const envFilePath = '.env';
dotenv.config({ path: path.normalize(envFilePath) });

const app = express();
app.set('view engine', 'ejs');

// Override POST requests with query param ?_method=PUT to be PUT requests
app.use(methodOverride('_method'));
app.use(express.static('public'));
app.use(express.static('helperFunctions'));
app.use(express.static('img'));

// Configure Express to parse request body data into request.body
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
// Using middleware logger
app.use(logger.logger);
const multerUpload = multer({ dest: 'uploads/' });

const entryList = {
  name: {
    label: 'Name',
    type: 'text',
  },
  phone: {
    label: 'Phone',
    type: 'text',
  },
  password: {
    label: 'Password',
    type: 'password',
  },
  email: {
    label: 'Email',
    type: 'text',
  },
};

const homePageRequest = (request, response) => {
  console.log('Welcome to the home page!');

  // response.cookie('visits', 1);
  // console.log(request.cookies.visits);

  response.render('homePage', '');
};

const signUpRequest = (request, response) => {
  console.log('Sign Up Page');

  response.render('signUp', { entryList });
};

const registrationRequest = (request, response) => {
  // const sqlQuery = 'SELECT * FROM dummy';
  // pool.query(sqlQuery, (err, result) => {
  //   if (err){
  //     console.error(err);
  //   }
  //   const allResult = result.rows;
  //   console.log(allResult)
  // })
  console.log('This is the login page!');
  console.log('Form successfully submitted! Here is the request!');
  console.log(request.body);
  const {
    name, phone, email, password,
  } = request.body;

  const now = moment();
  const formatTime = now.format('YYYY-MM-DD, HH:mm:ss');

  const hashedPassword = helper.hashingPassword(password);
  const dataListUsers = [name, phone, email, formatTime];
  const dataListAuthenticate = [phone, hashedPassword];

  // Bank Balance
  let userid; let
    bankAccountId;
  const bankAmtGiven = 1000;

  // Pool Query to insert into users table
  pool
    .query('INSERT INTO users (name, phone,email, date) VALUES ($1,$2,$3,$4) RETURNING *', dataListUsers)
    .then((result) => {
      // console.log(result.rows[0]);
      console.log('Userdata base successful');
    })
    // user_bank_accounts
    .then(() => pool.query(`SELECT id from users WHERE phone = '${phone}'`))
    .then((result) => {
      userid = result.rows[0].id;
      bankAccountId = idGenerator.idGenerator();
      const dataListCompiledUser = [userid, bankAccountId];
      return dataListCompiledUser;
    })
    .then((list) => {
      pool.query('INSERT INTO users_bank_accounts (userId, bankaccountid) VALUES ($1,$2) RETURNING *', list);
    })
    .then((result) => {
      // console.log(result.rows[0]);
      console.log('users_bank_accounts update successful');
    })
    // bank_accounts
    .then(() => {
      const dataBankAccounts = [bankAccountId, bankAmtGiven];
      pool.query('INSERT INTO bank_accounts (bankaccountid, balance) VALUES ($1,$2) RETURNING *', dataBankAccounts);
    })
    .then((result) => {
      console.log('bank_accounts update successful');
    })
    .then(() => {
      dataListAuthenticate.push(userid);
      return dataListAuthenticate;
    })
    .then((list) => {
      pool.query('INSERT INTO authenticate (phone,password,userId) VALUES ($1,$2,$3) RETURNING *', list);
    })
    .then((result) => {
      // console.log(result.rows[0]);
      console.log('authentication table update successful');
    })
    .catch((error) => console.log(error.stack));

  // // Pool Query into users_bank_accounts
  // pool
  //   .query(`SELECT id from users WHERE phone = '${phone}'`)
  //   .then((result) => {
  //     // console.log(result.rows[0])
  //     const userid = result.rows[0].id;
  //     const bankAccountId = idGenerator.idGenerator();
  //     const dataListCompiledUser = [userid, bankAccountId];
  //     return dataListCompiledUser
  //   })
  //   .then((list) => {
  //     pool.query('INSERT INTO users_bank_accounts (userId, bankaccountid) VALUES ($1,$2) RETURNING *', list)
  //   })
  //   .then((result) => {
  //     // console.log(result.rows[0]);
  //     console.log('users_bank_accounts update successful')
  //   })
  //   .catch((error) => console.log(error.stack))

  // Pool Query to insert data into authentication table
  // pool
  //   .query(`SELECT id from users WHERE phone = '${phone}'`)
  //   .then((result) => {
  //   const userid = result.rows[0].id;

  //   dataListAuthenticate.push(userid)
  //   return dataListAuthenticate
  //   })
  //   .then((list) => {
  //   pool.query('INSERT INTO authenticate (phone,password,userId) VALUES ($1,$2,$3) RETURNING *', list)
  //   })
  //   .then((result) => {
  //     // console.log(result.rows[0]);
  //     console.log('authentication table update successful')
  //   })
  //   .catch((error)=> console.log(error.stack))

  response.render('loginPage', { entryList });
};

const loginRequest = (request, response) => {
  response.render('loginPage', { entryList });
};

const loggedInRequest = (request, response) => {
  console.log('Login Request Came in!');

  console.log(request.body);
  const { phone, password } = request.body;

  const hashPassword = helper.hashingPassword(password);
  const loginCredentials = [phone, hashPassword];
  let account;
  let message;

  pool
    .query('SELECT * from authenticate WHERE phone=$1', [phone])
    .then((result) => {
      console.log(result.rows[0]);

      if (result.rows.length === 0) {
        message = 'Username / Password is incorrect.';
        response.render('loginPage', { entryList, message });
        return;
      }

      const validationResult = result.rows[0];
      const checkPassword = validationResult.password;

      if (checkPassword !== loginCredentials[1]) {
        message = 'Username / Password is incorrect.';
        response.render('loginPage', { entryList, message });
        return;
      }

      const { userid } = validationResult;
      const hashedCookie = helper.hashingCookie(userid);
      const timeRecord = Date.now();
      const timeNow = new Date();
      const lastloggedin = timeNow.toString();

      console.log('----------------------------');
      console.log(timeNow);
      console.log(lastloggedin);

      pool.query(`UPDATE authenticate SET cookie = '${hashedCookie}' WHERE phone='${phone}'`);
      pool.query(`UPDATE authenticate SET lastloggedin = '${lastloggedin}' WHERE phone='${phone}'`);
      pool.query(`UPDATE authenticate SET time = '${timeRecord}' WHERE phone='${phone}'`);

      response.cookie('sessionID', hashedCookie);
      response.cookie('userId', userid);
      response.cookie('isUserLoggedIn', true);

      // Generate a many to many inner join

      pool
        .query(`SELECT users.id, users.name, users.phone, users.email, users_bank_accounts.userid, users_bank_accounts.bankaccountid, bank_accounts.bankaccountid, bank_accounts.balance FROM users INNER JOIN users_bank_accounts ON users_bank_accounts.userid = users.id INNER JOIN bank_accounts on users_bank_accounts.bankaccountid = bank_accounts.bankaccountid WHERE users.id = '${userid}'`)
        .then((result) => {
          console.log('************** LOGIN ACCOUNT DETAILS ************');
          console.log(result.rows);
          console.log('***************************************************');
          account = result.rows[0];
          response.render('accountDetails', { account });
        });
    })
    .catch((error) => {
      console.log(error.stack);
    });
};

const transferPageRequest = (request, response) => {
  const { index } = request.params;

  // console.log(index)
  let account;
  pool
    .query(`SELECT users.id, users.name, users.phone, users.email, users_bank_accounts.userid, users_bank_accounts.bankaccountid, bank_accounts.bankaccountid, bank_accounts.balance FROM users INNER JOIN users_bank_accounts ON users_bank_accounts.userid = users.id INNER JOIN bank_accounts on users_bank_accounts.bankaccountid = bank_accounts.bankaccountid WHERE users.id = ${index}`)
    .then((results) => {
      account = results.rows[0];
      console.log(account);

      response.render('transferPage', { account });
    })
    .catch((error) => {
      console.log(error.stack);
    });
};

const transferPagePostRequest = (request, response) => {
  console.log(request.body);
  const { payerBankAccountId, amount, payeeBankAccountId } = request.body;

  // How to add a catch statement here?
  // Update the account balance
  const results = Promise.all([
    pool.query(`UPDATE bank_accounts SET balance=balance+${amount} where bankaccountid='${payeeBankAccountId}' `),
    pool.query(`UPDATE bank_accounts SET balance=balance-${amount} where bankaccountid='${payerBankAccountId}' `),
  ]);

  const transactionHistory = request.body;

  transactionHistory.transaction_history = Date.now();

  transactionHistory.transaction_hash = helper.hashingTransaction(payerBankAccountId, transactionHistory.transaction_history);

  const list_value = Object.values(transactionHistory);
  const list_keys = Object.keys(transactionHistory);
  console.log(list_keys[0]);
  console.log(transactionHistory);

  const transactionHistoryDict = {
    payerBankAccountId: { value: list_value[0], label: 'Payer Bank Account ID' },
    amount: { value: list_value[1], label: 'Amount' },
    payeeBankAccountId: { value: list_value[2], label: 'Payee Bank Account ID' },
    transactionHistoryReference: { value: list_value[4], label: 'Transaction Reference ID' },
  };

  // Create a transaction history record
  pool.query('INSERT into transaction_history (payeraccountid, payeeaccountid, amount, transaction_history, transaction_hash) VALUES ($1,$3,$2,$4,$5) RETURNING *', list_value);

  response.render('transactionHistory', { transactionHistoryDict });
};

const logoutRequest = (request, response) => {
  response.clearCookie('sessionID');
  response.clearCookie('isUserLoggedIn');
  response.clearCookie('userId');
  response.redirect('/');
};

app.get('/', homePageRequest);
// Sign up
app.get('/signUp', signUpRequest);
// Login Request
app.get('/login', loginRequest);
app.post('/login', registrationRequest);

app.post('/loggedIn', loggedInRequest);
app.get('/transfer/:index', helper.authMiddleware, transferPageRequest);
app.post('/transfer/transactionhistory', transferPagePostRequest);
app.get('/logout', logoutRequest);

app.listen(3004);
