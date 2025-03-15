const mysql = require('mysql');
const express = require('express');
const session = require('express-session');
const path = require('path');

let psw ;
let user ;
let host ;
let db ;

 user = "u14804_EnR7bTReGn";
 db = "s14804_users";
readline.question('PSW: ', returnVal => {
    psw=returnVal;
    readline.close();
});
readline.question('HOST: ', returnVal => {
    host=returnVal;
    readline.close();
});

const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout
});

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

// http://localhost:3000/
app.get('/login', function(request, response) {
    // Render login template
    let name = request.get("name");
    let secret = request.get("psw");
    if(name!=null&&secret!=null) {
        connection.query('SELECT * FROM logins WHERE name = ? AND password = ?', [name, secret], function(error, results, fields) {
            if (error) throw error;
            if (results.length > 0) {
                response.send("true");
            } else {
                response.send("false");
            }
            response.end();
        });
    } else {
        response.send('no_data');
        response.end();
    }

    response.sendFile(path.join(__dirname + '/login.html'));
});
app.listen(3000);

