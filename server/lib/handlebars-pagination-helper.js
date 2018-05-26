'use strict';

import Handlebars from 'handlebars';

Handlebars.registerHelper('pagination', function(collectionSize, page, pageSize, maxSize, options) {
	var startPage, endPage, context;

	var pageCount = Math.ceil(parseInt(collectionSize) / parseInt(pageSize));

	if (arguments.length === 3) {
		options = parseInt(maxSize);
		size = 5;
	}

	startPage = parseInt(page) - Math.floor(parseInt(maxSize) / 2);
	endPage = parseInt(page) + Math.floor(parseInt(maxSize) / 2);

	if (startPage <= 0) {
		endPage -= (startPage - 1);
		startPage = 1;
	}

	if (endPage > pageCount) {
		endPage = pageCount;
		if (endPage - parseInt(maxSize) + 1 > 0) {
			startPage = endPage - parseInt(maxSize) + 1;
		} else {
			startPage = 1;
		}
	}

	context = {
		startFromFirstPage: false,
		pages: [],
		endAtLastPage: false,
	};
	if (startPage === 1) {
		context.startFromFirstPage = true;
	}
	for (var i = startPage; i <= endPage; i++) {
		context.pages.push({
			page: i,
			isCurrent: i === parseInt(page),
		});
	}
	if (endPage === pageCount) {
		context.endAtLastPage = true;
	}

	return options.fn(context);
});