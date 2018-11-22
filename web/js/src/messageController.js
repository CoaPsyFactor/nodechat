var messageController = (function ($, socket) {
  var myData = {}, loadedUsers = {}, current;

  $(document).on('click', 'button.send', function (e) {
    e.preventDefault();

    sendMessage();
  });

  $(document).on('keypress', 'input.message', function (e) {
    if (e.keyCode === 13) {
      e.preventDefault();
      sendMessage();
    }
  });

  var wentOffline = function (user) {
    if (typeof user.id === 'undefined') {
      return;
    }

    if (user.id === current) {
      clearMessages();
      current = false;
      $('.no-messages').show();
    }
  };

  var sendMessage = function () {
    var $input = $('input.message'), data = {}, cache = [];

    if ($input.val().length == 0) {
      return;
    }

    data.recipient = current;
    data.message = $input.val();

    if (data.message) {
      data.message = JSON.stringify(
        CryptoJS.AES.encrypt(data.message, myData.key),
        function(key, value) {
          if (typeof value === 'object' && value !== null) {
            if (cache.indexOf(value) !== -1) {
              return;
            }
          
            cache.push(value);
          }
          
          return value;
        });

      cache = [];
    }

    $input.val('');
    console.log(data);
    socket.emit('message_send', data);
  };

  var createUserElement = function (user) {
    user.element = $('<li />', {
      "class": "list-group-item"
    });

    user.element.html(' ' + user.alias);
    
    user.badge = $('<span />', {
      'class': 'badge hide'
    }).appendTo(user.element);

    $('<img />', {
      width: 32,
      src: 'upload/' + user.avatar
    }).prependTo(user.element);

    user.element.appendTo('ul.friends');
  };

  var bindUIEvents = function (user) {
    user.element.on('click', function () {
      $('.selected').removeClass('selected');
      user.element.addClass('selected');
      user.messages.unread = 0;

      if (current) {
        loadedUsers[current].lastMessage = $('input.message').val();
      }

      if (user.lastMessage.length) {
        $('input.message').val(user.lastMessage)
      } else {
        $('input.message').val('');
      }

      current = user.id;
      user.badge.addClass('hide');

      clearMessages();

      if (0 === user.messages.all.length) {
        $('.no-messages').show();
      } else {
        var $scrollEl;
        user.messages.all.forEach(function (message) {
          $el = printMessage(message);
          if (!message.new) {
            $scrollEl = $el;
          }
        });

        $('.message-area').scrollTop($scrollEl.position().top - $('.message-item:visible:first').position().top);
      }
    });
  };

  var clearMessages = function () {
    $('ul.messages li.message-item').remove();
  };

  var printMessage = function (data) {
    var date = new Date(data.date),
        $el = $('<li />', {
          'class': 'message-item list-group-item'
        });

    if (data.sender.id != myData.id) {
      $el.addClass('sender');
    } else {
      $el.addClass('not-sender');
    }

    var messageObj = JSON.parse(data.message),
        message = CryptoJS.AES.decrypt(messageObj, myData.key);

    $el.html('<div class="row message-info"><span class="badge">' + data.sender.alias + '</span>' + message.toString(CryptoJS.enc.Utf8).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;') + '</div><div class="row message-time"><span>' + date + '</span></div>');
    $el.appendTo('.messages');

    $('.no-messages').hide();

    return $el;
  };

  var messagePush = function (user, data) {
    if (typeof user.messages === 'undefined') {
      return;
    }

    if (current == user.id) {
      printMessage(data);
      $('.message-area').scrollTop($('.message-area .messages').height());
    } else if (data.sender.id != myData.id) {
      if (!user.messages.unread) {
        data.new = true;
      }
      user.messages.unread++;
      user.badge.html(user.messages.unread);
      user.badge.removeClass('hide');
    }

    user.messages.all.push(data);
  };

  var setUserData = function (data) {
    if (typeof data.id === 'undefined' || typeof data.alias === 'undefined') {
      throw new Error('Error loading user data, missing alias or id');
    }

    myData.id = data.id;
    myData.alias = data.alias;
    myData.key = data.key;

    console.log(myData);
  };

  var getId = function () {
    return myData.id;
  };

  var getAlias = function () {
    return myData.alias;
  };

  var msgCtrl = {
    messagePush: messagePush,
    addUser: function (user) {
      if (typeof user.element === 'undefined' || 0 === $(user.element).length) {
        user.lastMessage = '';
        createUserElement(user);
        bindUIEvents(user);
        loadedUsers[user.id] = user;
      }
    },
    wentOffline: wentOffline,
    getId: getId,
    getAlias: getAlias,
    setUserData: setUserData
  };

  return msgCtrl;
})(jQuery, socket);
