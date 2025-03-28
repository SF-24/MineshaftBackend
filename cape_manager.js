import moment from "moment/moment";
import mysql from "mysql";
import process from "node:process";

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


module.exports = {

    setCape: function (varId, varCapeName) {
        connection.query('SELECT * FROM minecraft_data WHERE id = ?', [varId], function (error, results, fields) {
            if (results.length > 0) {
                let varUniqueId = (results[0]).uuid;
                if (varUniqueId == null) return false;
                // TODO: check cape
                connection.query('DELETE FROM capes WHERE id=?', [varUniqueId]);
                connection.query('INSERT INTO capes (id, current_cape) VALUES (?, ?)', [varUniqueId, varCapeName], function (error, results, fields) {
                });
            }
            return false;
        })
    },


    hasCape: function (varId, varCapeName)
    {

        connection.query('SELECT * FROM minecraft_data WHERE id = ?', [varId], function(error, results, fields) {
            if (results.length > 0) {
                let cape=(results[0]).owned_items;
                if(cape==null) cape="";
                let array = res.json({cape});
                for (let i in array) {
                    console.log("cape name: " + i);
                    if (i===varCapeName) return true;
                }
            }
            return false;
        })
        return false;
    }
};