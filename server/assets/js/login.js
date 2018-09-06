const auth = Auth();
$(document).ready(function() {
	var googleUser = {};

	/*var startGoogleLoginProcess = function() {
		gapi.load('auth2', function() {
			auth2 = gapi.auth2.init({
				client_id: '334369412681-p9f585ii666p18mdq2tg06gta717ree9.apps.googleusercontent.com',
				cookiepolicy: 'single_host_origin'
			});
		});
	};

	$('#gtc-google-login').click(function() {
		auth2.grantOfflineAccess().then(signInCallback);
	});

	function signInCallback(authResult) {
		if (authResult['code']) {
			$("#gtc-google-login").off('click');
			authResult['clientId'] = "334369412681-p9f585ii666p18mdq2tg06gta717ree9.apps.googleusercontent.com";
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
	}*/

	var startGoogleLoginProcess = function() {
		gapi.load('auth2', function() {
			// Retrieve the singleton for the GoogleAuth library and set up the client.
			auth2 = gapi.auth2.init({
				client_id: '334369412681-p9f585ii666p18mdq2tg06gta717ree9.apps.googleusercontent.com',
				cookiepolicy: 'single_host_origin'
			});
			googleAttachSignin(document.getElementById('gtc-google-login'));
		});
	};

	var startGoogleLoginProcessModal = function() {
		gapi.load('auth2', function() {
			// Retrieve the singleton for the GoogleAuth library and set up the client.
			auth2 = gapi.auth2.init({
				client_id: '334369412681-p9f585ii666p18mdq2tg06gta717ree9.apps.googleusercontent.com',
				cookiepolicy: 'single_host_origin'
			});
			googleAttachSignin(document.getElementById('modal-gtc-google-login'));
		});
	};

	var startGoogleLoginProcessFooter = function() {
		gapi.load('auth2', function() {
			// Retrieve the singleton for the GoogleAuth library and set up the client.
			auth2 = gapi.auth2.init({
				client_id: '334369412681-p9f585ii666p18mdq2tg06gta717ree9.apps.googleusercontent.com',
				cookiepolicy: 'single_host_origin'
			});
			googleAttachSignin(document.getElementById('footer-modal-gtc-google-login'));
		});
	};


	function googleAttachSignin(element) {
		auth2.attachClickHandler(element, {},
			function(googleUser) {
				var newGoogleUser = {};
				var profileId = googleUser.getBasicProfile().getId();
				var id_token = googleUser.getAuthResponse().id_token;
				var profile = decodeJwt(id_token);
				newGoogleUser.first_name = profile.given_name;
				if (profile.family_name) {
					newGoogleUser.last_name = profile.family_name;
				}
				newGoogleUser.email = profile.email;
				newGoogleUser.role = 3;
				newGoogleUser.google_id = profileId;
				$.ajax({
					type: "POST",
					url: "/auth/google",
					data: newGoogleUser,
					success: function(result) {
						window.location.href = "/";
					}
				});
			},
			function(error) {
				console.log(JSON.stringify(error, undefined, 2))
			});
	};

	startGoogleLoginProcess();
	startGoogleLoginProcessModal();
	startGoogleLoginProcessFooter();

	function decodeJwt(token) {
		var base64Url = token.split('.')[1];
		var base64 = base64Url.replace('-', '+').replace('_', '/');
		return JSON.parse(window.atob(base64));
	};

	function googleSignOut() {
		auth2.signOut().then(function() {
			console.log('User signed out.');
		});
	};

	function getProfileData() {
		IN.API.Profile("me")
			.fields("id", "email-address", "first-name", "last-name", "formatted-name", "headline", "location", "public-profile-url", "summary", "num-connections", "picture-url")
			.result(function(data) {
				var profileData = data.values[0];
				var linkedInUser = {};
				linkedInUser.first_name = profileData.firstName;
				if (profileData.lastName) {
					linkedInUser.last_name = profileData.lastName;
				}
				linkedInUser.email = profileData.emailAddress;
				linkedInUser.role = 3;
				linkedInUser.linkedin_id = profileData.id;
				$.ajax({
					type: "POST",
					url: "/auth/linkedin",
					data: linkedInUser,
					success: function(result) {
						localStorage.setItem("access_token", result.access_token);
						window.location.href = "/";
					}
				});
			});
	};

	var serialize = function(obj) {
		var str = [];
		for (var p in obj)
			if (obj.hasOwnProperty(p)) {
				str.push(encodeURIComponent(p) + "=" + encodeURIComponent(obj[p]));
			}
		return str.join("&");
	}

	/*$('#gtc-linkedin-login').click(function(e) {
		var credentials = {
			response_type: 'code',
			client_id: '81epswkuklqmde',
			redirect_uri: 'http://localhost:9000/api/auth/linkedin',
			state: '987654321',
			scope: 'r_basicprofile'
		}
		var linkedINWindow = window.open("https://www.linkedin.com/oauth/v2/authorization?" + serialize(credentials), 'TwitterOAuthPopup', 'location=0,status=0,width=800,height=auto');
	});*/

	$('#gtc-linkedin-login').click(function(e) {
		if (!IN.User.isAuthorized()) {
			IN.User.authorize(function() {
				getProfileData();
			});
		} else {
			console.log("Already Login In with LinkedIn");
		}
	});

	$('#modal-gtc-linkedin-login').click(function(e) {
		if (!IN.User.isAuthorized()) {
			IN.User.authorize(function() {
				getProfileData();
			});
		} else {
			console.log("Already Login In with LinkedIn");
		}
	});

	$('#footer-modal-gtc-linkedin-login').click(function(e) {
		if (!IN.User.isAuthorized()) {
			IN.User.authorize(function() {
				getProfileData();
			});
		} else {
			console.log("Already Login In with LinkedIn");
		}
	});

	$('#gtcVerficationLinkedLogin').click(function(e) {
		if (!IN.User.isAuthorized()) {
			IN.User.authorize(function() {
				getProfileData();
			});
		} else {
			console.log("Already Login In with LinkedIn");
		}
	});
	function linkedInSignIn() {
		if (!IN.User.isAuthorized()) {
			IN.User.authorize(function() {
				getProfileData();
			});
		} else {
			console.log("Already Login In with LinkedIn");
		}
	};

	function linkedinLogout() {
		IN.User.logout(function() {
			console.log("Linkedin User Logout successful");
		});
	};

	window.fbAsyncInit = function() {
		FB.init({
			appId: '393416147793353',
			cookie: true,
			xfbml: true,
			version: 'v3.0'
		});

		FB.getLoginStatus(function(loginStatus) {
			console.log(loginStatus);
		});
	};

	(function(d, s, id) {
		var js, fjs = d.getElementsByTagName(s)[0];
		if (d.getElementById(id)) return;
		js = d.createElement(s);
		js.id = id;
		js.src = "https://connect.facebook.net/en_US/sdk.js";
		fjs.parentNode.insertBefore(js, fjs);
	}(document, 'script', 'facebook-jssdk'));

	function fb_login() {
		FB.login(function(response) {
			if (response.authResponse) {
				FB.api('/me?fields=id,name,email', function(profileInfo) {
					var fbUser = {};
					fbUser.first_name = profileInfo.name;
					if (profileInfo.lastName) {
						fbUser.last_name = profileInfo.lastName;
					}
					fbUser.email = profileInfo.email;
					fbUser.role = 3;
					fbUser.fb_id = profileInfo.id;
					$.ajax({
						type: "POST",
						url: "/auth/fb",
						data: fbUser,
						success: function(result) {
							localStorage.setItem("access_token", result.access_token);
							window.location.href = "/";
						}
					});
				});
			} else {
				console.log('User cancelled login or did not fully authorize.');

			}
		}, {
			scope: 'public_profile,email'
		});
	};

	$("#gtc-fb-login").click(function() {
		fb_login();
	});

	$("#modal-gtc-fb-login").click(function() {
		fb_login();
	});

	$("#footer-modal-gtc-fb-login").click(function() {
		fb_login();
	});

	$("#gtcVerficationFbLogin").click(function() {
		fb_login();
	});

	var twitterWin;
	var checkConnect;

	$("#gtc-twitter-login").click(function() {
		var oAuthURL = "/api/auth/twitter";
		twitterWin = window.open(oAuthURL, 'TwitterOAuthPopup', 'location=0,status=0,width=800,height=400');
	});

	$("#modal-gtc-twitter-login").click(function() {
		var oAuthURL = "/api/auth/twitter"; 
		twitterWin = window.open(oAuthURL, 'TwitterOAuthPopup', 'location=0,status=0,width=800,height=400');
	});

	$("#footer-modal-gtc-twitter-login").click(function() {
		var oAuthURL = "/api/auth/twitter";
		twitterWin = window.open(oAuthURL, 'TwitterOAuthPopup', 'location=0,status=0,width=800,height=400');
	});

	$("#gtcVerficationTwitterLogin").click(function() {
		var oAuthURL = "/api/auth/twitter";
		twitterWin = window.open(oAuthURL, 'TwitterOAuthPopup', 'location=0,status=0,width=800,height=400');
	});

	checkConnect = setInterval(function() {
		if (!twitterWin || !twitterWin.closed) return;
		clearInterval(checkConnect);
	}, 100);

	window.onTwitterAuthClose = function(data) {
		const profileData = JSON.parse(decodeURIComponent(data));
		var twitterUser = {};
		twitterUser.first_name = profileData.name;
		if (profileData.lastName) {
			twitterUser.last_name = profileData.lastName;
		}
		twitterUser.email = profileData.email;
		twitterUser.role = 3;
		twitterUser.twitter_id = profileData.id;
		$.ajax({
			type: "POST",
			url: "/auth/twitter",
			data: twitterUser,
			success: function(result) {
				localStorage.setItem("access_token", result.access_token);
				window.location.href = "/";
			}
		});
	};
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