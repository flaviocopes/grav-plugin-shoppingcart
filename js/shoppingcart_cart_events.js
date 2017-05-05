(function(ShoppingCart) {

    /***********************************************************/
    /* Handle removing a product from the cart
    /* #event
    /***********************************************************/
    jQuery(document).on('click tap', '.js__shoppingcart__remove-from-cart', function() {
        var element_id = jQuery(this).data('id');
        ShoppingCart.items.splice(element_id, 1);
        ShoppingCart.renderCart();
        //ShoppingCart.calculateItemsLeft();
        ShoppingCart._saveCartToLocalstorage();
    });


    /***********************************************************/
    /* Handle proceed to checkout button click
    /* #event
    /***********************************************************/
    jQuery(document).on('click tap', '.js__shoppingcart__proceed-to-checkout', function() {
        ShoppingCart.proceedToCheckout();
    });

    /***********************************************************/
    /* Allow only numbers in quantity box
    /* #event
    /***********************************************************/
    jQuery(document).on('keydown', '.js__shoppingcart__quantity-box-cart', function(e) {
        // Allow: backspace, delete
        if (jQuery.inArray(e.keyCode, [46, 8]) !== -1 ||
            // Allow: home, end, left, right
            (e.keyCode >= 35 && e.keyCode <= 39)) {
            // let it happen, don't do anything
            return;
        }
        // Ensure that it is a number and stop the keypress
        if ((e.shiftKey || (e.keyCode < 48 || e.keyCode > 57)) && (e.keyCode < 96 || e.keyCode > 105)) {
            e.preventDefault();
        }
    });


    /***********************************************************/
    /* Continue shopping
    /* #event
    /***********************************************************/
    jQuery(document).on('click tap', '.js__shoppingcart__continue-shopping', function(event) {
        history.back();
    });

    /***********************************************************/
    /* Allow only numbers in quantity box
    /* #event
    /***********************************************************/
    jQuery(document).on('keydown', '#js__shoppingcart__quantity', function(e) {
        // Allow: backspace, delete
        if (jQuery.inArray(e.keyCode, [46, 8]) !== -1 ||
            // Allow: home, end, left, right
            (e.keyCode >= 35 && e.keyCode <= 39)) {
            return;
        }

        // Ensure that it is a number
        if ((e.shiftKey || (e.keyCode < 48 || e.keyCode > 57)) && (e.keyCode < 96 || e.keyCode > 105)) {
            e.preventDefault();
        }
    });

    /***********************************************************/
    /* Add a product to the cart (from the product page)
    /* #event
    /***********************************************************/
    jQuery(document).on('click tap', '.js__shoppingcart__button-add-to-cart', function(event) {
        var quantity = jQuery(this).closest('.shoppingcart-product-container').find('#js__shoppingcart__quantity').val() || 1;
        var button = jQuery(this);
        var i = 0;
        var product = {};
        var currentProduct = [];
        var clickedId = jQuery(this).data('id');

        button.attr('disabled', 'disabled');

        if (ShoppingCart.currentPageIsProducts) {
            currentProduct = ShoppingCart.currentProducts.filter(function(item) {
                return item.id == clickedId;
            });
            ShoppingCart.currentProduct = currentProduct[0];
        }

        // Deep copy
        product = jQuery.extend(true, {}, ShoppingCart.currentProduct);
        ShoppingCart.addProduct(product, quantity);
        button.html(window.PLUGIN_SHOPPINGCART.translations.PRODUCT_ADDED_TO_CART);

        setTimeout(function() {
            button.html('<i class="fa fa-shopping-cart"></i> ' + window.PLUGIN_SHOPPINGCART.translations.ADD_TO_CART);
            button.attr('disabled', null);
        }, 2000);
    });

    /***********************************************************/
    /* Handle change the quantity box in the cart
    /* #event
    /***********************************************************/
    jQuery(document).on('keyup', '.js__shoppingcart__quantity-box-cart', function() {
        var element_id = jQuery(this).data('id');
        var new_quantity = jQuery(this).val();
        var isInt = function isInt(n) {
            return n % 1 == 0;
        };

        if (!isInt(new_quantity)) {
            alert(window.PLUGIN_SHOPPINGCART.translations.VALUE_NOT_ACCEPTABLE);
            jQuery(this).val(ShoppingCart.items[element_id].quantity);
            return;
        }

        if (ShoppingCart.settings.cart.maximum_total_quantity_value && (parseInt(new_quantity) > ShoppingCart.settings.cart.maximum_total_quantity_value)) {
            alert(window.PLUGIN_SHOPPINGCART.translations.QUANTITY_EXCEEDS_MAX_ALLOWED_VALUE + ': ' + ShoppingCart.settings.cart.maximum_total_quantity_value);
            jQuery(this).val(ShoppingCart.items[element_id].quantity);
            return;
        }

        ShoppingCart.items[element_id].quantity = new_quantity;
        ShoppingCart._saveCartToLocalstorage();
        ShoppingCart.renderCart();

        jQuery(".js__shoppingcart__quantity-box-cart[data-id='" + element_id + "']").focus().val(jQuery(".js__shoppingcart__quantity-box-cart[data-id='" + element_id + "']").val()); //this is to avoid browser auto-selecting text
    });

    /***********************************************************/
    /* Initialize and render the shopping cart at page start
    /***********************************************************/
    jQuery(function() {
        ShoppingCart.loadSettings();

        /***********************************************************/
        /* Initialize the cart
        /***********************************************************/
        var initializeCart = function initializeCart() {
            if (new Date().getTime() - storejs.get('grav-shoppingcart-basket-data-updatetime') > 1000 * 60 * ShoppingCart.settings.cart.timeout) { //empty the cart after x minutes
                storejs.remove('grav-shoppingcart-basket-data');
            }

            if (typeof storejs.get('grav-shoppingcart-basket-data') !== 'undefined') {
                var items = storejs.get('grav-shoppingcart-basket-data');
                var itemsInCart = [];

                items.forEach(function(item) {
                    if (item.quantity != "0" && item.quantity !== "") {
                        itemsInCart.push(item);
                    }
                });

                ShoppingCart.items = itemsInCart;
            }
        };

        /***********************************************************/
        /* Render the cart at page load
        /***********************************************************/
        var renderCart = function renderCart() {
            var interval = setInterval(function() {
                if (ShoppingCart.items) {
                    clearInterval(interval);
                    setTimeout(function() {
                        ShoppingCart.renderCart();
                    }, 300);
                }
            }, 200);
        };

        /***********************************************************/
        /* Populate the cart counter (if present) at page load
        /***********************************************************/
        var populateCartCounter = function populateCartCounter() {
            var interval = setInterval(function() {
                if (ShoppingCart.items) {
                    clearInterval(interval);
                    setTimeout(function() {
                        var count = ShoppingCart.items.length;
                        if (count > 0) {
                            $('.js__shoppingcart-counter').append('(' + count + ')');
                        }
                    }, 300);
                }
            }, 200);
        };

        initializeCart();
        renderCart();
        populateCartCounter();
    });


})(window.ShoppingCart);
