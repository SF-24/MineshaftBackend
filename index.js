import * as process from "node:process";
import moment from 'moment';
import 'moment/min/locales';

const capeManager = require('./cape_manager');

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

        if (varName!=null&& varSecret!=null&& typeof varName=="string"&&typeof varSecret=="string") {
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
                        expiry: moment(expiryTime.format('YYYY/MM/DD HH:mm:ss')).format("YYYY-MM-DD HH:mm:ss"),
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

        if (varUser!=null&& typeof varUser=="string") {
            connection.query('SELECT * FROM capes WHERE id = ?', [varUser], function(error, results, fields) {
                // If there is an issue with the query, output the error
                if (error) throw error;
                // If the account exists
                if (results.length > 0) {
                    let cape=(results[0]).current_cape;
                    if(cape==null || cape==="") cape="empty";
                    return res.json({
                        current_cape: cape
                    });
                } else {
                    return res.json({
                        current_cape: 'empty'
                    });
                }
            });
        } else {
            return res.json({
                current_cape: 'empty'
            });
        }
    } else if (address.includes('/set_cape')) {

        let returnVal = setCapeLogic(req,address);
        return res.json({
            success: returnVal
        });

    }else if (address.includes('/owned_items')) {
        const search_params = address.searchParams;

//        let varId = req.query.id;
        let varSession = req.query.session;
        let varSessionExpiry = req.query.expiry;//moment(req.query.expiry, 'YYYY/MM/DD HH:mm:ss');

        let expiry = moment(varSessionExpiry, 'YYYY/MM/DD HH:mm:ss');
        if(expiry.isBefore(moment().add(0, 'hours'))) {
            return res.json({
                capes: '',
                expired:true
            });
        }


        if (varSession!=null&&varSessionExpiry!=null&& typeof varSession=="string"&&typeof varSessionExpiry=="string") {

            //let varExpiryFormatted =moment(varSessionExpiry.format('YYYY/MM/DD HH:mm:ss')).format("YYYY-MM-DD HH:mm:ss");

            connection.query('SELECT * FROM sessions WHERE session_id = ? AND expiry_date = ? ', [varSession, varSessionExpiry], function(error, results, fields) {
                // If there is an issue with the query, output the error

                let varId=(results[0]).user_id;
                if (error) throw error;
                // If the account exists
                if (results.length > 0) {

                    connection.query('SELECT * FROM minecraft_data WHERE id = ?', [varId], function(error, results, fields) {
                        if(results.length>0) {
                            let cape=(results[0]).owned_items;
                            if(cape==null) cape="";
                            return res.json({
                                owned_items: cape
                            });
                        } else {
                            return res.json({
                                capes: ''
                            });
                        }
                    })
                } else {
                    return res.json({
                        capes: ''
                    });
                }
            });
        } else {
            return res.json({
                capes: ''
            });
        }
    } else {
        const {name = 'World'} = req.query
        return res.json({
            message: `Hello ${name}!`,
        });
    }
}


// set cape

function setCapeLogic(req,address) {
    let varCape = req.query.cape;
    let varSession = req.query.session;
    let varSessionExpiry = req.query.expiry;

    if (varSession != null && varSessionExpiry != null && typeof varSession == "string" && typeof varSessionExpiry == "string") {
        let expiry = moment(varSessionExpiry, 'YYYY/MM/DD HH:mm:ss');
        if(expiry.isBefore(moment().add(0, 'hours'))) {
            return res.json({
                success:false,
                expired:true
            });
        }

        connection.query('SELECT * FROM sessions WHERE session_id = ? AND expiry_date = ? ', [varSession, varSessionExpiry], function (error, results, fields) {
            // If there is an issue with the query, output the error

            let varId = (results[0]).user_id;
            if (error) throw error;
            // If the account exists
            if (results.length > 0) {
                if(capeManager.hasCape(varId, varCape)) {
                    capeManager.setCape(varId, varCape);
                    return true;
                } else {
                    return false;
                }
            }
        });

    }
    return false;
}