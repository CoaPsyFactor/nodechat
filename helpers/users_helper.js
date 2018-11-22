var Users = function () {
  var users = {}, loadedUsers = {}, self = this, crypto = require('crypto'), CryptoJS = require("crypto-js");

  this.getUser = function (userId, callback, error) {
    if (typeof users[userId] === 'undefined') {
      if (typeof error === 'function') {
        error(userId);
      }

      return {};
    }

    if (typeof loadedUsers[userId] === 'undefined') {
      loadedUsers[userId] = {
        info: users[userId],
        friends: {
          list: [],
          addFriend: function(id) {
            loadedUsers[userId].friends.list.push(id);

            return id;
          },
          notifyFriends: function (message, data) {
            loadedUsers[userId].friends.list.forEach(function (id) {
              var user = loadedUsers[id];

              if (typeof user === 'undefined') {
                return;
              }

              user.emitToSockets(message, data);
            });
          },
          notifyFriend: function (id, message, data) {
            if (-1 == loadedUsers[userId].friends.getOnlineFriends('id').indexOf(id)) {
              return;
            }

            var user = loadedUsers[id];

            if (typeof user.getPublic === 'undefined') {
              return;
            }

            user.emitToSockets(message, data);
          },
          sendMessage: function (recipient, message) {
            if (-1 == loadedUsers[userId].friends.getOnlineFriends('id').indexOf(recipient)) {
              return;
            }

            var user = loadedUsers[recipient], sender = loadedUsers[userId], messageData, cache = [];

            if (typeof user.getPublic === 'undefined' || typeof sender.getPublic === 'undefined' || !user.socketsOnline()) {
              sender.emitToSockets('went_off', {id: user.getPublic().id});
              return;
            }

            messageData = {
              sender: {
                id: sender.getPublic().id,
                alias: sender.getPublic().alias
              },
              recipient: {
                id: user.getPublic().id,
                alias: user.getPublic().alias
              },
              message: message,
              date: new Date().toUTCString()
            };

            sender.emitToSockets('message_received', messageData);

            message = CryptoJS.AES.decrypt(JSON.parse(message), sender.getKey());
            message = CryptoJS.AES.encrypt(message, user.getKey());

            messageData.message = JSON.stringify(
                message,
                function(key, value) {
                  if (typeof value === 'object' && value !== null) {
                    if (cache.indexOf(value) !== -1) {
                      return;
                    }
                  
                    cache.push(value);
                  }
                  
                  return value;
                });
              
            cache = null;

            user.emitToSockets('message_received', messageData);            
          },
          getOnlineFriends: function (attr) {
            var onlineFriends = [];

            loadedUsers[userId].friends.list.forEach(function (id) {
              var user = loadedUsers[id];

              if (typeof user === 'undefined' || user.socketsOnline() == 0) {
                return;
              }

              if (attr) {
                if (user.getPublic().hasOwnProperty(attr)) {
                  onlineFriends.push(user.getPublic()[attr]);
                }
              } else {
                onlineFriends.push(user.getPublic());
              }
            });

            return onlineFriends;
          }
        },
        getPublic: function () {
          if (typeof users[userId] === 'undefined') {
            return {};
          }

          return users[userId].public;
        },
        addSocket: function (socket) {
          if (typeof users[userId] === 'undefined') {
            return;
          }

          users[userId].sockets[socket.id] = socket;
        },
        removeSocket: function (socket) {
          if (typeof users[userId] === 'undefined') {
            return;
          }

          delete users[userId].sockets[socket.id];
        },
        socketsOnline: function () {
          if (typeof users[userId] === 'undefined') {
            return 0;
          }

          try {
            return Object.keys(users[userId].sockets).length;
          } catch (e) {
            return 0;
          }
        },
        getSockets: function () {
          if (typeof users[userId] === 'undefined') {
            return;
          }

          var sockets = {};

          if (users[userId].sockets) {
            sockets = users[userId].sockets;
          }

          return sockets;
        },
        getSocketsAsArray: function () {
          var sockets = [];

          if (typeof users[userId] === 'undefined') {
            return;
          }

          for (var socketId in users[userId].sockets) {
            if (false == users[userId].sockets.hasOwnProperty(socketId)) {
              continue;
            }

            sockets.push(users[userId].sockets[socketId]);
          }

          return sockets;
        },
        emitToSockets: function (message, data) {
          if (typeof users[userId] === 'undefined') {
            return;
          }

          var sockets = users[userId].sockets;

          for (var socketId in sockets) {
            if (false == sockets.hasOwnProperty(socketId)) {
              continue;
            }

            sockets[socketId].emit(message, data);
          }
        },
        removeUser: function () {
          if (typeof users[userId] === 'undefined') {
            return;
          }

          try {
            delete loadedUsers[userId];
          } catch (e) {
          }

          try {
            delete users[userId];
          } catch (e) {

          }
        },
        getKey: function() {
          if (typeof users[userId] === 'undefined') {
            return '';
          }

          return users[userId].key;
        }
      };
    }

    if (typeof callback === 'function') {
      callback(loadedUsers[userId]);
    }

    return loadedUsers[userId];
  };

  this.addUser = function (id, alias, secret, ip, avatar) {
    if (typeof users[id] !== 'undefined') {
      return self;
    }

    var key = crypto.createHash('sha256').update('!s@' + id + '^u@$f*' + alias).digest('hex');

    users[id] = {
      id: id,
      alias: alias,
      sockets: {},
      ip: ip,
      secret: secret,
      key: key,
      public: {
        id: id,
        alias: alias,
        avatar: avatar,
        messages: {
          unread: 0,
          all: []
        }
      }
    };

    return self;
  };

  this.removeUser = function (userId) {
    try {
      delete users[userId];
    } catch (e) {}

    try {
      delete loadedUsers[userId];
    } catch (e) {}
  };

  this.getAllUsers = function () {
    var onlineUsers = [];

    for (var i in users) {
      if (false == users.hasOwnProperty(i)) {
        continue;
      }

      onlineUsers.push(users[i].public);
    }

    return onlineUsers;
  };

  return this;
};

global.users = new Users();