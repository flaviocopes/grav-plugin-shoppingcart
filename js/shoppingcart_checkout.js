(function(ShoppingCart) {

    ShoppingCart.processCheckoutFormSubmission = function processCheckoutFormSubmission() {
        var that = this;
        var data = {};

        /********************************************************/
        /* Fill the data object with values from the checkout form
        /********************************************************/
        var fillDataObjectWithValuesFromCheckoutForm = function fillDataObjectWithValuesFromCheckoutForm() {
            ShoppingCart.checkout_form_fields.forEach(function(checkout_form_field) {
                if (typeof checkout_form_field.name !== 'undefined') {
                    data[checkout_form_field.name] = jQuery('form[name=checkout] [name=' + checkout_form_field.name + ']').val();
                }
            });
        };

        fillDataObjectWithValuesFromCheckoutForm();

        /********************************************************/
        /* Do some processing / validation on the checkout form values
        /* Return false if I cannot go on, so the outer function can be stopped
        /********************************************************/
        var customProcessingOfCheckoutForm = function customProcessingOfCheckoutForm() {
            if (data.country === 'US') {
                if (data.hasOwnProperty("province")) {
                    delete data.province;
                }
            } else {
                if (data.hasOwnProperty("state")) {
                    delete data.state;
                }

                if (!data.province) {
                    alert(window.PLUGIN_SHOPPINGCART.translations.PLEASE_FILL_ALL_THE_REQUIRED_FIELDS);
                    return false;
                }
            }
        };
        
        var return_value = customProcessingOfCheckoutForm();
        if (return_value === false) {
            return;
        }

        /********************************************************/
        /* Fill `ShoppingCart.checkout_form_data` with the checkout form data
        /* Fill storejs.get('grav-shoppingcart-checkout-form-data') with the checkout form data
        /* Fill `ShoppingCart.gateway` with the gateway name
        /********************************************************/
        ShoppingCart.checkout_form_data = data;
        storejs.set('grav-shoppingcart-checkout-form-data', data); //Store data info in cookie
        ShoppingCart.gateway = jQuery('.js__payment__method').val();

        /********************************************************/
        /* - Generates the order random token
        /* - Processes the shipping method
        /* - Calculates the total order price including shipment
        /* - Calls the jQuery event `proceedToPayment`
        /********************************************************/
        var _goOnWithCheckout = function _goOnWithCheckout() {

            /***********************************************************/
            /* Create a random token and store it in
             /* storejs.get('grav-shoppingcart-order-token')
             /***********************************************************/
            var generateRandomToken = function generateRandomToken () {
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

                storejs.set('grav-shoppingcart-order-token', { token: randomToken(10) });
            };

            /***********************************************************/
            /* Check the shipping method and add it to
             /* storejs.get('grav-shoppingcart-shipping-method')
             /***********************************************************/
            var processShippingMethod = function processShippingMethod() {
                var shippingMethod = {
                    method: '',
                    cost: 0
                };

                if (ShoppingCart.settings.shipping.methods.length === 1) {
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
            };

            /***********************************************************/
            /* Calculate the total order price and store it in ShoppingCart.totalOrderPrice
             /***********************************************************/
            var calculateTotalOrderPrice = function calculateTotalOrderPrice () {
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

                /***********************************************************/
                /* Add shipping costs to the order price
                 /***********************************************************/
                ShoppingCart.generateShippingPrice();
                orderPrice = parseFloat(parseFloat(orderPrice) + parseFloat(ShoppingCart.shippingPrice)).toFixed(2);
                ShoppingCart.totalOrderPrice = orderPrice;
            };

            generateRandomToken ();
            processShippingMethod();
            calculateTotalOrderPrice ();

            jQuery(that).attr('disabled', 'disabled');
            jQuery(document).trigger('proceedToPayment', ShoppingCart);
        };

        _goOnWithCheckout();
    };

    /***********************************************************/
    /* Get the allowed shipping options based on the settings
    /***********************************************************/
    ShoppingCart.populateShippingOptions = function populateShippingOptions() {
        var shippingMethods = [];
        for (index in ShoppingCart.settings.shipping.methods) {
            shippingMethods[index] = ShoppingCart.settings.shipping.methods[index];
        }

        var methodIsAllowedInCountry = function methodIsAllowedInCountry(method, country) {
            for (index in method.allowed_countries) {
                if (method.allowed_countries[index] == country) return true;
                if (method.allowed_countries[index] == '*') return true;
            }
            return false;
        };

        var ifIsGenericThereIsNoCountrySpecificMethod = function ifIsGenericThereIsNoCountrySpecificMethod(method, country) {
            return true;
        };

        var orderWeightIsAllowedForThisMethod = function orderWeightIsAllowedForThisMethod(method) {
            return true;
        };

        var orderPriceIsAllowedForThisMethod = function orderPriceIsAllowedForThisMethod(method) {
            return true;
        };

        if (jQuery('.js__billing__country').val() === 'US') {
            jQuery('.js__billing__state__control').show();
            jQuery('.js__billing__province__control').hide();
        } else {
            jQuery('.js__billing__state__control').hide();
            jQuery('.js__billing__province__control').show();
        }

        if (shippingMethods.length === 0) {
            jQuery('.checkout-choose-shipping-block').hide();
        } else if (shippingMethods.length === 1) {

            var priceBlock = shippingMethods[0].price + ' ' + ShoppingCart.getCurrentCurrencySymbol();
            if (ShoppingCart.settings.ui.currency_symbol_position === 'before') {
                priceBlock = ShoppingCart.getCurrentCurrencySymbol() + ' ' + shippingMethods[0].price;
            }

            jQuery('.checkout-choose-shipping-block .form-select-wrapper').html(shippingMethods[0].name + ' - ' + priceBlock);
            jQuery('.checkout-choose-shipping-block').show();
        } else {
            var select = document.getElementById('js__shipping__method');

            if (select) {
                //Calculate shipping methods for the shipping country
                select.options.length = 0;

                ShoppingCart.generateShippingPrice();

                for (index in shippingMethods) {
                    if (shippingMethods.hasOwnProperty(index)) {
                        method = shippingMethods[index];
                        if (methodIsAllowedInCountry(method, ShoppingCart.checkout_form_data.country) &&
                                ifIsGenericThereIsNoCountrySpecificMethod(method, ShoppingCart.checkout_form_data.country) &&
                                orderWeightIsAllowedForThisMethod(method) &&
                                orderPriceIsAllowedForThisMethod(method)) {

                            var priceBlock = method.price + ' ' + ShoppingCart.getCurrentCurrencySymbol();
                            if (ShoppingCart.settings.ui.currency_symbol_position === 'before') {
                                priceBlock = ShoppingCart.getCurrentCurrencySymbol() + ' ' + method.price;
                            }

                            select.options[select.options.length] = new Option(method.name + ' - ' + priceBlock, method.name);
                        }
                    }
                }
            }

            jQuery('.checkout-choose-shipping-block').show();
        }
    };

    /***********************************************************/
    /* Get the payment options based on the settings
    /***********************************************************/
    ShoppingCart.populatePaymentOptions = function populatePaymentOptions() {
        jQuery('.checkout-choose-payment-block').hide();
        jQuery('.checkout-choose-payment-block-title').hide();

        var paymentMethods = [];
        for (index in ShoppingCart.settings.payment.methods) {
            paymentMethods[index] = ShoppingCart.settings.payment.methods[index];
        }

        var paymentMethodsCount = 0;
        for (index in paymentMethods) {
            if (paymentMethods.hasOwnProperty(index)) {
                paymentMethodsCount++;
            }
        }

        var select = document.getElementById('js__payment__method');

        if (select) {
            select.options.length = 0;

            for (index in paymentMethods) {
                if (paymentMethods.hasOwnProperty(index)) {
                    method = paymentMethods[index];

                    select.options[select.options.length] = new Option(method.name, index);
                }
            }
        }

        if (paymentMethodsCount > 1) {
            jQuery('.checkout-choose-payment-block').show();
            jQuery('.checkout-choose-payment-block-title').show();
        }
    };

    /***********************************************************/
    /* Setup the checkout page
    /***********************************************************/
    ShoppingCart.setupCheckout = function setupCheckout() {
        if (!storejs.get('grav-shoppingcart-basket-data') || storejs.get('grav-shoppingcart-basket-data').length == 0) {
            jQuery('.js__checkout__block').html(window.PLUGIN_SHOPPINGCART.translations.NO_ITEMS_IN_CART);
            jQuery('.js__checkout__block').show();
            return;
        }

        jQuery('.js__checkout__block').show();

        //I have items in the cart, I can go on

        var countries = ShoppingCart.getCountries();
        var select = document.getElementById('js__billing__country');
        if (select) {
            for (index in countries) {
                if (ShoppingCart.countryCanBuy(countries[index].code)) {
                    select.options[select.options.length] = new Option(countries[index].name, countries[index].code);
                }
            }
        }

        var states = ShoppingCart.getUSAStates();
        select = document.getElementById('js__billing__state');
        if (select) {
            for (var i = 0; i < states.length; i++) {
                select.options[select.options.length] = new Option(states[i].name, states[i].code);
            }
        }

        var stateChanged = function stateChanged() {
            //Calculate immediately the shipping address, so it's used for taxes
            if (!ShoppingCart.checkout_form_data) {
                ShoppingCart.checkout_form_data = {
                    state: jQuery('.js__billing__state').val(),
                };
            } else {
                ShoppingCart.checkout_form_data.state = jQuery('.js__billing__state').val();
            }
            ShoppingCart.calculateTotalPriceIncludingTaxes();
            ShoppingCart.calculateTotalPriceIncludingTaxesAndShipping();
            ShoppingCart.renderCart();
        };

        /***********************************************************/
        /* Called when first populating the country field with the default
        /* country, and when the user changes the country.
        /* Used to calculate the default shipping price too.
        /***********************************************************/
        var countryChanged = function countryChanged() {
            //Calculate immediately the shipping price, so it's shown in the cart
            if (!ShoppingCart.checkout_form_data) {
                ShoppingCart.checkout_form_data = {
                    country: jQuery('.js__billing__country').val(),
                };
            } else {
                ShoppingCart.checkout_form_data.country = jQuery('.js__billing__country').val();
            }

            ShoppingCart.populateShippingOptions();

            ShoppingCart.generateShippingPrice();

            if (jQuery('.js__billing__country').val() === 'US') {
                jQuery('.js__billing__state__control').show();
                jQuery('.js__billing__province__control').hide();
            } else {
                jQuery('.js__billing__state__control').hide();
                jQuery('.js__billing__province__control').show();
            }
            ShoppingCart.calculateTotalPriceIncludingTaxes();
            ShoppingCart.calculateTotalPriceIncludingTaxesAndShipping();
            ShoppingCart.renderCart();
        };

        jQuery("#js__billing__country").val(ShoppingCart.settings.general.default_country || 'US');
        countryChanged();

        ShoppingCart.populatePaymentOptions();

        if ((ShoppingCart.settings.general.default_country || 'US') === 'US') {
            jQuery('.js__billing__state__control').show();
            stateChanged();
        } else {
            jQuery('.js__billing__province__control').show();
        }

        jQuery(document).delegate('.js__billing__country', 'change', function() {
            countryChanged();
        });

        jQuery(document).delegate('.js__billing__state', 'change', function() {
            stateChanged();
        });

    };

})(window.ShoppingCart);
