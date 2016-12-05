<?php
use Step\Acceptance\Frontend as FrontendTester;

$I = new FrontendTester($scenario);

$I->am('Customer');
$I->wantTo('buy a product with Stripe');
$I->lookForwardTo('conclude the purchase process');

$I->buyProductWithStripeCheckout();
