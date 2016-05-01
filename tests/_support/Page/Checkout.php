<?php
namespace Page;

class Checkout
{
    // include url of current page
    public static $URL = '';

    /**
     * @var \AcceptanceTester
     */
    protected $tester;

    /**
     * Declare UI map for this page here. CSS or XPath allowed.
     * public static $usernameField = '#username';
     * public static $formSubmitButton = "#mainForm input[type=submit]";
     */



    public function __construct(\AcceptanceTester $I)
    {
        $this->tester = $I;
    }

    /**
     *
     */
    public function waitForStripeCheckoutToShowUp()
    {
        $I = $this->tester;

        $I->wait(5); // secs
        $I->switchToIFrame('stripe_checkout_app');
        $I->waitForElementVisible('#card_number', 10); // secs
    }

    /**
     *
     */
    public function fillStripeCheckoutForm()
    {
        $I = $this->tester;
        $I->switchToWindow();
        $I->switchToIFrame('stripe_checkout_app');

        $I->see('Stripe');

        //Adding them all at once does not work for some strange Stripe frontend input magic

        // $I->fillField(['id' => 'card_number'], '4242424242424242');
        // $I->fillField(['id' => 'cc-exp'], '222');
        // $I->fillField(['id' => 'cc-csc'], '222');

        // $I->submitForm('#signup', ['username' => 'MilesDavis'])


        $I->pressKey('#card_number','4');
        $I->pressKey('#card_number','2');
        $I->pressKey('#card_number','4');
        $I->pressKey('#card_number','2');
        $I->pressKey('#card_number','4');
        $I->pressKey('#card_number','2');
        $I->pressKey('#card_number','4');
        $I->pressKey('#card_number','2');
        $I->pressKey('#card_number','4');
        $I->pressKey('#card_number','2');
        $I->pressKey('#card_number','4');
        $I->pressKey('#card_number','2');
        $I->pressKey('#card_number','4');
        $I->pressKey('#card_number','2');
        $I->pressKey('#card_number','4');
        $I->pressKey('#card_number','2');
        $I->pressKey('#cc-exp','0');
        $I->pressKey('#cc-exp','2');
        $I->pressKey('#cc-exp','2');
        $I->pressKey('#cc-exp','2');
        $I->pressKey('#cc-csc','222');

        $I->click('#submitButton');
        $I->switchToWindow();
    }

    /**
     * Fill the checkout form and accept the terms
     */
    public function fillCheckout()
    {
        $I = $this->tester;
        $I->fillField(['name' => 'data[firstname]'], 'John');
        $I->fillField(['name' => 'data[lastname]'], 'Tester');
        $I->fillField(['name' => 'data[email]'], 'john.tester@mail.com');
        $I->fillField(['name' => 'data[address]'], 'x');
        $I->fillField(['name' => 'data[telephone]'], 'x');
        $I->fillField(['name' => 'data[city]'], 'x');
        $I->fillField(['name' => 'data[zip]'], 'x');
        $I->click(['name' => 'data[agree_to_terms]']);
    }

    /**
     * Select the passed payment method
     */
    public function selectPaymentMethod($method)
    {
        $I = $this->tester;
        $I->selectOption('select.js__payment__method', $method);
    }

    /**
     * Go on and pay
     */
    public function proceedToPayment()
    {
        $I = $this->tester;
        $I->click('Go on and pay');
    }

}
