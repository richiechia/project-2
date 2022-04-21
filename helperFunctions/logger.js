import { pool } from './initClient.js';
// Middleware logger
function logger(request, response, next) {
  console.log(request.originalUrl);
  // const phone = '98457330';
  // pool.query(`SELECT id from users WHERE phone = '${phone}'`).then((result) => {
  //   console.log(result.rows[0]);
  // });

  next();
}

export default {
  logger,
};
