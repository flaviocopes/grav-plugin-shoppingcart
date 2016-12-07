<?php
namespace Grav\Plugin\ShoppingCart;

use Grav\Common\Data\Data;

/**
 * Class Gateway
 * @package Grav\Plugin\ShoppingCart
 *
 * @property string amount
 * @property string currency
 * @property string gateway
 * @property string token
 */
class Order
{
    protected $data;

    /**
     * Order constructor.
     *
     * @param      $order
     * @param null $type
     */
    public function __construct($order, $type = null) {
        $this->data = new Data();

        if (is_array($order)) {
            if (isset($order['products'])) $this->data->set('products', $order['products']);
            if (isset($order['data'])) $this->data->set('data', $order['data']);
            if (isset($order['shipping'])) $this->data->set('shipping', $order['shipping']);
            if (isset($order['payment'])) $this->data->set('payment', $order['payment']);
            if (isset($order['amount'])) $this->data->set('amount', $order['amount']);
            if (isset($order['taxes'])) $this->data->set('taxes', $order['taxes']);
            if (isset($order['token'])) $this->data->set('token', $order['token']);
            if (isset($order['extra'])) $this->data->set('extra', $order['extra']);
            if (isset($order['gateway'])) $this->data->set('gateway', $order['gateway']);
        } elseif (get_class($order) == 'Grav\Plugin\ShoppingCart\Order' || get_class($order) == 'Order') {
            $this->data = $order->getData();
        }

        return $this;
    }

    public function getData() {
        return $this->data;
    }

    /**
     * @param $key
     *
     * @return mixed
     */
    public function __get($key) {
        return $this->data->get($key);
    }

    /**
     * @param $key
     *
     * @return bool
     */
    public function __isset($key) {
        return isset($this->data->$key);
    }

    public function __toString() {
        return $this->toJson();
    }

    public function toJson() {
        return $this->data->toJson();
    }

    public function toArray() {
        return $this->data->toArray();
    }
}

