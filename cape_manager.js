import moment from "moment/moment";
import mysql from "mysql";
import process from "node:process";

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
        connection.query('SELECT * FROM minecraft_data WHERE id = ?', [varId], function (error, results, fields) {
            if (results.length > 0) {
                let cape = (results[0]).owned_items.capes;
                if (cape == null) return false;
                // TODO: check cape. If the cape json contains the selected cape.
                if (cape.includes(varCapeName)) return true;
            }
            return false;
        })
        return false;
    },

    setCapeLogic: function (req,address) {
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
                    if(hasCape(varId, varCape)) {
                        setCape(varId, varCape);
                        return true;
                    } else {
                        return false;
                    }
                }
            });

        }
        return false;
    }
};