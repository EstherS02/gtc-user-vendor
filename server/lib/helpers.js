'use strict';
import Handlebars from 'handlebars';
const moment = require('moment');


Handlebars.registerHelper('starCount', function(rating) {

    var rating = Math.trunc(rating);

    var colored = "";
    var colorless = "";
    var tag1 = "<i class=" + '"fa fa-star"' + " aria-hidden=" + '"true"' + " style=" + '"color: #CDBE29;"></i>';
    var tag2 = "<i class=" + '"fa fa-star"' + " aria-hidden=" + '"true"' + " style=" + '"color: #b9bab1;"></i>';

    for (var i = 0; i <= rating - 1; i++) {
        colored = tag1 + colored;
    }
    for (var i = 1; i <= 5 - rating; i++) {
        colorless = tag2 + colorless;
    }
    return new Handlebars.SafeString(colored + colorless);

});

Handlebars.registerHelper('convertUpperCase', function(msg) {
    return msg.toUpperCase();
});

Handlebars.registerHelper('Titlecase', function(str) {
    return str.replace(/\w\S*/g, function(txt) {
        return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
    });;
});


Handlebars.registerHelper('DisplayJSON', function(context, options) {
    if (!context)
        return 'null';

    return JSON.stringify(context);
});

Handlebars.registerHelper('toURL', function(text, options) {
    if (!text)
        return 'null';

    return text.split(' ').join('-');
});

Handlebars.registerHelper("prettifyDate", function(timestamp) {
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
        "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
    ];
    var d = new Date();
    var curr_date = d.getDate();
    var curr_month = monthNames[d.getMonth()]
    var curr_year = d.getFullYear();
    return curr_month + ' ' + curr_date + ', ' + curr_year;
});

Handlebars.registerHelper('ifCond', function(v1, operator, v2, options) {

    switch (operator) {
        case '!=':
            return (v1 != v2) ? options.fn(this) : options.inverse(this);
        case '==':
            return (v1 == v2) ? options.fn(this) : options.inverse(this);
        case '===':
            return (v1 === v2) ? options.fn(this) : options.inverse(this);
        case '<':
            return (v1 < v2) ? options.fn(this) : options.inverse(this);
        case '<=':
            return (v1 <= v2) ? options.fn(this) : options.inverse(this);
        case '>':
            return (v1 > v2) ? options.fn(this) : options.inverse(this);
        case '>=':
            return (v1 >= v2) ? options.fn(this) : options.inverse(this);
        case '&&':
            return (v1 && v2) ? options.fn(this) : options.inverse(this);
        case '||':
            return (v1 || v2) ? options.fn(this) : options.inverse(this);
        default:
            return options.inverse(this);
    }
});
Handlebars.registerHelper('formatTime', function(date, format) {
    var mmnt = moment(date);
    return mmnt.format(format);
});
Handlebars.registerHelper('progressBar', function(value, total) {
    var rating = (value / total) * 60;
    return rating;
});