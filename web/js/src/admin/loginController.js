var adminLoginController = (function($) {
	var loggingIn = false;

	var setNotEmpty = function(selector) {
		$(selector).attr('placeholder', 'Mora biti popunjeno.')

		return null;
	};

	$(document).on('submit', 'form.login', function(e) {
		e.preventDefault();

		if (loggingIn) {
			return;
		}

		loggingIn = true;

		var username = $('#alias').val() || setNotEmpty('#alias'), password = $('#password').val() || setNotEmpty('#password'), data;

		if (username === null || password === null) {
			return;
		}

		data = {
			user: username,
			password: password
		};
		
		$.ajax({
			url: '/api/admin/login',
			type: 'post',
			data: data,
			success: function(response) {
				window.location = '/admin';
				loggingIn = false;
			},
			error: function(response) {
				loggingIn = false;
				$('div.server-warning').hide()
				$('div.server-error').hide();

				if (response.status === 500) {
					$('div.server-error').show();
				} else {					
					$('div.wrong-credentials').html(response.responseJSON.message).show()
				}

				setTimeout(function() {
					$('.alert').fadeOut('fast');
				}, 2000);
			}
		})
	})
	return this;
})(jQuery);