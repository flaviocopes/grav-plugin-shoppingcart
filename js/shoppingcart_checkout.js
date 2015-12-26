(function(ShoppingCart) {

    /***********************************************************/
    /* Get the shipping options based on the settings
    /***********************************************************/
    ShoppingCart.populateShippingOptions = function populateShippingOptions() {
        var shippingMethods = [];
        for (index in ShoppingCart.settings.shipping.methods) {
            shippingMethods[index] = ShoppingCart.settings.shipping.methods[index];
        }

        var select = document.getElementById('js__shipping__method');

        var methodIsAllowedInCountry = function methodIsAllowedInCountry(method, country) {
            for (index in method.allowedCountries) {
                if (method.allowedCountries[index] == country) return true;
                if (method.allowedCountries[index] == '*') return true;
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
            if (ShoppingCart.settings.ui.currencySymbolPosition === 'before') {
                priceBlock = ShoppingCart.getCurrentCurrencySymbol() + ' ' + shippingMethods[0].price;
            }

            jQuery('.checkout-choose-shipping-block .form-select-wrapper').html(shippingMethods[0].name + ' - ' + priceBlock);
            jQuery('.checkout-choose-shipping-block').show();
        } else {

            //Calculate shipping methods for the shipping country
            select.options.length = 0;

            ShoppingCart.generateShippingPrice();

            for (index in shippingMethods) {
                if (shippingMethods.hasOwnProperty(index)) {
                    method = shippingMethods[index];
                    if (methodIsAllowedInCountry(method, ShoppingCart.shippingAddress.country) &&
                            ifIsGenericThereIsNoCountrySpecificMethod(method, ShoppingCart.shippingAddress.country) &&
                            orderWeightIsAllowedForThisMethod(method) &&
                            orderPriceIsAllowedForThisMethod(method)) {

                        var priceBlock = method.price + ' ' + ShoppingCart.getCurrentCurrencySymbol();
                        if (ShoppingCart.settings.ui.currencySymbolPosition === 'before') {
                            priceBlock = ShoppingCart.getCurrentCurrencySymbol() + ' ' + shippingMethods[index].price;
                        }

                        select.options[select.options.length] = new Option(method.name + ' - ' + priceBlock, method.name);
                    }
                }
            }

            jQuery('.checkout-choose-shipping-block').show();
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
            ShoppingCart.calculateTotalPriceIncludingTaxesAndShipping();
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

        jQuery("#js__billing__country").val(ShoppingCart.settings.general.defaultCountry || 'US');
        _countryChanged();

        if ((ShoppingCart.settings.general.defaultCountry || 'US') === 'US') {
            jQuery('.js__billing__state__control').show();
            _stateChanged();
        } else {
            jQuery('.js__billing__province__control').show();
        }

        jQuery(document).delegate('.js__billing__country', 'change', function() {
            _countryChanged();
        });

        jQuery(document).delegate('.js__billing__state', 'change', function() {
            _stateChanged();
        });

    };

})(window.ShoppingCart);
