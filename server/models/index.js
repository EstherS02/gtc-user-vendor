/* eslint global-require: "off" */
const model = {};
let initialized = false;

/**
 * Initializes sequelize models and their relations.
 * @param   {Object} sequelize  - Sequelize instance.
 * @returns {Object}            - Sequelize models.
 */
function init(sequelize) {
    delete module.exports.init; // Destroy itself to prevent repeated calls and clash with a model named 'init'.
    initialized = true;
    // Import model files and assign them to `model` object.
    model.Address = sequelize.import('./definition/address.js');
    model.AdFeaturedproduct = sequelize.import('./definition/ad-featuredproduct.js');
    model.Admin = sequelize.import('./definition/admin.js');
    model.AdminUser = sequelize.import('./definition/admin-user.js');
    model.Announcement = sequelize.import('./definition/announcement.js');
    model.Appclient = sequelize.import('./definition/appclients.js');
    model.Attribute = sequelize.import('./definition/attribute.js');
    model.BusinessHour = sequelize.import('./definition/business-hours.js');
    model.Cart = sequelize.import('./definition/cart.js');
    model.Category = sequelize.import('./definition/category.js');
    model.CategoryAttribute = sequelize.import('./definition/category-attribute.js');
    model.Country = sequelize.import('./definition/country.js');
    model.Coupon = sequelize.import('./definition/coupon.js');
    model.CouponCategory = sequelize.import('./definition/coupon-category.js');
    model.CouponExcludedCategory = sequelize.import('./definition/coupon-excluded-category.js');
    model.CouponExcludedProduct = sequelize.import('./definition/coupon-excluded-product.js');
    model.CouponProduct = sequelize.import('./definition/coupon-product.js');
    model.Currency = sequelize.import('./definition/currency.js');
    model.Discount = sequelize.import('./definition/discount.js');
    model.DiscussionBoard = sequelize.import('./definition/discussion-board.js');
    model.DiscussionBoardDetail = sequelize.import('./definition/discussion-board-details.js');
    model.DiscussionBoardPost = sequelize.import('./definition/discussion-board-post.js');
    model.DiscussionBoardPostComment = sequelize.import('./definition/discussion-board-post-comment.js');
    model.DiscussionBoardPostLike = sequelize.import('./definition/discussion-board-post-like.js');
    model.EmailTemplate = sequelize.import('./definition/email-template.js');
    model.FeaturedProduct = sequelize.import('./definition/featured-product.js');
    model.GlobalSetting = sequelize.import('./definition/global-setting.js');
    model.Mail = sequelize.import('./definition/mail.js');
    model.Marketplace = sequelize.import('./definition/marketplace.js');
    model.MarketplaceType = sequelize.import('./definition/marketplace-type.js');
    model.MarketplaceProduct = sequelize.import('./definition/marketplace-products.js');
    model.Notification = sequelize.import('./definition/notification.js');
    model.NotificationSetting = sequelize.import('./definition/notification-setting.js');
    model.OrderItem = sequelize.import('./definition/order-items.js');
    model.OrderPayment = sequelize.import('./definition/order-payment.js');
    model.OrderPaymentEscrow = sequelize.import('./definition/order-payment-escrow.js');
    model.Order = sequelize.import('./definition/orders.js');
    model.Payment = sequelize.import('./definition/payment.js');
    model.PaymentSetting = sequelize.import('./definition/payment-setting.js');
    model.Plan = sequelize.import('./definition/plan.js');
    model.PlanLimit = sequelize.import('./definition/plan-limit.js');
    model.PlanMarketplace = sequelize.import('./definition/plan-marketplace.js');
    model.Product = sequelize.import('./definition/product.js');
    model.ProductRatings = sequelize.import('./definition/product-ratings.js');
    model.ProductAdsSetting = sequelize.import('./definition/product-ads-setting.js');
    model.ProductAttribute = sequelize.import('./definition/product-attribute.js');
    model.ProductDiscount = sequelize.import('./definition/product-discount.js');
    model.ProductMedia = sequelize.import('./definition/product-media.js');
    model.Region = sequelize.import('./definition/region.js');
    model.Review = sequelize.import('./definition/reviews.js');
    model.Shipping = sequelize.import('./definition/shipping.js');
    model.State = sequelize.import('./definition/state.js');
    model.SubCategory = sequelize.import('./definition/sub-category.js');
    model.Subscription = sequelize.import('./definition/subscription.js');
    model.SubscriptionSales = sequelize.import('./definition/subscription-sales.js');
    model.Talk = sequelize.import('./definition/talk.js');
    model.TalkSetting = sequelize.import('./definition/talk-setting.js');
    model.TalkThreadUsers = sequelize.import('./definition/talk-thread-users.js');
    model.TalkThread = sequelize.import('./definition/talk-thread.js');
    model.TermsAndCond = sequelize.import('./definition/terms-and-cond.js');
    model.Tax = sequelize.import('./definition/tax.js');
    model.Ticket = sequelize.import('./definition/ticket.js');
    model.TicketThread = sequelize.import('./definition/ticket-thread.js');
    model.Timezone = sequelize.import('./definition/timezone.js');
    model.UserOrder = sequelize.import('./definition/user-orders.js');
    model.UserMail = sequelize.import('./definition/user-mail.js');
	model.User = sequelize.import('./definition/users.js');
	model.UserPlan = sequelize.import('./definition/user-plan.js');
    model.UserToken = sequelize.import('./definition/user-token.js');
    model.Vendor = sequelize.import('./definition/vendor.js');
    model.VendorFollower = sequelize.import('./definition/vendor-follower.js');
    model.VendorNotification = sequelize.import('./definition/vendor-notification.js');
    model.VendorNotificationSetting = sequelize.import('./definition/vendor-notification-setting.js');
    model.VendorPlan = sequelize.import('./definition/vendor-plan.js');
    model.VendorRating = sequelize.import('./definition/vendor-rating.js');
    model.VendorShippingLocation = sequelize.import('./definition/vendor-shipping-location.js');
    model.VendorUserProduct = sequelize.import('./definition/vendor-user-product.js');
    model.VendorVerification = sequelize.import('./definition/vendor-verification.js');
    model.WishList = sequelize.import('./definition/wish-list.js');
    model.OrderItemsOverview = sequelize.import('./definition/order-items-overview.js');

    // All models are initialized. Now connect them with relations.
    require('./definition/address.js').initRelations();
    require('./definition/ad-featuredproduct.js').initRelations();
    require('./definition/admin.js').initRelations();
    require('./definition/admin-user.js').initRelations();
    require('./definition/announcement.js').initRelations();
    require('./definition/appclients.js').initRelations();
    require('./definition/attribute.js').initRelations();
    require('./definition/business-hours.js').initRelations();
    require('./definition/cart.js').initRelations();
    require('./definition/category.js').initRelations();
    require('./definition/category-attribute.js').initRelations();
    require('./definition/country.js').initRelations();
    require('./definition/coupon.js').initRelations();
    require('./definition/coupon-category.js').initRelations();
    require('./definition/coupon-excluded-category.js').initRelations();
    require('./definition/coupon-excluded-product.js').initRelations();
    require('./definition/coupon-product.js').initRelations();
    require('./definition/currency.js').initRelations();
    require('./definition/discount.js').initRelations();
    require('./definition/discussion-board.js').initRelations();
    require('./definition/discussion-board-details.js').initRelations();
    require('./definition/discussion-board-post.js').initRelations();
    require('./definition/discussion-board-post-comment.js').initRelations();
    require('./definition/discussion-board-post-like.js').initRelations();
    require('./definition/email-template.js').initRelations();
    require('./definition/featured-product.js').initRelations();
    require('./definition/global-setting.js').initRelations();
    require('./definition/mail.js').initRelations();
    require('./definition/marketplace.js').initRelations();
    require('./definition/marketplace-type.js').initRelations();
    require('./definition/marketplace-products.js').initRelations();
    require('./definition/notification.js').initRelations();
    require('./definition/notification-setting.js').initRelations();
    require('./definition/order-items.js').initRelations();
    require('./definition/order-payment.js').initRelations();
    require('./definition/order-payment-escrow.js').initRelations();
    require('./definition/orders.js').initRelations();
    require('./definition/payment.js').initRelations();
    require('./definition/payment-setting.js').initRelations();
    require('./definition/plan.js').initRelations();
    require('./definition/plan-limit.js').initRelations();
    require('./definition/plan-marketplace.js').initRelations();
    require('./definition/product.js').initRelations();
    require('./definition/product-ratings.js').initRelations();
    require('./definition/product-ads-setting.js').initRelations();
    require('./definition/product-attribute.js').initRelations();
    require('./definition/product-discount.js').initRelations();
    require('./definition/product-media.js').initRelations();
    require('./definition/region.js').initRelations();
    require('./definition/reviews.js').initRelations();
    require('./definition/shipping.js').initRelations();
    require('./definition/state.js').initRelations();
    require('./definition/sub-category.js').initRelations();
    require('./definition/subscription.js').initRelations();
    require('./definition/subscription-sales.js').initRelations();
    require('./definition/talk.js').initRelations();
    require('./definition/talk-setting.js').initRelations();
    require('./definition/talk-thread.js').initRelations();
    require('./definition/talk-thread-users.js').initRelations();
    require('./definition/tax.js').initRelations();
    require('./definition/terms-and-cond.js').initRelations();
    require('./definition/ticket.js').initRelations();
    require('./definition/ticket-thread.js').initRelations();
    require('./definition/timezone.js').initRelations();
    require('./definition/user-mail.js').initRelations();
    require('./definition/user-orders.js').initRelations();
	require('./definition/users.js').initRelations();
	require('./definition/user-plan.js').initRelations();
    require('./definition/user-token.js').initRelations();
    require('./definition/vendor.js').initRelations();
    require('./definition/vendor-follower.js').initRelations();
    require('./definition/vendor-notification-setting.js').initRelations();
    require('./definition/vendor-notification.js').initRelations();
    require('./definition/vendor-plan.js').initRelations();
    require('./definition/vendor-rating.js').initRelations();
    require('./definition/vendor-shipping-location.js').initRelations();
    require('./definition/vendor-user-product.js').initRelations();
    require('./definition/vendor-verification.js').initRelations();
    require('./definition/wish-list.js').initRelations();
    require('./definition/order-items-overview.js').initRelations();
    return model;
}

// Note: While using this module, DO NOT FORGET FIRST CALL model.init(sequelize). Otherwise you get undefined.
module.exports = model;
module.exports.init = init;
module.exports.isInitialized = initialized;
