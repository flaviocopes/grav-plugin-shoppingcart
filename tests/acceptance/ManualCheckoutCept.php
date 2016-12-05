<?php
use Step\Acceptance\Frontend as FrontendTester;

$I = new FrontendTester($scenario);

$I->am('Customer');
$I->wantTo('buy a product with Manual Checkout');
$I->lookForwardTo('conclude the purchase process');

$I->buyProductWithManualCheckout();
