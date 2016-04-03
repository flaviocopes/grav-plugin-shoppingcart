<?php

/**
 * Class ShoppingCartTest
 */
class ShoppingCartTest extends \Codeception\TestCase\Test
{
    protected function _before()
    {
        require_once(__DIR__ . '/../../../classes/shoppingcart.php');
    }

    protected function _after()
    {
    }

    public function testGetSymbolOfCurrencyCode()
    {
        $this->assertSame('€', \Grav\Plugin\ShoppingCart::getSymbolOfCurrencyCode('EUR'));
        $this->assertSame('€', \Grav\Plugin\ShoppingCart::getSymbolOfCurrencyCode('eur'));
        $this->assertSame('€', \Grav\Plugin\ShoppingCart::getSymbolOfCurrencyCode('Eur'));
        $this->assertSame('$', \Grav\Plugin\ShoppingCart::getSymbolOfCurrencyCode('USD'));

        try {
            $this->assertSame('', \Grav\Plugin\ShoppingCart::getSymbolOfCurrencyCode('xxxxxxx'));
            $this->fail("Expected Exception not thrown");
        } catch (Exception $e) {
            $this->assertContains("Undefined index", $e->getMessage());
        }
    }
}

