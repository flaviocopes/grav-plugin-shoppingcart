(function(ShoppingCart) {
    ShoppingCart.items = [];
    ShoppingCart.shippingAddress = {};
    ShoppingCart.currentPageIsProduct = false;
    ShoppingCart.currentPageIsProducts = false;

    /***********************************************************/
    /* Load the shopping cart settings
    /***********************************************************/
    ShoppingCart.loadSettings = function loadSettings() {
        ShoppingCart.settings = PLUGIN_SHOPPINGCART.settings;

        if (!ShoppingCart.settings) {
            ShoppingCart.settings = {};
        }
        if (!ShoppingCart.settings.countries) {
            ShoppingCart.settings.countries = {};
        }
        if (!ShoppingCart.settings.shipment) {
            ShoppingCart.settings.shipment = {};
        }
        if (!ShoppingCart.settings.shipment.methods) {
            ShoppingCart.settings.shipment.methods = [];
        }
        if (!ShoppingCart.settings.payment) {
            ShoppingCart.settings.payment = {};
        }
        if (!ShoppingCart.settings.payment.methods) {
            ShoppingCart.settings.payment.methods = [];
        }

        i = 0;

        while (i < ShoppingCart.settings.shipment.methods.length) {
            item = ShoppingCart.settings.shipment.methods[i];
            if (!item.allowedCountries) item.allowedCountries = [];
            ShoppingCart.settings.shipment.methods[i] = item;
            i++;
        }

        i = 0;

        while (i < ShoppingCart.settings.countries.length) {
            item = ShoppingCart.settings.countries[i];

            if (item.allow === 'false' || item.allow === false) {
                item.isAllowed = false;
            } else {
                item.isAllowed = true;
            }
            ShoppingCart.settings.countries[i] = item;

            i++;
        }

        i = 0;

        while (i < ShoppingCart.settings.payment.methods.length) {
            item = ShoppingCart.settings.payment.methods[i];
            ShoppingCart.settings.payment.methods[i] = item;

            i++;
        }
    };

    /***********************************************************/
    /* Check product quantity value and proceed to checkout
    /***********************************************************/
    ShoppingCart.proceedToCheckout = function proceedToCheckout() {
        var isInt = function isInt(n) {
            return n % 1 == 0;
        };

        for (var i = 0; i < ShoppingCart.items.length; i++) {
            if (!isInt((ShoppingCart.items[i].quantity))) {
                alert(window.PLUGIN_SHOPPINGCART.translations.VALUE_NOT_ACCEPTABLE);
                return;
            }

            if (parseInt(ShoppingCart.items[i].quantity) > ShoppingCart.settings.cart.maximumTotalQuantityValue) {
                alert(window.PLUGIN_SHOPPINGCART.translations.QUANTITY_EXCEEDS_MAX_ALLOWED_VALUE + ': ' + ShoppingCart.settings.cart.maximumTotalQuantityValue);
                return;
            }
        }

        window.location.href = PLUGIN_SHOPPINGCART.checkout_url;
    };

    /***********************************************************/
    /* Calculate the cart total price
    /***********************************************************/
    ShoppingCart.cartTotalPrice = function cartTotalPrice(item) {
        var orderPrice = 0;
        var i = 0;

        while (i < ShoppingCart.items.length) {
            orderPrice += ShoppingCart.items[i].product.price * ShoppingCart.items[i].quantity;
            i++;
        }

        orderPrice = parseFloat(orderPrice).toFixed(2);
        return orderPrice;
    };

    /***********************************************************/
    /* Add a product to the cart
    /* #refactor #todo #later
    /***********************************************************/
    ShoppingCart.addProduct = function addProduct(product, variations, quantity) {
        var existingProducts = jQuery(ShoppingCart.items).filter(function(index, item) { if (product.id == item.product.id) return true; }).toArray();

        //LATER
        // for (var variation in variations) {
        //     if (variations.hasOwnProperty(variation)) {
        //         existingProducts = jQuery(existingProducts).filter(function(index, item) { if (variations[variation] == item['variations'][variation]) return true; }).toArray();
        //     }
        // }

        var existingProduct = existingProducts[0];

        if (!existingProduct) {
            if (product.type === 'digital') product.isDigital = true;
            ShoppingCart.items.push({product: product, variations: variations, quantity: quantity});
        } else {
            existingProduct.quantity = parseInt(existingProduct.quantity) + parseInt(quantity);
        }

        ShoppingCart._saveCartToLocalstorage();
        //LATER
        // ShoppingCart.calculateItemsLeft();
        ShoppingCart.renderCart();
    };

    /***********************************************************/
    /* Save the shopping cart to the local storage
    /***********************************************************/
    ShoppingCart._saveCartToLocalstorage = function _saveCartToLocalstorage() {
        storejs.set('grav-shoppingcart-basket-data', JSON.stringify(ShoppingCart.items));
        storejs.set('grav-shoppingcart-basket-data-updatetime', new Date().getTime());
    };

    /***********************************************************/
    /* Clear the shopping cart
    /***********************************************************/
    ShoppingCart.clearCart = function clearCart() {
        ShoppingCart.items = [];
        storejs.remove('grav-shoppingcart-basket-data');

        var interval = setInterval(function() {
            if (ShoppingCart.settings != null) {
                clearInterval(interval);
                if (!ShoppingCart.settings.general.storeClientInformation) {
                    storejs.remove('grav-shoppingcart-person-address');
                }
            }
        }, 50);

        ShoppingCart._saveCartToLocalstorage();
    };

    /***********************************************************/
    /* Calculate the shopping cart subtotal for an item
    /***********************************************************/
    ShoppingCart.cartSubtotalPrice = function cartSubtotalPrice(item) {
        return parseFloat(item.product.price * item.quantity).toFixed(2);
    };

    /***********************************************************/
    /* Calculate the total price of a cart including taxes and shipment
    /***********************************************************/
    ShoppingCart.calculateTotalPriceIncludingTaxesAndShipment = function calculateTotalPriceIncludingTaxesAndShipment() {
        ShoppingCart.calculateTotalPriceIncludingTaxes();

        var total = parseFloat(ShoppingCart.totalOrderPriceIncludingTaxes).toFixed(2);
        if (!ShoppingCart.shipmentPrice) {
            return total;
        }

        total = parseFloat(total) + parseFloat(ShoppingCart.shipmentPrice);
        return parseFloat(total).toFixed(2);
    };

    /***********************************************************/
    /* Calculate the total price of a cart including taxes
    /***********************************************************/
    ShoppingCart.calculateTotalPriceIncludingTaxes = function calculateTotalPriceIncludingTaxes() {
        var orderPrice = 0;
        var i = 0;
        var totalPrice;
        var country = null;
        var percentage = 0;

        while (i < ShoppingCart.items.length) {
            orderPrice += ShoppingCart.items[i].product.price * ShoppingCart.items[i].quantity;
            i++;
        }


        if (ShoppingCart.productPriceDoesNotIncludeTaxes()) {
            //calculate country taxes
            country = jQuery(ShoppingCart.settings.countries).filter(function(index, item) { if (ShoppingCart.shippingAddress.country == item.name) return true; }).toArray()[0];
            if (!country) {
                country = jQuery(ShoppingCart.settings.countries).filter(function(index, item) { if (item.name == '*') return true; }).toArray()[0];
            }

            if (country) {
                if (country.isAllowed) {
                    percentage = parseInt(country.percentage);

                    if (country.name === 'US') {
                        if (ShoppingCart.settings.us_states) {
                            var state = jQuery(ShoppingCart.settings.us_states).filter(function(index, item) { if (ShoppingCart.shippingAddress.state == item.name) return true; }).toArray()[0];
                            if (state) {
                                percentage = state.percentage;
                            }
                        }
                    }
                }
            }

            if (percentage !== 0) {
                totalPrice = orderPrice + orderPrice * (percentage / 100);
            } else {
                totalPrice = orderPrice;
            }

        } else {
            totalPrice = orderPrice;
        }

        totalPrice = parseFloat(totalPrice.toFixed(2)).toFixed(2);

        ShoppingCart.taxesApplied = parseFloat(totalPrice - orderPrice).toFixed(2);
        ShoppingCart.totalOrderPriceIncludingTaxes = totalPrice;

        return totalPrice;
    };

    /***********************************************************/
    /* Return the current currency symbol
    /* #todo #stub
    /***********************************************************/
    ShoppingCart.currentCurrencySymbol = function currentCurrencySymbol() {
        return '$';
        //return jQuery(ShoppingCart.currencies).filter(function(index, item) { if (ShoppingCart.settings.general.defaultCurrency == item.code) return true; }).toArray()[0].symbol;
    };

    /***********************************************************/
    /* Determine if the cart should be shown in the current page
    /* #refactor
    /***********************************************************/
    ShoppingCart.shouldShowCart = function shouldShowCart() {
        if (ShoppingCart.currentPageIsCart || ShoppingCart.currentPageIsCheckout) {
                return true;
        }
        if (ShoppingCart.currentPageIsOrder) {
                return false;
        }

        if (ShoppingCart.items.length > 0) {
            return true;
        } else {
            return false;
        }
    };

    /***********************************************************/
    /* Determine the type of the current page
    /***********************************************************/
    ShoppingCart.currentPageIsProductOrProductsOrCart = function currentPageIsProductOrProductsOrCart() {
        return (ShoppingCart.currentPageIsProduct === true ||
                        ShoppingCart.currentPageIsProducts === true ||
                        ShoppingCart.currentPageIsCart === true);
    };

    /***********************************************************/
    /* Calculate if the cart content amount is greater than the minimum allowed
    /* #todo #stub
    /***********************************************************/
    ShoppingCart.orderAmountIsGreaterThenMinimum = function orderAmountIsGreaterThenMinimum() {
        return true;
        //TODO
        // if (!ShoppingCart.settings.cart.minimumSumToPlaceOrder) return true;
        // var cart = ShoppingCart.items;
        // var orderPrice = 0;
        // var i = 0;

        // while (i < cart.length) {
        //     orderPrice += cart[i].product.price * cart[i].quantity;
        //     i++;
        // }

        // return (parseInt(orderPrice) >= parseInt(ShoppingCart.settings.cart.minimumSumToPlaceOrder));
    };

    /***********************************************************/
    /* Calculate the shipment price
    /***********************************************************/
    ShoppingCart.generateShipmentPrice = function generateShipmentPrice() {
        if (ShoppingCart.settings.shipment.methods.length === 0) {
            ShoppingCart.shipmentPrice = 0.00;
            ShoppingCart.renderCart();
        } else if (ShoppingCart.settings.shipment.methods.length === 1) {
            ShoppingCart.shipmentPrice = parseFloat(ShoppingCart.settings.shipment.methods[0].price).toFixed(2);

            if (jQuery(ShoppingCart.items).filter(function(index, item) { if (item.product.type == 'phisical') return true }).toArray().length == 0) {
                //Digital only order. Don't show shipping options and set shipment price to 0
                jQuery('#checkout-choose-shipping-block').hide();
                jQuery('#checkout-choose-payment-block').removeClass('span6');
                ShoppingCart.shipmentPrice = 0;
            }

            ShoppingCart.renderCart();
        } else {
            var interval = setInterval(function() {
                var shipmentMethodName = jQuery('.js__shipment__method').val();
                if (shipmentMethodName) {
                    clearInterval(interval);
                }
                var thePrice = jQuery(ShoppingCart.settings.shipment.methods).filter(function(index, item) { if (shipmentMethodName == item.name) return true; }).toArray()[0];
                var price = 0;
                if (typeof thePrice !== 'undefined') {
                    price = thePrice.price;
                }
                if (isNaN(price)) {
                    price = 0;
                }

                price = parseFloat(price).toFixed(2);

                ShoppingCart.shipmentPrice = price;

                if (jQuery(ShoppingCart.items).filter(function(index, item) { if (item.product.type == 'phisical') return true }).toArray().length == 0) {
                    //Digital only order. Don't show shipping options and set shipment price to 0
                    jQuery('#checkout-choose-shipping-block').hide();
                    jQuery('#checkout-choose-payment-block').removeClass('span6');
                    ShoppingCart.shipmentPrice = 0;
                }

                ShoppingCart.renderCart();
            }, 50);
        }
    };

    /***********************************************************/
    /* Check if the setting to include taxes in product prices is disabled
    /***********************************************************/
    ShoppingCart.productPriceDoesNotIncludeTaxes = function productPriceDoesNotIncludeTaxes() {
        return false;
        //return ShoppingCart.settings.general.productTaxes !== 'included';
    };

    /***********************************************************/
    /* Get the currency symbol from the settings
    /***********************************************************/
    ShoppingCart.getCurrentCurrencySymbol = function getCurrentCurrencySymbol() {
        return jQuery(ShoppingCart.currencies).filter(function(index, item) { if (ShoppingCart.settings.general.defaultCurrency == item.code) return true; }).toArray()[0].symbol;
    };

    /***********************************************************/
    /* Get the "show currency before price" setting
    /* #todo #stub
    /***********************************************************/
    ShoppingCart.showCurrencyBeforePrice = function showCurrencyBeforePrice() {
        return true;
        //return ShoppingCart.settings.ui.currencySymbolPosition === 'before';
    };

    /***********************************************************/
    /* Return true if the passed country can buy from the shop
    /* #todo #stub
    /***********************************************************/
    ShoppingCart.countryCanBuy = function countryCanBuy(countryCode) {
        return true;
        // if (jQuery(ShoppingCart.settings.countries).filter(function(index, item) { if ((item.name == countryCode || item.name == '*') && item.isAllowed == true) return true; }).toArray().length > 0) {
        //     return true;
        // } else {
        //     return false;
        // }
    };

    /***********************************************************/
    /* Gets the country code relative to the country name passed
    /***********************************************************/
    ShoppingCart.getCodeOfCountry = function getCodeOfCountry(countryName) {
        return ShoppingCart.getCountries()[countryName];
    };

    /***********************************************************/
    /* Get the US States list
    /***********************************************************/
    ShoppingCart.getUSAStates = function getUSAStates() {
        return [
            {code: "AK", name: "Alaska"},
            {code: "AL", name: "Alabama"},
            {code: "AR", name: "Arkansas"},
            {code: "AZ", name: "Arizona"},
            {code: "CA", name: "California"},
            {code: "CO", name: "Colorado"},
            {code: "CT", name: "Connecticut"},
            {code: "DE", name: "Delaware"},
            {code: "DC", name: "District of Columbia"},
            {code: "FL", name: "Florida"},
            {code: "GA", name: "Georgia"},
            {code: "HI", name: "Hawaii"},
            {code: "IA", name: "Iowa"},
            {code: "ID", name: "Idaho"},
            {code: "IL", name: "Illinois"},
            {code: "IN", name: "Indiana"},
            {code: "KS", name: "Kansas"},
            {code: "KY", name: "Kentucky"},
            {code: "LA", name: "Louisiana"},
            {code: "MA", name: "Massachusetts"},
            {code: "MD", name: "Maryland"},
            {code: "ME", name: "Maine"},
            {code: "MI", name: "Michigan"},
            {code: "MN", name: "Minnesota"},
            {code: "MS", name: "Mississippi"},
            {code: "MO", name: "Missouri"},
            {code: "MT", name: "Montana"},
            {code: "NC", name: "North Carolina"},
            {code: "ND", name: "North Dakota"},
            {code: "NE", name: "Nebraska"},
            {code: "NH", name: "New Hampshire"},
            {code: "NJ", name: "New Jersey"},
            {code: "NM", name: "New Mexico"},
            {code: "NV", name: "Nevada"},
            {code: "NY", name: "New York"},
            {code: "OH", name: "Ohio"},
            {code: "OK", name: "Oklahoma"},
            {code: "OR", name: "Oregon"},
            {code: "PA", name: "Pennsylvania"},
            {code: "RI", name: "Rhode Island"},
            {code: "SC", name: "South Carolina"},
            {code: "SD", name: "South Dakota"},
            {code: "TN", name: "Tennessee"},
            {code: "TX", name: "Texas"},
            {code: "UT", name: "Utah"},
            {code: "VA", name: "Virginia"},
            {code: "VT", name: "Vermont"},
            {code: "WA", name: "Washington"},
            {code: "WI", name: "Wisconsin"},
            {code: "WV", name: "West Virginia"},
            {code: "WY", name: "Wyoming"}];
    };

    /***********************************************************/
    /* Get the World Countries list
    /***********************************************************/
    ShoppingCart.getCountries = function getCountries() {
        var countryCodes = [];

        countryCodes['Afghanistan'] = 'AF';
        countryCodes['Albania'] = 'AL';
        countryCodes['Algeria'] = 'DZ';
        countryCodes['American Samoa'] = 'AS';
        countryCodes['Andorra'] = 'AD';
        countryCodes['Angola'] = 'AO';
        countryCodes['Anguilla'] = 'AI';
        countryCodes['Antarctica'] = 'AQ';
        countryCodes['Antigua and Barbuda'] = 'AG';
        countryCodes['Argentina'] = 'AR';
        countryCodes['Armenia'] = 'AM';
        countryCodes['Aruba'] = 'AW';
        countryCodes['Australia'] = 'AU';
        countryCodes['Austria'] = 'AT';
        countryCodes['Azerbaijan'] = 'AZ';
        countryCodes['Bahrain'] = 'BH';
        countryCodes['Bangladesh'] = 'BD';
        countryCodes['Barbados'] = 'BB';
        countryCodes['Belarus'] = 'BY';
        countryCodes['Belgium'] = 'BE';
        countryCodes['Belize'] = 'BZ';
        countryCodes['Benin'] = 'BJ';
        countryCodes['Bermuda'] = 'BM';
        countryCodes['Bhutan'] = 'BT';
        countryCodes['Bolivia'] = 'BO';
        countryCodes['Bosnia and Herzegovina'] = 'BA';
        countryCodes['Botswana'] = 'BW';
        countryCodes['Bouvet Island'] = 'BV';
        countryCodes['Brazil'] = 'BR';
        countryCodes['British Indian Ocean Territory'] = 'IO';
        countryCodes['British Virgin Islands'] = 'VG';
        countryCodes['Brunei'] = 'BN';
        countryCodes['Bulgaria'] = 'BG';
        countryCodes['Burkina Faso'] = 'BF';
        countryCodes['Burundi'] = 'BI';
        countryCodes['Côte d\'Ivoire'] = 'CI';
        countryCodes['Cambodia'] = 'KH';
        countryCodes['Cameroon'] = 'CM';
        countryCodes['Canada'] = 'CA';
        countryCodes['Cape Verde'] = 'CV';
        countryCodes['Cayman Islands'] = 'KY';
        countryCodes['Central African Republic'] = 'CF';
        countryCodes['Chad'] = 'TD';
        countryCodes['Chile'] = 'CL';
        countryCodes['China'] = 'CN';
        countryCodes['Christmas Island'] = 'CX';
        countryCodes['Cocos (Keeling) Islands'] = 'CC';
        countryCodes['Colombia'] = 'CO';
        countryCodes['Comoros'] = 'KM';
        countryCodes['Congo'] = 'CG';
        countryCodes['Cook Islands'] = 'CK';
        countryCodes['Costa Rica'] = 'CR';
        countryCodes['Croatia'] = 'HR';
        countryCodes['Cuba'] = 'CU';
        countryCodes['Cyprus'] = 'CY';
        countryCodes['Czech Republic'] = 'CZ';
        countryCodes['Democratic Republic of the Congo'] = 'CD';
        countryCodes['Denmark'] = 'DK';
        countryCodes['Djibouti'] = 'DJ';
        countryCodes['Dominica'] = 'DM';
        countryCodes['Dominican Republic'] = 'DO';
        countryCodes['East Timor'] = 'TP';
        countryCodes['Ecuador'] = 'EC';
        countryCodes['Egypt'] = 'EG';
        countryCodes['El Salvador'] = 'SV';
        countryCodes['Equatorial Guinea'] = 'GQ';
        countryCodes['Eritrea'] = 'ER';
        countryCodes['Estonia'] = 'EE';
        countryCodes['Ethiopia'] = 'ET';
        countryCodes['Faeroe Islands'] = 'FO';
        countryCodes['Falkland Islands'] = 'FK';
        countryCodes['Fiji'] = 'FJ';
        countryCodes['Finland'] = 'FI';
        countryCodes['Former Yugoslav Republic of Macedonia'] = 'MK';
        countryCodes['France'] = 'FR';
        countryCodes['France, Metropolitan'] = 'FX';
        countryCodes['French Guiana'] = 'GF';
        countryCodes['French Polynesia'] = 'PF';
        countryCodes['French Southern Territories'] = 'TF';
        countryCodes['Gabon'] = 'GA';
        countryCodes['Georgia'] = 'GE';
        countryCodes['Germany'] = 'DE';
        countryCodes['Ghana'] = 'GH';
        countryCodes['Gibraltar'] = 'GI';
        countryCodes['Greece'] = 'GR';
        countryCodes['Greenland'] = 'GL';
        countryCodes['Grenada'] = 'GD';
        countryCodes['Guadeloupe'] = 'GP';
        countryCodes['Guam'] = 'GU';
        countryCodes['Guatemala'] = 'GT';
        countryCodes['Guinea'] = 'GN';
        countryCodes['Guinea-Bissau'] = 'GW';
        countryCodes['Guyana'] = 'GY';
        countryCodes['Haiti'] = 'HT';
        countryCodes['Heard and Mc Donald Islands'] = 'HM';
        countryCodes['Honduras'] = 'HN';
        countryCodes['Hong Kong'] = 'HK';
        countryCodes['Hungary'] = 'HU';
        countryCodes['Iceland'] = 'IS';
        countryCodes['India'] = 'IN';
        countryCodes['Indonesia'] = 'ID';
        countryCodes['Iran'] = 'IR';
        countryCodes['Iraq'] = 'IQ';
        countryCodes['Ireland'] = 'IE';
        countryCodes['Israel'] = 'IL';
        countryCodes['Italy'] = 'IT';
        countryCodes['Jamaica'] = 'JM';
        countryCodes['Japan'] = 'JP';
        countryCodes['Jordan'] = 'JO';
        countryCodes['Kazakhstan'] = 'KZ';
        countryCodes['Kenya'] = 'KE';
        countryCodes['Kiribati'] = 'KI';
        countryCodes['Kuwait'] = 'KW';
        countryCodes['Kyrgyzstan'] = 'KG';
        countryCodes['Laos'] = 'LA';
        countryCodes['Latvia'] = 'LV';
        countryCodes['Lebanon'] = 'LB';
        countryCodes['Lesotho'] = 'LS';
        countryCodes['Liberia'] = 'LR';
        countryCodes['Libya'] = 'LY';
        countryCodes['Liechtenstein'] = 'LI';
        countryCodes['Lithuania'] = 'LT';
        countryCodes['Luxembourg'] = 'LU';
        countryCodes['Macau'] = 'MO';
        countryCodes['Madagascar'] = 'MG';
        countryCodes['Malawi'] = 'MW';
        countryCodes['Malaysia'] = 'MY';
        countryCodes['Maldives'] = 'MV';
        countryCodes['Mali'] = 'ML';
        countryCodes['Malta'] = 'MLT';
        countryCodes['Mayotte'] = 'MT';
        countryCodes['Marshall Islands'] = 'MH';
        countryCodes['Martinique'] = 'MQ';
        countryCodes['Mauritania'] = 'MR';
        countryCodes['Mauritius'] = 'MU';
        countryCodes['Mexico'] = 'MX';
        countryCodes['Micronesia'] = 'FM';
        countryCodes['Moldova'] = 'MD';
        countryCodes['Monaco'] = 'MC';
        countryCodes['Mongolia'] = 'MN';
        countryCodes['Montenegro'] = 'ME';
        countryCodes['Montserrat'] = 'MS';
        countryCodes['Morocco'] = 'MA';
        countryCodes['Mozambique'] = 'MZ';
        countryCodes['Myanmar'] = 'MM';
        countryCodes['Namibia'] = 'NA';
        countryCodes['Nauru'] = 'NR';
        countryCodes['Nepal'] = 'NP';
        countryCodes['Netherlands'] = 'NL';
        countryCodes['Netherlands Antilles'] = 'AN';
        countryCodes['New Caledonia'] = 'NC';
        countryCodes['New Zealand'] = 'NZ';
        countryCodes['Nicaragua'] = 'NI';
        countryCodes['Niger'] = 'NE';
        countryCodes['Nigeria'] = 'NG';
        countryCodes['Niue'] = 'NU';
        countryCodes['Norfolk Island'] = 'NF';
        countryCodes['North Korea'] = 'KP';
        countryCodes['Northern Marianas'] = 'MP';
        countryCodes['Norway'] = 'NO';
        countryCodes['Oman'] = 'OM';
        countryCodes['Pakistan'] = 'PK';
        countryCodes['Palau'] = 'PW';
        countryCodes['Panama'] = 'PA';
        countryCodes['Papua New Guinea'] = 'PG';
        countryCodes['Paraguay'] = 'PY';
        countryCodes['Peru'] = 'PE';
        countryCodes['Philippines'] = 'PH';
        countryCodes['Pitcairn Islands'] = 'PN';
        countryCodes['Poland'] = 'PL';
        countryCodes['Portugal'] = 'PT';
        countryCodes['Puerto Rico'] = 'PR';
        countryCodes['Qatar'] = 'QA';
        countryCodes['Reunion'] = 'RE';
        countryCodes['Romania'] = 'RO';
        countryCodes['Russia'] = 'RU';
        countryCodes['Rwanda'] = 'RW';
        countryCodes['São Tomé and Príncipe'] = 'ST';
        countryCodes['Saint Helena'] = 'SH';
        countryCodes['St. Pierre and Miquelon'] = 'PM';
        countryCodes['Saint Kitts and Nevis'] = 'KN';
        countryCodes['Saint Lucia'] = 'LC';
        countryCodes['Saint Vincent and the Grenadines'] = 'VC';
        countryCodes['Samoa'] = 'WS';
        countryCodes['San Marino'] = 'SM';
        countryCodes['Saudi Arabia'] = 'SA';
        countryCodes['Senegal'] = 'SN';
        countryCodes['Serbia'] = 'RS';
        countryCodes['Seychelles'] = 'SC';
        countryCodes['Sierra Leone'] = 'SL';
        countryCodes['Singapore'] = 'SG';
        countryCodes['Slovakia'] = 'SK';
        countryCodes['Slovenia'] = 'SI';
        countryCodes['Solomon Islands'] = 'SB';
        countryCodes['Somalia'] = 'SO';
        countryCodes['South Africa'] = 'ZA';
        countryCodes['South Georgia and the South Sandwich Islands'] = 'GS';
        countryCodes['South Korea'] = 'KR';
        countryCodes['Spain'] = 'ES';
        countryCodes['Sri Lanka'] = 'LK';
        countryCodes['Sudan'] = 'SD';
        countryCodes['Suriname'] = 'SR';
        countryCodes['Svalbard and Jan Mayen Islands'] = 'SJ';
        countryCodes['Swaziland'] = 'SZ';
        countryCodes['Sweden'] = 'SE';
        countryCodes['Switzerland'] = 'CH';
        countryCodes['Syria'] = 'SY';
        countryCodes['Taiwan'] = 'TW';
        countryCodes['Tajikistan'] = 'TJ';
        countryCodes['Tanzania'] = 'TZ';
        countryCodes['Thailand'] = 'TH';
        countryCodes['The Bahamas'] = 'BS';
        countryCodes['The Gambia'] = 'GM';
        countryCodes['Togo'] = 'TG';
        countryCodes['Tokelau'] = 'TK';
        countryCodes['Tonga'] = 'T0';
        countryCodes['Trinidad and Tobago'] = 'TT';
        countryCodes['Tunisia'] = 'TN';
        countryCodes['Turkey'] = 'TR';
        countryCodes['Turkmenistan'] = 'TM';
        countryCodes['Turks and Caicos Islands'] = 'TC';
        countryCodes['Tuvalu'] = 'TV';
        countryCodes['US Virgin Islands'] = 'VI';
        countryCodes['Uganda'] = 'UG';
        countryCodes['Ukraine'] = 'UA';
        countryCodes['United Arab Emirates'] = 'AE';
        countryCodes['United Kingdom'] = 'GB';
        countryCodes['United States'] = 'US';
        countryCodes['United States Minor Outlying Islands'] = 'UM';
        countryCodes['Uruguay'] = 'UY';
        countryCodes['Uzbekistan'] = 'UZ';
        countryCodes['Vanuatu'] = 'VU';
        countryCodes['Vatican City'] = 'VA';
        countryCodes['Venezuela'] = 'VE';
        countryCodes['Vietnam'] = 'VN';
        countryCodes['Wallis and Futuna Islands'] = 'WF';
        countryCodes['Western Sahara'] = 'EH';
        countryCodes['Yemen'] = 'YE';
        countryCodes['Zambia'] = 'ZM';
        countryCodes['Zimbabwe'] = 'ZW';

        return countryCodes;
    };

    /***********************************************************/
    /* Get the World Currencies list
    /***********************************************************/
    ShoppingCart.currencies = [
        {"code":"AED","symbol":"\u062f.\u0625;","name":"UAE dirham"},
        {"code":"AFN","symbol":"Afs","name":"Afghan afghani"},
        {"code":"ALL","symbol":"L","name":"Albanian lek"},
        {"code":"AMD","symbol":"AMD","name":"Armenian dram"},
        {"code":"ANG","symbol":"NA\u0192","name":"Netherlands Antillean gulden"},
        {"code":"AOA","symbol":"Kz","name":"Angolan kwanza"},
        {"code":"ARS","symbol":"$","name":"Argentine peso"},
        {"code":"AUD","symbol":"$","name":"Australian dollar"},
        {"code":"AWG","symbol":"\u0192","name":"Aruban florin"},
        {"code":"AZN","symbol":"AZN","name":"Azerbaijani manat"},
        {"code":"BAM","symbol":"KM","name":"Bosnia and Herzegovina konvertibilna marka"},
        {"code":"BBD","symbol":"Bds$","name":"Barbadian dollar"},
        {"code":"BDT","symbol":"\u09f3","name":"Bangladeshi taka"},
        {"code":"BGN","symbol":"BGN","name":"Bulgarian lev"},
        {"code":"BHD","symbol":".\u062f.\u0628","name":"Bahraini dinar"},
        {"code":"BIF","symbol":"FBu","name":"Burundi franc"},
        {"code":"BMD","symbol":"BD$","name":"Bermudian dollar"},
        {"code":"BND","symbol":"B$","name":"Brunei dollar"},
        {"code":"BOB","symbol":"Bs.","name":"Bolivian boliviano"},
        {"code":"BRL","symbol":"R$","name":"Brazilian real"},
        {"code":"BSD","symbol":"B$","name":"Bahamian dollar"},
        {"code":"BTN","symbol":"Nu.","name":"Bhutanese ngultrum"},
        {"code":"BWP","symbol":"P","name":"Botswana pula"},
        {"code":"BYR","symbol":"Br","name":"Belarusian ruble"},
        {"code":"BZD","symbol":"BZ$","name":"Belize dollar"},
        {"code":"CAD","symbol":"$","name":"Canadian dollar"},
        {"code":"CDF","symbol":"F","name":"Congolese franc"},
        {"code":"CHF","symbol":"Fr.","name":"Swiss franc"},
        {"code":"CLP","symbol":"$","name":"Chilean peso"},
        {"code":"CNY","symbol":"\u00a5","name":"Chinese/Yuan renminbi"},
        {"code":"COP","symbol":"Col$","name":"Colombian peso"},
        {"code":"CRC","symbol":"\u20a1","name":"Costa Rican colon"},
        {"code":"CUC","symbol":"$","name":"Cuban peso"},
        {"code":"CVE","symbol":"Esc","name":"Cape Verdean escudo"},
        {"code":"CZK","symbol":"K\u010d","name":"Czech koruna"},
        {"code":"DJF","symbol":"Fdj","name":"Djiboutian franc"},
        {"code":"DKK","symbol":"Kr","name":"Danish krone"},
        {"code":"DOP","symbol":"RD$","name":"Dominican peso"},
        {"code":"DZD","symbol":"\u062f.\u062c","name":"Algerian dinar"},
        {"code":"EEK","symbol":"KR","name":"Estonian kroon"},
        {"code":"EGP","symbol":"\u00a3","name":"Egyptian pound"},
        {"code":"ERN","symbol":"Nfa","name":"Eritrean nakfa"},
        {"code":"ETB","symbol":"Br","name":"Ethiopian birr"},
        {"code":"EUR","symbol":"\u20ac","name":"European Euro"},
        {"code":"FJD","symbol":"FJ$","name":"Fijian dollar"},
        {"code":"FKP","symbol":"\u00a3","name":"Falkland Islands pound"},
        {"code":"GBP","symbol":"\u00a3","name":"British pound"},
        {"code":"GEL","symbol":"GEL","name":"Georgian lari"},
        {"code":"GHS","symbol":"GH\u20b5","name":"Ghanaian cedi"},
        {"code":"GIP","symbol":"\u00a3","name":"Gibraltar pound"},
        {"code":"GMD","symbol":"D","name":"Gambian dalasi"},
        {"code":"GNF","symbol":"FG","name":"Guinean franc"},
        {"code":"GQE","symbol":"CFA","name":"Central African CFA franc"},
        {"code":"GTQ","symbol":"Q","name":"Guatemalan quetzal"},
        {"code":"GYD","symbol":"GY$","name":"Guyanese dollar"},
        {"code":"HKD","symbol":"HK$","name":"Hong Kong dollar"},
        {"code":"HNL","symbol":"L","name":"Honduran lempira"},
        {"code":"HRK","symbol":"kn","name":"Croatian kuna"},
        {"code":"HTG","symbol":"G","name":"Haitian gourde"},
        {"code":"HUF","symbol":"Ft","name":"Hungarian forint"},
        {"code":"IDR","symbol":"Rp","name":"Indonesian rupiah"},
        {"code":"ILS","symbol":"\u20aa","name":"Israeli new sheqel"},
        {"code":"INR","symbol":"\u2089","name":"Indian rupee"},
        {"code":"IQD","symbol":"\u062f.\u0639","name":"Iraqi dinar"},
        {"code":"IRR","symbol":"IRR","name":"Iranian rial"},
        {"code":"ISK","symbol":"kr","name":"Icelandic kr\u00f3na"},
        {"code":"JMD","symbol":"J$","name":"Jamaican dollar"},
        {"code":"JOD","symbol":"JOD","name":"Jordanian dinar"},
        {"code":"JPY","symbol":"\u00a5","name":"Japanese yen"},
        {"code":"KES","symbol":"KSh","name":"Kenyan shilling"},
        {"code":"KGS","symbol":"\u0441\u043e\u043c","name":"Kyrgyzstani som"},
        {"code":"KHR","symbol":"\u17db","name":"Cambodian riel"},
        {"code":"KMF","symbol":"KMF","name":"Comorian franc"},
        {"code":"KPW","symbol":"W","name":"North Korean won"},
        {"code":"KRW","symbol":"W","name":"South Korean won"},
        {"code":"KWD","symbol":"KWD","name":"Kuwaiti dinar"},
        {"code":"KYD","symbol":"KY$","name":"Cayman Islands dollar"},
        {"code":"KZT","symbol":"T","name":"Kazakhstani tenge"},
        {"code":"LAK","symbol":"KN","name":"Lao kip"},
        {"code":"LBP","symbol":"\u00a3","name":"Lebanese lira"},
        {"code":"LKR","symbol":"Rs","name":"Sri Lankan rupee"},
        {"code":"LRD","symbol":"L$","name":"Liberian dollar"},
        {"code":"LSL","symbol":"M","name":"Lesotho loti"},
        {"code":"LTL","symbol":"Lt","name":"Lithuanian litas"},
        {"code":"LVL","symbol":"Ls","name":"Latvian lats"},
        {"code":"LYD","symbol":"LD","name":"Libyan dinar"},
        {"code":"MAD","symbol":"MAD","name":"Moroccan dirham"},
        {"code":"MDL","symbol":"MDL","name":"Moldovan leu"},
        {"code":"MGA","symbol":"FMG","name":"Malagasy ariary"},
        {"code":"MKD","symbol":"MKD","name":"Macedonian denar"},
        {"code":"MMK","symbol":"K","name":"Myanma kyat"},
        {"code":"MNT","symbol":"\u20ae","name":"Mongolian tugrik"},
        {"code":"MOP","symbol":"P","name":"Macanese pataca"},
        {"code":"MRO","symbol":"UM","name":"Mauritanian ouguiya"},
        {"code":"MUR","symbol":"Rs","name":"Mauritian rupee"},
        {"code":"MVR","symbol":"Rf","name":"Maldivian rufiyaa"},
        {"code":"MWK","symbol":"MK","name":"Malawian kwacha"},
        {"code":"MXN","symbol":"$","name":"Mexican peso"},
        {"code":"MYR","symbol":"RM","name":"Malaysian ringgit"},
        {"code":"MZM","symbol":"MTn","name":"Mozambican metical"},
        {"code":"NAD","symbol":"N$","name":"Namibian dollar"},
        {"code":"NGN","symbol":"\u20a6","name":"Nigerian naira"},
        {"code":"NIO","symbol":"C$","name":"Nicaraguan c\u00f3rdoba"},
        {"code":"NOK","symbol":"kr","name":"Norwegian krone"},
        {"code":"NPR","symbol":"NRs","name":"Nepalese rupee"},
        {"code":"NZD","symbol":"NZ$","name":"New Zealand dollar"},
        {"code":"OMR","symbol":"OMR","name":"Omani rial"},
        {"code":"PAB","symbol":"B./","name":"Panamanian balboa"},
        {"code":"PEN","symbol":"S/.","name":"Peruvian nuevo sol"},
        {"code":"PGK","symbol":"K","name":"Papua New Guinean kina"},
        {"code":"PHP","symbol":"\u20b1","name":"Philippine peso"},
        {"code":"PKR","symbol":"Rs.","name":"Pakistani rupee"},
        {"code":"PLN","symbol":"z\u0142","name":"Polish zloty"},
        {"code":"PYG","symbol":"\u20b2","name":"Paraguayan guarani"},
        {"code":"QAR","symbol":"QR","name":"Qatari riyal"},
        {"code":"RON","symbol":"L","name":"Romanian leu"},
        {"code":"RSD","symbol":"din.","name":"Serbian dinar"},
        {"code":"RUB","symbol":"P","name":"Russian ruble"},
        {"code":"SAR","symbol":"SR","name":"Saudi riyal"},
        {"code":"SBD","symbol":"SI$","name":"Solomon Islands dollar"},
        {"code":"SCR","symbol":"SR","name":"Seychellois rupee"},
        {"code":"SDG","symbol":"SDG","name":"Sudanese pound"},
        {"code":"SEK","symbol":"kr","name":"Swedish krona"},
        {"code":"SGD","symbol":"S$","name":"Singapore dollar"},
        {"code":"SHP","symbol":"\u00a3","name":"Saint Helena pound"},
        {"code":"SLL","symbol":"Le","name":"Sierra Leonean leone"},
        {"code":"SOS","symbol":"Sh.","name":"Somali shilling"},
        {"code":"SRD","symbol":"$","name":"Surinamese dollar"},
        {"code":"SYP","symbol":"LS","name":"Syrian pound"},
        {"code":"SZL","symbol":"E","name":"Swazi lilangeni"},
        {"code":"THB","symbol":"\u0e3f","name":"Thai baht"},
        {"code":"TJS","symbol":"TJS","name":"Tajikistani somoni"},
        {"code":"TMT","symbol":"m","name":"Turkmen manat"},
        {"code":"TND","symbol":"DT","name":"Tunisian dinar"},
        {"code":"TRY","symbol":"TL","name":"Turkish new lira"},
        {"code":"TTD","symbol":"TT$","name":"Trinidad and Tobago dollar"},
        {"code":"TWD","symbol":"NT$","name":"New Taiwan dollar"},
        {"code":"TZS","symbol":"TZS","name":"Tanzanian shilling"},
        {"code":"UAH","symbol":"грн.","name":"Ukrainian hryvnia"},
        {"code":"UGX","symbol":"USh","name":"Ugandan shilling"},
        {"code":"USD","symbol":"$","name":"United States dollar"},
        {"code":"UYU","symbol":"$U","name":"Uruguayan peso"},
        {"code":"UZS","symbol":"UZS","name":"Uzbekistani som"},
        {"code":"VEB","symbol":"Bs","name":"Venezuelan bolivar"},
        {"code":"VND","symbol":"\u20ab","name":"Vietnamese dong"},
        {"code":"VUV","symbol":"VT","name":"Vanuatu vatu"},
        {"code":"WST","symbol":"WS$","name":"Samoan tala"},
        {"code":"XAF","symbol":"CFA","name":"Central African CFA franc"},
        {"code":"XCD","symbol":"EC$","name":"East Caribbean dollar"},
        {"code":"XDR","symbol":"SDR","name":"Special Drawing Rights"},
        {"code":"XOF","symbol":"CFA","name":"West African CFA franc"},
        {"code":"XPF","symbol":"F","name":"CFP franc"},
        {"code":"YER","symbol":"YER","name":"Yemeni rial"},
        {"code":"ZAR","symbol":"R","name":"South African rand"},
        {"code":"ZMK","symbol":"ZK","name":"Zambian kwacha"},
        {"code":"ZWR","symbol":"Z$","name":"Zimbabwean dollar"}
    ];


    /***********************************************************/
    /* Ensure I can add this quantity to the cart
    /* #todo #stub
    /***********************************************************/
    ShoppingCart.canAddToCartThisQuantityOfThisProduct = function canAddToCartThisQuantityOfThisProduct(product, quantity) {

        return true;

        // if (ShoppingCart.settings.cart.limitDigitalProductsToSingleQuantity && (product.isDigital || product.type == 'digital')) {
        //     for (var j = 0; j < ShoppingCart.items.length; j++) {
        //         if (ShoppingCart.items[j].product.id == product.id) {
        //             return false;
        //         }
        //     }
        // }

        // if (product.variations && product.variations.manageStock) { //variations have stock management
        //     var variations = {};

        //     if (product.variations && product.variations.variations) {
        //         var i = 0;
        //         var variationsNumber = product.variations.variations.length;
        //         if (variationsNumber > 0) {
        //             while (i < variationsNumber) {

        //                 if (jQuery('.variations select').get(i)) {
        //                     var name = product.variations.variations[i].name;
        //                     var val = jQuery(jQuery('.variations select').get(i)).val();

        //                     variations[name] = val;
        //                 }

        //                 i++;
        //             }
        //         }
        //     }

        //     for (var j = 0; j < ShoppingCart.items.length; j++) {
        //         if (ShoppingCart.items[j].product.id == product.id && ShoppingCart.isEquivalent(ShoppingCart.items[j].variations, variations)) {
        //             if (parseInt(ShoppingCart.items[j].quantity) + parseInt(quantity) > parseInt(product.quantity_available)) {
        //                 return false;
        //             } else {
        //                 return true;
        //             }
        //         }
        //     }

        //     if (parseInt(quantity) > parseInt(product.quantity_available)) {
        //         return false;
        //     }

        //     return true;

        // } else {
        //     if (product.quantity_available === '') return true;
        // }

        // for (var j = 0; j < ShoppingCart.items.length; j++) {
        //     if (ShoppingCart.items[j].product.id == product.id) {
        //         if (parseInt(ShoppingCart.items[j].quantity) + parseInt(quantity) > parseInt(product.quantity_available)) {
        //             return false;
        //         } else {
        //             return true;
        //         }
        //     }
        // }

        // if (parseInt(quantity) > parseInt(product.quantity_available)) {
        //     return false;
        // }

        // return true;


    };

    /***********************************************************/
    /* Compare the values of 2 objects
    /***********************************************************/
    ShoppingCart.isEquivalent = function isEquivalent(a, b) {
        // Create arrays of property names
        var aProps = Object.getOwnPropertyNames(a);
        var bProps = Object.getOwnPropertyNames(b);

        // If number of properties is different,
        // objects are not equivalent
        if (aProps.length != bProps.length) {
                return false;
        }

        for (var i = 0; i < aProps.length; i++) {
                var propName = aProps[i];

                // If values of same property are not equal,
                // objects are not equivalent
                if (a[propName] !== b[propName]) {
                        return false;
                }
        }

        // If we made it this far, objects
        // are considered equivalent
        return true;
    };

    /***********************************************************/
    /* Render the cart
    /***********************************************************/
    ShoppingCart.renderCart = function renderCart() {
        var $cart = jQuery('.js__shoppingcart-cart');
        var $cartTitle = jQuery('.js__shoppingcart-cart__title');

        var thead = $cart.find('thead');
        var tbody = $cart.find('tbody');

        thead.html('');
        tbody.html('');

        if (ShoppingCart.items.length === 0) {
            $cart.removeClass('has-products');
            $cartTitle.hide();
            return;
        } else {
            $cart.addClass('has-products');
            if (ShoppingCart.currentPageIsProduct) $cartTitle.text(window.PLUGIN_SHOPPINGCART.translations.SHOPPING_CART);
            if (ShoppingCart.currentPageIsProducts) $cartTitle.text(window.PLUGIN_SHOPPINGCART.translations.SHOPPING_CART);
            if (ShoppingCart.currentPageIsCheckout) $cartTitle.text(window.PLUGIN_SHOPPINGCART.translations.YOU_ARE_PURCHASING_THESE_ITEMS);
            if (ShoppingCart.currentPageIsOrder) $cartTitle.text(window.PLUGIN_SHOPPINGCART.translations.ITEMS_PURCHASED);
            if (ShoppingCart.currentPageIsOrderCancelled) $cartTitle.text(window.PLUGIN_SHOPPINGCART.translations.SHOPPING_CART);
            if (ShoppingCart.currentPageIsCart) $cartTitle.text(window.PLUGIN_SHOPPINGCART.translations.SHOPPING_CART);
            $cartTitle.show();
        }

        thead.html('<tr>' +
                             '<th class="cart-product">' + window.PLUGIN_SHOPPINGCART.translations.ITEM + '</th>' +
                             '<th class="cart-product-price">' + window.PLUGIN_SHOPPINGCART.translations.PRICE + '</th>' +
                             '<th class="cart-product-quantity">' + window.PLUGIN_SHOPPINGCART.translations.QUANTITY + '</th>' +
                             '<th class="cart-product-total">' + window.PLUGIN_SHOPPINGCART.translations.TOTAL + '</th>' +
                             '<th class="cart-product-remove-button">' + '</th>' +
                             '</tr>');
        var currencySymbol = ShoppingCart.currentCurrencySymbol();

        var rows_html = '';

        for (var i = 0; i < ShoppingCart.items.length; i++) {
            var item = ShoppingCart.items[i];
            var row = '<tr><td class="cart-product">';

            // if (item.product.defaultPhoto) {
            //   row += '<img src="' + ShoppingCart.baseURL + '/media/com_shoppingcart/attachments/' + item.product.defaultPhoto + '" class="img-polaroid" style="width: 30px; padding:0px!important"> ';
            // }

            if (item.product.url) {
                row += '<a href="' + decodeURIComponent(item.product.url) + '" class="cart-product-name">' + item.product.title + '</a>';
            } else {
                row += item.product.title;
            }
            // if (item.variations) {
            //     row += '&nbsp;<span class="variations">' + ShoppingCart.printVariation(item) + '</span>';
            // }
            row += '</td>';

            /***********************************************************/
            /* Price
            /***********************************************************/
            row += '<td class="cart-product-price">';
            if (ShoppingCart.showCurrencyBeforePrice()) {
                row += ShoppingCart.currentCurrencySymbol() + ' ' + parseFloat(item.product.price).toFixed(2);
            } else {
                row += parseFloat(item.product.price).toFixed(2) + ' ' + ShoppingCart.currentCurrencySymbol();
            }
            row += '</td>';

            /***********************************************************/
            /* Quantity
            /***********************************************************/

            row += '<td class="cart-product-quantity">';

            //TODO
            // if (ShoppingCart.settings.cart.allowEditingQuantityFromCart) {
            //     if (ShoppingCart.currentPageIsProductOrProductsOrCart()) {
            //         if (item.product.isDigital) {
            //             if (ShoppingCart.settings.cart.limitDigitalProductsToSingleQuantity) {
            //                 row += item.quantity;
            //             } else {
            //                 row += '<input value="' + item.quantity + '" class="input-mini js__shoppingcart__quantity-box-cart" data-id="' + i + '" />';
            //             }
            //         } else {
            //             row += '<input value="' + item.quantity + '" class="input-mini js__shoppingcart__quantity-box-cart" data-id="' + i + '" />';
            //         }
            //     } else {
            //         row += item.quantity;
            //     }
            // } else {
                row += item.quantity;
            // }

            /***********************************************************/
            /* Total
            /***********************************************************/

            //TODO
            //
            // if (ShoppingCart.settings.ui.currencySymbolPosition === 'after') {
            //     row += '<td class="cart-product-total">' + parseFloat(ShoppingCart.cartSubtotalPrice(item)).toFixed(2) + '<span class="currency"> ' + currencySymbol + '</span>' + '</td>';
            // } else {
                row += '<td class="cart-product-total">' + '<span class="currency">' + currencySymbol + '</span> ' + parseFloat(ShoppingCart.cartSubtotalPrice(item)).toFixed(2) + '</td>';
            // }

            row += '<td class="cart-product-remove-button">';

            if (ShoppingCart.currentPageIsProductOrProductsOrCart()) {
                row += '<a class="btn btn-small js__shoppingcart__remove-from-cart" data-id="' + i + '">' + window.PLUGIN_SHOPPINGCART.translations.REMOVE + '</a>';
            }

            row += '</td>';
            row += '</tr>';

            rows_html += row;
        }


        /***********************************************************/
        /* Additional lines after products
        /***********************************************************/

        row = '<tr>';

        if (ShoppingCart.currentPageIsProduct) {
            row += '<td class="goback"><a class="btn btn-success js__shoppingcart__continue-shopping">' + window.PLUGIN_SHOPPINGCART.translations.CONTINUE_SHOPPING + '</a></td>';
        } else {
            row += '<td class="empty"></td>';
        }

        row += '<td class="empty"></td>';
        row += '<td class="empty"></td>';
        row += '<td class="cart-product-total">';

        if (ShoppingCart.showCurrencyBeforePrice()) {
            row += ShoppingCart.currentCurrencySymbol() + ' ' + ShoppingCart.cartTotalPrice();
        } else {
            row += ShoppingCart.cartTotalPrice() + ' ' + ShoppingCart.currentCurrencySymbol();
        }

        row += '</td>';


        /***********************************************************/
        /* Checkout / or yet reached minimum order level
        /***********************************************************/
        row += '<td>';

        var atLeastAProductIsAdded = false;

        ShoppingCart.items.forEach(function(item) {
            if (item.quantity != "0" && item.quantity != "") {
                atLeastAProductIsAdded = true;
            }
        });

        if (atLeastAProductIsAdded) {
            if (ShoppingCart.orderAmountIsGreaterThenMinimum()) {
                if (ShoppingCart.currentPageIsProductOrProductsOrCart()) {
                    row += '<button class="btn btn-success js__shoppingcart__proceed-to-checkout">' + window.PLUGIN_SHOPPINGCART.translations.CHECKOUT + '</button>';
                }
                if (ShoppingCart.currentPageIsOrderCancelled) {
                    row += '<button class="btn btn-success js__shoppingcart__proceed-to-checkout">' + window.PLUGIN_SHOPPINGCART.translations.CHECKOUT + '</button>';
                }
            } else {
                row += window.PLUGIN_SHOPPINGCART.translations.MINIMUM_TO_PLACE_AN_ORDER;

                if (ShoppingCart.showCurrencyBeforePrice()) {
                    row += ShoppingCart.currentCurrencySymbol() + ' ' + ShoppingCart.settings.cart.minimumSumToPlaceOrder;
                } else {
                    row += ShoppingCart.settings.cart.minimumSumToPlaceOrder + ' ' + ShoppingCart.currentCurrencySymbol();
                }
            }

        }

        row += '</td>';

        if (ShoppingCart.currentPageIsCheckout) {

            /***********************************************************/
            /* Product price do not include taxes, show them here
            /***********************************************************/
            if (ShoppingCart.productPriceDoesNotIncludeTaxes()) {

                row += '<tr class="cart-taxes-calculated">';

                if (ShoppingCart.shippingAddress.country) {
                    //row += '<td><strong>' + window.PLUGIN_SHOPPINGCART.translations.INCLUDING_TAXES + '</strong></td>';

                    row += '<td><strong>';
                    if (ShoppingCart.settings.cart.addShippingAndTaxesCostToTotal) {
                        row += window.PLUGIN_SHOPPINGCART.translations.INCLUDING_TAXES;
                    } else {
                        row += window.PLUGIN_SHOPPINGCART.translations.TAXES;
                    }
                    row += '</strong></td>';

                    row += '<td></td>';
                    row += '<td></td>';
                    row += '<td>';

                    if (ShoppingCart.showCurrencyBeforePrice()) {

                        row += ShoppingCart.currentCurrencySymbol();
                        row += ' ';

                        if (ShoppingCart.settings.cart.addShippingAndTaxesCostToTotal) {
                            row += ShoppingCart.calculateTotalPriceIncludingTaxes();
                        } else {
                            row += ShoppingCart.taxesApplied;
                        }

                    } else {

                        if (ShoppingCart.settings.cart.addShippingAndTaxesCostToTotal) {
                            row += ShoppingCart.calculateTotalPriceIncludingTaxes();
                        } else {
                            row += ShoppingCart.taxesApplied;
                        }

                        row += ' ';
                        row += ShoppingCart.currentCurrencySymbol();

                    }

                    row += '</td>';
                    row += '<td></td>';

                } else {
                    row += '<td>' + window.PLUGIN_SHOPPINGCART.translations.PRICE_DO_NOT_INCLUDE_TAXES + '</td>';
                    row += '<td></td>';
                    row += '<td></td>';
                    row += '<td></td>';
                    row += '<td></td>';
                }

                row += '</tr>';
            }

            /***********************************************************/
            /* Shipment price
            /***********************************************************/
            if (ShoppingCart.shipmentPrice) {
                row += '<tr class="cart-shipment-calculated">';

                row += '<td><strong>';

                if (ShoppingCart.settings.cart.addShippingAndTaxesCostToTotal) {
                    row += window.PLUGIN_SHOPPINGCART.translations.INCLUDING_SHIPMENT;
                } else {
                    row += window.PLUGIN_SHOPPINGCART.translations.SHIPPING;
                }

                row += '</strong></td>';

                row += '<td></td>';
                row += '<td></td>';
                row += '<td>';

                if (ShoppingCart.showCurrencyBeforePrice()) {

                    row += ShoppingCart.currentCurrencySymbol();
                    row += ' ';

                    if (ShoppingCart.settings.cart.addShippingAndTaxesCostToTotal) {
                        row += ShoppingCart.calculateTotalPriceIncludingTaxesAndShipment();
                    } else {
                        row += ShoppingCart.shipmentPrice;
                    }

                } else {

                    if (ShoppingCart.settings.cart.addShippingAndTaxesCostToTotal) {
                        row += ShoppingCart.calculateTotalPriceIncludingTaxesAndShipment();
                    } else {
                        row += ShoppingCart.shipmentPrice;
                    }

                    row += ' ';
                    row += ShoppingCart.currentCurrencySymbol();

                }

                row += '</td>';
                row += '<td></td>';
                row += '</tr>';
            }

            /***********************************************************/
            /* Discounts enabled, add form
            /***********************************************************/
            //TODO
            // if (ShoppingCart.settings.general.enableDiscounts) {
            //     row += '<tr class="discount-code-line">';
            //     row += '<td>';

            //     if (ShoppingCart.showDiscountCodeBoxEnabled) {
            //         row += '<input type="text" id="js__discount-code-box" action="applyDiscountCode" />';
            //         row += '<button class="btn btn-success js__checkout__button__apply-discount-code">' + ShoppingCart.translations.JSUBMIT + '</button>';
            //     }

            //     if (!ShoppingCart.hideDiscountCodeBoxLink) {
            //         row += '<a id="js__shoppingcart__show-discount-code-box-link">' + window.PLUGIN_SHOPPINGCART.translations.HAVE_A_DISCOUNT_CODE + '</strong>';
            //     }

            //     row += '</td>';

            //     row += '<td></td>';
            //     row += '<td></td>';
            //     row += '<td></td>';
            //     row += '<td></td>';
            //     row += '</tr>';
            // }



            /***********************************************************/
            /* Total after discount
            /***********************************************************/
            // if (ShoppingCart.totalAfterDiscount) {
            //     row += '<tr class="total-after-discount-line">';
            //     row += '<td><strong>' + window.PLUGIN_SHOPPINGCART.translations.TOTAL_AFTER_DISCOUNT + '</strong></td>';
            //     row += '<td></td>';
            //     row += '<td></td>';
            //     row += '<td>';

            //     if (ShoppingCart.showCurrencyBeforePrice()) {
            //         row += ShoppingCart.currentCurrencySymbol() + ' ' + ShoppingCart.totalAfterDiscount;
            //     } else {
            //         row += ShoppingCart.totalAfterDiscount + ' ' + ShoppingCart.currentCurrencySymbol();
            //     }

            //     row += '</td>';
            //     row += '<td></td>';
            //     row += '</tr>';
            // } else {

                var totalPriceIncludingTaxesAndShipment = ShoppingCart.calculateTotalPriceIncludingTaxesAndShipment();

                if (totalPriceIncludingTaxesAndShipment) {
                    row += '<tr class="total-line">';
                    row += '<td><strong>' + window.PLUGIN_SHOPPINGCART.translations.TOTAL + '</strong></td>';
                    row += '<td></td>';
                    row += '<td></td>';

                    row += '<td>';

                    if (ShoppingCart.showCurrencyBeforePrice()) {
                        row += ShoppingCart.currentCurrencySymbol() + ' ' + totalPriceIncludingTaxesAndShipment;
                    } else {
                        row += totalPriceIncludingTaxesAndShipment + ' ' + ShoppingCart.currentCurrencySymbol();
                    }

                    row += '</td>';


                    row += '<td></td>';
                    row += '</tr>';
                }
            // }
        }

        rows_html += row;

        tbody.html(tbody.html() + rows_html);
    }

})(window.ShoppingCart);
