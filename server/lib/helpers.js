'use strict';
import Handlebars from 'handlebars';
const moment = require('moment');
const _ = require('lodash');
import {
	URLSearchParams
} from 'url';
const numeral = require('numeral');
const planPermissions = require('../config/plan-marketplace-permission.js');
const config = require('../config/environment');
const orderItemStatus = require("../config/order-item-new-status");

Handlebars.registerHelper('starCount', function(rating, color) {

	var rating = Math.ceil(rating);

	var colored = "";
	var colorless = "",
		tag1, tag2;

	tag1 = "<i class=" + '"fa fa-star"' + " aria-hidden=" + '"true"' + " style=" + '"color: #ffa700;"></i>';
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

//HELPER TO HANDLE NESTED OPERATIONS

Handlebars.registerHelper({
	eq: function(v1, v2) {
		return v1 === v2;
	},
	ne: function(v1, v2) {
		return v1 !== v2;
	},
	lt: function(v1, v2) {
		return v1 < v2;
	},
	gt: function(v1, v2) {
		return v1 > v2;
	},
	lte: function(v1, v2) {
		return v1 <= v2;
	},
	gte: function(v1, v2) {
		return v1 >= v2;
	},
	and: function() {
		return Array.prototype.slice.call(arguments).every(Boolean);
	},
	or: function() {
		return Array.prototype.slice.call(arguments, 0, -1).some(Boolean);
	}
});

Handlebars.registerHelper('formatTime', function(date, format) {
	var gmtDateTime = moment.utc(date);
	return gmtDateTime.local().format(format);
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

Handlebars.registerHelper('SUMFloatDisplay', function(v1, v2, count, options) {
	var a = parseFloat(v1) + parseFloat(v2);
	if (a > count) {
		return count;
	} else {
		return a;
	}
});

Handlebars.registerHelper('quantityPrice', function(quantity, price, symbol, options) {
	var amt = parseInt(quantity) * parseFloat(price);
	return numeral(amt).format(symbol + '0,0.00');
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
		let newdate = moment(moment(moment.utc(context).toDate()).local().format('YYYY-MM-DD HH:mm:ss')).fromNow();
		return newdate;
	}
});
Handlebars.registerHelper('timeLeft', function(context, options) {
	var currentDate = moment().utc().format('YYYY-M-DD HH:mm:ss');
	var endDate = moment(context, 'YYYY-M-DD HH:mm:ss');
	var secondsDiff = '';
	if (endDate.diff(currentDate) > 0) {
		var intervals = ['months','days', 'hours', 'minutes'],
			out = [];
		var arrayEle = [];
		for (var i = 0; i < intervals.length; i++) {
			var diff = endDate.diff(currentDate, intervals[i]);
			endDate.add(diff, intervals[i]);
			arrayEle[intervals[i]] = diff;
			out.push(diff + ' ' + intervals[i]);
		}
		if (arrayEle['minutes'] < 60) {
			secondsDiff = arrayEle['minutes'] + 'm ';
		} else if (arrayEle['hours'] <= 24) {
			secondsDiff = arrayEle['hours'] + 'h ';
			if(arrayEle['minutes'] > 60) {
				secondsDiff = secondsDiff + arrayEle['minutes'] % 60;
				 secondsDiff = secondsDiff +'m ';
			}
		} else if (arrayEle['days'] <= 30) {
			secondsDiff = arrayEle['days'] + 'd ';
			if(arrayEle['hours'] > 24){
			 secondsDiff = secondsDiff+ arrayEle['hours'] % 24;
				 secondsDiff = secondsDiff +'h ';
			}
		} else if (arrayEle['months'] <= 12 ) {
			secondsDiff = arrayEle['months'] + 'mon ';
			if(arrayEle['days'] > 30){
			 secondsDiff = secondsDiff+ arrayEle['days'] % 24;
				 secondsDiff = secondsDiff +'d ';
			}
	}
	secondsDiff = secondsDiff +' left!';
}
	return secondsDiff;
});

var serialize = function(obj) {
	var str = [];
	for (var p in obj)
		if (obj.hasOwnProperty(p)) {
			str.push(encodeURIComponent(p) + "=" + encodeURIComponent(obj[p]));
		}
	return str.join("&");
}

Handlebars.registerHelper('DurationCalculator', function(existingQueryObj, durationType, duration, options) {
	var existingObj = JSON.parse(JSON.stringify(existingQueryObj));
	if (durationType == 'DAY') {
		existingObj['start_date'] = moment().subtract(parseInt(duration), 'day').format('YYYY-MM-DD');
		existingObj['end_date'] = moment().format('YYYY-MM-DD');
	} else if (durationType == 'WEEK') {
		existingObj['start_date'] = moment().subtract(parseInt(duration), 'week').format('YYYY-MM-DD');
		existingObj['end_date'] = moment().format('YYYY-MM-DD');
	} else if (durationType == 'MONTH') {
		existingObj['start_date'] = moment().month(parseInt(duration)).startOf('month').format('YYYY-MM-DD');
		existingObj['end_date'] = moment().month(parseInt(duration)).endOf('month').format('YYYY-MM-DD');
	} else if (true) {
		existingObj['start_date'] = moment().year(parseInt(duration)).startOf('year').format('YYYY-MM-DD');
		existingObj['end_date'] = moment().year(parseInt(duration)).endOf('year').format('YYYY-MM-DD');
	}
	return serialize(existingObj);
});

Handlebars.registerHelper('QueryParams', function(existingQueryObj, newObj, deleteKey, options) {
	var existingObj = JSON.parse(JSON.stringify(existingQueryObj));
	if (Object.keys(newObj).length > 0) {
		existingObj = Object.assign(existingObj, newObj);
	}
	if (deleteKey != null) {
		var tmpArray = deleteKey.split('&');
		tmpArray.forEach(function(tmpKey) {
			delete existingObj[tmpKey];
		});
	}
	return serialize(existingObj);
});

Handlebars.registerHelper('paginationParams', function(existingQueryParams, newQueryObj, options) {
	var urlParams = new URLSearchParams(existingQueryParams);
	for (var property in newQueryObj) {
		if (newQueryObj.hasOwnProperty(property)) {
			urlParams.set(property, newQueryObj[property]);
		}
	}
	return urlParams;
});

Handlebars.registerHelper('marketplacePermission', function(vendorPlanId, marketplaceId, options) {
	var actionsValues = planPermissions[vendorPlanId][marketplaceId];
	if (actionsValues && Array.isArray(actionsValues) && actionsValues.length > 0) {
		if (getIndexOfAction(actionsValues, '*') > -1) {
			return options.fn(this);
		} else {
			return options.inverse(this);
		}
	} else {
		return options.inverse(this);
	}
});

function getIndexOfAction(array, value) {
	if (value) {
		if (array.length > 0) {
			for (var i = 0; i < array.length; i++) {
				if (array[i]) {
					if (array[i] == value) {
						return i;
					}
				}
			}
		}
		return -1;
	}
}

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
			val = val.replace("order", " "); //Order
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
Handlebars.registerHelper('CommaSeparate', function(amt) {
	return numeral(amt).format('0,0');
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
		if (element.id == id) {
			name = element.attr_name;
		}
	});
	return name;
});

Handlebars.registerHelper("LikeUnlike", function(likes, user) {
	let name;
	likes.forEach(function(element) {
		if (element.user_id == user.id) {
			name = 'Unlike';
		}
	});
	if (name != 'Unlike') {
		name = "Like";
	}
	return name;
});

Handlebars.registerHelper('marketPlaceChart', function(totalAmt, marketPlaceArr) {
	var ret = '';
	var mpKeyValue = {
		"Private Wholesale Marketplace": "wholesale",
		"Public Marketplace": "shop",
		"Services Marketplace": "service",
		"Lifestyle Marketplace": "lifestyle"
	}
	var option;
	for (var i = 0, len = marketPlaceArr.length; i < len; i++) {
		let amt = parseFloat(marketPlaceArr[i].amount).toFixed(2);
		var mPlaceClass = mpKeyValue[marketPlaceArr[i].marketplace_name] ? mpKeyValue[marketPlaceArr[i].marketplace_name] : "wholesale";
		option = `<li><p class="top_perf_marketplace_chart_price">$ ${amt}</p>
        <span class = "` + mPlaceClass + ` reporting_chart_` + mPlaceClass + `_color" style = "height:` + calculatePercentage(totalAmt, marketPlaceArr[i].amount) + `" title = "` + marketPlaceArr[i].marketplace_name + `"></span></li>`
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
	if (total < 0)
		return "text_red_color";
	else
		return "text_green_color";
};

Handlebars.registerHelper('compareSalePerformance', function(obj, compareProducts) {
	var ret = '';
	var matchedObj = _.find(compareProducts, function(aObj) {
		return aObj.product_id == obj.product_id;
	});
	if (matchedObj) {
		ret = `<td> ` + currencyFormat(obj.total_sales) + `
         <span class = "` + getTextColor(obj.total_sales, matchedObj.total_sales) + `">` + currencyFormat(obj.total_sales - matchedObj.total_sales) + `</span>
         <span class = "text_grey_color"> vs ` + currencyFormat(matchedObj.total_sales) + `(` + calculatePercentage(obj.total_sales, matchedObj.total_sales) + `) </span>
         </td>
         <td>` + currencyFormat(obj.vendor_fee) + `
         <span class = "` + getTextColor(obj.vendor_fee, matchedObj.vendor_fee) + `"> ` + currencyFormat(obj.vendor_fee - matchedObj.vendor_fee) + ` </span>
         <span class = "text_grey_color"> vs ` + currencyFormat(matchedObj.vendor_fee) + `(` + calculatePercentage(obj.vendor_fee, matchedObj.vendor_fee) + `) </span>
         </td>
         <td>` + currencyFormat(obj.gtc_fees) + `
         <span class = "` + getTextColor(obj.gtc_fees, matchedObj.gtc_fees) + `">` + currencyFormat(obj.gtc_fees - matchedObj.gtc_fees) + `</span>
         <span class = "text_grey_color"> vs ` + currencyFormat(matchedObj.gtc_fees) + `(` + calculatePercentage(obj.gtc_fees, matchedObj.gtc_fees) + `) </span>
         </td>`
	} else {
		ret = `<td> ` + currencyFormat(obj.total_sales) + `
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

Handlebars.registerHelper('productPerformance', function(product, compareProducts){

	var domElement= '';
	var matchedObj = _.find(compareProducts, function(aObj){
		return aObj.product_id == product.product_id;;
	});

	if (matchedObj) {
		domElement = `<td>
			<div class="customCheckbox">
				<input type="checkbox" class="customCheckboxInput" name="selected">
				<label class="checkbox-b"></label>
			</div>
		</td>
		<td class="table-data">
			<span class="d-inline-block text-truncate" style="max-width: 150px;" title="`+product.product_name+`">
				`+product.product_name+`
			</span>
		</td>
		<td>
			`+product.marketplace_name+`
		</td>
		<td>
			`+product.sales+`<span class = "` + getTextColor(product.sales, matchedObj.sales) + `"> +`+(product.sales-matchedObj.sales)+`</span>
			<span class = "text_grey_color"> vs `+matchedObj.sales+`(`+ calculatePercentage(product.sales, matchedObj.sales)+`) </span>
		</td>
		<td>
			`+currencyFormat(product.total_fees)+`<span class = "` + getTextColor(product.total_fees, matchedObj.total_fees) + `">`+currencyFormat(product.total_fees-matchedObj.total_fees)+`</span>
			<span class = "text_grey_color"> vs `+currencyFormat(matchedObj.total_fees)+`(`+ calculatePercentage(product.total_fees, matchedObj.total_fees)+`) </span>
		</td>
		<td>
			`+currencyFormat(product.gtc_fees)+`<span class = "` + getTextColor(product.gtc_fees, matchedObj.gtc_fees) + `">`+currencyFormat(product.gtc_fees-matchedObj.gtc_fees)+`</span>
			<span class = "text_grey_color"> vs `+currencyFormat(matchedObj.gtc_fees)+`(`+calculatePercentage(product.gtc_fees, matchedObj.gtc_fees)+`) </span>
		</td>
		<td>
			`+currencyFormat(product.vendor_fees)+`<span class = "` + getTextColor(product.vendor_fees, matchedObj.vendor_fees) + `">`+currencyFormat(product.vendor_fees-matchedObj.vendor_fees)+`</span>
			<span class = "text_grey_color"> vs `+currencyFormat(matchedObj.vendor_fees)+`(`+ calculatePercentage(product.vendor_fees, matchedObj.vendor_fees)+`) </span>
		</td>`;		
	} else {
		domElement = `<td>
			<div class="customCheckbox">
				<input type="checkbox" class="customCheckboxInput" name="selected">
				<label class="checkbox-b"></label>
			</div>
		</td>
		<td class="table-data">
			<span class="d-inline-block text-truncate" style="max-width: 250px;" title="`+product.product_name+`">
				`+product.product_name+`
			</span>
		</td>
		<td>
			`+product.marketplace_name+`
		</td>
		<td>
			`+product.sales+`
		</td>
		<td>
			`+currencyFormat(product.total_fees)+`
		</td>
		<td>
			`+currencyFormat(product.gtc_fees)+`
		</td>
		<td>
			`+currencyFormat(product.vendor_fees)+`
		</td>`;	
	}
	return new Handlebars.SafeString(domElement);
})

Handlebars.registerHelper('cityPerformance', function(city, compareCity){
	var domElement= '';
	var matchedObj = _.find(compareCity, function(aObj){
		return aObj['Product.city'] == city['Product.city'];
	});

	if (matchedObj) {
		domElement = `<td>
			<div class="customCheckbox">
				<input type="checkbox" class="customCheckboxInput" name="selected">
				<label class="checkbox-b"></label>
			</div>
		</td>
		<td class="table-data">
			`+city['Product.city']+`
		</td>
		<td>
			`+city.sales+`<span class = "` + getTextColor(city.sales, matchedObj.sales) + `"> +`+(city.sales-matchedObj.sales)+`</span>
			<span class = "text_grey_color"> vs `+matchedObj.sales+`(`+ calculatePercentage(city.sales, matchedObj.sales)+`) </span>
		</td>
		<td>
			`+currencyFormat(city.total_fees)+`<span class = "` + getTextColor(city.total_fees, matchedObj.total_fees) + `">`+currencyFormat(city.total_fees-matchedObj.total_fees)+`</span>
			<span class = "text_grey_color"> vs `+currencyFormat(matchedObj.total_fees)+`(`+ calculatePercentage(city.total_fees, matchedObj.total_fees)+`) </span>
		</td>
		<td>
			`+currencyFormat(city.gtc_fees)+`<span class = "` + getTextColor(city.gtc_fees, matchedObj.gtc_fees) + `">`+currencyFormat(city.gtc_fees-matchedObj.gtc_fees)+`</span>
			<span class = "text_grey_color"> vs `+currencyFormat(matchedObj.gtc_fees)+`(`+ calculatePercentage(city.gtc_fees, matchedObj.gtc_fees)+`) </span>
		</td>
		<td>
			`+currencyFormat(city.vendor_fees)+`<span class = "` + getTextColor(city.vendor_fees, matchedObj.vendor_fees) + `">`+currencyFormat(city.vendor_fees-matchedObj.vendor_fees)+`</span>
			<span class = "text_grey_color"> vs `+currencyFormat(matchedObj.vendor_fees)+`(`+ calculatePercentage(city.vendor_fees, matchedObj.vendor_fees)+`) </span>
		</td>`;		
	} else {
		domElement = `<td>
			<div class="customCheckbox">
				<input type="checkbox" class="customCheckboxInput" name="selected">
				<label class="checkbox-b"></label>
			</div>
		</td>
		<td class="table-data">
			`+city['Product.city']+`
		</td>
		<td>
		`+city.sales+`
		</td>
		<td>
			`+currencyFormat(city.total_fees)+`
		</td>
		<td>
			`+currencyFormat(city.gtc_fees) +`
		</td>
		<td>
			`+currencyFormat(city.vendor_fees) +`
		</td>`;	
	}
	return new Handlebars.SafeString(domElement);
})

Handlebars.registerHelper('countryPerformance', function(country, compareCountry){

	var domElement= '';
	var matchedObj = _.find(compareCountry, function(aObj){
		return aObj['Product.Country.id'] == country['Product.Country.id'];
	});

	if (matchedObj) {
		domElement = `<td>
			<div class="customCheckbox">
				<input type="checkbox" class="customCheckboxInput" name="selected">
				<label class="checkbox-b"></label>
			</div>
		</td>
		<td class="table-data">
			`+country['Product.Country.name']+`
		</td>
		<td>
			`+country.sales+`<span class = "` + getTextColor(country.sales, matchedObj.sales) + `"> +`+(country.sales-matchedObj.sales)+`</span>
			<span class = "text_grey_color"> vs `+matchedObj.sales+`(`+ calculatePercentage(country.sales, matchedObj.sales)+`) </span>
		</td>
		<td>
			`+currencyFormat(country.total_fees)+`<span class = "` + getTextColor(country.total_fees, matchedObj.total_fees) + `"> `+currencyFormat(country.total_fees-matchedObj.total_fees)+`</span>
			<span class = "text_grey_color"> vs `+currencyFormat(matchedObj.total_fees)+`(`+ calculatePercentage(country.total_fees, matchedObj.total_fees)+`) </span>
		</td>
		<td>
			`+currencyFormat(country.gtc_fees)+`<span class = "` + getTextColor(country.gtc_fees, matchedObj.gtc_fees) + `"> `+currencyFormat(country.gtc_fees-matchedObj.gtc_fees)+`</span>
			<span class = "text_grey_color"> vs `+currencyFormat(matchedObj.gtc_fees)+`(`+ calculatePercentage(country.gtc_fees, matchedObj.gtc_fees)+`) </span>
		</td>
		<td>
			`+currencyFormat(country.vendor_fees)+`<span class = "` + getTextColor(country.vendor_fees, matchedObj.vendor_fees) + `"> `+currencyFormat(country.vendor_fees-matchedObj.vendor_fees)+`</span>
			<span class = "text_grey_color"> vs `+currencyFormat(matchedObj.vendor_fees)+`(`+ calculatePercentage(country.vendor_fees, matchedObj.vendor_fees)+`) </span>
		</td>`;		
	} else {
		domElement = `<td>
			<div class="customCheckbox">
				<input type="checkbox" class="customCheckboxInput" name="selected">
				<label class="checkbox-b"></label>
			</div>
		</td>
		<td class="table-data">
			`+country['Product.Country.name']+`
		</td>
		<td>
		`+country.sales+`
		</td>
		<td>
			`+currencyFormat(country.total_fees)+`
		</td>
		<td>
			`+currencyFormat(country.gtc_fees) +`
		</td>
		<td>
			`+currencyFormat(country.vendor_fees) +`
		</td>`;	
	}
	return new Handlebars.SafeString(domElement);
})

Handlebars.registerHelper('buyerPerformance', function(buyer, compareBuyer){

	var domElement= '';
	var matchedObj = _.find(compareBuyer, function(aObj){
		return aObj['Order.User.id'] == buyer['Order.User.id'];
	});

	if (matchedObj) {
		domElement = `<td>
			<div class="customCheckbox">
				<input type="checkbox" class="customCheckboxInput" name="selected">
				<label class="checkbox-b"></label>
			</div>
		</td>
		<td class="table-data">
			`+buyer['Order.User.first_name']+` `+ buyer['Order.User.last_name']+`
		</td>
		<td>
			`+buyer.sales+`<span class = "` + getTextColor(buyer.sales, matchedObj.sales) + `"> +`+(buyer.sales-matchedObj.sales)+`</span>
			<span class = "text_grey_color"> vs `+matchedObj.sales+`(`+ calculatePercentage(buyer.sales, matchedObj.sales)+`) </span>
		</td>
		<td>
			`+currencyFormat(buyer.total_fees)+`<span class = "` + getTextColor(buyer.total_fees, matchedObj.total_fees) + `">`+currencyFormat(buyer.total_fees-matchedObj.total_fees)+`</span>
			<span class = "text_grey_color"> vs `+currencyFormat(matchedObj.total_fees)+`(`+ calculatePercentage(buyer.total_fees, matchedObj.total_fees)+`) </span>
		</td>
		<td>
			`+currencyFormat(buyer.gtc_fees)+`<span class = "` + getTextColor(buyer.gtc_fees, matchedObj.gtc_fees) + `">`+currencyFormat(buyer.gtc_fees-matchedObj.gtc_fees)+`</span>
			<span class = "text_grey_color"> vs `+currencyFormat(matchedObj.gtc_fees)+`(`+ calculatePercentage(buyer.gtc_fees, matchedObj.gtc_fees)+`) </span>
		</td>
		<td>
			`+currencyFormat(buyer.vendor_fees)+`<span class = "` + getTextColor(buyer.vendor_fees, matchedObj.vendor_fees) + `">`+currencyFormat(buyer.vendor_fees-matchedObj.vendor_fees)+`</span>
			<span class = "text_grey_color"> vs `+currencyFormat(matchedObj.vendor_fees)+`(`+ calculatePercentage(buyer.vendor_fees, matchedObj.vendor_fees)+`) </span>
		</td>`;		
	} else {
		domElement = `<td>
			<div class="customCheckbox">
				<input type="checkbox" class="customCheckboxInput" name="selected">
				<label class="checkbox-b"></label>
			</div>
		</td>
		<td class="table-data">
			`+buyer['Order.User.first_name']+` `+ buyer['Order.User.last_name']+`
		</td>
		<td>
		`+buyer.sales+`
		</td>
		<td>
			`+currencyFormat(buyer.total_fees)+`
		</td>
		<td>
			`+currencyFormat(buyer.gtc_fees)+`
		</td>
		<td>
			`+currencyFormat(buyer.vendor_fees)+`
		</td>`;	
	}
	return new Handlebars.SafeString(domElement);
})

Handlebars.registerHelper('socialIcon', function(obj, options) {
	if (obj == '' || obj == null || obj == 'null')
		return options.inverse(this);
	return options.fn(this);
});

Handlebars.registerHelper('ifIsZero', function(value, options) {
	if (value === 0) {
		return options.fn(this);
	}
	return options.inverse(this);
});

Handlebars.registerHelper('MarketPlaceURL', function(marketPlace_id, options) {
	if (!marketPlace_id)
		return 'products';
	let marketPlace;
	switch (marketPlace_id) {
		case 1:
			marketPlace = "wholesale";
			break;
		case 2:
			marketPlace = "shop";
			break;
		case 3:
			marketPlace = "services";
			break;
		case 4:
			marketPlace = "lifestyle";
			break;
		default:
			marketPlace = "products";
			break;
	}
	return marketPlace;
});

Handlebars.registerHelper('OrderStatusText', function(order_status, options) {
	if (!order_status)
		return ' ';
	let orderStatus;
	switch (order_status) {
		case 1:
			orderStatus = "Order not yet confirmed by seller";
			break;
		case 2:
			orderStatus = "Order confirmed by seller";
			break;
		case 3:
			orderStatus = "Seller is processing your order";
			break;
		case 4:
			orderStatus = "Order dispatched";
			break;
		case 5:
			orderStatus = "Order delivered";
			break;
		case 7:
			orderStatus = "Order Cancelled";
			break;
		case 8:
			orderStatus = "Order Failed";
			break;

		default:
			orderStatus = " ";
			break;
	}
	return orderStatus;
});

Handlebars.registerHelper('OrderStatusBar', function(order_status, options) {
	if (!order_status)
		return 'style="width:100%;"';

	let prograssBar;
	switch (order_status) {
		case 1:
			prograssBar = "width:5%;";
			break;
		case 2:
			prograssBar = "width:10%;background-color:green;";
			break;
		case 3:
			prograssBar = "width:15%;background-color:green;";
			break
		case 4:
			prograssBar = "width:20%;background-color:green;";
			break
		case 5:
			prograssBar = "width:100%;background-color:green;";
			break
		case 6:
			prograssBar = "width:100%;background-color:green;";
			break;
		default:
			prograssBar = "width:100%;background-color:red;";
			break;
	}
	return prograssBar;
});

Handlebars.registerHelper('Location', function(id, arrayEle, options) {
	let name;
	arrayEle.forEach(function(element) {
		if (element.id == id) {
			name = element.name;
		}
	});
	return name;
});
Handlebars.registerHelper('searchCategory', function(element, id) {
	var name = '';
	for (var i = 0, len = element.length; i < len; i++) {
		if (element[i].id == id) {
			name = element[i].name;
			return name.charAt(0).toUpperCase() + name.substr(1).toLowerCase();
		}
	}
	return name.charAt(0).toUpperCase() + name.substr(1).toLowerCase();
});

Handlebars.registerHelper('searchSubCategory', function(element, sub_cat, cat) {
	var name = '';
	var sub_name = '';
	for (var i = 0, len = element.length; i < len; i++) {
		if (element[i].id == cat) {
			name = element[i].SubCategories;
			for (var j = 0, sub_len = name.length; j < sub_len; j++) {
				if (name[j].id == sub_cat) {
					sub_name = name[j].name;
					return sub_name.charAt(0).toUpperCase() + sub_name.substr(1).toLowerCase();
				}
			}
		}
	}
	return sub_name.charAt(0).toUpperCase() + sub_name.substr(1).toLowerCase();
});
Handlebars.registerHelper('dotdotdot', function(str) {
	var body = str;
	var regex = /(<([^>]+)>)/ig;
	var result = body.replace(regex, "");
	if (str.length > 100) {
		result = result.substr(0, 100);
		return result + '...';
	}

	return result;
});
Handlebars.registerHelper('decimalFixed', function(distance) {
	return parseFloat(distance).toFixed(0);
});
Handlebars.registerHelper('decimalFixedOne', function(distance) {
	var rating = Math.ceil(distance);
	return rating;
});

Handlebars.registerHelper('sizeInKB', function(value) {
	var valueInKB = value / 1000;
	return valueInKB.toFixed(2);
});
Handlebars.registerHelper('verificationStatus', function(obj, status, content, option) {
	var text = '';
	if (obj.APPROVED == status) {
		text = `<span class="id-verified">
                    <i class="fas fa-check-circle"></i>
                </span>`;
	} else {
		text = `<span class="id-verified">
                    <i class="fas fa-exclamation-circle"></i>
                </span>`;
	}
	if (obj.WAITING == status) {
		text = text + 'Your ' + content + ' verification request is awaiting';
	} else if (obj.APPROVED == status) {
		text = text + 'Your ' + content + ' verification request is approved';
	} else if (obj.REJECTED == status) {
		text = text + option;
	} else {
		text = text + `You haven't submitted this yet.`;
	}
	return text;
});
Handlebars.registerHelper('returnCond', function(date) {
	const deliveredDate = new Date(date);
	const currentDate = new Date();
	deliveredDate.setDate(deliveredDate.getDate() + parseInt(config.returnItemDays));
	if (deliveredDate >= currentDate) {
		return "";
	} else {
		return "display: none;";
	}
});

Handlebars.registerHelper('trackProgressBar', function(status) {
	if (status == orderItemStatus['ORDER_INITIATED']) {
		return "width: 1%;background-color: darkgoldenrod;"
	} else if (status == orderItemStatus['CONFIRMED']) {
		return "width: 25%;background-color: darkslateblue;"
	} else if (status == orderItemStatus['SHIPPED']) {
		return "width: 50%;background-color: darkcyan;"
	} else if (status == orderItemStatus['DELIVERED']) {
		return "width: 100%;background-color: darkgreen;"
	} else {
		return "width: 100%;background-color: darkred;"
	}
});

Handlebars.registerHelper('ctrCalculation', function(impressions, clicks) {
	var ctr = 0;
	if(impressions != null && clicks != null){
		if (impressions != 0) {
			ctr = (clicks / impressions) * 100;
		}
	}
	return ctr;
});