(function(ShoppingCart) {

    /***********************************************************/
    /* Generate the selected shipping price
    /***********************************************************/
    jQuery(document).on('change', '.js__shipping__method', function(event) {
        ShoppingCart.generateShippingPrice();
    });

    /***********************************************************/
    /* Store order in localstorage and proceed to Stripe
    /***********************************************************/
    jQuery(document).on('submit', 'form[name=checkout]', function(event) {
        event.preventDefault();
        ShoppingCart.processCheckoutFormSubmission();
    });

    /***********************************************************/
    /* Initialize the checkout at page load
    /***********************************************************/
    jQuery(function() {
        //Query('.js__checkout__block').hide();
        ShoppingCart.setupCheckout();
        ShoppingCart.populateShippingOptions();
    });

})(window.ShoppingCart);
