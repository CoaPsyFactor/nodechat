exports.init = function (app, db, users) {
  var fs = require('fs'), gm = require('gm');

  app.get('/logout', function (req, res) {
    req.session.destroy();

    res.cookie('_sii', null);

    res.redirect('/');
  });

  app.post('/upload/avatar', function (req, res) {
    var avatar = req.files.avatar;

    if (req.session._ssis) {      
      fs.unlink('web/upload/' + req.session.avatar, function () {});

      db.query('UPDATE `users` SET `avatar` = ? WHERE `id` = ?', [avatar.name, req.session._ssis], function(err, results) {
        req.session.avatar = avatar.name;
        res.cookie('avatar', avatar.name);

        res.redirect('/');
      });
    } else {
      fs.unlink(avatar.path, function() {
        res.status(403).send({message: 'Morate biti ulogovani.'});
      });
    }
  });

  app.post('/login', function (req, res) {
    if (typeof req.session !== 'object') {
      req.session = {};
    }

    if (req.session._ssis) {
      res.cookie('_sii', req.session._ssis);

      res.send({
        logged: true
      });
    } else {

      var getHash = function (password) {
        var crypto = require('crypto');
        return crypto.createHash('sha256').update(password).digest('hex');
      };

      var user = req.body.alias, pass = getHash(req.body.secret);

      db.query(
          'SELECT * FROM `users` WHERE `username` = ? AND `password` = ?',
          [user, pass],
          function (error, results, fields) {
            if (error) {
              res.status(500);
              res.send({error: true});
            } else {
              if (results.length) {
                var ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress.split(':').pop();
                users.addUser(results[0].id, results[0].username, results[0].password, ip, results[0].avatar);

                res.cookie('_sii', results[0].id);
                res.cookie('avatar', results[0].avatar);

                req.session._ssis = results[0].id;
                req.session.avatar = results[0].avatar;

                res.send({
                  logged: true
                });
              } else {
                req.session = null;

                res.cookie('_sii', null);
                res.cookie('avatar', null);
                res.send({
                  logged: false
                });
              }
            }
          }
      );
    }
  });
};