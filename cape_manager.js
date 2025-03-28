import moment from "moment/moment";
import mysql from "mysql";
import process from "node:process";
import {NULL} from "mysql/lib/protocol/constants/types";

const capeManager = require('./cape_manager');

const psw = process.env.sql_psw;
const user = process.env.sql_user;
const host = process.env.sql_host ;
const db = process.env.sql_db;
const port = process.env.port;

const connection = mysql.createConnection({
    host     : host,
    user     : user,
    password : psw,
    database : db,
    port: port
});
