(function() {

    /***********************************************************/
    /* Handle Proceed to Payment
    /***********************************************************/
    jQuery(function() {
        jQuery(document).on('proceedToPayment', function(event, ShoppingCart) {

            if (ShoppingCart.gateway != 'stripe') {
                return;
            }

            /***********************************************************/
            /* Configure Stripe
            /***********************************************************/
            var stripeHandler = StripeCheckout.configure({
                key: ShoppingCart.settings.payment.methods.stripe.publicKey,
                token: function(token, args) {
                    var order = {
                        products: storejs.get('grav-shoppingcart-basket-data'),
                        address: storejs.get('grav-shoppingcart-person-address'),
                        shipping: storejs.get('grav-shoppingcart-shipping-method'),
                        payment: storejs.get('grav-shoppingcart-payment-method'),
                        token: storejs.get('grav-shoppingcart-order-token').token,
                        extra: { 'stripeToken': token.id },
                        amount: ShoppingCart.totalOrderPrice.toString(),
                        gateway: ShoppingCart.gateway
                    };


                    jQuery.ajax({
                        url: ShoppingCart.settings.baseURL + ShoppingCart.settings.urls.saveOrderURL + '?task=pay',
                        data: order,
                        type: 'POST'
                    })
                    .success(function(redirectUrl) {
                        ShoppingCart.clearCart();
                        window.location = redirectUrl;
                    })
                    .error(function() {
                        alert('Payment not successful. Please contact us.');
                    });
                }
            });

            stripeHandler.open({
                name: ShoppingCart.settings.payment.methods.stripe.name,
                description: ShoppingCart.settings.payment.methods.stripe.description,
                email: storejs.get('grav-shoppingcart-person-address').email,
                amount: ShoppingCart.calculateTotalPriceIncludingTaxesAndShipping().toString().replace('.', ''),
                currency: ShoppingCart.settings.general.currency
            });
        });

    });

})();
