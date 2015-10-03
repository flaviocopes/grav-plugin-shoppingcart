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
    /***********************************************************/
    jQuery(document).on('click tap', '.js__shoppingcart__continue-shopping', function(event) {
        history.back();
    });

    /***********************************************************/
    /* Add a product to the cart (from the product page)
    /* #event
    /***********************************************************/
    jQuery(document).on('click tap', '.js__button-add-to-cart', function(event) {
        var quantity = 1; //jQuery('#quantity').val(); //TODO
        var button = jQuery(this);
        button.attr('disabled', 'disabled');
        var i = 0;

        // Deep copy
        var product = jQuery.extend(true, {}, ShoppingCart.currentProduct);

        //TODO
        // if (product.openOption && product.openOption.enabled === true) {
        //     var name = product.openOption.text;
        //     var val = jQuery('#js__shoppingcart__openOption-textarea').val();

        //     if (product.openOption.mandatory === true) {
        //         if (!val) {
        //             alert(window.PLUGIN_SHOPPINGCART.translations.CHOOSE_AN_OPTION + ': ' + name);
        //             return;
        //         }
        //     }
        // }

        if (ShoppingCart.canAddToCartThisQuantityOfThisProduct(product, quantity)) {
            ShoppingCart.addProduct(product, quantity);
            button.html(window.PLUGIN_SHOPPINGCART.translations.PRODUCT_ADDED_TO_CART);
        }

        setTimeout(function() {
            button.html(window.PLUGIN_SHOPPINGCART.translations.ADD_TO_CART);
            button.attr('disabled', null);
        }, 2000);

    });

    /***********************************************************/
    /* Initialize and render the shopping cart at page start
    /* #event
    /***********************************************************/
    jQuery(function() {
        ShoppingCart.loadSettings();

        /***********************************************************/
        /* Initialize the cart
        /***********************************************************/
        var initializeCart = function initializeCart() {
            if (new Date().getTime() - storejs.get('grav-shoppingcart-basket-data-updatetime') > 1000 * 60 * 60 * 2) { //the cart lasts 2 hours
                storejs.remove('grav-shoppingcart-basket-data');
            }

            if (typeof storejs.get('grav-shoppingcart-basket-data') !== 'undefined') {
                var items = JSON.parse(storejs.get('grav-shoppingcart-basket-data'));
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

        initializeCart();
        renderCart();
    });

})(window.ShoppingCart);
