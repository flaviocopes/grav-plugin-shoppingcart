<?php
namespace Grav\Plugin;

use Grav\Common\File\CompiledYamlFile;
use Grav\Common\Grav;
use Grav\Common\User\User;
use Grav\Common\Page\Page;
use Symfony\Component\Yaml\Yaml;
use RocketTheme\Toolbox\File\File;


class ShoppingCartController
{
    /**
     * @param Grav   $grav
     * @param string $task
     * @param array  $post
     */
    public function __construct(Grav $grav, $task, $post)
    {
        $this->grav = $grav;
        $this->task = $task ?: 'display';
        $this->post = $this->getPost($post);
    }

    /**
     * Performs a task.
     */
    public function execute()
    {
        // Set redirect if available.
        if (isset($this->post['_redirect'])) {
            $redirect = $this->post['_redirect'];
            unset($this->post['_redirect']);
        }

        $success = false;
        $method = 'task' . ucfirst($this->task);

        if (!method_exists($this, $method)) {
            throw new \RuntimeException('Page Not Found', 404);
        }

        try {
            $success = call_user_func(array($this, $method));
        } catch (\RuntimeException $e) {
            $this->setMessage($e->getMessage());
        }

        return $success;
    }

    /**
     * Handle saving the order.
     *
     * @return bool True if the action was performed.
     */
    public function taskPay()
    {

        $currency = $this->grav['config']->get('plugins.shoppingcart.general.currency');
        $secretKey = $this->grav['config']->get('plugins.shoppingcart.payment.methods.stripe.secretKey');
        $description = $this->grav['config']->get('plugins.shoppingcart.payment.methods.stripe.description');

        $amount = $this->post['amount'];
        $stripeToken = $this->post['stripeToken'];

        //process payment
        \Stripe\Stripe::setApiKey($secretKey);

        // Create the charge on Stripe's servers - this will charge the user's card
        try {
            $charge = \Stripe\Charge::create([
                "amount" => $amount, // amount in cents, again
                "currency" => $currency,
                "card" => $stripeToken,
                "description" => $description
            ]);
        } catch(\Stripe\Error\Card $e) {
            // The card has been declined
            throw new \RuntimeException("Stripe payment not successful");
            //TODO: fail gracefully
        }

        //all fine, save order to db
        $order_id = $this->_saveOrder();
        echo $order_id; exit();
    }

    /**
     * Saves the order and sends the order emails
     */
    private function _saveOrder()
    {
        $order_id = $this->_saveOrderToFilesystem();
        $this->_sendEmails($order_id);

        return $order_id;
    }

    /**
     * Sends the order emails
     */
    private function _sendEmails()
    {
       //TODO
    }

    /**
     * Saves the order to the filesystem in the user/data/ folder
     */
    private function _saveOrderToFilesystem() {
        $prefix = 'order-';
        $format = 'Ymd-His-u';
        $ext = '.txt';
        $filename = $prefix . $this->udate($format) . $ext;

        /** @var Twig $twig */
        $twig = $this->grav['twig'];

        $body = Yaml::dump(array(
            'products' => $this->post['products'],
            'address' => $this->post['address'],
            'shipping' => $this->post['shipping'],
            'payment' => $this->post['payment'],
            'token' => $this->post['token'],
            'paid' => true,
            'paid_on' => $this->udate($format),
            'total_paid' => $this->post['total_paid'],
        ));

        // $vars = array(
        //     'order' => json_encode(array(
        //         'products' => $this->post['products'],
        //         'address' => $this->post['address'],
        //         'shipping' => $this->post['shipping'],
        //         'payment' => $this->post['payment'],
        //         'token' => $this->post['token'],
        //         'paid' => true,
        //         'paid_on' => $this->udate($format),
        //         'total_paid' => $this->post['total_paid'],
        //     ))
        // );

        $file = File::instance(DATA_DIR . 'shoppingcart' . '/' . $filename);
        // $body = $twig->processString(
        //     '{{order}}',
        //     $vars
        // );

        $file->save($body);

        return $filename;
    }

    /**
     * Prepare and return POST data.
     *
     * @param array $post
     * @return array
     */
    protected function getPost($post)
    {
        unset($post['task']);

        // Decode JSON encoded fields and merge them to data.
        if (isset($post['_json'])) {
            $post = array_merge_recursive($post, $this->jsonDecode($post['_json']));
            unset($post['_json']);
        }
        return $post;
    }

    /**
     * Create unix timestamp for storing the data into the filesystem.
     *
     * @param string $format
     * @param int $utimestamp
     * @return string
     */
    private function udate($format = 'u', $utimestamp = null)
    {
        if (is_null($utimestamp)) {
            $utimestamp = microtime(true);
        }

        $timestamp = floor($utimestamp);
        $milliseconds = round(($utimestamp - $timestamp) * 1000000);

        return date(preg_replace('`(?<!\\\\)u`', \sprintf('%06d', $milliseconds), $format), $timestamp);
    }
}
