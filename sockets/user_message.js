module.exports = function (socket, user_data, io, db, users) {
  socket.on('message_send', function (data) {
    if (
        false == user_data.id || typeof data.recipient === 'undefined' ||
        false == data.recipient || false == data.message || data.message.length === 0
    ) {
      return;
    }

    users.getUser(user_data.id, function(user) {
    	user.friends.sendMessage(data.recipient, data.message);
    });
  });
};
