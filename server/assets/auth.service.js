(function(window, undefined) {

	var Auth = function() {
		if (!(this instanceof Auth)) {
			return new Auth();
		}

		var fn = this;
		var currentUser = {};

		fn.login = function(loginCredentials) {
			return new Promise((resolve, reject) => {
				$.ajax({
					type: 'POST',
					url: '/api/auth/login',
					data: loginCredentials,
					success: function(data, text) {
						localStorage.setItem("access_token", data.access_token);
						localStorage.setItem("expires_in", data.expires_in);
						localStorage.setItem("token_type", data.token_type);
						fn.getCurrentUser().then(function(data) {
							localStorage.setItem("email", data.email);
							resolve(data);
						});
					},
					error: function(request, status, error) {
						reject(request);
					}
				});
			});
		}

		fn.getCurrentUser = function() {
			return new Promise((resolve, reject) => {
				$.ajax({
					type: 'GET',
					url: '/api/users/me',
					success: function(data, text) {
						resolve(data);
					},
					error: function(request, status, error) {
						reject(request);
					}
				});
			});
		}

		fn.isLoggedIn = function() {
			fn.getCurrentUser().then(function(data) {
				if (data) {
					$('#userAuthentication').text("Welcome back, " + data.first_name);
					$('#loginBanner').hide();
				} else {
					$('#loginBanner').show();
				}
			});
		}

		fn.refreshToken = function() {
			return new Promise((resolve, reject) => {
				var refreshTokenCredentials = {};
				refreshTokenCredentials.email = localStorage.getItem("email");
				$.ajax({
					type: 'POST',
					url: '/api/auth/refresh-token',
					data: refreshTokenCredentials,
					success: function(data, text) {
						resolve(data);
					},
					error: function(request, status, error) {
						reject(request);
					}
				});
			});
		}

		fn.alertService = function(statusCode, responseText) {
			$("#vendorAlert .gtc-container").empty();
			if (statusCode == 200 || statusCode == 201) {
				$("#vendorAlert").addClass("vendor-alert msg-success");
				$("#vendorAlert .gtc-container").append("<span>" + responseText + "</span>");
				$("#vendorAlert").focus();
			} else if (statusCode == 400 || statusCode == 500 || statusCode == 404) {
				$("#vendorAlert").addClass("vendor-alert msg-danger");
				$("#vendorAlert .gtc-container").append("<span>" + responseText + "</span>");
				$("#vendorAlert").focus();
			}
			setTimeout(function() {
				$("#vendorAlert .gtc-container").empty();
				$("#vendorAlert").removeClass("vendor-alert msg-success");
			}, 10000);
		}
	}

	if (typeof module === "object" && module && typeof module.exports === "object") {
		module.exports = Auth;
	} else {
		window.Auth = Auth;

		if (typeof define === "function" && define.amd) {
			define("auth", [], function() {
				return Auth;
			});
		}
	}
})(window);