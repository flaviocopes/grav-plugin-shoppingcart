<?php
namespace Grav\Plugin;

use Grav\Common\File\CompiledYamlFile;
use Grav\Common\Grav;
use Grav\Common\User\User;
use Grav\Common\Page\Page;
use Symfony\Component\Yaml\Yaml;

// use RocketTheme\Toolbox\Session\Message;

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
    public function taskSave()
    {
        error_log('SAVE!');

        $order_id = $this->_saveOrder();
        echo $order_id;
        exit();
    }

    private function _saveOrderPage() {
        $pages = $this->grav['pages'];
        $parent = $pages->dispatch('/orders', true);

        // Create page.
        $page = new Page;
        $page->parent($parent);
        $now = new \DateTime();
        $year = $now->format('Y');
        $month = $now->format('m');
        $page->folder($parent->path() . '/' . $year . '/' . $month . '/' . md5($now->getTimestamp()));

        $products = json_decode($this->post['products']);
        $address = json_decode($this->post['address']);
        $shipment = json_decode($this->post['shipment']);
        $payment = json_decode($this->post['payment']);
        $token = $this->post['token'];
        $total_paid = $this->post['total_paid'];



        $header = [];
        $header['products'] = [];
        foreach($products as $product) {
            $header['products'][] = [
                'quantity' => $product->quantity,
                'product' => [
                    'title' => $product->product->title,
                    'id' => $product->product->id,
                    'price' => $product->product->price,
                    'normal_price' => $product->product->normal_price,
                    'defaultPhoto' => $product->product->defaultPhoto,
                    'quantity_available' => $product->product->quantity_available,
                    'type' => $product->product->type,
                    'hasFiles' => $product->product->hasFiles,
                    'size_weight' => $product->product->size_weight,
                    'url' => $product->product->url,
                    'isDigital' => $product->product->isDigital,
                ]
            ];
        }

        $header['created_on'] = $now->format(DATE_ATOM);

        $header['address'] = [
            'firstname' => $address->firstname,
            'lastname' => $address->lastname,
            'email' => $address->email,
            'telephone' => $address->telephone,
            'address1' => $address->address1,
            'address2' => $address->address2,
            'city' => $address->city,
            'zip' => $address->zip,
            'country' => $address->country,
            'state' => $address->state,
            'province' => $address->province,
        ];

        $header['shipment'] = [
            'method' => $shipment->method,
            'cost' => $shipment->cost,
        ];

        $header['payment'] = [
            'method' => $payment->method,
        ];

        $header['token'] = $token;
        $header['total_paid'] = $total_paid;

        $page->name('order.md');
        $page->header($header);
        $page->frontmatter(Yaml::dump((array)$page->header(), 10, 2, false));
        $page->validate();
        $page->filter();
        $page->save();
    }

    private function _saveOrder() {
        $this->_saveOrderPage();
/*
        $app = JFactory::getApplication();
        $products = joo_decode($app->input->post->get('products', '', 'STRING'));
        $address = joo_decode($app->input->post->get('address', '', 'STRING'));
        $shipment = joo_decode($app->input->post->get('shipment', '', 'STRING'));
        $payment = joo_decode($app->input->post->get('payment', '', 'STRING'));
        $token = joo_decode($app->input->post->get('token', '', 'STRING'));
        $total_paid = joo_decode($app->input->post->get('total_paid', '', 'STRING'));
        $discount_code = joo_decode($app->input->post->get('discount_code', '', 'STRING'));

        $db = JFactory::getDBO();
        $db->setQuery('SELECT id FROM #__joocommerce_orders WHERE token='.$db->Quote($token));

        $order_id = $db->loadResult();
        if ($order_id) {
            //IPN already arrived
            $query = $db->getQuery(true);

            $query->update('#__joocommerce_orders');
            $query->set($db->quoteName('created_on') . ' = NOW()');
            $query->set($db->quoteName('products') . ' = ' . $db->Quote($products));
            $query->set($db->quoteName('address') . ' = ' . $db->Quote($address));
            $query->set($db->quoteName('shipment') . ' = ' . $db->Quote($shipment));
            $query->set($db->quoteName('payment') . ' = ' . $db->Quote($payment));
            $query->set($db->quoteName('total_paid') . ' = ' . $db->Quote($total_paid));
            $query->set($db->quoteName('discount_code') . ' = ' . $db->Quote($discount_code));
            $query->where('token='.$db->quote($token));

            $db->setQuery((string) $query);

            try {
                $db->execute();
            } catch (RuntimeException $e) {
                error_log($e->getMessage());
            }

            JoocommerceHelper::sendEmails($order_id);
        } else {
            $query = $db->getQuery(true);

            $query->insert('#__joocommerce_orders');
            $query->columns(array(
                $db->quoteName('created_on'),
                $db->quoteName('products'),
                $db->quoteName('address'),
                $db->quoteName('shipment'),
                $db->quoteName('payment'),
                $db->quoteName('token'),
                $db->quoteName('total_paid'),
                $db->quoteName('discount_code'),
                $db->quoteName('created_by')
            ));

            $query->values(
                'NOW(), '.
                $db->Quote($products). ', '.
                $db->Quote($address). ', '.
                $db->Quote($shipment). ', '.
                $db->Quote($payment). ', '.
                $db->Quote($token). ', '.
                $db->Quote($total_paid). ', '.
                $db->Quote($discount_code). ', '.
                $db->Quote((int) JFactory::getUser()->get('id'))
            );

            $db->setQuery((string) $query);

            try {
                $db->execute();
            } catch (RuntimeException $e) {
                error_log($e->getMessage());
            }

            $order_id = $db->insertid();
        }

        if (strpos($payment, 'stripe')) {
            $this->_setOrderAsPaid($order_id);
        }

        if (strpos($payment, 'stripe')) {
            JoocommerceHelper::sendEmails($order_id);
        }

        return $order_id;

*/
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
}
