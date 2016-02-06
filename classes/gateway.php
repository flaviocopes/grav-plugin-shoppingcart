<?php
namespace Grav\Plugin;

use Grav\Common\Grav;
use RocketTheme\Toolbox\Event\Event;

abstract class ShoppingCartGateway
{
    protected $name = '';

    /** @var Grav $grav */
    protected $grav;

    /**
     * Return the order extracted from the event object
     */
    public function getOrderFromEvent(Event $event) {
        require_once __DIR__ . '/order.php';
        return new Order($event['order']);
    }

    /**
     * Returns true if the called gateway is the current one
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

    abstract public function onShoppingCartPay(Event $event);
}
