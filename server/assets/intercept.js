(function(XHR) {
    "use strict";
    const auth = Auth();
    $(document).ready(function() {
        $.ajaxSetup({
            beforeSend: function(xhr) {
                if (localStorage.getItem("access_token")) {
                    xhr.setRequestHeader('Authorization', 'Bearer ' + localStorage.getItem("access_token"));
                }
            },
            statusCode: {
                401: function() {
                    auth.refreshToken().then(function(data) {
                        localStorage.setItem("access_token", data.access_token);
                    });
                }
            }
        });
    });
})(XMLHttpRequest);