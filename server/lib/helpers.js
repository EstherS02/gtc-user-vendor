'use strict';
import Handlebars from 'handlebars';
const moment = require('moment');
const _ = require('lodash');
const numeral = require('numeral');

Handlebars.registerHelper('starCount', function(rating, color) {

    var rating = Math.ceil(rating);

    var colored = "";
    var colorless = "",
        tag1, tag2;
    /*if (color) {
        tag1 = "<i class=" + '"fa fa-star"' + " aria-hidden=" + '"true"' + " style=" + '"color: ' + color + '"></i>';
        tag2 = "<i class=" + '"fa fa-star"' + " aria-hidden=" + '"true"' + " style=" + '"color: #b9bab1;"></i>';
    } else {
        tag1 = "<i class=" + '"fa fa-star"' + " aria-hidden=" + '"true"' + " style=" + '"color: #CDBE29;"></i>';
        tag2 = "<i class=" + '"fa fa-star"' + " aria-hidden=" + '"true"' + " style=" + '"color: #b9bab1;"></i>';
    }*/

    tag1 = "<i class=" + '"fa fa-star"' + " aria-hidden=" + '"true"' + " style=" + '"color: #CDBE29;"></i>';
    tag2 = "<i class=" + '"fa fa-star"' + " aria-hidden=" + '"true"' + " style=" + '"color: #b9bab1;"></i>';

    for (var i = 0; i <= rating - 1; i++) {
        colored = tag1 + colored;
    }
    for (var i = 1; i <= 7 - rating; i++) {
        colorless = tag2 + colorless;
    }
    return new Handlebars.SafeString(colored + colorless);
});

Handlebars.registerHelper('convertUpperCase', function(msg) {
    return msg.toUpperCase();
});

Handlebars.registerHelper('Titlecase', function(str) {
    if (str) {
        return str.replace(/\w\S*/g, function(txt) {
            return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
        });
    } else {
        return '';
    }

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
    var rating = 0;
    if (total != 0) {
        rating = (value / total) * 100;
    }
    return rating;
});

Handlebars.registerHelper('SUMFloat', function(v1, v2, options) {
    return parseFloat(v1) + parseFloat(v2);
});

Handlebars.registerHelper('quantityPrice', function(quantity, price, options) {
    return parseInt(quantity) * parseFloat(price);
});

Handlebars.registerHelper('cartPageClass', function(marketPlace, classType, options) {
    var displayClassLeft = "";
    var displayClassRight = "";
    var displayLabel = "";

    if (marketPlace.code === 'PWM') {
        displayClassLeft = 'shop_wholesale_items';
        displayClassRight = 'yourorder_wholesalesum_head';
        displayLabel = 'Wholesale';
    } else if (marketPlace.code === 'PM') {
        displayClassLeft = 'shop_shop_items';
        displayClassRight = 'yourorder_shopsum_head';
        displayLabel = 'Shop';
    } else if (marketPlace.code === 'SM') {
        displayClassLeft = 'shop_service_items';
        displayClassRight = 'yourorder_servicesum_head';
        displayLabel = 'Service';
    } else if (marketPlace.code === 'LM') {
        displayClassLeft = 'shop_subscription_items';
        displayClassRight = 'yourorder_subscriptionsum_head'
        displayLabel = 'Subscription';
    }

    if (classType === 'CART-LEFT')
        return displayClassLeft;
    else if (classType === 'CART-RIGHT')
        return displayClassRight;
    else if (classType === 'LABEL')
        return displayLabel;
    else
        return '';

});

Handlebars.registerHelper('DiffFloat', function(v1, v2, options) {
    return parseFloat(v1) - parseFloat(v2);
});

Handlebars.registerHelper('select', function(selected, options) {
    return options.fn(this).replace(
        new RegExp(' value=\"' + selected + '\"'),
        '$& selected="selected"');
});

Handlebars.registerHelper("setChecked", function(value, currentValue) {
    if (value == currentValue) {
        return "checked";
    } else {
        return "";
    }
});

Handlebars.registerHelper("days", function(value) {
    var days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    return days[value];
});

Handlebars.registerHelper('optionsSelected', function(context, test) {
    var ret = '';
    for (var i = 0, len = context.length; i < len; i++) {
        var option = '<option value="' + context[i].id + '"';
        if (test.indexOf(context[i].id) >= 0) {
            option += ' selected="selected"';
        }
        option += '>' + context[i].product_name + '</option>';
        ret += option;
    }
    return new Handlebars.SafeString(ret);
});

Handlebars.registerHelper('optionsSelectedCategory', function(context, test) {
    var ret = '';
    for (var i = 0, len = context.length; i < len; i++) {
        var option = '<option value="' + context[i].id + '"';
        if (test.indexOf(context[i].id) >= 0) { // you may also use some  test.some(context[i].id)
            option += ' selected="selected"';
        }
        option += '>' + context[i].name + '</option>';
        ret += option;
    }
    return new Handlebars.SafeString(ret);
});

