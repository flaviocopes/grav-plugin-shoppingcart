<?php
namespace Grav\Plugin;

use Grav\Common\Plugin;
use Grav\Common\Grav;
use RocketTheme\Toolbox\Event\Event;
use Omnipay\Omnipay;

class ShoppingCartStripeGateway extends ShoppingCartGateway
{
    protected $name = 'stripe';

    /**
     * Handle paying via this gateway
     */
    public function onShoppingCartPay(Event $event) {
        if ($event['gateway'] != $this->name) {
            return;
        }

        $order = $event['order'];

        $amount = $order['amount'];
        $currency = $this->grav['config']->get('plugins.shoppingcart.general.currency');
        $description = $this->grav['config']->get('plugins.shoppingcart.payment.methods.stripe.description');

        $token = $order['stripeToken'];
        $secretKey = $this->grav['config']->get('plugins.shoppingcart.payment.methods.stripe.secretKey');

        $gateway = Omnipay::create('Stripe');
        $gateway->setApiKey($secretKey);

        try {
            $response = $gateway->purchase([
                'amount' => $amount,
                'currency' => $currency,
                'description' => $description,
                'token' => $token])->send();

            if ($response->isSuccessful()) {
                // mark order as complete
                $this->grav->fireEvent('onShoppingCartSaveOrder', new Event(['gateway' => 'stripe', 'order' => $order]));
            } elseif ($response->isRedirect()) {
                $response->redirect();
            } else {
                // display error to customer
                throw new \RuntimeException("Payment not successful: " . $response->getMessage());
            }
        } catch (\Exception $e) {
            // internal error, log exception and display a generic message to the customer
            throw new \RuntimeException('Sorry, there was an error processing your payment. Please try again later.');
        }
    }
}