<?php
namespace Grav\Plugin;

use Grav\Common\Grav;
use RocketTheme\Toolbox\Event\Event;

abstract class ShoppingCartGateway
{
    protected $name = '';

    /**
     * @param Grav $grav
     */
    public function __construct(Grav $grav)
    {
        $this->grav = $grav;

        if ($this->name == '') {
            throw new \RuntimeException('Gateway must provide the $name property');
        }

    }

    abstract public function onShoppingCartPay(Event $event);
}
