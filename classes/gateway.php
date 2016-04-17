<?php
namespace Grav\Plugin\ShoppingCart;

use Grav\Common\Grav;
use RocketTheme\Toolbox\Event\Event;

/**
 * Class Gateway
 * @package Grav\Plugin\ShoppingCart
 */
abstract class Gateway
{
    protected $name = '';

    /** @var Grav $grav */
    protected $grav;

    /**
     * Return the order extracted from the event object
     *
     * @param Event $event
     *
     * @return Order
     */
    public function getOrderFromEvent(Event $event) {
        require_once __DIR__ . '/order.php';
        return new Order($event['order']);
    }

    /**
     * Returns true if the called gateway is the current one
     *
     * @param $gateway
     *
     * @return bool
     */
    protected function isCurrentGateway($gateway) {
        if ($gateway != $this->name) {
            return false;
        }
        return true;
    }

    /**
     */
    public function __construct()
    {
        $this->grav = Grav::instance();

        if ($this->name == '') {
            throw new \RuntimeException('Gateway must provide the $name property');
        }

    }

    /**
     * @param Event $event
     *
     * @return mixed
     */
    abstract public function onShoppingCartPay(Event $event);
}
