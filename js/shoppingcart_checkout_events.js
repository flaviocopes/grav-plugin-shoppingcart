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

        var that = this;

        /********************************************************/
        /* Function called if I later can go on with the checkout
        /********************************************************/
        var _goOnWithCheckout = function _goOnWithCheckout() {

            var randomToken = function randomToken(length) {
                var upper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
                var lower = 'abcdefghijklmnopqrstuvwxyz';
                var number = '0123456789';
                var token = '', i;
                var seed = upper + lower + number;
                length = length || 13;

                for (i = 0; i < length; i++) {
                    token += seed[Math.floor(Math.random() * (seed.length - 1))];
                }

                return token;
            };

            var url = '';
            var token = randomToken(10);
            var paymentMethod = 'stripe';
            var shippingMethod = {};

            //Determine shipping method
            if (ShoppingCart.settings.shipping.methods.length === 0) {
                shippingMethod = {
                    method: '',
                    cost: 0
                };
            } else if (ShoppingCart.settings.shipping.methods.length === 1) {
                shippingMethod = {
                    method: ShoppingCart.settings.shipping.methods[0].name,
                    cost: ShoppingCart.settings.shipping.methods[0].price
                };
            } else {
                shippingMethod = {
                    method: jQuery('.js__shipping__method').val(),
                    cost: ShoppingCart.shippingPrice
                };
            }

            //Store in localstorage
            storejs.set('grav-shoppingcart-shipping-method', shippingMethod);
            storejs.set('grav-shoppingcart-payment-method', { method: paymentMethod });
            storejs.set('grav-shoppingcart-order-token', { token: token });

            //Calculate the order price
            var orderPrice = ShoppingCart.totalOrderPriceIncludingTaxes;
            if (!orderPrice) {
                orderPrice = 0;
                var i = 0;
                var cart = ShoppingCart.items;

                while (i < cart.length) {
                    orderPrice += cart[i].product.price * cart[i].quantity;
                    i++;
                }
            }

            //////////////////////////////////////////////////////////
            //Add shipping costs to the order price
            //////////////////////////////////////////////////////////
            ShoppingCart.generateShippingPrice();
            orderPrice = parseFloat(parseFloat(orderPrice) + parseFloat(ShoppingCart.shippingPrice)).toFixed(2);
            ShoppingCart.totalOrderPrice = orderPrice;

            //////////////////////////////////////////////////////////
            //Remove coupon discount from the total amount
            //////////////////////////////////////////////////////////
            if (!ShoppingCart.amountOfDiscount) ShoppingCart.amountOfDiscount = 0;
            ShoppingCart.totalOrderPrice = parseFloat(parseFloat(parseFloat(ShoppingCart.totalOrderPrice) - parseFloat(ShoppingCart.amountOfDiscount)).toFixed(2)).toFixed(2);


            jQuery(that).attr('disabled', 'disabled');
            ShoppingCart.configureStripe();

            ShoppingCart.stripeHandler.open({
                name: ShoppingCart.settings.payment.methods.stripe.name,
                description: ShoppingCart.settings.payment.methods.stripe.description,
                email: storejs.get('grav-shoppingcart-person-address').email,
                amount: ShoppingCart.calculateTotalPriceIncludingTaxesAndShipping().toString().replace('.', ''),
                currency: ShoppingCart.settings.general.currency
            });

        };

        var address = {
            firstname: jQuery('.js__billing__firstname').val(),
            lastname: jQuery('.js__billing__lastname').val(),
            email: jQuery('.js__billing__email').val(),
            telephone: jQuery('.js__billing__telephone').val(),
            address1: jQuery('.js__billing__address1').val(),
            address2: jQuery('.js__billing__address2').val(),
            city: jQuery('.js__billing__city').val(),
            zip: jQuery('.js__billing__zip').val(),
            country: jQuery('.js__billing__country').val(),
            state: jQuery('.js__billing__state').val(),
            province: jQuery('.js__billing__province').val()
        };

        if (address.country != 'US' && !address.province) {
            alert(window.PLUGIN_SHOPPINGCART.translations.PLEASE_FILL_ALL_THE_REQUIRED_FIELDS);
            return;
        }

        ShoppingCart.shippingAddress = address;
        storejs.set('grav-shoppingcart-person-address', address); //Store address info in cookie

        _goOnWithCheckout();
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
