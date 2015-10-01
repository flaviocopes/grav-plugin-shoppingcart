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

            if (typeof ShoppingCart.settings.cart.maximumTotalQuantityValue !== undefined && ShoppingCart.settings.cart.maximumTotalQuantityValue > 0 && parseInt(ShoppingCart.items[i].quantity) > ShoppingCart.settings.cart.maximumTotalQuantityValue) {
                alert(window.PLUGIN_SHOPPINGCART.translations.QUANTITY_EXCEEDS_MAX_ALLOWED_VALUE + ': ' + ShoppingCart.settings.cart.maximumTotalQuantityValue);
                return;
            }
        }

        window.location.href = PLUGIN_SHOPPINGCART.settings.urls.baseURL + PLUGIN_SHOPPINGCART.settings.urls.checkoutURL;
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
    ShoppingCart.addProduct = function addProduct(product, quantity) {
        var existingProducts = jQuery(ShoppingCart.items).filter(function(index, item) { if (product.id == item.product.id) return true; }).toArray();

        var existingProduct = existingProducts[0];

        if (!existingProduct) {
            if (product.type === 'digital') product.isDigital = true;
            ShoppingCart.items.push({product: product, quantity: quantity});
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

        ShoppingCart.totalOrderPriceIncludingTaxesAndShipment = parseFloat(total).toFixed(2);

        return ShoppingCart.totalOrderPriceIncludingTaxesAndShipment;
    };

    /***********************************************************/
    /* Calculate the total price of a cart including taxes
    /***********************************************************/
    ShoppingCart.calculateTotalPriceIncludingTaxes = function calculateTotalPriceIncludingTaxes() {
        var orderPrice = 0;
        var i = 0;
        var totalPrice;
        var country = null;
        var tax_percentage = 0;

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
                    tax_percentage = parseInt(country.tax_percentage);

                    if (country.name === 'US') {
                        if (ShoppingCart.settings.us_states) {
                            var state = jQuery(ShoppingCart.settings.us_states).filter(function(index, item) { if (ShoppingCart.shippingAddress.state == item.name) return true; }).toArray()[0];
                            if (state) {
                                tax_percentage = state.tax_percentage;
                            }
                        }
                    }
                }
            }

            if (tax_percentage !== 0) {
                totalPrice = orderPrice + orderPrice * (tax_percentage / 100);
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
        if (!ShoppingCart.settings.cart.minimumSumToPlaceOrder) {
            return true;
        }

        var cart = ShoppingCart.items;
        var orderPrice = 0;
        var i = 0;

        while (i < cart.length) {
            orderPrice += cart[i].product.price * cart[i].quantity;
            i++;
        }

        return (parseInt(orderPrice) >= parseInt(ShoppingCart.settings.cart.minimumSumToPlaceOrder));
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

            if (jQuery(ShoppingCart.items).filter(function(index, item) { if (item.product.type != 'digital') return true }).toArray().length > 0) {
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

                if (jQuery(ShoppingCart.items).filter(function(index, item) { if (item.product.type != 'digital') return true }).toArray().length > 0) {
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
    /* Ensure I can add this quantity to the cart
    /* #todo #stub
    /***********************************************************/
    ShoppingCart.canAddToCartThisQuantityOfThisProduct = function canAddToCartThisQuantityOfThisProduct(product, quantity) {
        if (ShoppingCart.settings.cart.limitDigitalProductsToSingleQuantity && (product.isDigital || product.type == 'digital')) {
            for (var j = 0; j < ShoppingCart.items.length; j++) {
                if (ShoppingCart.items[j].product.id == product.id) {
                    return false;
                }
            }
        }

        if (product.quantity_available === '') return true;

        for (var j = 0; j < ShoppingCart.items.length; j++) {
            if (ShoppingCart.items[j].product.id == product.id) {
                if (parseInt(ShoppingCart.items[j].quantity) + parseInt(quantity) > parseInt(product.quantity_available)) {
                    return false;
                } else {
                    return true;
                }
            }
        }

        if (parseInt(quantity) > parseInt(product.quantity_available)) {
            return false;
        }

        return true;
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
            if (ShoppingCart.settings.cart.allowEditingQuantityFromCart) {
                if (ShoppingCart.currentPageIsProductOrProductsOrCart()) {
                    if (item.product.isDigital) {
                        if (ShoppingCart.settings.cart.limitDigitalProductsToSingleQuantity) {
                            row += item.quantity;
                        } else {
                            row += '<input value="' + item.quantity + '" class="input-mini js__shoppingcart__quantity-box-cart" data-id="' + i + '" />';
                        }
                    } else {
                        row += '<input value="' + item.quantity + '" class="input-mini js__shoppingcart__quantity-box-cart" data-id="' + i + '" />';
                    }
                } else {
                    row += item.quantity;
                }
            } else {
                row += item.quantity;
            }

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
