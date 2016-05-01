<?php
namespace Step\Acceptance;

use Page\Checkout as CheckoutPage;

class Frontend extends \AcceptanceTester
{

    /**
     * Define custom actions here
     */

    public function buyProductWithManualCheckout()
    {
        $I = $this;
        $I->addProductToCart();
        $I->goToCheckout();
        $checkoutPage = new CheckoutPage($I);
        $checkoutPage->fillCheckout();
        $checkoutPage->selectPaymentMethod('Manual Checkout');
        $checkoutPage->proceedToPayment();
        $I->checkOrderConfirmed();
    }

    public function buyProductWithStripeCheckout()
    {
        $I = $this;
        $I->addProductToCart();
        $I->goToCheckout();
        $checkoutPage = new CheckoutPage($I);
        $checkoutPage->fillCheckout();
        $checkoutPage->selectPaymentMethod('Stripe');
        $checkoutPage->proceedToPayment();
        $checkoutPage->waitForStripeCheckoutToShowUp();
        $checkoutPage->fillStripeCheckoutForm();
        $I->checkOrderConfirmed();
    }


    /**
     * Add a product to the cart
     */
    public function addProductToCart()
    {
        $I = $this;
        $I->amOnPage('/');
        $I->executeJS('ShoppingCart.clearCart()');
        $I->see('Shop');
        $I->see('Geek Toys');
        $I->seeLink('Geek Toys');
        $I->click('Geek Toys');
        $I->see('Anime, Gaming, Movies, Comics, we have all your toys');
        $I->see('Stuffy Turret');
        $I->seeLink('Details');
        $I->click('Details');
        $I->see('Brick Mug');
        $I->seeLink('Add to cart');
        $I->click('.js__shoppingcart__button-add-to-cart');
    }

    /**
     * Go to the checkout page by clicking the cart button
     */
    public function goToCheckout()
    {
        $I = $this;
        $I->see('Checkout');
        $I->click('Checkout');
    }

    /**
     * Check the order confirmation is shown
     */
    public function checkOrderConfirmed()
    {
        $I = $this;
        $I->waitForElementVisible('.shoppingcart__order-confirmation', 20); // secs
        $I->see('Thanks for your order');
    }


}