if (discountLength) {
	count = discountLength;
}else {
	count = 0;
}

function removeDiscount(e) {
	$(e).parents(".discountRow").remove();
	count = count - 1;
	if (count < 3) {
		$(".discount_tier").show();
	}
}

function removeImage(e, imageIndex) {
	if (imageFiles[imageIndex].id) {
		if (confirm('Are you sure you want to delete this thing into the database?')) {
		    // Delete it!
		    $.ajax({
				url: '/api/product-medias/'+ imageFiles[imageIndex].id,
				type: 'DELETE',
				success: function(data) {
					imageFiles.splice(imageIndex, 1);
					$(e).parents(".pip").remove();
					appendImage();
				},
				error: function(error) {
					appendImage();
				}
			});
		} else {
			appendImage();
		}
	} else {
		imageFiles.splice(imageIndex, 1);
		$(e).parents(".pip").remove();
		appendImage();
	}
}

function removeBaseImage(e, imageIndex) {
	if (productBaseImage[imageIndex].id) {
		if (confirm('Are you sure you want to delete base image from database?')) {
		    // Delete it!
		    productBaseImageId = productBaseImage[imageIndex].id;
			productBaseImage.splice(imageIndex, 1);
			$(e).parents("#base").remove();
			$("#baseImage").removeAttr("disabled");
			
			appendBaseImage();
		} else {
			appendBaseImage();
		}
	} else {
		productBaseImage.splice(imageIndex, 1);
		$(e).parents("#base").remove();
		$("#baseImage").removeAttr("disabled");
		appendBaseImage();
	}
}

function appendImage() {
	$(".preview").empty();
	for (var i = 0; i < imageFiles.length; i++) {
		var domElement;
		domElement = "<span class=\"pip\">" + "<img class=\"imageThumb\" src=\"" + imageFiles[i].uploadedImage + "\"/>" +
			"<i class='fa fa-times productRemoveIcon' onclick='removeImage(this," + i + ")' aria-hidden='true'></i></span>"
		$(".preview").append(domElement);
	}
	if (imageFiles.length >= 6) {
		$("#productImage").hide();
	} else {
		$("#productImage").show();
	}
}

function appendBaseImage() {

	$('div.base_image').empty();
	for (var i = 0; i < productBaseImage.length; i++) {
		var domElement;
		domElement = "<span class=\"pip\" id=\"base\">" + "<img class=\"imageThumb\" src=\"" + productBaseImage[i].uploadedBaseImage + "\"/>" +
			"<i class='fa fa-times productRemoveIcon' onclick='removeBaseImage(this," + i + ")' aria-hidden='true'></i></span>"
		$('div.base_image').append(domElement);
		$('#baseImage').attr("disabled", "disabled");
	}
}

/*function testValue(count) {
	$(".value_discount_amount" + count).show();
	$(".percent_discount_amount" + count).hide();
}

function testPercent(count) {
	$(".value_discount_amount" + count).hide();
	$(".percent_discount_amount" + count).show();
}*/

$(function() {
	$('#quantity_available').change(function() {
		if ($('#quantity_available').val() == '0') {
			$('#product_status option').removeAttr('selected').filter('[value=9]').attr('selected', true);
			$("#product_status").prop("disabled", true);
		} else {
			$("#product_status").prop("disabled", false);
		}
	}).change()
})

