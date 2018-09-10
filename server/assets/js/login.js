const auth = Auth();
$(document).ready(function() {
	var googleUser = {};
	var googleClientID = "365861189994-btvs30d57molferkqd7kds8u9e5qapi6.apps.googleusercontent.com";
	var facebookClientID = "2176475222638001";
	var linkedinClientID = "81wncf8gzyo3oh";

	var startGoogleLoginProcess = function() {
		gapi.load('auth2', function() {
			auth2 = gapi.auth2.init({
				client_id: googleClientID,
				cookiepolicy: 'single_host_origin'
			});
		});
	};

	$('#gtc-google-login').click(function() {
		auth2.grantOfflineAccess().then(signInCallback);
	});

	$('#modal-gtc-google-login').click(function() {
		auth2.grantOfflineAccess().then(signInCallback);
	});

	$('#footer-modal-gtc-google-login').click(function() {
		auth2.grantOfflineAccess().then(signInCallback);
	});

	function signInCallback(authResult) {
		if (authResult['code']) {
			$("#gtc-google-login").off('click');
			authResult['clientId'] = googleClientID;
			authResult['redirectUri'] = window.location.origin;

			$.ajax({
				type: 'POST',
				url: '/auth/google',
				data: authResult,
				success: function(result) {
					window.location.href = "/";
				},
				error: function(response, status, error) {
					$('#signupLog').append('<p class="text-danger text-500">' + response.responseText + '</p>');
				}
			});
		} else {
			// There was an error.
		}
	}

	startGoogleLoginProcess();

	function facebookLogin() {
		var credentials = {
			client_id: facebookClientID,
			redirect_uri: window.origin + "/api/auth/facebook",
			scope: 'email'
		}
		var facebookWindow = window.open("https://www.facebook.com/v3.1/dialog/oauth?" + serialize(credentials), 'facebookPopup', 'location=0,status=0,width=800,height=400');
	};

	$("#gtc-fb-login").click(function() {
		facebookLogin();
	});

	$("#modal-gtc-fb-login").click(function() {
		facebookLogin();
	});

	$("#footer-modal-gtc-fb-login").click(function() {
		facebookLogin();
	});

	$("#gtcVerficationFbLogin").click(function() {
		facebookLogin();
	});

	function linkedinLogin() {
		var credentials = {
			response_type: 'code',
			client_id: linkedinClientID,
			redirect_uri: window.origin + "/api/auth/linkedin",
			scope: 'r_basicprofile,r_emailaddress'
		}
		var linkedinWindow = window.open("https://www.linkedin.com/oauth/v2/authorization?" + serialize(credentials), 'LinkedinPopup', 'location=0,status=0,width=800,height=400');
	};

	$('#gtc-linkedin-login').click(function(e) {
		linkedinLogin();
	});

	$('#modal-gtc-linkedin-login').click(function(e) {
		linkedinLogin();
	});

	$('#footer-modal-gtc-linkedin-login').click(function(e) {
		linkedinLogin();
	});

	$('#gtcVerficationLinkedLogin').click(function(e) {
		linkedinLogin();
	});

	function twitterLogin() {
		var oAuthURL = "/api/auth/request-twitter";
		var twitterWindow = window.open(oAuthURL, 'TwitterOAuthPopup', 'location=0,status=0,width=800,height=400');
	};

	$("#gtc-twitter-login").click(function() {
		twitterLogin();
	});

	$("#modal-gtc-twitter-login").click(function() {
		twitterLogin();
	});

	$("#footer-modal-gtc-twitter-login").click(function() {
		twitterLogin();
	});

	$("#gtcVerficationTwitterLogin").click(function() {
		twitterLogin();
	});

	window.onPopupClose = function(data) {
		if (data == 'successful') {
			window.location.href = "/";
		} else {
			console.log('failed');
		}
	};

	var serialize = function(obj) {
		var str = [];
		for (var p in obj)
			if (obj.hasOwnProperty(p)) {
				str.push(encodeURIComponent(p) + "=" + encodeURIComponent(obj[p]));
			}
		return str.join("&");
	}
});

$(document).ready(function() {
	$('#btnSignup').prop('disabled', true);
	$('#loadingSpinnersignUp').hide();

	$('#inputEmail, #inputPassword').keyup(function() {

		if ($('#inputEmail').val() != '' && $('#inputPassword').val() != '' && $('#inputTerms').is(":checked")) {
			$('#btnSignup').prop('disabled', false);
		} else {
			$('#btnSignup').prop('disabled', true);
		}
	});
	$('#inputTerms').change(function() {
		if (this.checked == true) {
			if ($('#inputEmail').val() != '' && $('#inputPassword').val() != '' && $('#inputTerms').is(":checked")) {
				$('#btnSignup').prop('disabled', false);
			} else {
				$('#btnSignup').prop('disabled', true);
			}
		} else {
			$('#btnSignup').prop('disabled', true);
		}

	});

	$('#signUpForm').validate({
		rules: {
			first_name: {
				required: true
			},
			password: {
				required: true,
				minlength: 8
			}
		},
		submitHandler: function(form) {
			$('#loadingSpinnersignUp').show();
			var newUser = {};
			newUser.email = $('#inputEmail').val();
			newUser.first_name = $('#inputFirstname').val();
			newUser.password = $('#inputPassword').val();
			newUser.provider = 1;

			$.ajax({
				type: 'POST',
				url: '/api/users',
				data: newUser,
				success: function(data, text) {
					$('#loadingSpinnersignUp').hide();
					auth.login({
						email: data.email,
						password: $('#inputPassword').val()
					}).then(function(user) {
						$('#loadingSpinnersignUp').hide();
						if (user) {
							var timer = setTimeout(function() {
								window.location.href = '/user-join';
							}, 1000);
						} else {}
					});
				},
				error: function(request, status, error) {
					$('#loadingSpinnersignUp').hide();
					$('#signUpErrorLog').text(request.responseText);
					setTimeout(function() {
						$('#signUpErrorLog').hide();

					}, 3000);
				}
			});
		}
	});
});

