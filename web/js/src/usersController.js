var usersController = (function ($, socket, message) {
  var myData = {id: null, alias: null}, loadedUsers = {};

  socket.setUsersController(this);
  socket.setMessageController(message);

  this.insertUser = function (user) {
    if (typeof user.id === 'undefined' || typeof user.alias === 'undefined') {
      throw new Error('Both user.id and user.alias must be defined');
    }

    if (typeof loadedUsers[user.id] !== 'undefined' || myData.id == user.id) {
      return;
    }

    message.addUser(user);
    user.remove = function (callback) {
      if (typeof callback === 'function') {
        callback({id: user.id, alias: user.alias});
      }

      if (typeof user.element.remove === 'function') {
        user.element.remove();
      }

      delete loadedUsers[user.id];
    };

    loadedUsers[user.id] = user;
  };

  this.getUser = function (id) {
    if (typeof loadedUsers[id] === 'undefined') {
      return {};
    }

    return loadedUsers[id];
  };

  this.setMe = function (user) {
    myData = {
      id: user.id,
      alias: user.alias
    };

    messageController.setUserData(user);
    $.cookie('_sii', user.id);
  };

  this.getId = function () {
    return myData.id;
  };

  this.getAlias = function () {
    return myData.alias;
  };

  return this;
})(jQuery, userSocketEvents, messageController);
