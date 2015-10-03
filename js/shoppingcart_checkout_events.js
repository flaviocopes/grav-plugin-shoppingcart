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
    jQuery(document).on('click tap', '.js__checkout__button__proceed-to-payment', function(event) {
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

            //Agreed to terms and conditions?
            if (ShoppingCart.settings.general.agreeToTerms && !jQuery('#js__accepted-terms').prop("checked")) {
                alert(window.PLUGIN_SHOPPINGCART.translations.PLEASE_ACCEPT_TERMS_AND_CONDITIONS);
                return;
            }

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
            storejs.set('grav-shoppingcart-shipping-method', JSON.stringify(shippingMethod));
            storejs.set('grav-shoppingcart-payment-method', JSON.stringify({
                method: paymentMethod
            }));
            storejs.set('grav-shoppingcart-order-token', JSON.stringify({
                token: token
            }));

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
                email: JSON.parse(storejs.get('grav-shoppingcart-person-address')).email,
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

        //TODO
        // if (ShoppingCart.settings.general.additionalCheckoutFields) {
        //     if (ShoppingCart.settings.general.additionalCheckoutField1) {
        //         address.additionalCheckoutField1 = jQuery('.js__billing__additionalCheckoutField1').val();
        //     }
        //     if (ShoppingCart.settings.general.additionalCheckoutField2) {
        //         address.additionalCheckoutField2 = jQuery('.js__billing__additionalCheckoutField2').val();
        //     }
        // }

        var verimail = new Comfirm.AlphaMail.Verimail();
        var allFieldsFilled = true;

        if (!address.firstname ||
                !address.lastname ||
                !address.email ||
                !address.telephone ||
                !address.address1 ||
                !address.city ||
                !address.zip ||
                !address.country) {
            allFieldsFilled = false;
        }

        //TODO
        // if (ShoppingCart.settings.general.additionalCheckoutFields) {
        //     if (ShoppingCart.settings.general.additionalCheckoutField1 && !ShoppingCart.settings.general.additionalCheckoutField1IsOptional && !address.additionalCheckoutField1) {
        //         allFieldsFilled = false;
        //     }
        //     if (ShoppingCart.settings.general.additionalCheckoutField2 && !ShoppingCart.settings.general.additionalCheckoutField2IsOptional && !address.additionalCheckoutField2) {
        //         allFieldsFilled = false;
        //     }
        // }

        if (address.country === 'US' && !address.state) {
            allFieldsFilled = false;
        }
        if (address.country != 'US' && !address.province) {
            allFieldsFilled = false;
        }

        if (!allFieldsFilled) {
            alert(window.PLUGIN_SHOPPINGCART.translations.PLEASE_FILL_ALL_THE_REQUIRED_FIELDS);
            return;
        }

        verimail.verify(address.email, function(status, message, suggestion) {
            var message = '';

            if (status === 0) { //valid email
                ShoppingCart.shippingAddress = address;
                storejs.set('grav-shoppingcart-person-address', JSON.stringify(address)); //Store address info in cookie
                _goOnWithCheckout();

            } else {
                // Incorrect syntax!
                if (suggestion) {
                    message = window.PLUGIN_SHOPPINGCART.translations.SORRY_THE_EMAIL_IS_NOT_VALID_DID_YOU_MEAN + ' ' + suggestion + '?';
                } else {
                    message = window.PLUGIN_SHOPPINGCART.translations.SORRY_THE_EMAIL_IS_NOT_VALID
                }

                alert(message);
            }
        });

    });

    /***********************************************************/
    /* Render the clicked product image
    /***********************************************************/
    jQuery(document).on('click tap', '.shoppingcart__product-image', function() {
        //jQuery('.shoppingcart__default-image').attr('src', ShoppingCart.baseURL + "/media/com_shoppingcart/attachments/" + jQuery(this).data('filename'));
    });

    /***********************************************************/
    /* Initialize the checkout at page load
    /***********************************************************/
    jQuery(function() {
        jQuery('.js__checkout__block').hide();
        ShoppingCart.setupCheckout();
        ShoppingCart.populateShippingOptions();
    });

})(window.ShoppingCart);
