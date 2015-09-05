(function() {

    /***********************************************************/
    /* Calculate the variations object
    /***********************************************************/
    // ShoppingCart.calculateVariations = function calculateVariations() {
    //     var variations = {};

    //     if (ShoppingCart.currentProduct.variations && ShoppingCart.currentProduct.variations.variations) {
    //         var i = 0;

    //         var variationsNumber = ShoppingCart.currentProduct.variations.variations.length;
    //         if (variationsNumber > 0) {
    //             while (i < variationsNumber) {

    //                 if (jQuery('.variations select').get(i)) {
    //                     var name = ShoppingCart.currentProduct.variations.variations[i].name;
    //                     var val = jQuery(jQuery('.variations select').get(i)).val();

    //                     variations[name] = val;
    //                 }

    //                 i++;
    //             }
    //         }
    //     }

    //     return variations;
    // };


    /***********************************************************/
    /* Calculate the items left
    /***********************************************************/
    // ShoppingCart.calculateItemsLeft = function calculateItemsLeft() {

    //     if (ShoppingCart.currentPageIsProduct) {

    //         var isInteger = function isInteger(x) {
    //             return (typeof x === 'number') && (x % 1 === 0);
    //         }

    //         if (isInteger(ShoppingCart.currentProduct.quantity_available)) {

    //             var variations = ShoppingCart.calculateVariations();
    //             var found = false;

    //             for (var j = 0; j < ShoppingCart.items.length; j++) {
    //                 if (ShoppingCart.items[j].product.id == ShoppingCart.currentProduct.id && ShoppingCart.isEquivalent(ShoppingCart.items[j].variations, variations)) {
    //                     var left = parseInt(ShoppingCart.currentProduct.quantity_available) - parseInt(ShoppingCart.items[j].quantity);

    //                     if (!isNaN(left)) {
    //                         jQuery('.items-left').html('(' + left + window.PLUGIN_SHOPPINGCART.translations.ITEMS_LEFT + ')');
    //                         found = true;
    //                     }
    //                 }
    //             }

    //             if (!found) {
    //                 jQuery('.items-left').html('(' + ShoppingCart.currentProduct.quantity_available + window.PLUGIN_SHOPPINGCART.translations.ITEMS_LEFT + ')');
    //             }

    //         } else {
    //             jQuery('.items-left').html('');
    //         }
    //     }

    // };


    /***********************************************************/
    /* Handle change the quantity box in the cart
    /* #todo
    /***********************************************************/
    // jQuery(document).on('keyup', '.js__shoppingcart__quantity-box-cart', function() {
    //     var element_id = jQuery(this).data('id');
    //     var new_quantity = jQuery(this).val();
    //     var isInt = function isInt(n) {
    //         return n % 1 == 0;
    //     };

    //     if (!ShoppingCart.canAddToCartThisQuantityOfThisProduct(ShoppingCart.items[element_id].product, new_quantity)) {
    //         alert(window.PLUGIN_SHOPPINGCART.translations.OUT_OF_STOCK);
    //         jQuery(this).val(ShoppingCart.items[element_id].quantity);
    //         return;
    //     }

    //     if (!isInt(new_quantity)) {
    //         alert(window.PLUGIN_SHOPPINGCART.translations.VALUE_NOT_ACCEPTABLE);
    //         jQuery(this).val(ShoppingCart.items[element_id].quantity);
    //         return;
    //     }

    //     if (parseInt(new_quantity) > ShoppingCart.settings.cart.maximumTotalQuantityValue) {
    //         alert(window.PLUGIN_SHOPPINGCART.translations.QUANTITY_EXCEEDS_MAX_ALLOWED_VALUE + ': ' + ShoppingCart.settings.cart.maximumTotalQuantityValue);
    //         jQuery(this).val(ShoppingCart.items[element_id].quantity);
    //         return;
    //     }

    //     ShoppingCart.items[element_id].quantity = new_quantity;
    //     ShoppingCart._saveCartToLocalstorage();
    //    // ShoppingCart.calculateItemsLeft();
    //     ShoppingCart.renderCart();

    //     jQuery(".js__shoppingcart__quantity-box-cart[data-id='" + element_id + "']").focus().val(jQuery(".js__shoppingcart__quantity-box-cart[data-id='" + element_id + "']").val()); //this is to avoid browser auto-selecting text
    // });

    /***********************************************************/
    /* Handle show discount code box
    /* #todo
    /***********************************************************/
    // jQuery(document).on('click tap', '#js__shoppingcart__show-discount-code-box-link', function() {
    //     jQuery('#js__shoppingcart__show-discount-code-box-link').hide();
    //     ShoppingCart.showDiscountCodeBoxEnabled = true;
    //     ShoppingCart.hideDiscountCodeBoxLink = true;
    //     ShoppingCart.renderCart();
    // });

    /***********************************************************/
    /* Handle apply discount code
    /* #todo
    /***********************************************************/
    // jQuery(document).on('click tap', '.js__shoppingcart__checkout__button__apply-discount-code', function(event) {
    //     ShoppingCart.applyDiscountCode();
    // });

    /***********************************************************/
    /* Add a product to the cart (from the products list)
    /* #todo
    /* #event
    /***********************************************************/
    // jQuery(document).on('click tap', '.js__button__add-to-cart__in-list', function(event) {
    //     var button = jQuery(this);
    //     button.attr('disabled', 'disabled');

    //     var product_id = jQuery(event.target).data('product_id');

    //     if (ShoppingCart.canAddToCartThisQuantityOfThisProduct(ShoppingCart.currentProducts[product_id], 1)) {
    //         ShoppingCart.addProduct(ShoppingCart.currentProducts[product_id], null, 1);
    //         button.html(window.PLUGIN_SHOPPINGCART.translations.PRODUCT_ADDED_TO_CART);
    //     } else {
    //         button.html(window.PLUGIN_SHOPPINGCART.translations.OUT_OF_STOCK);
    //     }

    //     setTimeout(function() {
    //         button.html(window.PLUGIN_SHOPPINGCART.translations.ADD_TO_CART);
    //         button.attr('disabled', null);
    //     }, 2000);
    // });


    // ShoppingCart.applyDiscountCode = function applyDiscountCode() {};

    // ShoppingCart.printVariation = function printVariation(item) {
    //     var out = '';
    //     for (var variation in item.variations) {
    //         if (item.variations.hasOwnProperty(variation)) {
    //             out += '<strong>' + variation + '</strong>: ' + item.variations[variation] + ' ';
    //         }
    //     }
    //     return out;
    // };


    /***********************************************************/
    /* Calculate price of the variations combination selected
    /***********************************************************/
    // jQuery(document).on('change', '.variations select', function(e) {
    //     var variations = {};

    //     var i = 0;
    //     var allVariantsChosen = true;
    //     var variationsNumber = ShoppingCart.currentProduct.variations.variations.length;
    //     if (variationsNumber > 0) {
    //         while (i < variationsNumber) {
    //             if (jQuery('.variations select').get(i)) {
    //                 var val = jQuery(jQuery('.variations select').get(i)).val();
    //                 if (!val) {
    //                     allVariantsChosen = false;
    //                 }
    //             }
    //             i++;
    //         }
    //     }

    //     if (allVariantsChosen) {
    //         // find combination, see if price changes and in case update it.

    //         var theCombination = jQuery(ShoppingCart.currentProduct.variations.combinations).filter(function(index, item) { if (jQuery(jQuery('.variations select').get(0)).val() == ShoppingCart.htmlDecode(item.variant.column1)) return true; }).toArray();

    //         i = 0;
    //         if (variationsNumber > 0) {
    //             while (i < variationsNumber) {
    //                 theCombination = jQuery(theCombination).filter(function(index, item) { if (jQuery(jQuery('.variations select').get(i)).val() == ShoppingCart.htmlDecode(item.variant['column' + (i+1)])) return true; }).toArray();
    //                 i++;
    //             }
    //         }

    //         var combinationChosen = theCombination[0];
    //         var price = ShoppingCart.currentProduct.normal_price;
    //         if (typeof combinationChosen.price !== 'undefined' && combinationChosen.price !== '') {
    //             price = combinationChosen.price;
    //         }
    //         ShoppingCart.currentProduct.price = price;
    //         jQuery('.js__product-price').html(price);

    //         if (ShoppingCart.currentProduct.variations.manageStock) { //variations have stock management
    //             if (!isNaN(combinationChosen.quantity_available)) {
    //                 ShoppingCart.currentProduct.quantity_available = parseInt(combinationChosen.quantity_available);
    //             } else {
    //                 ShoppingCart.currentProduct.quantity_available = ''; //no limit
    //             }

    //             ShoppingCart.calculateItemsLeft();
    //         }

    //     }

    // });

})();
