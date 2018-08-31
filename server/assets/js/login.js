const auth = Auth();
$(document).ready(function() {
	var googleUser = {};

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
					console.log(data)
					auth.login({
						email: data.email,
						password: $('#inputPassword').val()
					}).then(function(user) {
						if (user) {
							var timer = setTimeout(function() {
								window.location.href = '/user-join';
							}, 1000);
						} else {}
					});
				},
				error: function(request, status, error) {
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