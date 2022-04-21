// const { pool } = require('./initClient');

// import { pool } from './initClient.js';

function createFunction() {
  console.log('hi');

  // const results = pool.query('SELECT * from authenticate');
  // console.log(results);
}

const createBtn = document.getElementById('createaccount');
createBtn.addEventListener('click', createFunction);
