'use strict';
import Handlebars from 'handlebars';

Handlebars.registerHelper('starCount', function (rating) {

    var rating = Math.trunc(rating);
    
    var colored = "";
    var colorless = "";
    var tag1 = "<i class=" + '"fa fa-star"' + " aria-hidden=" + '"true"' + " style=" + '"color: #CDBE29;"></i>';
    var tag2 = "<i class=" + '"fa fa-star"' + " aria-hidden=" + '"true"' + " style=" + '"color: #000000;"></i>';

    for (var i = 0; i <= rating - 1; i++) {
        colored = tag1 + colored;
    }
    for (var i = 1; i <= 5 - rating; i++) {
        colorless = tag2 + colorless;
    }
    return new Handlebars.SafeString(colored + colorless);

});

Handlebars.registerHelper('convertUpperCase', function (msg) {
    return msg.toUpperCase();
});

Handlebars.registerHelper('Titlecase', function (str) {
    return str.replace(/\w\S*/g, function(txt){
        return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
    });;
});


Handlebars.registerHelper('DisplayJSON', function(context, options) {
    if(!context)
        return 'null';

    return JSON.stringify(context);
});

Handlebars.registerHelper('toURL', function(text, options) {
    if(!text)
        return 'null';

    return text.split(' ').join('-');
});

Handlebars.registerHelper('equal', function(lvalue, rvalue, options) {
    if (arguments.length < 3)
        throw new Error("Handlebars Helper equal needs 2 parameters");
    var operators = {
        '==':       function(l,r) { return l == r; },
        '===':      function(l,r) { return l === r; },
        '!=':       function(l,r) { return l != r; },
        '<':        function(l,r) { return l < r; },
        '>':        function(l,r) { return l > r; },
        '<=':       function(l,r) { return l <= r; },
        '>=':       function(l,r) { return l >= r; },
        'typeof':   function(l,r) { return typeof l == r; }
    }
    var operator = options.hash.operator;
    var result = operators[operator](lvalue,rvalue);

    if( result ) {
        return options.fn(this);
    } else {
        return options.inverse(this);
    }
});









