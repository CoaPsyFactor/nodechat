var uiController = (function ($, socket) {
  var newRequests = 0;
  socket.on('friend_request', function (user) {
    newRequests++;
    $('.requests span.badge').html(newRequests);
  });

  $(document).on('ready', function () {
    var avatar = $.cookie('avatar');

    $.ajax({
      url: '/api/requests/count',
      success: function (data) {
        newRequests = data.count;
        $('.requests span.badge').html(newRequests);
      }
    });

    if (avatar.length) {
      $('<img />', {
        height: 48,
        src: 'upload/' + avatar
      }).appendTo('.dd-profile');

      $('.dd-profile').css({
        padding: 0,
        border: '2px solid silver'
      }).find('i').remove();
    }
  });

  $(document).on('mouseup', '.close-modal', function () {
    $('div').modal('hide');
  });

  $(document).on('click', 'a.add-contact', function (e) {
    e.preventDefault();

    $('.add-user-list').modal('show');
  });

  $(document).on('change', '.avatar-upload-field', function () {
      if ($(this).val().length) {
        $(this).parent().submit();
      }
  });

  $(document).on('click', 'a.avatar-upload', function (e) {
    e.preventDefault();

    $('.upload-avatar').modal('show');
  });

  $(document).on('keyup', 'input.search', function (e) {
    var user = $(this).val();

    if (user.length < 3) {
      return true;
    }

    $.ajax({
      url: '/api/user/find',
      type: 'post',
      data: {user: user},
      success: function (data) {
        if (typeof data.users === 'undefined') {
          return;
        }

        $('.request-user-list li').remove();

        data.users.forEach(function (user) {

          var $li = $('<li />', {
            'class': 'list-group-item'
          }).html(user.alias).appendTo('.request-user-list');

          var $accept = $('<i />', {
            'class': 'accept glyphicon glyphicon-ok-sign'
          }).appendTo($li);

          $accept.on('click', function (e) {
            $.ajax({
              url: '/api/request/send',
              type: 'post',
              data: {user: user.id},
              success: function (msg) {
                $li.addClass('request-ok').html(msg.message);

                setTimeout(function() {
                  $li.fadeOut('medium');
                }, 500);
              }
            })
          })
        })
      }
    });
  });

  $(document).on('click', 'a.requests', function (e) {
    e.preventDefault();

    $.ajax({
      url: '/api/requests',
      success: function (requests) {
        if (!requests.length) {
          return;
        }

        $('.requests-list li').remove();

        requests.forEach(function (request) {
          var $li = $('<li />', {
            'class': 'list-group-item'
          }).html(request.sender).appendTo('.requests-list');

          var $decline = $('<i />', {
            'class': 'decline glyphicon glyphicon-remove-sign'
          }).appendTo($li);

          var $accept = $('<i />', {
            'class': 'accept glyphicon glyphicon-ok-sign'
          }).appendTo($li);

          $accept.on('click', function (e) {
            e.preventDefault();

            $.ajax({
              url: '/api/request/accept',
              type: 'post',
              data: request,
              success: function () {
                $li.remove();
                newRequests = $('.requests-list li').length;
                if (!newRequests) {
                  $('div.requests').modal('hide');
                }

                $('a.requests span.badge').html(newRequests);
              }
            });
          });
        });

        $('div.requests').modal('show');
      },
      error: function () {
        alert('Doslo je do greske.');
      }
    });
  });
})(jQuery, socket);