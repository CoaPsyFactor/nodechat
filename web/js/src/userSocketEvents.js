var userSocketEvents = (function (socket, $) {
  var usersController = {}, messageController = {};

  $(document).ready(function () {
    var id = $.cookie('_sii');

    if (id) {
      socket.emit('login_via_id', {id: id});
    }
  });

  this.setUsersController = function (usrCtrl) {
    usersController = usrCtrl;
  };

  this.setMessageController = function (msgCtrl) {
    messageController = msgCtrl;
  };

  this.login = function (data) {
    socket.emit('initialize', data);
  };

  socket.on('id_login_fail', function (data) {
    $.removeCookie('_sii');
    document.location = '/';
  });

  socket.on('logged_in', function (data) {

    usersController.setMe(data);

    if (data) {
      $('div.init').remove();
      $('.logged').removeClass('hide');
      socket.emit('get_online_users', {});
    }
  });

  socket.on('logged_in_failed', function (data) {
    $('.wrong-credentials').removeClass('hide');
  });

  socket.on('login_error', function (data) {
    $('.server-error').removeClass('hide');
  });

  socket.on('online_users', function (users) {
    users.forEach(function (user) {
      console.log(user);
      usersController.insertUser(user);
    });
  });

  socket.on('came_online', function (data) {
    if (data.id === $.cookie('_sii')) {
      return;
    }

    console.log('online', data);

    usersController.insertUser(data);
  });

  socket.on('message_not_send', function (data) {
    console.log('not send', data);
  });

  socket.on('message_received', function (data) {
    var user;

    if (data.sender.id == usersController.getId()) {
      user = usersController.getUser(data.recipient.id);
    } else {
      user = usersController.getUser(data.sender.id)
    }

    messageController.messagePush(user, data);
  });

  socket.on('went_off', function (user) {
    var $user = usersController.getUser(user.id);

    if (typeof $user.remove === 'function') {
      $user.remove();
    }

    messageController.wentOffline(user);
  });

  return this;
})(socket, jQuery);
