import * as process from "node:process";
import moment from 'moment';
import 'moment/min/locales';

import "./cape_manager";
import {JSON, NULL} from "mysql/lib/protocol/constants/types";

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

// app.use(express.json());
// app.use(express.urlencoded({ extended: true }));
// app.use(express.static(path.join(__dirname, 'static')));

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
                    let skin=(results[0]).current_skin;
                    let is_slim=(results[0]).is_slim_skin;
                    if(cape==null || cape==="") cape="empty";
                    if(skin==null || skin==="") cape="steve";
                    return res.json({
                        current_cape: cape,
                        current_skin: skin,
                        is_slim: (is_slim===1)
                    });
                } else {
                    return res.json({
                        current_cape: "empty",
                        current_skin: "steve",
                        is_slim: false
                    });
                }
            });
        } else {
            return res.json({
                current_cape: "empty",
                current_skin: "steve",
                is_slim: false
            });
        }

    } else if (address.includes('/set_cape')) {

        let varCape = req.query.cape;
        let varSession = req.query.session;
        let varSessionExpiry = req.query.expiry;

        const search_params = address.searchParams;

//        let varId = req.query.id;
//         let varSession = req.query.session;
//         let varSessionExpiry = req.query.expiry;//moment(req.query.expiry, 'YYYY/MM/DD HH:mm:ss');

        let expiry = moment(varSessionExpiry, 'YYYY/MM/DD HH:mm:ss');
        if(expiry.isBefore(moment().add(0, 'hours'))) {
            return res.json({
                expired:true,
                success:"session_expired"
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
                            let uniqueId=((results[0]).owned_items);
                            let cape=((results[0]).owned_items);
                            if(cape==null) cape="";
                            for(let i in cape) {
                                for(let j in i) {
                                    setCape(varId, varCape)
                                    return res.json({
                                        success: true
                                    });
                                }
                            }
                            return res.json({
                                success: "cape_not_owned"
                            });

                        } else {
                            return res.json({
                                success: "no_capes_found"
                            });
                        }
                    })

                } else {
                    return res.json({
                        success: "invalid_session"
                    });
                }
            });
        } else {
            return res.json({
                success: "invalid_request"
            });
        }

        //
        //
        // let returnVal = setCapeLogic(varCape, varSession, varSessionExpiry);
        // return res.json({
        //     success: returnVal
        // });

    }else if (address.includes('/owned_items')) {
        const search_params = address.searchParams;

//        let varId = req.query.id;
        let varSession = req.query.session;
        let varSessionExpiry = req.query.expiry;//moment(req.query.expiry, 'YYYY/MM/DD HH:mm:ss');

        let expiry = moment(varSessionExpiry, 'YYYY/MM/DD HH:mm:ss');
        if(expiry.isBefore(moment().add(0, 'hours'))) {
            return res.json({
                owned_items: '',
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
                                owned_items: ''
                            });
                        }
                    })

                } else {
                    return res.json({
                        owned_items: ''
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


function setCapeLogic(varCape, varSession ,varSessionExpiry) {


    if (varSession != null && varSessionExpiry != null) {// && typeof varSession === "string" && typeof varSessionExpiry === "string") {
        let expiry = moment(varSessionExpiry, 'YYYY/MM/DD HH:mm:ss');
        if(expiry.isBefore(moment().add(0, 'hours'))) {
            return res.json({
                success:false,
                expired:true
            });
        }

        connection.query('SELECT * FROM sessions WHERE session_id = ? AND expiry_date = ?', [varSession, varSessionExpiry], function (error, results, fields) {
            // If there is an issue with the query, output the error

            let varId = (results[0]).user_id;
            if (error) throw error;
            // If the account exists
            if (results.length > 0) {
                connection.query('SELECT * FROM minecraft_data WHERE id = ?', [varId], function (error, results, fields) {
                    if (results.length > 0) {
                        let cape = (results[0]).owned_items.capes;
                        if (cape == null) cape = "";
                        if (varCape==="empty" || cape.includes(varCape)) {
                            setCape(varId, varCape);
                            return true;
                        } else {
                            return 6;
                        }
                    }
                    return 5;
                })
                return 4;
            }
            return 2;
        });

    }
    return 1;
}


function setCape(varId, varCapeName) {
    connection.query('SELECT * FROM minecraft_data WHERE id = ?', [varId], function (error, results, fields) {
        if (results.length > 0) {
            let varUniqueId = (results[0]).uuid;
            let varUserSkin = (results[0]).current_skin;
            let varIsSlim = (results[0]).is_slim_skin;
            if (varUniqueId == null) return false;
            if(varIsSlim==null) varIsSlim=0;
            // TODO: check cape
            try{connection.query('DELETE FROM capes WHERE id=?', [varUniqueId]);}catch (e) {}
            connection.query('INSERT INTO capes (id, current_cape, current_skin, is_slim_skin) VALUES (?, ?, ?, ?)', [varUniqueId, varCapeName, varUserSkin, varIsSlim], function (error, results, fields) {
            });
        }
        return false;
    })
}


function hasCape(varId, varCapeName)
{
    if(varCapeName.equal("empty")) return true;

    connection.query('SELECT * FROM minecraft_data WHERE id = ?', [varId], function(error, results, fields) {
        if (results.length > 0) {
            let cape=(results[0]).owned_items;
            if(cape==null) throw NULL;
            let array = Json.parse(cape);
            for (let i in array.capes) {
                console.log("cape name: " + i);
                if (varCapeName.equals(i)) return true;
            }
        }
        return false;
    })
    return false;
}


function getCapes(varId)
{
    connection.query('SELECT * FROM minecraft_data WHERE id = ?', [varId], function(error, results, fields) {
        if(results.length>0) {
            let cape=(results[0]).owned_items;
            if(cape==null) cape="";
            return cape;
        }
    })
    return null;
}
