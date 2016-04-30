<?php

use Grav\Plugin\ShoppingCart\ShoppingCart;

/**
 * Class ShoppingCartTest
 */
class ShoppingCartTest extends \Codeception\TestCase\Test
{
    protected $shoppingcart;

    protected function _before()
    {
        require_once(__DIR__ . '/../../../classes/shoppingcart.php');
        $this->shoppingcart = new ShoppingCart();
    }

    protected function _after()
    {
    }

    public function testGetCountries()
    {
        $countries = $this->shoppingcart->getCountries();
        $this->assertTrue(is_array($countries));
    }

    public function testGetCurrencies()
    {
        $currencies = $this->shoppingcart->getCurrencies();
        $this->assertTrue(is_array($currencies));
    }

    public function testGetOwnPageTypes()
    {
        $page_types = ShoppingCart::getOwnPageTypes();
        $this->assertTrue(is_array($page_types));

        // Test current page types

        $this->assertContains('shoppingcart_categories', $page_types);
        $this->assertContains('shoppingcart_products', $page_types);
        $this->assertContains('shoppingcart_product', $page_types);
        $this->assertContains('shoppingcart_checkout', $page_types);
        $this->assertContains('shoppingcart_order', $page_types);

        // Test deprecated page types

        $this->assertContains('shoppingcart_category', $page_types);
        $this->assertContains('shoppingcart_detail', $page_types);
        $this->assertContains('shoppingcart', $page_types);
    }

    public function testGetSymbolOfCurrencyCode()
    {
        $this->assertSame('€', ShoppingCart::getSymbolOfCurrencyCode('EUR'));
        $this->assertSame('€', ShoppingCart::getSymbolOfCurrencyCode('eur'));
        $this->assertSame('€', ShoppingCart::getSymbolOfCurrencyCode('Eur'));
        $this->assertSame('$', ShoppingCart::getSymbolOfCurrencyCode('USD'));

        try {
            $this->assertSame('', ShoppingCart::getSymbolOfCurrencyCode('xxxxxxx'));
            $this->fail("Expected Exception not thrown");
        } catch (Exception $e) {
            $this->assertContains("Undefined index", $e->getMessage());
        }
    }

    public function testGetShippingCountries()
    {
        $countries = $this->shoppingcart->getShippingCountries();
        $this->assertTrue(is_array($countries));
    }

    public function testGetTranslationStringsForFrontend()
    {
        $strings = $this->shoppingcart->getTranslationStringsForFrontend();
        $this->assertTrue(is_array($strings));
    }
}

