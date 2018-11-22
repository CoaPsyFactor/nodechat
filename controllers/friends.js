exports.init = function (app, db, users) {
  app.post('/api/user/find', function (req, res) {
    if (req.session._ssis) {
      var user = req.body.user || '';

      if (user.length < 3) {
        res
            .status(400)
            .send({message: 'Ukucajte minimum 3 karaktera.'});
        return;
      }

      db.query('SELECT `id`, `username` FROM `users` WHERE UPPER(`username`) LIKE UPPER(?) AND id != ?', ['%' + user + '%', req.session._ssis], function (err, results) {
        if (err) {
          res
              .status(500)
              .send({error: err});

          return;
        }

        var usrs = [], user = users.getUser(req.session._ssis);

        results.forEach(function (result) {
          if (-1 == user.friends.list.indexOf(result.id)) {
            usrs.push({id: result.id, alias: result.username});
          }
        });

        res.send({users: usrs});
      });
    } else {
      res
          .status(403)
          .send({message: 'morate biti ulogovani'});
    }
  });

  var createFriendRelation = function (creator, friend, callback) {
    db.query('INSERT INTO `relations` (`user`,`friend`) VALUES (?,?)', [creator, friend], function (err, result) {
      if (err) {
        handleDBError(res, err);
        return;
      }

      if (result.insertId) {
        if (typeof callback === 'function') {
          callback();
        }
      }
    });
  };

  var acceptFriendRequest = function (req, response, data) {
    var params = [
      data.sender,
      data.user,
      data.user,
      data.sender

    ];

    db.query('SELECT `id` FROM `relations` WHERE (`user` = ? AND `friend` = ?) OR (`user` = ? AND `friend` = ?)', params, function (err, result) {
      params = [
        data.sender,
        data.user
      ];

      if (err) {
        handleDBError(response, err);
        return;
      }

      if (result.length) {
        response.send({message: 'Vec ste prijatelji.', success: false});
        return;
      }

      createFriendRelation(data.sender, data.user, function () {
        users.getUser(
            req.session._ssis,
            function (me) {
              me.friends.addFriend(data.sender);
              users.getUser(data.sender, function (user) {

                if (user.socketsOnline()) {
                  me.emitToSockets('came_online', user.getPublic());
                  user.emitToSockets('came_online', me.getPublic());
                  user.friends.addFriend(me.getPublic().id);
                }
              });

              response.send({message: 'Zahtev je prihvacen.'});
              db.query('DELETE FROM `friend_request` WHERE `id` = ?', req.body.id);
            },
            function () {
              req.session = null;
              response.redirect('/');
            });
      });
    });
  };

  var handleDBError = function (res, err) {
    res
        .status(500)
        .send({error: err});

    return;
  };

  app.post('/api/request/accept', function (req, res) {
    if (req.session._ssis) {
      var id = req.body.id || 0;

      if (!id) {
        res
            .status(400)
            .send({message: 'Pogresan zahtev.'});

        return;
      }

      var param = [
        id,
        req.session._ssis
      ];

      db.query('SELECT * FROM `friend_request` WHERE `id` = ? AND `user` = ?', param, function (err, results) {
        if (err) {
          handleDBError(res, err);
          return;
        }

        if (!results.length) {
          res
              .status(404)
              .send({message: 'Zahtev ne postoji.'});

          return;
        }

        var result = results[0];

        //Request = function (req, response, data, callback) {
        acceptFriendRequest(req, res, result);
      });

    } else {
      res
          .status(403)
          .send({messag: 'Morate biti ulogovani.'});
    }
  });

  app.post('/api/request/send', function (req, res) {
    if (req.session._ssis) {
      var user = req.body.user || '';

      if (user.length < 3) {
        res
            .status(400)
            .send({message: 'Ukucajte minimum 4 karaktera.'});
        return;
      }

      if (user == req.session._ssis) {
        res
            .status(401)
            .send({message: 'Ne mozete sami sebi polati zahtev.'});
        return;
      }

      var sender = users.getUser(req.session._ssis),
          params = [
            sender.getPublic().id,
            user,
            user,
            sender.getPublic().id
          ]
          ;

      db.query('SELECT `id` FROM `relations` WHERE (`user` = ? AND `friend` = ?) OR (`user` = ? AND `friend` = ?)', params, function (err, result) {
        if (err) {
          res
              .status(500)
              .send({error: err});

          return;
        }

        if (result.length) {
          res
              .status(401)
              .send({message: 'Vec ste prijatelji.'});

          return;
        }

        db.query('DELETE FROM `friend_request` WHERE (`user` = ? AND `sender` = ?) OR (`user` = ? AND `sender` = ?)', params);
        db.query('SELECT `id` FROM `users` WHERE `id` = ?', user, function (err, results) {
          if (err) {
            res
                .status(500)
                .send({error: err});

            return;
          }

          if (0 == results.length) {
            res
                .status(404)
                .send({message: 'Korisnik nije pronadjen.'});

            return;
          }

          db.query(
              'INSERT INTO `friend_request` (`user`, `sender`, `sender_alias`) VALUES (?, ?, ?)',
              [user, sender.getPublic().id, sender.getPublic().alias],
              function (err, result) {
                if (err) {
                  res
                      .status(500)
                      .send({error: err});
                }

                if (result.insertId) {
                  users.getUser(user, function (recipient) {
                    recipient.emitToSockets('friend_request', sender.getPublic());
                  });

                  res.send({message: 'Zahtev poslat.'});
                }
              });
        });
      });
    } else {
      res
          .status(403)
          .send({message: 'morate biti ulogovani'});
    }
  });

  app.get('/api/requests/count', function (req, res) {
    if (req.session._ssis) {
      db.query('SELECT `id` FROM `friend_request` WHERE `user` = ?', req.session._ssis, function (err, results) {
        if (err) {
          res.status(500).send({error: err});
          return;
        }

        res.send({count: results.length});
      });
    } else {
      res.status(403).send({message: 'Morate biti ulogovoani.'});
    }
  });


  app.get('/api/requests', function (req, res) {
    if (req.session._ssis) {
      var user = users.getUser(req.session._ssis);
      db.query('SELECT `id`,`sender_alias` FROM `friend_request` WHERE `user` = ?', user.getPublic().id, function (err, results) {
        if (err) {
          res
              .status(500)
              .send({error: err});

          return;
        }

        var requests = [];

        results.forEach(function (result) {
          requests.push({id: result.id, sender: result.sender_alias});
        });

        res.send(requests);
      });
    } else {
      res
          .status(403)
          .send({message: 'Morate biti ulogovoani.'});
    }
  });
};