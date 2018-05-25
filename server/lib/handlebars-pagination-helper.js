'use strict';

import Handlebars from 'handlebars';

Handlebars.registerHelper('pagination', function(currentPage, collectionSize, size, options) {
	var startPage, endPage, context;

	var pageCount = Math.ceil(parseInt(collectionSize) / parseInt(size));

	if (arguments.length === 3) {
		options = parseInt(size);
		size = 5;
	}

	startPage = parseInt(currentPage) - Math.floor(parseInt(size) / 2);
	endPage = parseInt(currentPage) + Math.floor(parseInt(size) / 2);

	if (startPage <= 0) {
		endPage -= (startPage - 1);
		startPage = 1;
	}

	if (endPage > pageCount) {
		endPage = pageCount;
		if (endPage - parseInt(size) + 1 > 0) {
			startPage = endPage - parseInt(size) + 1;
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
			isCurrent: i === parseInt(currentPage),
		});
	}
	if (endPage === pageCount) {
		context.endAtLastPage = true;
	}

	return options.fn(context);
});