$(document).ready(function() {
	$('#modelBtnSignup').prop('disabled', true);

	$('#modelInputEmail, #modelInputPassword').keyup(function() {

		if ($('#modelInputEmail').val() != '' && $('#modelInputPassword').val() != '' && $('#modelInputTerms').is(":checked")) {
			$('#modelBtnSignup').prop('disabled', false);
		} else {
			$('#modelBtnSignup').prop('disabled', true);
		}
	});
	$('#modelInputTerms').change(function() {
		if (this.checked == true) {
			if ($('#modelInputEmail').val() != '' && $('#modelInputPassword').val() != '' && $('#modelInputTerms').is(":checked")) {
				$('#modelBtnSignup').prop('disabled', false);
			} else {
				$('#modelBtnSignup').prop('disabled', true);
			}
		} else {
			$('#modelBtnSignup').prop('disabled', true);
		}

	});

	$('#modelSignUpForm').validate({
		rules: {
			first_name: {
				required: true
			},
			password: {
				required: true,
				minlength: 8
			}
		},
		submitHandler: function(form) {
			var newUser = {};
			newUser.email = $('#modelInputEmail').val();
			newUser.first_name = $('#modelInputFirstname').val();
			newUser.password = $('#modelInputPassword').val();
			newUser.provider = 1;

			$.ajax({
				type: 'POST',
				url: '/api/users',
				data: newUser,
				success: function(data, text) {
					console.log(data)
					auth.login({
						email: data.email,
						password: $('#modelInputPassword').val()
					}).then(function(user) {
						if (user) {
							var timer = setTimeout(function() {
								window.location.href = '/user-join';
							}, 1000);
						} else {}
					});
				},
				error: function(request, status, error) {
					$('#modelSignUpErrorLog').text(request.responseText);

					setTimeout(function() {
						$('#modelSignUpErrorLog').hide();

					}, 3000);
				}
			});
		}
	});
});

$(document).ready(function() {
	$('#footerModelBtnSignup').prop('disabled', true);

	$('#footerModelInputEmail, #footerModelInputPassword').keyup(function() {

		if ($('#footerModelInputEmail').val() != '' && $('#footerModelInputPassword').val() != '' && $('#footerModelInputTerms').is(":checked")) {
			$('#footerModelBtnSignup').prop('disabled', false);
		} else {
			$('#footerModelBtnSignup').prop('disabled', true);
		}
	});
	$('#footerModelInputTerms').change(function() {
		if (this.checked == true) {
			if ($('#footerModelInputEmail').val() != '' && $('#footerModelInputPassword').val() != '' && $('#footerModelInputTerms').is(":checked")) {
				$('#footerModelBtnSignup').prop('disabled', false);
			} else {
				$('#footerModelBtnSignup').prop('disabled', true);
			}
		} else {
			$('#footerModelBtnSignup').prop('disabled', true);
		}

	});

	$('#footerModelSignUpForm').validate({
		rules: {
			first_name: {
				required: true
			},
			password: {
				required: true,
				minlength: 8
			}
		},
		submitHandler: function(form) {
			var newUser = {};
			newUser.email = $('#footerModelInputEmail').val();
			newUser.first_name = $('#footerModelInputFirstname').val();
			newUser.password = $('#footerModelInputPassword').val();
			newUser.provider = 1;

			$.ajax({
				type: 'POST',
				url: '/api/users',
				data: newUser,
				success: function(data, text) {
					console.log(data)
					auth.login({
						email: data.email,
						password: $('#footerModelInputPassword').val()
					}).then(function(user) {
						if (user) {
							var timer = setTimeout(function() {
								window.location.href = '/user-join';
							}, 1000);
						} else {}
					});
				},
				error: function(request, status, error) {
					$('#footerModelSignUpErrorLog').text(request.responseText);

					setTimeout(function() {
						$('#footerModelSignUpErrorLog').hide();

					}, 3000);
				}
			});
		}
	});
});

$(document).ready(function() {
	$('#searchSubmit').prop('disabled', true);
	$('#searchForm').on('change paste', ':input', function(e) {
		$('#searchSubmit').prop('disabled', false);
	});

	$("#searchForm").submit(function(e) {
		e.preventDefault();
		let formInput = $("#searchForm :input").filter(function(index, element) {
			return $(element).val() != '';
		}).serialize();
		window.location.href = location.pathname + '/search?' + formInput;
	});
});