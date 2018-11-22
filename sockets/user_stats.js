module.exports = function (socket, user_data, io, db, users) {
  socket.on('get_online_users', function (data) {
    if (false == user_data.id) {
      return;
    }

    if (false == user_data.friends instanceof Array) {
      return;
    }

    var onlineFriends = [];

    user_data.friends.forEach(function (id) {
      var user = users.getUser(id);

      if (typeof user.getPublic !== 'function') {
        return;
      }

      onlineFriends.push(user.getPublic());
    });

    socket.emit('online_users', onlineFriends);
  });
};
