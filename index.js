import * as process from "node:process";
import moment from 'moment';
import 'moment/min/locales';

const mysql = require('mysql');
const express = require('express');
const session = require('express-session');
const path = require('path');
const uuid = require('uuid');

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
    if (address.includes('/login')) {
        const search_params = address.searchParams;

        let varName = req.query.name;
        let varSecret = req.query.psw;

        if (varName!=null&& varSecret!=null) {
            connection.query('SELECT * FROM logins WHERE name = ? AND password = ?', [varName, varSecret], function(error, results, fields) {
                // If there is an issue with the query, output the error
                if (error) throw error;
                // If the account exists
                if (results.length > 0) {

                    let identifier=(results[0]).id;
                    let sessionVar = uuid.v4();
                    let expiryTime=moment().add(6, 'hours');
                    connection.query('DELETE FROM sessions WHERE user_id=?', [identifier]);
                    connection.query('INSERT INTO sessions (user_id, session_id, expiry_date) VALUES (?, ?, ?)',[identifier, sessionVar, moment(expiryTime.format('YYYY/MM/DD HH:mm:ss')).format("YYYY-MM-DD HH:mm:ss")], function(error, results, fields) {
                    });
                    return res.json({
                        success: 'true',
                        session_id: sessionVar,
                        expiry: expiryTime,
                    });
                } else {
                    return res.json({
                        success: 'false',
                    });
                }
            });
        } else {
            return res.json({
                success: 'false',
            });
        }
    } else if (address.includes('/cape')) {
        const search_params = address.searchParams;

        let varUser = req.query.id;

        if (varName!=null&& varSecret!=null) {
            connection.query('SELECT * FROM capes WHERE id = ?', [varUser], function(error, results, fields) {
                // If there is an issue with the query, output the error
                if (error) throw error;
                // If the account exists
                if (results.length > 0) {
                    let cape=(results[0]).currentCape;
                    if(cape==null || cape==="") cape="empty";
                    return res.json({
                        currentCape: cape
                    });
                } else {
                    return res.json({
                        currentCape: 'empty'
                    });
                }
            });
        } else {
            return res.json({
                success: 'false',
            });
        }
    } else {
        const {name = 'World'} = req.query
        return res.json({
            message: `Hello ${name}!`,
        });
    }
}