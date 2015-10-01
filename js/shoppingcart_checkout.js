(function(ShoppingCart) {

    /***********************************************************/
    /* Get the shipping options based on the settings
    /***********************************************************/
    ShoppingCart.populateShippingOptions = function populateShippingOptions() {
        var shipmentMethods = ShoppingCart.settings.shipping.methods;
        var select = document.getElementById('js__shipment__method');

        var methodIsAllowedInCountry = function methodIsAllowedInCountry(method, country) {
            for (index in method.allowedCountries) {
                if (method.allowedCountries[index] == country) return true;
                if (method.allowedCountries[index] == '*') return true;
            }
        };

        var ifIsGenericThereIsNoCountrySpecificMethod = function ifIsGenericThereIsNoCountrySpecificMethod(method, country) {
            var goOn = true;
            for (index in method.allowedCountries) {
                if (method.allowedCountries[index] == '*') goOn = false;
            }
            if (!goOn) return true; //is not generic, ignore

            for (var i = 0; i < shipmentMethods.length; i++) {
                var aMethod = shipmentMethods[i];
                for (index in method.allowedCountries) {
                    if (method.allowedCountries[index] == country) return false;
                }
            }

            return true;
        };

        var orderWeightIsAllowedForThisMethod = function orderWeightIsAllowedForThisMethod(method) {

            if (method.type !== 'weightBased') {
                return true;
            }

            var orderWeight = 0;
            var i = 0;
            var cart = ShoppingCart.items;

            while (i < cart.length) {
                orderWeight += cart[i].product.size_weight * cart[i].quantity;
                i++;
            }

            if (orderWeight < method.starting_order_weight) {
                return false;
            }

            if (orderWeight > method.ending_order_weight) {
                return false;
            }

            return true;
        };

        var orderPriceIsAllowedForThisMethod = function orderPriceIsAllowedForThisMethod(method) {
            if (method.type !== 'priceBased') {
                return true;
            }

            var orderPrice = 0;
            var i = 0;
            var cart = ShoppingCart.items;

            while (i < cart.length) {
                orderPrice += cart[i].product.price * cart[i].quantity;
                i++;
            }

            if (orderPrice < method.starting_order_price) {
                return false;
            }

            if (orderPrice > method.ending_order_price) {
                return false;
            }

            return true;
        };

        if (jQuery('#js__billing__country').val() === 'US') {
            jQuery('#js__billing__state__control').removeClass('hidden');
            jQuery('#js__billing__province__control').addClass('hidden');
        } else {
            jQuery('#js__billing__state__control').addClass('hidden');
            jQuery('#js__billing__province__control').removeClass('hidden');
        }

        if (shipmentMethods.length === 0) {
            jQuery('#checkout-choose-shipping-block').hide();
            jQuery('#checkout-choose-payment-block').removeClass('span6');
        } else if (shipmentMethods.length === 1) {

            var priceBlock = shipmentMethods[0].price + ' ' + ShoppingCart.getCurrentCurrencySymbol();
            if (ShoppingCart.settings.ui.currencySymbolPosition === 'before') {
                priceBlock = ShoppingCart.getCurrentCurrencySymbol() + ' ' + shipmentMethods[0].price;
            }

            jQuery('#checkout-choose-shipping-block .control-group').html(shipmentMethods[0].name + ' - ' + priceBlock);
        } else {

            //Calculate shipment methods for the shipping country
            select.options.length = 0;

            ShoppingCart.generateShipmentPrice();

            for (index in shipmentMethods) {
                if (shipmentMethods.hasOwnProperty(index)) {
                    method = shipmentMethods[index];
                    if (methodIsAllowedInCountry(method, ShoppingCart.shippingAddress.country) &&
                            ifIsGenericThereIsNoCountrySpecificMethod(method, ShoppingCart.shippingAddress.country) &&
                            orderWeightIsAllowedForThisMethod(method) &&
                            orderPriceIsAllowedForThisMethod(method)) {

                        var priceBlock = shipmentMethods[index].price + ' ' + ShoppingCart.getCurrentCurrencySymbol();
                        if (ShoppingCart.settings.ui.currencySymbolPosition === 'before') {
                            priceBlock = ShoppingCart.getCurrentCurrencySymbol() + ' ' + shipmentMethods[index].price;
                        }

                        select.options[select.options.length] = new Option(shipmentMethods[index].name + ' - ' + priceBlock, shipmentMethods[index].name);
                    }
                }
            }
        }

        if (jQuery(ShoppingCart.items).filter(function(index, item) { if (item.product.type != 'digital') return true }).toArray().length > 0) {
            //Digital only order. Don't show shipping options and set shipment price to 0
            jQuery('#checkout-choose-shipping-block').hide();
            jQuery('#checkout-choose-payment-block').removeClass('span6');
            ShoppingCart.shipmentPrice = 0;
        }

    };

    /***********************************************************/
    /* Setup the checkout page
    /***********************************************************/
    ShoppingCart.setupCheckout = function setupCheckout() {
        if (!storejs.get('grav-shoppingcart-basket-data') || JSON.parse(storejs.get('grav-shoppingcart-basket-data')).length == 0) {
            jQuery('.js__checkout__block').html(window.PLUGIN_SHOPPINGCART.translations.NO_ITEMS_IN_CART);
            jQuery('.js__checkout__block').show();
            return;
        }

        jQuery('.js__checkout__block').show();
        //I have items in the cart, I can go on

        var countries = ShoppingCart.getCountries();
        var select = document.getElementById('js__billing__country');
        for (index in countries) {
            if (ShoppingCart.countryCanBuy(countries[index].code)) {
                select.options[select.options.length] = new Option(countries[index].name, countries[index].code);
            }
        }

        var states = ShoppingCart.getUSAStates();
        select = document.getElementById('js__billing__state');
        for (var i = 0; i < states.length; i++) {
            select.options[select.options.length] = new Option(states[i].name, states[i].code);
        }

        var _stateChanged = function _stateChanged() {
            //Calculate immediately the shipping address, so it's used for taxes
            if (!ShoppingCart.shippingAddress) {
                ShoppingCart.shippingAddress = {
                    state: jQuery('.js__billing__state').val(),
                };
            } else {
                ShoppingCart.shippingAddress.state = jQuery('.js__billing__state').val();
            }
            ShoppingCart.calculateTotalPriceIncludingTaxes();
            ShoppingCart.calculateTotalPriceIncludingTaxesAndShipment();
            ShoppingCart.renderCart();
        };

        /***********************************************************/
        /* Called when first populating the country field with the default
        /* country, and when the user changes the country.
        /* Used to calculate the default shipping price too.
        /***********************************************************/
        var _countryChanged = function _countryChanged() {
            //Calculate immediately the shipping price, so it's shown in the cart
            if (!ShoppingCart.shippingAddress) {
                ShoppingCart.shippingAddress = {
                    country: jQuery('.js__billing__country').val(),
                };
            } else {
                ShoppingCart.shippingAddress.country = jQuery('.js__billing__country').val();
            }

            ShoppingCart.populateShippingOptions();

            ShoppingCart.generateShipmentPrice();

            if (jQuery('#js__billing__country').val() === 'US') {
                jQuery('#js__billing__state__control').removeClass('hidden');
                jQuery('#js__billing__province__control').addClass('hidden');
            } else {
                jQuery('#js__billing__state__control').addClass('hidden');
                jQuery('#js__billing__province__control').removeClass('hidden');
            }
            ShoppingCart.calculateTotalPriceIncludingTaxes();
            ShoppingCart.calculateTotalPriceIncludingTaxesAndShipment();
            ShoppingCart.renderCart();
        };

        //TODO
        //jQuery("#js__billing__country").val(ShoppingCart.settings.general.defaultCountry || 'US');
        jQuery("#js__billing__country").val('US');
        _countryChanged();

        if ((ShoppingCart.settings.general.defaultCountry || 'US') === 'US') {
            jQuery('#js__billing__state__control').removeClass('hidden');
            _stateChanged();
        } else {
            jQuery('#js__billing__province__control').removeClass('hidden');
        }

        jQuery(document).delegate('#js__billing__country', 'change', function() {
            _countryChanged();
        });

        jQuery(document).delegate('#js__billing__state', 'change', function() {
            _stateChanged();
        });

    };

    /***********************************************************/
    /* Configure Stripe
    /* #todo
    /***********************************************************/
    ShoppingCart.configureStripe = function configureStripe() {
        ShoppingCart.stripeHandler = StripeCheckout.configure({
            key: ShoppingCart.settings.payment.methods.stripe.publicKey,
            token: function(token, args) {
                var order = {
                    products: storejs.get('grav-shoppingcart-basket-data'),
                    address: storejs.get('grav-shoppingcart-person-address'),
                    shipment: storejs.get('grav-shoppingcart-shipment-method'),
                    payment: storejs.get('grav-shoppingcart-payment-method'),
                    token: JSON.parse(storejs.get('grav-shoppingcart-order-token')).token,
                    stripeToken: token.id,
                    amount: ShoppingCart.totalOrderPrice.toString().replace('.', ''),
                    total_paid: ShoppingCart.totalOrderPrice,
                    discount_code: ShoppingCart.discountCodeUsed
                };

                jQuery.ajax({
                    url: ShoppingCart.settings.urls.baseURL + ShoppingCart.settings.urls.saveOrderURL + '?task=order.pay',
                    data: order,
                    type: 'POST'
                })
                .success(function(orderId) {
                    ShoppingCart.clearCart();
                    window.location = ShoppingCart.settings.urls.baseURL + ShoppingCart.settings.urls.orderURL + '/id:' + orderId.replace('.txt', '') + '/token:' + order.token;
                })
                .error(function() {
                    alert('Payment not successful. Please contact us.');
                });
            }
        });
    };

})(window.ShoppingCart);