Handlebars.registerHelper('each_upto', function(ary, max, id, options) {
    if (!ary || ary.length == 0)
        return options.inverse(this);
    var result = [];
    for (var i = 0; result.length < max && i < ary.length; ++i)
        if (ary[i].category_id == id) {
            result.push(options.fn(ary[i]));
        }
    return result.join('');
});

Handlebars.registerHelper('each_limit', function(ary, max, options) {
    if (!ary || ary.length == 0)
        return options.inverse(this);
    var result = [];
    for (var i = 0; result.length < max && i < ary.length; ++i)
        result.push(options.fn(ary[i]));
    return result.join('');
});

Handlebars.registerHelper('FormatDate', function(context, options) {
    if (context) {
        let newdate = moment(new Date(context)).fromNow()
        return newdate;
    }
});

var serialize = function(obj) {
    var str = [];
    for (var p in obj)
        if (obj.hasOwnProperty(p)) {
            str.push(encodeURIComponent(p) + "=" + encodeURIComponent(obj[p]));
        }
    return str.join("&");
}

Handlebars.registerHelper('QueryParams', function(existingQueryObj, newObj, deleteKey, options) {
    var existingObj = JSON.parse(JSON.stringify(existingQueryObj));
    if (Object.keys(newObj).length > 0) {
        existingObj = Object.assign(existingObj, newObj);
    }
    if (deleteKey != 'null') {
        var tmpArray = deleteKey.split('&');
        tmpArray.forEach(function(tmpKey) {
            delete existingObj[tmpKey];
        });
    }
    return serialize(existingObj);
});

Handlebars.registerHelper('FrameObject', function(options) {
    return options.hash;
});

Handlebars.registerHelper('ProfilePicture', function(context, options) {
    if (context && context.user_pic_url)
        return context.user_pic_url;
    return '/img/avatar.png'
});

Handlebars.registerHelper('objectKey', function(obj, value_pass, options) {
    var val;
    Object.keys(obj).forEach(function(key) {
        if (value_pass == obj[key]) {
            var val1 = key.toLowerCase();
            val = val1.charAt(0).toUpperCase() + val1.slice(1);
            val = val.replace("order", " Order");
        }
    });
    return val;
});

Handlebars.registerHelper('countrySelected', function(context, test) {
    var ret = '';
    var option;
    for (var i = 0, len = context.length; i < len; i++) {
        if (test.indexOf(context[i].id) == -1) {
            option = '<option value="' + context[i].id + '">' + context[i].name + '</option>'
            ret += option;

        }
    }
    return new Handlebars.SafeString(ret);
});

Handlebars.registerHelper('vendorSelectedcountry', function(context, test) {
    var ret = '';
    var option;
    for (var i = 0, len = context.length; i < len; i++) {
        if (test.indexOf(context[i].id) >= 0) {
            option = '<option value="' + context[i].id + '">' + context[i].name + '</option>'
            ret += option;
        }

    }
    return new Handlebars.SafeString(ret);
});

// Handlebars.registerHelper('vendorPlan', function(context, plan, option) {
//     var ret = '';
//     var option;
//     if (plan == 1 || plan == 6 || plan == 5) {
//         return context;
//     } else if (plan == 2) {
//         if (context == 'SHOP' || context == 'SERVICES' || context == 'LIFESTYLE') {
//             return context;
//         } else {
//             return ret;
//         }

//     } else if (plan == 3) {
//         if (context == 'SERVICES') {
//             return context;
//         }
//     } else if (plan == 4) {
//         if (context == 'LIFESTYLE') {
//             return context;
//         }
//     } else {
//         return;
//     }
// });

Handlebars.registerHelper('upperCount', function(limit, offset, count, option) {
    return count - (limit * offset);
});

Handlebars.registerHelper('bgColor', function(type, option) {
    if (type == 1) {
        return 'pmp4';
    } else if (type == 2) {
        return 'pmp1';
    } else if (type == 3) {
        return 'pmp2';
    } else {
        return 'pmp3';
    }
});

Handlebars.registerHelper('navbarSetting', function(user, type, options) {
    if (type == "wholesale") {
        if (user) {
            return options.fn(this);
        } else {
            return options.inverse(this);
        }
    } else {
        return options.fn(this);
    }
});

Handlebars.registerHelper('json', function(jsonStr, key) {
  if (_.isUndefined(jsonStr) || _.isNull(jsonStr)) {
    return '';
  }
  let obj = JSON.parse(jsonStr);
  return obj[key];
});

Handlebars.registerHelper('padZero', function(str, len, isJson, key) {
    var s = "";
    if (isJson == 'true') {
        if (_.isUndefined(str) || _.isNull(str)) {
            s = '';
        } else {
            let obj = JSON.parse(str);
            if (_.isUndefined(obj[key]) || _.isNull(obj[key])) {
                s = '';
            } else {
                s = obj[key];
            }
        }
    } else {
        s = str;
    }
    return _.padStart(s, len, '0');
});

