-- ALTER TABLE users
-- ADD COLUMN IF NOT EXISTS hashed_password text;


-- \l
-- \dt
-- psql -d regina -f init_tables.sql
-- // sudo service postgresql start
-- //Create database <<database_name>>

CREATE TABLE if not EXISTS users (
  id SERIAL PRIMARY KEY,
  name TEXT,
  phone varchar,
  email varchar,
  date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE if not EXISTS authenticate (
  id SERIAL PRIMARY KEY,
  userId integer,
  phone varchar,
  password varchar,
  cookie varchar,
  lastLoggedIn DATE
);

ALTER TABLE authenticate ADD COLUMN IF NOT EXISTS time varchar;
ALTER TABLE authenticate ALTER COLUMN lastloggedin type varchar;

CREATE TABLE if not EXISTS bank_accounts (
  id SERIAL PRIMARY KEY,
  bankAccountId varchar,
  balance DOUBLE PRECISION
);


CREATE TABLE if not EXISTS users_bank_accounts (
  id SERIAL PRIMARY KEY,
  userId integer,
  bankAccountId varchar
);


CREATE TABLE if not EXISTS transaction_history (
  id SERIAL PRIMARY KEY,
  payerAccountId varchar,
  payeeAccountId varchar,
  amount DOUBLE PRECISION,
  transaction_history varchar,
  transaction_hash varchar
);

CREATE TABLE if not EXISTS users_favourite(
  id SERIAL PRIMARY KEY,
  userId integer,
  payeeName varchar,
  payeeAccountId varchar,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- CREATE TABLE if not EXISTS dummy (
--   id SERIAL PRIMARY KEY,
--   name text
-- );

-- INSERT INTO dummy (name) VALUES ('lol');
