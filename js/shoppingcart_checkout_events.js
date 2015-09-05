(function(ShoppingCart) {

    /***********************************************************/
    /* Generate the selected shipment price
    /***********************************************************/
    jQuery(document).on('change', '.js__shipment__method', function(event) {
        ShoppingCart.generateShipmentPrice();
    });

    /***********************************************************/
    /* Store order in localstorage and proceed to PayPal / save order if offline
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
            var paymentMethod = null;
            var shippingMethod = {};

            //Agreed to terms and conditions?
            if (ShoppingCart.settings.general.agreeToTerms && !jQuery('#js__accepted-terms').prop("checked")) {
                alert(window.PLUGIN_SHOPPINGCART.translations.PLEASE_ACCEPT_TERMS_AND_CONDITIONS);
                return;
            }

            //Determine payment method
            if (jQuery(ShoppingCart.settings.payment.methods).filter(function(index, item) { if (item.enabled == true) return true; }).toArray().length > 1) {
                if (jQuery('#payment-method-offline').prop('checked')) paymentMethod = 'offline';
                if (jQuery('#payment-method-paypal').prop('checked')) paymentMethod = 'paypal';
                if (jQuery('#payment-method-stripe').prop('checked')) paymentMethod = 'stripe';
            } else {
                paymentMethod = jQuery(ShoppingCart.settings.payment.methods).filter(function(index, item) { if (item.enabled == true) return true; }).toArray()[0].name.toLowerCase();
            }

            //If offline, determine additional information
            var userProvidedInfo = jQuery('#payment-method-offline-textarea').val();

            if (paymentMethod === 'offline' && jQuery(ShoppingCart.settings.payment.methods).filter(function(index, item) { if (item.name == 'Offline') return true; }).toArray()[0].askUserInfo) {
                if (!userProvidedInfo) {
                    alert(window.PLUGIN_SHOPPINGCART.translations.PLEASE_FILL_PAYMENT_INFORMATION_TEXT_AREA);
                    jQuery(that).attr('disabled', null);
                    return;
                }
            }

            //Determine shipping method
            if (ShoppingCart.settings.shipment.methods.length === 0) {
                shippingMethod = {
                    method: '',
                    cost: 0
                };
            } else if (ShoppingCart.settings.shipment.methods.length === 1) {
                shippingMethod = {
                    method: ShoppingCart.settings.shipment.methods[0].name,
                    cost: ShoppingCart.settings.shipment.methods[0].price
                };
            } else {
                shippingMethod = {
                    method: jQuery('.js__shipment__method').val(),
                    cost: ShoppingCart.shipmentPrice
                };
            }

            //Store in localstorage
            storejs.set('grav-shoppingcart-shipment-method', JSON.stringify(shippingMethod));
            if (paymentMethod === 'offline') {
                storejs.set('grav-shoppingcart-payment-method', JSON.stringify({
                    method: paymentMethod,
                    message: userProvidedInfo
                }));
            } else {
                storejs.set('grav-shoppingcart-payment-method', JSON.stringify({
                    method: paymentMethod
                }));
            }
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
            //Add shipment costs to the order price
            //////////////////////////////////////////////////////////
            ShoppingCart.generateShipmentPrice();
            orderPrice = parseFloat(parseFloat(orderPrice) + parseFloat(ShoppingCart.shipmentPrice)).toFixed(2);
            ShoppingCart.totalOrderPrice = orderPrice;

            //////////////////////////////////////////////////////////
            //Remove coupon discount from the total amount
            //////////////////////////////////////////////////////////
            if (!ShoppingCart.amountOfDiscount) ShoppingCart.amountOfDiscount = 0;
            ShoppingCart.totalOrderPrice = parseFloat(parseFloat(parseFloat(ShoppingCart.totalOrderPrice) - parseFloat(ShoppingCart.amountOfDiscount)).toFixed(2)).toFixed(2);

            //Proceed with the payment
            if (paymentMethod === 'paypal') {
                var goToPayPal = function goToPayPal() {
                    var text = '';
                    var i = 0;
                    var cart = ShoppingCart.items;

                    while (i < cart.length) {
                        text += '<input type="hidden" name="item_name_' + (i + 1) + '" value="' + cart[i].product.title + '">';
                        text += '<input type="hidden" name="amount_' + (i + 1) + '" value="' + cart[i].product.price + '">';
                        text += '<input type="hidden" name="quantity_' + (i + 1) + '" value="' + cart[i].quantity + '">';
                        i++;
                    }

                    var address = JSON.parse(storejs.get('grav-shoppingcart-person-address'));

                    text += '\
                        <input type="hidden" name="cmd" value="_cart"> \
                        <input type="hidden" name="bn" value="JooCommerce_SP">\
                        <input type="hidden" name="upload" value="1"> \
                        <input type="hidden" name="shipping_1" value="' + ShoppingCart.shipmentPrice + '"> \
                        <input type="hidden" name="business" value="' + jQuery(ShoppingCart.settings.payment.methods).filter(function(index, item) { if (item.name == 'PayPal') return true; }).toArray()[0].accountUsername + '"> \
                        <input type="hidden" name="currency_code" value="' + ShoppingCart.settings.general.defaultCurrency + '"> \
                        <input type="hidden" name="custom" value="' + token + '"> \
                        <input type="hidden" name="return" value="' + ShoppingCart.orderSuccessfulPageURL + '"> \
                        <input type="hidden" name="cancel_return" value="' + ShoppingCart.orderCancelledPageURL + '"> \
                        <input type="hidden" name="notify_url" value="' + ShoppingCart.ipnURL + '"> \
                        <input type="hidden" name="tax_cart" value="' + ShoppingCart.taxesApplied + '"> \
                        <input type="hidden" name="first_name" value="' + address.firstname + '"> \
                        <input type="hidden" name="last_name" value="' + address.lastname + '"> \
                        <input type="hidden" name="address1" value="' + address.address1 + '"> \
                        <input type="hidden" name="address2" value="' + address.address2 + '"> \
                        <input type="hidden" name="city" value="' + address.city + '"> \
                        <input type="hidden" name="state" value="' + (address.country == 'US' ? address.state : address.province) + '"> \
                        <input type="hidden" name="zip" value="' + address.zip + '"> \
                        <input type="hidden" name="lc" value="' + address.country + '"> \
                        <input type="hidden" name="email" value="' + address.email + '"> \
                        <input type="hidden" name="night_phone_b" value="' + address.telephone + '">';

                    if (ShoppingCart.amountOfDiscount) {
                        text += '<input type="hidden" name="discount_amount_cart" value="' + ShoppingCart.amountOfDiscount + '">';
                    }

                    jQuery('#paypal-form').append(text);
                    jQuery('#paypal-form').submit();
                };

                //Prevent multiple clicks of button
                //TODO: uncomment
                //jQuery(that).attr('disabled', 'disabled');

                //Save the order to db as 'not paid'
                var order = {
                    products: storejs.get('grav-shoppingcart-basket-data').replace(/(&quot;)/g, '\\"'),
                    address: storejs.get('grav-shoppingcart-person-address'),
                    shipment: storejs.get('grav-shoppingcart-shipment-method'),
                    payment: storejs.get('grav-shoppingcart-payment-method'),
                    token: JSON.parse(storejs.get('grav-shoppingcart-order-token')).token,
                    total_paid: ShoppingCart.totalOrderPrice,
                    // discount_code: ShoppingCart.discountCodeUsed
                };

                jQuery.ajax({
                    url: ShoppingCart.settings.urls.baseURL + '/save_order?task=order.save',
                    data: order,
                    type: 'POST',
                    cache: false
                })
                .success(function(orderId) {
                    console.log(orderId);
                    // goToPayPal(orderId);
                });
            }

//TODO
            // if (paymentMethod === 'stripe') {
            //     jQuery(that).attr('disabled', 'disabled');

            //     ShoppingCart.stripeHandler.open({
            //         name: unescape(jQuery(ShoppingCart.settings.payment.methods).filter(function(index, item) { if (item.name == 'Stripe') return true; }).toArray()[0].stripeName),
            //         description: unescape(jQuery(ShoppingCart.settings.payment.methods).filter(function(index, item) { if (item.name == 'Stripe') return true; }).toArray()[0].stripeDescription),
            //         email: JSON.parse(storejs.get('grav-shoppingcart-person-address')).email,
            //         amount: ShoppingCart.totalOrderPrice.toString().replace('.', ''),
            //         currency: ShoppingCart.settings.general.defaultCurrency
            //     });
            // }
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

        var interval = setInterval(function() {
        // if (ShoppingCart.settings != null) {
          clearInterval(interval);
          if (window.ShoppingCart && ShoppingCart.items) {
            ShoppingCart.setupCheckout();
            ShoppingCart.populateShippingOptions();
            // <?php if ($paymentMethodStripe) : ?>
            //   configureStripe();
            // <?php endif ?>
          }
        // }
        }, 50);
    });

})(window.ShoppingCart);
