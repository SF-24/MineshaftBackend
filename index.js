import * as process from "node:process";

const mysql = require('mysql');
const express = require('express');
const session = require('express-session');
const path = require('path');

const psw = process.env.sql_psw;
const user = process.env.sql_user;
const host = process.env.sql_host ;
const db = process.env.sql_db;

const connection = mysql.createConnection({
    host     : host,
    user     : user,
    password : psw,
    database : db
});

const app = express();

app.use(session({
    secret: 'secret',
    resave: true,
    saveUninitialized: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'static')));

export default function handler(req,res) {
    var address = req.url;
    if (address === '/login') {
        let name = request.get("name");
        let secret = request.get("psw");
        if(name!=null&&secret!=null) {
            return res.json({
                success: 'true',
            });
        } else {
            return res.json({
                success: 'false',
            });
        }
    } else {
        const {name = 'World'} = req.query
        return res.json({
            message: `Hello ${name}}!`,
        });
    }
}