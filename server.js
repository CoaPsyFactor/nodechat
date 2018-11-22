var config = require('./config.json');
var express = require('express');
var app = express();
var fs = require('fs');
var server = require('http').Server(app);
var io = require('socket.io')(server);
var session = require('express-session');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var multer = require('multer');

require('./helpers/users_helper.js');

var mysql = require('mysql');
var db = mysql.createConnection({
  host: config.mysql.host,
  user: config.mysql.user,
  password: config.mysql.password,
  database: config.mysql.database
});

app.use(cookieParser());
app.use(session({
  secret: 'j38emd0bro!jo5b01j3',
  saveUninitialized: true,
  resave: false
}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: true
}));

app.use(multer({dest: './web/upload'}));
app.use(express.static('web'));

db.connect();
server.listen(config.socket.port);

io.on('connection', function (socket) {
  var user_data = {}, socketCtrl = {}, files = fs.readdirSync(__dirname + '/sockets');

  files.forEach(function (file) {
    if (file.substr(-3) !== '.js') {
      return;
    }

    socketCtrl = require(__dirname + '/sockets/' + file);
    socketCtrl(socket, user_data, io, db, global.users);
  });
});

fs.readdir(__dirname + '/controllers/', function (error, files) {
  var controller;

  if (error) {
    throw new Error(error);
  }

  files.forEach(function (file) {
    if (file.substr(-3) === '.js') {
      controller = require(__dirname + '/controllers/' + file);
      controller.init(app, db, global.users);
    }
  });
});

console.log('Socket listening on port ' + config.socket.port);

app.get('/', function (req, res) {
  var html = fs.readFileSync(__dirname + '/web/view/index.html', {encoding: 'utf-8'}), content;
  html = html.replace();

  if (typeof req.session === 'undefined') {
    req.session = {
      userId: false
    };
  }

  if (typeof req.session._ssis === 'undefined' || false == req.session._ssis) {
    content = fs.readFileSync(__dirname + '/web/view/partial/login.html', {encoding: 'utf-8'});
  } else {

    content = fs.readFileSync(__dirname + '/web/view/partial/chat.html', {encoding: 'utf-8'});
    content = content.replace('{{ socket_address }}', 'http://' + config.server.address + ':' + config.socket.port);

    if (Object.keys(users.getUser(req.session._ssis)).length === 0) {
      db.query('SELECT * FROM `users` WHERE `id` = ?', req.session._ssis, function(err, result) {
        if (err) {
          res.status(500).send({error: err});
          return;
        }

        if (!result.length) {
          req.session = null;

          res.cookie('_sii', null);
          res.redirect('/');
          return;
        }

        var _user = result[0], ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress.split(':').pop();;
        users.addUser(_user.id, _user.username, _user.password, ip, _user.avatar);
        res.cookie('_sii', req.session._ssis);
        res.cookie('avatar', _user.avatar);
        
        res.send(html.replace('{{ content }}', content));
      })
      
      return;
    }

    res.cookie('_sii', req.session._ssis);
  }

  res.send(html.replace('{{ content }}', content));
});

app.listen(config.server.port, function () {
  console.log('HTTP Server listening on port 8080');
});