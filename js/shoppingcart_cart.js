(function(ShoppingCart) {
    ShoppingCart.items = [];
    ShoppingCart.checkout_form_data = {};
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
        if (!ShoppingCart.settings.shipping) {
            ShoppingCart.settings.shipping = {};
        }
        if (!ShoppingCart.settings.shipping.methods) {
            ShoppingCart.settings.shipping.methods = [];
        }
        if (!ShoppingCart.settings.payment) {
            ShoppingCart.settings.payment = {};
        }
        if (!ShoppingCart.settings.payment.methods) {
            ShoppingCart.settings.payment.methods = [];
        }

        for (index in ShoppingCart.settings.shipping.methods) {
            item = ShoppingCart.settings.shipping.methods[index];
            if (typeof item !== 'undefined') {
                if (!item.allowed_countries) item.allowed_countries = [];
                ShoppingCart.settings.shipping.methods[index] = item;
            }
        }

        for (index in ShoppingCart.settings.countries) {
            item = ShoppingCart.settings.countries[index];
            if (typeof item !== 'undefined') {
                if (item.allow === 'false' || item.allow === false) {
                    item.isAllowed = false;
                } else {
                    item.isAllowed = true;
                }
                ShoppingCart.settings.countries[index] = item;
            }

        }

        for (index in ShoppingCart.settings.payment.methods) {
            item = ShoppingCart.settings.payment.methods[index];
            if (typeof item !== 'undefined') {
                ShoppingCart.settings.payment.methods[index] = item;
            }
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

            if (typeof ShoppingCart.settings.cart.maximum_total_quantity_value !== undefined && ShoppingCart.settings.cart.maximum_total_quantity_value > 0 && parseInt(ShoppingCart.items[i].quantity) > ShoppingCart.settings.cart.maximum_total_quantity_value) {
                alert(window.PLUGIN_SHOPPINGCART.translations.QUANTITY_EXCEEDS_MAX_ALLOWED_VALUE + ': ' + ShoppingCart.settings.cart.maximum_total_quantity_value);
                return;
            }
        }

        window.location.href = PLUGIN_SHOPPINGCART.settings.baseURL + PLUGIN_SHOPPINGCART.settings.urls.checkout_url;
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
    /***********************************************************/
    ShoppingCart.addProduct = function addProduct(product, quantity) {
        var onBeforeAddProductToCart;
        $(document).trigger(onBeforeAddProductToCart = $.Event('onBeforeAddProductToCart', { product: product }));
        if (onBeforeAddProductToCart.result === false) {
            return;
        }

        var existingProducts = jQuery(ShoppingCart.items).filter(function(index, item) { if (product.title == item.product.title) return true; }).toArray();

        var existingProduct = existingProducts[0];

        if (!existingProduct) {
            ShoppingCart.items.push({product: product, quantity: quantity});
        } else {
            existingProduct.quantity = parseInt(existingProduct.quantity) + parseInt(quantity);
        }

        $(ShoppingCart).trigger('onAfterAddProductToCart', product);

        ShoppingCart._saveCartToLocalstorage();
        ShoppingCart.renderCart();
    };

    /***********************************************************/
    /* Save the shopping cart to the local storage
    /***********************************************************/
    ShoppingCart._saveCartToLocalstorage = function _saveCartToLocalstorage() {
        storejs.set('grav-shoppingcart-basket-data', ShoppingCart.items);
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
                    storejs.remove('grav-shoppingcart-checkout-form-data');
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
    /* Calculate the total price of a cart including taxes and shipping
    /***********************************************************/
    ShoppingCart.calculateTotalPriceIncludingTaxesAndShipping = function calculateTotalPriceIncludingTaxesAndShipping() {
        ShoppingCart.calculateTotalPriceIncludingTaxes();

        var total = parseFloat(ShoppingCart.totalOrderPriceIncludingTaxes).toFixed(2);
        if (!ShoppingCart.shippingPrice) {
            return total;
        }

        total = parseFloat(total) + parseFloat(ShoppingCart.shippingPrice);

        ShoppingCart.totalOrderPriceIncludingTaxesAndShipping = parseFloat(total).toFixed(2);

        return ShoppingCart.totalOrderPriceIncludingTaxesAndShipping;
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
        var tax_included = 0;

        while (i < ShoppingCart.items.length) {
            orderPrice += ShoppingCart.items[i].product.price * ShoppingCart.items[i].quantity;
            i++;
        }

        //calculate country taxes
        var country;
        for (index in ShoppingCart.settings.countries) {
            if (ShoppingCart.checkout_form_data.country == ShoppingCart.settings.countries[index].name) {
                country = ShoppingCart.settings.countries[index];
            }
        }

        if (!country) {
            for (index in ShoppingCart.settings.countries) {
                if ('*' == ShoppingCart.settings.countries[index].name) {
                    country = ShoppingCart.settings.countries[index];
                }
            }
        }

        if (country) {
            if (country.isAllowed) {
                tax_percentage = parseInt(country.tax_percentage) || 0;
                if (country.name === 'US') {
                    if (ShoppingCart.settings.us_states) {
                        var state = jQuery(ShoppingCart.settings.us_states).filter(function(index, item) { if (ShoppingCart.checkout_form_data.state == item.name) return true; }).toArray()[0];
                        if (state) {
                            tax_percentage = state.tax_percentage || 0;
                        }
                    }
                }
            }
        }

        if (ShoppingCart.productPriceDoesNotIncludeTaxes()) {
            if (tax_percentage !== 0) {
                totalPrice = orderPrice + orderPrice * (tax_percentage / 100);
            } else {
                totalPrice = orderPrice;
            }

            totalPrice = parseFloat(totalPrice.toFixed(2)).toFixed(2);
            ShoppingCart.taxesApplied = parseFloat(totalPrice - orderPrice).toFixed(2);
            ShoppingCart.totalOrderPriceIncludingTaxes = totalPrice;
        } else {
            totalPrice = orderPrice;
            tax_included = totalPrice * (tax_percentage / 100);
            totalPrice = parseFloat(totalPrice.toFixed(2)).toFixed(2);
            ShoppingCart.taxesApplied = parseFloat(tax_included).toFixed(2);
            ShoppingCart.totalOrderPriceIncludingTaxes = totalPrice;
        }

        return totalPrice;
    };

    /***********************************************************/
    /* Return the current currency symbol
    /***********************************************************/
    ShoppingCart.currentCurrencySymbol = function currentCurrencySymbol() {
        return jQuery(ShoppingCart.currencies).filter(function(index, item) { if (ShoppingCart.settings.general.currency == item.code) return true; }).toArray()[0].symbol;
    };

    /***********************************************************/
    /* Determine if the cart should be shown in the current page
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
    /* Determine if the current page is a product / products / cart page
    /***********************************************************/
    ShoppingCart.currentPageIsProductOrProductsOrCartOrExternal = function currentPageIsProductOrProductsOrCartOrExternal() {
        return (ShoppingCart.currentPageIsProduct === true ||
                        ShoppingCart.currentPageIsProducts === true ||
                        ShoppingCart.currentPageIsExternal === true ||
                        ShoppingCart.currentPageIsCart === true);
    };

    /***********************************************************/
    /* Calculate if the cart content amount is greater than the minimum allowed
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
    /* Calculate the shipping price
    /***********************************************************/
    ShoppingCart.generateShippingPrice = function generateShippingPrice() {
        var countMethods = 0;
        for (index in ShoppingCart.settings.shipping.methods) {
            countMethods++;
        }

        if (!ShoppingCart.shippingPrice) {
            ShoppingCart.shippingPrice = 0.00;
        }

        if (countMethods === 0) {
            ShoppingCart.renderCart();
        } else if (countMethods === 1) {
            var method;
            for (index in ShoppingCart.settings.shipping.methods) {
                method = ShoppingCart.settings.shipping.methods[index];
            }

            ShoppingCart.shippingPrice = parseFloat(method.price).toFixed(2);
            ShoppingCart.renderCart();
        } else {
            var interval = setInterval(function() {
                var shippingMethodName = jQuery('.js__shipping__method').val();
                if (shippingMethodName) {
                    clearInterval(interval);

                    var method;
                    for (index in ShoppingCart.settings.shipping.methods) {
                        if (shippingMethodName == ShoppingCart.settings.shipping.methods[index].name) {
                            method = ShoppingCart.settings.shipping.methods[index];
                        }
                    }

                    var price = method.price;
                    if (isNaN(price)) {
                        price = 0;
                    }

                    price = parseFloat(price).toFixed(2);

                    ShoppingCart.shippingPrice = price;
                    ShoppingCart.renderCart();
                }

            }, 50);
        }
    };

    /***********************************************************/
    /* Check if the setting to include taxes in product prices is disabled
    /***********************************************************/
    ShoppingCart.productPriceDoesNotIncludeTaxes = function productPriceDoesNotIncludeTaxes() {
        return ShoppingCart.settings.general.product_taxes !== 'included';
    };

    /***********************************************************/
    /* Get the "show currency before price" setting
    /* #todo #stub
    /***********************************************************/
    ShoppingCart.showCurrencyBeforePrice = function showCurrencyBeforePrice() {
        return ShoppingCart.settings.ui.currency_symbol_position === 'before';
    };

    /***********************************************************/
    /* Return true if the passed country can buy from the shop
    /* #todo #stub
    /***********************************************************/
    ShoppingCart.countryCanBuy = function countryCanBuy(countryCode) {
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

        var row = '<tr>';
        row += '<th class="cart-product">' + window.PLUGIN_SHOPPINGCART.translations.ITEM + '</th>';
        if (!ShoppingCart.isMobile()) {
            row += '<th class="cart-product-price">' + window.PLUGIN_SHOPPINGCART.translations.PRICE + '</th>';
        }

        if (!ShoppingCart.isMobile()) {
            row += '<th class="cart-product-quantity">' + window.PLUGIN_SHOPPINGCART.translations.QUANTITY + '</th>';
        } else {
            row += '<th class="cart-product-quantity">' + window.PLUGIN_SHOPPINGCART.translations.QUANTITY_SHORT + '</th>';
        }

        row += '<th class="cart-product-total">' + window.PLUGIN_SHOPPINGCART.translations.TOTAL + '</th>';

        if (ShoppingCart.currentPageIsProductOrProductsOrCartOrExternal()) {
            row += '<th class="cart-product-remove-button">';
            row += window.PLUGIN_SHOPPINGCART.translations.REMOVE;
            row += '</th>';
        }

        row += '</tr>';
        thead.html(row);
        var rows_html = '';

        for (var i = 0; i < ShoppingCart.items.length; i++) {
            var item = ShoppingCart.items[i];
            var row = '<tr><td class="cart-product">';

            if (ShoppingCart.settings.cart.add_product_thumbnail) {
                if (item.product.image) {
                    row += '<img src="' + item.product.image + '" class="cart-product-image"> ';
                }
            }

            if (item.product.url) {
                row += '<a href="' + item.product.url + '" class="cart-product-name">' + item.product.title + '</a>';
            } else {
                row += item.product.title;
            }

            row += '</td>';

            if (!ShoppingCart.isMobile()) {
                /***********************************************************/
                /* Price
                /***********************************************************/
                row += '<td class="cart-product-price">';
                row += ShoppingCart.renderPriceWithCurrency(item.product.price);
                row += '</td>';
            }

            /***********************************************************/
            /* Quantity
            /***********************************************************/
            row += '<td class="cart-product-quantity">';
            if (ShoppingCart.settings.cart.allow_editing_quantity_from_cart && !ShoppingCart.isMobile()) {
                if (ShoppingCart.currentPageIsProductOrProductsOrCartOrExternal()) {
                    row += '<input value="' + item.quantity + '" class="input-mini js__shoppingcart__quantity-box-cart" data-id="' + i + '" />';
                } else {
                    row += item.quantity;
                }
            } else {
                row += item.quantity;
            }
            row += '</td>';

            /***********************************************************/
            /* Total
            /***********************************************************/
            row += '<td class="cart-product-total">';
            row += ShoppingCart.renderPriceWithCurrency(ShoppingCart.cartSubtotalPrice(item));
            row += '</td>';

            if (ShoppingCart.currentPageIsProductOrProductsOrCartOrExternal()) {
                row += '<td class="cart-product-remove-button">';
                row += '<a class="btn btn-small js__shoppingcart__remove-from-cart" data-id="' + i + '">' + window.PLUGIN_SHOPPINGCART.translations.REMOVE + '</a>';
                row += '</td>';
            }

            row += '</tr>';

            rows_html += row;
        }

        /***********************************************************/
        /* Additional lines after products
        /***********************************************************/

        row = '<tr>';

        if (ShoppingCart.currentPageIsProduct) {
            row += '<td class="goback"><a href="#" class="btn btn-success js__shoppingcart__continue-shopping">' + window.PLUGIN_SHOPPINGCART.translations.CONTINUE_SHOPPING + '</a></td>';
        } else {
            row += '<td class="empty"><strong>' + window.PLUGIN_SHOPPINGCART.translations.SUBTOTAL + '</strong></td>';
        }

        row += '<td class="empty"></td>';

        if (!ShoppingCart.isMobile()) {
            row += '<td class="empty"></td>';
        }

        row += '<td class="cart-product-total">';
        row += ShoppingCart.renderPriceWithCurrency(ShoppingCart.cartTotalPrice());
        row += '</td>';

        /***********************************************************/
        /* Checkout / or not yet reached minimum order level
        /***********************************************************/
        var atLeastAProductIsAdded = false;

        ShoppingCart.items.forEach(function(item) {
            if (item.quantity != "0" && item.quantity != "") {
                atLeastAProductIsAdded = true;
            }
        });

        if (atLeastAProductIsAdded) {
            if (ShoppingCart.orderAmountIsGreaterThenMinimum()) {
                if (ShoppingCart.currentPageIsProductOrProductsOrCartOrExternal() || ShoppingCart.currentPageIsOrderCancelled) {
                    row += '<td><button class="btn btn-success js__shoppingcart__proceed-to-checkout">' + window.PLUGIN_SHOPPINGCART.translations.CHECKOUT + '</button></td>';
                }
            } else {
                row += '<td>';
                row += window.PLUGIN_SHOPPINGCART.translations.MINIMUM_TO_PLACE_AN_ORDER;
                row += ShoppingCart.renderPriceWithCurrency(ShoppingCart.settings.cart.minimumSumToPlaceOrder);
                row += '</td>';
            }
        }

        if (ShoppingCart.currentPageIsCheckout) {

            /***********************************************************/
            /* Product price do not include taxes, show them here
            /***********************************************************/
            if (ShoppingCart.productPriceDoesNotIncludeTaxes()) {

                row += '<tr class="cart-taxes-calculated">';

                if (ShoppingCart.checkout_form_data.country) {
                    //row += '<td><strong>' + window.PLUGIN_SHOPPINGCART.translations.INCLUDING_TAXES + '</strong></td>';

                    row += '<td><strong>';
                    if (ShoppingCart.settings.cart.add_shipping_and_taxes_cost_to_total) {
                        row += window.PLUGIN_SHOPPINGCART.translations.INCLUDING_TAXES;
                    } else {
                        row += window.PLUGIN_SHOPPINGCART.translations.TAXES;
                    }
                    row += '</strong></td>';

                    row += '<td></td>';
                    row += '<td></td>';
                    row += '<td>';
                    var amount = ShoppingCart.taxesApplied;
                    if (ShoppingCart.settings.cart.add_shipping_and_taxes_cost_to_total) {
                        amount = ShoppingCart.calculateTotalPriceIncludingTaxes();
                    }
                    row += ShoppingCart.renderPriceWithCurrency(amount)
                    row += '</td>';

                } else {
                    row += '<td>' + window.PLUGIN_SHOPPINGCART.translations.PRICE_DO_NOT_INCLUDE_TAXES + '</td>';
                    row += '<td></td>';
                    row += '<td></td>';
                    row += '<td></td>';
                }

                row += '</tr>';
            } else {
        var amount = ShoppingCart.taxesApplied;
        row += '<tr class="cart-taxes-calculated">';
        row += '<td><strong>';
        row += window.PLUGIN_SHOPPINGCART.translations.TAXES;
        row += '</strong></td>';
        row += '<td></td>';
                row += '<td></td>';
                row += '<td>';
        row += ShoppingCart.renderPriceWithCurrency(amount);
                row += '</td>';
        row += '</tr>';
        }

            /***********************************************************/
            /* Shipping price
            /***********************************************************/
            if (ShoppingCart.shippingPrice) {
                row += '<tr class="cart-shipping-calculated">';
                row += '<td><strong>';

                if (ShoppingCart.settings.cart.add_shipping_and_taxes_cost_to_total) {
                    row += window.PLUGIN_SHOPPINGCART.translations.INCLUDING_SHIPPING;
                } else {
                    row += window.PLUGIN_SHOPPINGCART.translations.SHIPPING;
                }

                row += '</strong></td>';
                row += '<td></td>';
                row += '<td></td>';
                row += '<td>';
                var amount = ShoppingCart.shippingPrice;
                if (ShoppingCart.settings.cart.add_shipping_and_taxes_cost_to_total) {
                    amount = ShoppingCart.calculateTotalPriceIncludingTaxesAndShipping();
                }
                row += ShoppingCart.renderPriceWithCurrency(amount);
                row += '</td>';
                row += '</tr>';
            }

            /***********************************************************/
            /* Calculate total including taxes and shipping
            /***********************************************************/
            var totalPriceIncludingTaxesAndShipping = ShoppingCart.calculateTotalPriceIncludingTaxesAndShipping();

            if (totalPriceIncludingTaxesAndShipping) {
                row += '<tr class="total-line">';
                row += '<td><strong>' + window.PLUGIN_SHOPPINGCART.translations.TOTAL + '</strong></td>';
                row += '<td></td>';
                row += '<td></td>';
                row += '<td>';
                row += ShoppingCart.renderPriceWithCurrency(totalPriceIncludingTaxesAndShipping);
                row += '</td>';
                row += '</tr>';
            }
        }

        rows_html += row;

        tbody.html(tbody.html() + rows_html);
    }

})(window.ShoppingCart);