Handlebars.registerHelper('last2', function(str, isJson, key) {
    var s = "";
    if (isJson == 'true') {
        if (_.isUndefined(str) || _.isNull(str)) {
            s = '';
        } else {
            let obj = JSON.parse(str);
            if (_.isUndefined(obj[key]) || _.isNull(obj[key])) {
                s = '';
            } else {
                s = obj[key];
            }
        }
    } else {
        s = str;
    }
    s = s + '';
    return s.length >= 2 ? s.substring(s.length - 2, s.length) : '';
});

Handlebars.registerHelper('currency', function(amt, symbol) {
    return numeral(amt).format(symbol + '0,0.00');
});

Handlebars.registerHelper('if_eq', function(a, b, opts) {
    if (a == b) {
        return opts.fn(this);
    } else {
        return opts.inverse(this);
    }
});

Handlebars.registerHelper('Attributes', function(id, arrayEle, options) {
    let name;
    arrayEle.forEach(function(element) {
        if(element.id == id){
            name= element.attr_name;    
        }
    });
    return name;
});
Handlebars.registerHelper("LikeUnlike",function(likes, user){
 let name;
    likes.forEach(function(element) {
        if(element.user_id == user.id){
            name= 'Unlike';    
        }
    });
    if(name != 'Unlike'){
        name="Like";
    }
    return name;
});

Handlebars.registerHelper('marketPlaceChart', function(totalAmt, marketPlaceArr) {        
    var ret = '';
    var mpKeyValue = {
        "Private Wholesale Marketplace" : "wholesale",
        "Public Marketplace" : "shop",
        "Services Marketplace" : "service",
        "Lifestyle Marketplace": "shop"
    }
    var option;
    for (var i = 0, len = marketPlaceArr.length; i < len; i++) {        
        option = `<li><span class = "`+mpKeyValue[marketPlaceArr[i].marketplace_name]+`" style = "height:`+calculatePercentage(totalAmt,marketPlaceArr[i].amount)+`" title = "`+marketPlaceArr[i].marketplace_name+`"></span></li>`
        ret += option;
    }
    return new Handlebars.SafeString(ret);
    
});

Handlebars.registerHelper('percentage', function(amtA, amtB) {    
    let per = parseFloat(amtB) / parseFloat(amtA) * 100;
    return numeral(per).format('0.00').toString() + '%';
});

function currencyFormat(amt) {
    return numeral(amt).format('$' + '0,0.00').toString();
};

function calculatePercentage(amtA, amtB) {
    let per = amtB / amtA * 100;
    return numeral(per).format('0.00').toString() + '%';
};

function getTextColor(amtA, amtB) {
    let total = (amtA - amtB);
    if(total < 0)
        return "text_red_color";
    else
        return "text_green_color";    
};

Handlebars.registerHelper('compareSalePerformance', function(obj, compareProducts) {   
    var ret = '';
    var matchedObj = _.find(compareProducts, function(aObj){
        return aObj.product_id == obj.product_id;
    });

    if(matchedObj){
        ret = `<td> ` + currencyFormat(obj.total_sales) + `
         <span class = "`+ getTextColor(obj.total_sales,matchedObj.total_sales) +`">` + currencyFormat(obj.total_sales - matchedObj.total_sales) + `</span>
         <span class = "text_grey_color"> vs ` + currencyFormat(matchedObj.total_sales) + `(` + calculatePercentage(obj.total_sales, matchedObj.total_sales) + `) </span>
         </td>
         <td>` + currencyFormat(obj.vendor_fee) + `
         <span class = "`+ getTextColor(obj.vendor_fee,matchedObj.vendor_fee) +`"> ` + currencyFormat(obj.vendor_fee - matchedObj.vendor_fee) + ` </span>
         <span class = "text_grey_color"> vs ` + currencyFormat(matchedObj.vendor_fee) + `(` + calculatePercentage(obj.vendor_fee, matchedObj.vendor_fee) + `) </span>
         </td>
         <td>` + currencyFormat(obj.gtc_fees) + `
         <span class = "`+ getTextColor(obj.gtc_fees,matchedObj.gtc_fees) +`">` + currencyFormat(obj.gtc_fees - matchedObj.gtc_fees) + `</span>
         <span class = "text_grey_color"> vs ` + currencyFormat(matchedObj.gtc_fees) + `(` + calculatePercentage(obj.gtc_fees, matchedObj.gtc_fees) +`) </span>
         </td>`
    } else {
        ret = `<td> `+ currencyFormat(obj.total_sales) + `
         <span class = "text_red_color"> N/A </span>
         <span class = "text_grey_color"> vs N/A (N/A % ) </span>
         </td>
         <td>` + currencyFormat(obj.vendor_fee) + `
         <span class = "text_red_color"> N/A </span>
         <span class = "text_grey_color"> vs N/A (N/A % ) </span>
         </td>
         <td>` + currencyFormat(obj.gtc_fees) + `
         <span class = "text_red_color"> N/A </span>
         <span class = "text_grey_color"> vs N/A (N/A % ) </span>
         </td>`
    }

    return new Handlebars.SafeString(ret);
});