$(document).ready(function() {

	var cropBoxData, canvasData, cropper, cropperInputImage, cropperOutputImage;
	var fileDetails = {}, baseImageFileDetails;
	var product_id = $('#edit_product_id').val();

	$("#gtc-cart-alert").hide();
	$('#gtc-feature-form-alert').hide();
	$('.indefiniteFeatureMsg').hide();


	$('#description').summernote({
		placeholder: 'Product description',
		tabsize: 2,
		height: 200,
		toolbar: [
					['style', ['bold', 'italic', 'underline', 'clear']],
					['font', ['strikethrough', 'superscript', 'subscript']],
					['fontsize', ['fontsize']],
					['color', ['color']],
					['para', ['ul', 'ol', 'paragraph']],
					['height', ['height']]
				]
	});

	$("#productImage").click(function(e) {
		$("#imageUpload").click();
	});
	$("#imageUpload").change(function() {
		test = '';
		fasterPreview(this);
	});
	$('#baseImage').on('change', function() {
		test = 'div.base_image';
		fasterPreview(this);
	});
	$('#crop-product-image').click(function() {
		if (test == 'div.base_image') {
			cropper.getCroppedCanvas().toBlob(function(blob) {
				fileDetails['cropperOutputImage'] = blob;
				fileDetails["croppedExtension"] = blob["type"].split("/")[1];
				fileDetails["fileName"] = fileDetails["originalFileName"] + "." + fileDetails["croppedExtension"];
				fileDetails['uploadedBaseImage'] = cropper.getCroppedCanvas().toDataURL();
				productBaseImage.length = 0;
				productBaseImage.push(fileDetails);
				appendBaseImage();
			});
			$('#profile-picture-modal').modal('hide');
		} else {
			cropper.getCroppedCanvas().toBlob(function(blob) {
				var fileTempHold = {};
				fileTempHold['cropperOutputImage'] = blob;
				fileTempHold["croppedExtension"] = blob["type"].split("/")[1];
				fileTempHold['fileName'] = fileDetails["originalFileName"] + "." + fileTempHold["croppedExtension"];
				fileTempHold['uploadedImage'] = cropper.getCroppedCanvas().toDataURL();
				imageFiles.push(fileTempHold);
				appendImage();
			});
			$('#profile-picture-modal').modal('hide');
		}
	});

	$('#profile-picture-modal').on('shown.bs.modal', function() {
		cropper = new Cropper(cropperInputImage, {
			aspectRatio: NaN,//16 / 16,
			// minCropBoxHeight: 280,
			// minCropBoxWidth: 1364,
			viewMode: 1,
			ready: function() { }
		});
	}).on('hidden.bs.modal', function() {
		cropBoxData = cropper.getCropBoxData();
		canvasData = cropper.getCanvasData();
		cropper.destroy();
	});

	function fasterPreview(uploader) {
		if (uploader.files && uploader.files[0]) {
			fileDetails["originalFileName"] = uploader.files[0]["name"].replace(/\.[^/.]+$/, "");
			fileDetails["originalExtension"] = uploader.files[0]["type"].split("/")[1];
			$('#uploaded-profile-picture').attr('src', window.URL.createObjectURL(uploader.files[0]));
			cropperInputImage = document.getElementById('uploaded-profile-picture');
			$('#profile-picture-modal').modal('show');
		}
	}

	$("#country").change(function() {
		var country_id = $('#country').val();
		$.ajax({
			url: '/api/states?country_id='+ country_id +'&field=name&order=asc',
			type: 'GET',
			success: function(result) {
				$("#state").empty();
				$("#state").append("<option disabled selected>Select State...</option>")
				for (var i = 0; i < result.rows.length; i++) {
					var options;
					options = "<option value=" + result.rows[i].id + ">" + result.rows[i].name + "</option>";
					$("#state").append(options);
				}
			},
			error: function(error) {
				console.log("Error", error);
			}
		});
	});

	$("#category").change(function() {
		var category_id = $('#category').val();
		$('#attributePopup').empty();
		$.ajax({
			url: '/api/sub-categories?category_id='+ category_id+'&field=name&order=asc',
			type: 'GET',
			success: function(result) {
				$("#sub_category").empty();
				$("#sub_category").append("<option disabled selected>Select Sub Category...</option>")
				for (var i = 0; i < result.rows.length; i++) {
					var options;
					options = "<option value=" + result.rows[i].id + ">" + result.rows[i].name + "</option>";
					$("#sub_category").append(options)
				}
			},
			error: function(error) {
				console.log("Error", error);
			}
		});

		$.ajax({
			url: '/api/product/attributes/index?category_id=' + category_id,
			type: 'GET',
			success: function(result) {
				$("#attributeDiv").empty();
				var attributeRow;
				attributeRow = '<tr></tr>';

				for (var i = 0; i < result.rows.length; i++) {
					var productAttribute;
					productAttribute = "<tr><td>" + result.rows[i].Attribute.attr_name + "</td><td>" +
						"<input type='text' name=" + result.rows[i].Attribute.id + " class='m-input-xxs all-quantity-cart-items' style='width:auto;'></td></tr>"

					attributeRow = attributeRow + productAttribute;
				}
				var attributeSection = '<div class="form-group"><label class="label-control">Product Attributes </label>' +
					'<div class="col-lg-8 border" style="padding: 0px;"><div class="modal-body">' +
					'<div class="container"><table class="table"><thead><tr>' +
					'<th class="shop_list_title"><b>Attribute</b></th><th class="shop_list_title">' +
					'<b>Value</b></th><th></th></tr></thead><tbody>' + attributeRow + '</tbody></table></div></div></div></div>'

				if(result.rows.length){
					$('#attributeDiv').append(attributeSection);
				}
			},
			error: function(error) {
				console.log("Error", error);
			}
		});
	});

	$("#productForm").validate({
		ignore: ":hidden:not(#description),.note-editable.card-block",
		rules: {
			product_name: "required",
			product_category_id: "required",
			sub_category_id: "required",
			marketplace_type_id: {
				required: function() {
					if ($("input[name=marketplace]").val() == 'Private Wholesale Marketplace') {
						return true;
					} else { return false; }
				}
			},
			product_location: "required",
			state_id: "required",
			sku: {
				required: true,
			},
			price: {
				required:function(){
					if($("select[name=marketplace_type_id]").val() == 2 || $("select[name=marketplace_type_id]").val() == 3 || $("select[name=marketplace_type_id]").val() == 4){
						return false;
					}else{
						return true;
					}		
				},
				number: true,
				dollarsscents: true
			},
			quantity_available: {
				required: true,
				digits: true
			},
			city: {
				required: true,
				lettersonly: true
			},
			shipping_cost: {
				number: true,
				dollarsscents: true
			},
			status: "required",
			moq: {
				required: function() {
					if ($("input[name=marketplace]").val() == 'Private Wholesale Marketplace') {
						return true;
					} else { return false; }
				},
				digits: true
			},
			exchanging_product: {
				required: function() {
					if ($("select[name=marketplace_type_id]").val() == 3) {
						return true;
					} else { return false; }
				}
			},
			exchanging_product_quantity: {
				required: function() {
					if ($("select[name=marketplace_type_id]").val() == 3) {
						return true;
					} else { return false; }
				}
			},
			subscription_duration: {
				required: function() {
					if ($("input[name=marketplace]").val() == 'Lifestyle Marketplace') {
						return true;
					} else { return false; }
				},
				digits: true
			},
			subscription_duration_unit:{
				required: function() {
					if ($("input[name=marketplace]").val() == 'Lifestyle Marketplace') {
						return true;
					} else { return false; }
				}
			},
			exclusive_start_date:{
				required:  function() {
					if ($('#exclusive_sale').is(":checked")) {
						return true;
					} else { return false; }
				},
				lesserThan: 'currentDate'
			},
			exclusive_end_date:{
				required: function() {
					if ($('#exclusive_sale').is(":checked")) {
						return true;
					} else { return false; }
				},
				greaterThan: "#exclusive_start_date" 
			},
			exclusive_offer:{
				required: function() {
					if ($('#exclusive_sale').is(":checked")) {
						return true;
					} else { return false; }
				},
				number: true,
				min: 0.01,
				dollarsscents: true
			},
			baseImage: {
				required: function() {
					if (productBaseImage.length == 0) {
						return true;
					} else {
						return false;
					}
				}
			}
		},
		messages: {
			product_name: "Please enter the product name",
			product_category_id: "Please select product category",
			sub_category_id: "Please select product sub-category",
			marketplace_type_id: "Please select Type",
			product_location: "Please select product origin",
			state_id:"Please select product state",
			sku: {
				required: "Please enter Stock Keeping Unit"
			},
			price: {
				required: "Please enter product price",
				number: "Please enter valid product price",
				dollarsscents: "Only two decimal values accepted"
			},
			quantity_available: {
				required: "Please enter available quantity",
				digits: "Please enter valid available quantity"
			},
			city: {
				required: "Please enter product origin city",
				lettersonly: "Please enter vaild city name"
			},
			shipping_cost: {
				number: "Please enter valid shipping cost",
				dollarsscents: "Only two decimal values accepted"
			},
			status: "Please select product status",
			exchanging_product: "Please enter the exchanging product name",
			exchanging_product_quantity: "Please enter exchanging product quantity",
			moq:{
				required: "Please enter minimum order quantity",
				digits: "Please enter valid quantity"
			},
			subscription_duration: {
				required:"Please enter subscription duration",
				digits: "Please enter a valid days"
			},		
			subscription_duration_unit: "Please select subscription duration type",
			exclusive_start_date: {
				required: "Please enter sales start date",
				lesserThan: "Start date can't be less than current date and time"
			},
			exclusive_end_date: {
				required: "Please enter sales end date",
				greaterThan: "End date should be greater than start date"
			},
			exclusive_offer: {
				required: "Please enter offer amount",
				number: "Please enter valid offer percentage",
				min: "Please enter valid offer percentage",
				dollarsscents: "Only two decimal values accepted"
			},
			baseImage: {
				required: "Please upload product base image."
			}
		}
	});

	$.validator.addMethod("lettersonly", function(value, element) {
		return this.optional(element) || /^[a-zA-Z ]*$/.test(value);
	}, "Letters only please");

	$.validator.addMethod("dollarsscents", function(value, element) {
		return this.optional(element) || /^\d{0,30}(\.\d{0,2})?$/i.test(value);
	}, "You must include two decimal places");

	$.validator.addMethod("greaterThan", 
	function(value, element, params) {

		if (!/Invalid|NaN/.test(new Date(value))) {
			return new Date(value) > new Date($(params).val());
		}

		return isNaN(value) && isNaN($(params).val()) 
			|| (Number(value) > Number($(params).val())); 
	},'Must be greater than {0}.');

	$.validator.addMethod("lesserThan", 
	function(value, element, params) {

		if (!/Invalid|NaN/.test(new Date(value))) {
			return new Date(value) >= new Date();
		}

		return isNaN(value) && isNaN($(params).val()) 
			|| (Number(value) > Number($(params).val())); 
	},'Must be greater than {0}.');

	$("#productForm").submit(function(e) {
		e.preventDefault();
		if ($('#productForm').valid()) {
			$("#product_status").prop("disabled", false);
			var formData = new FormData();
			
			let productInput = $("#productForm :input").filter(function(index, element) {
				return $(element).val() != '';
			}).serializeArray();

			productInput.forEach(function(obj) {
				formData.append(obj.name, obj.value);
			});

			attributeArr = $('#attributeDiv :input').filter(function(index, element) {
				return $(element).val() != '';
			}).serializeArray();

			let temp = [];
			attributeArr.forEach(function(attributesObj) {
				formData.delete(attributesObj.name);
				let obj = {};
				obj['attribute_id'] = attributesObj.name;
				obj['attribute_value'] = attributesObj.value;
				temp.push(obj);
			});

			if (temp.length > 0) {
				formData.append('product_attributes', JSON.stringify(temp));
			}

			$.ajaxSetup({ async: false });

			$.each(productBaseImage, function(i, file) {
				if (!file['id'])
					formData.append('product_base_image', file.cropperOutputImage, file.fileName);
			});

			$.each(imageFiles, function(i, file) {
				if (!file['id'])
					formData.append('product_media_'+i, file.cropperOutputImage, file.fileName);
			});

			if (formData.get('exclusive_sale') == null)
				formData.append('exclusive_sale', 0);

			if (!product_id){
				$.ajax({
					type: 'POST',
					url: '/api/product/',
					data: formData,
					cache: false,
					processData: false,
					contentType: false,
					success: function(data) {
						$('#gtc-cart-alert').removeClass('alert-danger').addClass('alert-success');
						$('#gtc-cart-alert .cart-message').text("Product Added Successfully")
						$("#gtc-cart-alert").fadeTo(7000, 500).slideUp(500, function() {
							$("#gtc-cart-alert").slideUp(500);
						});
						$('.pip').empty();
						$('.base_image').empty();
						setTimeout(function() {
							location.reload(true);
						}, 3000);
					},
					error: function(error) {
						$('#gtc-cart-alert').removeClass('alert-success').addClass('alert-danger');
						$('#gtc-cart-alert .cart-message').text(error.responseText);
						$("#gtc-cart-alert").fadeTo(7000, 500).slideUp(500, function() {
							$("#gtc-cart-alert").slideUp(500);
						});
					}
				});
			}else{
				$.ajax({
					type: 'PUT',
					url: '/api/product/edit/' + product_id,
					data: formData,
					cache: false,
					processData: false,
					contentType: false,
					success: function(data) {
						if (productBaseImageId && productBaseImage.length > 0) {

							$.ajax({
								url: '/api/product-medias/'+ productBaseImageId,
								type: 'DELETE',
								success: function(data) {
									$('#gtc-cart-alert').removeClass('alert-danger').addClass('alert-success');
									$('#gtc-cart-alert .cart-message').text("Product Updated Successfully");
									$("#gtc-cart-alert").fadeTo(7000, 500).slideUp(500, function() {
										$("#gtc-cart-alert").slideUp(500);
									});
									setTimeout(function() {
										location.reload(true);
									}, 3000);
								},
								error: function(error) {}
							});
						} else {
							$('#gtc-cart-alert').removeClass('alert-danger').addClass('alert-success');
							$('#gtc-cart-alert .cart-message').text("Product Updated Successfully");
							$("#gtc-cart-alert").fadeTo(7000, 500).slideUp(500, function() {
								$("#gtc-cart-alert").slideUp(500);
							});
							setTimeout(function() {
								location.reload(true);
							}, 3000);
						}
					},
					error: function(error) {
						$('#gtc-cart-alert').removeClass('alert-success').addClass('alert-danger');
						$('#gtc-cart-alert .cart-message').text(error.responseText);
						$("#gtc-cart-alert").fadeTo(7000, 500).slideUp(500, function() {
							$("#gtc-cart-alert").slideUp(500);
						});
					}
				});
			}
			$.ajaxSetup({ async: true });
		}
	});

	$("#reset").click(function() {
		location.reload(true);
	});

/*	$("#editdiscount").click(function(e) {

		if (count < 3) {

			var domElement = '&nbsp;<div class="row discountRow"><div class="col-lg-1"><label  class="label-control">For</label></div><div class="col-lg-2">' +
				'<input type="text" class="form-control-customized form-control-sm quantity" name="discount_quantity' + count + '" id="discount_quantity' + count + '" placeholder="20"></div>' +
				'<div class="col-lg-2"><label  class="label-control">product user receives</label></div>' +
				'<div class="col-lg-3"><div class="row edit-listing-dis"><input type="radio" class="discount_type" id="percentage_discount0"' +
				'name="discount_type' + count + '" value="percentage_discount" checked onclick=testPercent(' + count + ');> Total Percent Discount&nbsp; &nbsp;' +
				'<input class="list_place_21 discount_amount percent_discount_amount' + count + '" type="text" name="percent_discount_amount' + count + '" placeholder="20%"></div>' +
				'<div class="row edit-listing-dis"><input type="radio" class="discount_type" id="value_discount' + count + '" name="discount_type' + count + '"' +
				'value="value_discount" onclick=testValue(' + count + ')> Total Value Discount &nbsp;&nbsp;<input class="list_place_21 discount_amount value_discount_amount' + count + '"' +
				'type="text" name="value_discount_amount' + count + '" placeholder="20$" style="display:none" /></div></div>' +
				'<div class="col-lg-1" style="float:right"><a href="javascript:;"  onclick="removeDiscount(this)"><small>Remove</small></a>' +
				'</div></div>'

			$('#discountAppend').append(domElement);
			count = count + 1;
			if (count == 3) {
				$(".discount_tier").hide();
			}
		}
	});*/

	if (imageFiles && (imageFiles.length > 0))
		appendImage();

	if (productBaseImage && (productBaseImage.length > 0))
		appendBaseImage();

	//FEATURING THE PRODUCT FUNCTIONALITIES

	var featureProductInput;

	$('input:checkbox:not("#feature_indefinitely")').change(function() {
		recalculate();
	});

	function recalculate() {
		var sum = 0.00;
		$("input[class='positions']:checkbox:checked").each(function() {

			sum += parseFloat(this.id);
		});
		$('#totalFees').html(sum);
	}

	$("#featureForm").validate({
		rules: {
			start_date: {
				required: true,
				date: true,
				lesserThanFeature: 'currentDate'
			},
			end_date: {
				required: "#feature_indefinitely:unchecked",
				date: true,
				greaterThanFeature: "#start_date"
			}
		},
		messages: {
			start_date: {
				required: "Select start date",
				date: "Enter valid date",
				lesserThanFeature: "Must be greater than current date"
			},
			end_date: {
				required: "Select end date",
				date: "Enter valid date",
				greaterThanFeature: "Must be greater than start date"
			}
		}
	});

	$.validator.addMethod("greaterThanFeature",
		function(value, element, params) {

			if(!value){
				return true;
			}
			if (!/Invalid|NaN/.test(new Date(value))) {
				return new Date(value) > new Date($(params).val());
			}
			return isNaN(value) && isNaN($(params).val())
				|| (Number(value) > Number($(params).val()));
		}, 'Must be greater than {0}.');

	$.validator.addMethod("lesserThanFeature",
		function(value, element, params) {
			if (!/Invalid|NaN/.test(new Date(value))) {
				var timeStamp =  new Date();
				var currentDate = new Date(timeStamp.setHours(0,0,0,0));
				return new Date(value) >= currentDate;
			}
			return isNaN(value) && isNaN($(params).val())
				|| (Number(value) > Number($(params).val()));
		}, 'Must be greater than {0}.');


	$('#featureForm').submit(function(e) {
		e.preventDefault();

		var featurePosition = $('[class="positions"]');
		var featurePositionCount = 0;
		var checkedFeaturePositions = [];

		for (var i = 0, l = featurePosition.length; i < l; i++) {
			if (featurePosition[i].checked) {
				featurePositionCount = featurePositionCount + 1;
				checkedFeaturePositions.push(featurePosition[i].name);
			}
		}
		
		if (featurePositionCount < 1) {
			outputPopupError('Please select featuring position');
			return;
		}

		featureProductInput = $("#featureForm :input").filter(function(index, element) {
			return $(element).val() != '';
		}).serialize();

		if ($('#featureForm').valid()) {
			if(checkedFeaturePositions.length == 1 && checkedFeaturePositions[0] == 'position_profilepage'){
				featureProductInput = featureProductInput+'&product_id='+ product_id;
				$.ajax({
					url: '/api/feature-product',
					type: 'POST',
					data: featureProductInput,
					success: function(data) {
						$('#feature_response_message').html(data.message);
						$('#feature_response_message_details').html(data.messageDetails);
						$('#featureModal').modal('hide');
						$('#feature-success-modal').modal('show');
					},
					error: function(error) {
						$('#feature_response_message').html(error.responseJSON.message);
						$('#feature_response_message_details').html(error.responseJSON.messageDetails);
						$('#featureModal').modal('hide');
						$('#feature-success-modal').modal('show');
					}
				});
			}
			else{

				var featureStartDate, featureEndDate, from, to, featureDuration, amount, totalFeatureFees, sum;
				featureStartDate = $('#start_date').val();

				if($('#end_date').val()){

					featureEndDate = $('#end_date').val();
					from = moment(featureStartDate, 'MM/DD/YYYY'); 
					to = moment(featureEndDate, 'MM/DD/YYYY');
					featureDuration = to.diff(from, 'days');

					amount = $("#totalFees").html();

					sum = amount * featureDuration / 30;
					totalFeatureFees = sum.toFixed(2);

					$("#feature_total").html(totalFeatureFees);
					$("#feature_start_date").html(featureStartDate);
					$("#feature_end_date").html(featureEndDate);

				}else{
					totalFeatureFees  = $("#totalFees").html();
					$("#feature_total").html(totalFeatureFees);
					$("#feature_start_date").html(featureStartDate);
					$("#feature_end_date").html('Indefinitely');	
				}

				$('#featureModal').modal('hide');
				$('#featurePaymentModal').modal('show');
			}	
		}
	});

	$("#featurePaymentForm").validate({
		rules: {
			payment_details: "required"
		},
		messages: {
			payment_details: "Please select payment method"
		}
	});

	$('#featurePaymentForm').submit(function(e) {
		e.preventDefault();

		if ($('#featurePaymentForm').valid()) {
			$('#featurePaymentModal').modal('hide');
			var feature_amount = $("#feature_total").html()
			let featurePaymentInput = $("#featurePaymentForm :input").filter(function(index, element) {
				return $(element).val() != '';
			}).serialize();
			featurePaymentInput = featurePaymentInput + '&feature_amount=' + feature_amount;
			$.ajax({
				url: '/api/feature-product/payment?' + featureProductInput + '&product_id=' + product_id,
				type: 'POST',
				data: featurePaymentInput,
				success: function(data) {
					$('#feature_response_message').html(data.message);
					$('#feature_response_message_details').html(data.messageDetails);
					$('#feature-success-modal').modal('show');
				},
				error: function(error) {
					$('#feature_response_message').html(error.responseJSON.message);
					$('#feature_response_message_details').html(error.responseJSON.messageDetails);
					$('#feature-success-modal').modal('show');
				}
			});
		}
	});

	$('#feature_indefinitely').change(function() {
		if ($(this).is(":checked")) {
			$('#end_date').val('');
			$('.indefiniteFeatureMsg').show();
		}else{
			$('.indefiniteFeatureMsg').hide();
		}
	});

	$('#end_date').change(function() {
		$("#feature_indefinitely").prop("checked", false);
		$('.indefiniteFeatureMsg').hide();
	});

/*	$("#start_date").change(function() {
		var startDate = $('#start_date').val();
		let currentUTCDate = new Date();
		var from = new Date(startDate);
		if (from < currentUTCDate) {
			$('#start_date').val("");
			outputPopupError("Start Date should not less than Current Date");
		}
	});

	$("#end_date").change(function() {
		var start_date = $('#start_date').val();
		if (start_date) {
			var end_date = new Date($('#end_date').val());
			var from = new Date(start_date);
			if (from > end_date) {
				$('#end_date').val("");
				outputPopupError("End date should not less than start date");
			}
		} else {
			outputPopupError("Please select start date");
		}
	});*/

	function outputPopupError(data) {
		$('#gtc-feature-form-alert').removeClass('alert-success').addClass('alert-danger');
		$('#gtc-feature-form-alert .form-message').text(data);
		$("#gtc-feature-form-alert").fadeTo(2000, 500).slideUp(500, function() {
			$("#gtc-feature-form-alert").slideUp(500);
		});
	}

	$("#start_date, #end_date").datepicker({
		format: 'mm/dd/yyyy',
		autoHide: true,
		zIndex: 9999
	});

	//EXCLUSIVE SALES FUNCTIONALITY

	$("#exclusive_start_date, #exclusive_end_date").datetimepicker({
        dateFormat: 'mm-dd-yy',
        timeFormat: 'HH:mm:ss'
	}); 
	  
	if ($('#exclusive_sale').is(":checked")) {
		$('.salesDiv').prop('disabled', false);
	}

	$("#exclusive_sale").change(function () {
		let ischecked = $(this).is(':checked');
		if (!ischecked) {
			$('.salesDiv').prop('disabled', true);
			$('.salesDiv').val(null);
		} else {
			$('.salesDiv').prop('disabled', false);
		}
	});
});