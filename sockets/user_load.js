module.exports = function (socket, user_data, io, db, users) {
  var crypto = require('crypto');

  var populateUser = function (socket, id, alias, user) {
    var crypto = require('crypto');
    var key = crypto.createHash('sha256').update('!s@' + id + '^u@$f*' + alias).digest('hex');

    user_data.id = id;
    user_data.alias = alias;
    user_data.key = key;
    user_data.messages = {
      unread: 0,
      all: []
    };

    user.addSocket(socket);
    socket.emit('logged_in', user_data);
  };

  var loadFriends = function (socket) {
    if (typeof user_data.id === 'undefined') {
      return;
    }

    var query = 'SELECT * FROM `relations` WHERE `user` = ? OR `friend` = ?';

    db.query(query, [user_data.id, user_data.id], function (error, results) {
      if (error) {
        socket.emit('fetch_friends_failed', {});
      } else if (results.length) {
        var friends = [];
        results.forEach(function (result) {
          var friend = result.user;

          if (friend == user_data.id) {
            friend = result.friend;
          }

          friends.push(friend);
        });

        var usr = users.getUser(user_data.id, function(user) {
          user.friends.list = friends;          
          user.friends.notifyFriends('came_online', user.getPublic());
          socket.emit('online_users', user.friends.getOnlineFriends());
        });
      }
    });
  };

  socket.on('login_via_id', function (data) {
    var user = users.getUser(data.id), ip = socket.handshake.address.split(':').pop();

    if (typeof user.info === 'undefined') {
      db.query(
          'SELECT * FROM `users` WHERE `id` = ?',
          [data.id],
          function (error, results, fields) {
            if (error || 0 == results.length) {
              socket.emit('id_login_fail', {});
            } else if (results.length) {
              users.addUser(results[0].id, results[0].username, results[0].password, ip);
              populateUser(socket, results[0].id, results[0].username, users.getUser(results[0].id));
              loadFriends(socket);
            }
          }
      );

      return;
    }

    populateUser(socket, user.info.id, user.info.alias, user);
    loadFriends(socket);
  });

  socket.on('disconnect', function (s) {
    var user = users.getUser(user_data.id);

    try {
      user.removeSocket(socket);
      
      if (0 == user.socketsOnline()) {
        user.friends.notifyFriends('went_off', {id: user.getPublic().id});
        users.removeUser(user_data.id);
      }
    } catch (e) {
    }
  });
};