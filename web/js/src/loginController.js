var _logging = false;

$(document).on('submit', 'form.login', function (e) {
  e.preventDefault();

  if (_logging) {
    return;
  }

  _logging = true;

  $.ajax({
    url: '/login',
    type: 'post',
    dataType: 'json',
    data: $(this).serialize(),
    success: function (msg) {
      $('.server-error').hide();

      if (msg.logged) {
        window.location = '/';
      } else {
        _logging = false;
        $('.wrong-credentials').show();
      }
    },
    error: function () {
      _logging = false;
      $('.server-error').show();
      $('.wrong-credentials').hide();
    }
  });
});