<?php
namespace Grav\Plugin;

use Grav\Common\File\CompiledYamlFile;
use Grav\Common\Grav;
use Grav\Common\User\User;
use Grav\Common\Page\Page;
use Symfony\Component\Yaml\Yaml;
use RocketTheme\Toolbox\Event\Event;
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
        $this->grav = Grav::instance();
        $this->task = $task ?: 'display';
        $this->post = $this->getPost($post);
    }

    /**
     * Add message into the session queue.
     *
     * @param string $msg
     * @param string $type
     */
    public function setMessage($msg, $type = 'info')
    {
        /** @var Message $messages */
        $messages = $this->grav['messages'];
        $messages->add($msg, $type);
    }

    /**
     * Performs a task.
     */
    public function execute()
    {
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
        $orderData = $this->post;
        require_once __DIR__ . '/order.php';
        $order = new Order($orderData);

        $this->grav->fireEvent('onShoppingCartPay', new Event(['gateway' => $order->gateway, 'order' => $order]));
    }

    /**
     * Handle saving the order.
     *
     * @return bool True if the action was performed.
     */
    public function taskPreparePayment()
    {
        $orderData = $this->post;
        require_once __DIR__ . '/order.php';
        $order = new Order($orderData);

        $this->grav->fireEvent('onShoppingCartPreparePayment', new Event(['gateway' => $order->gateway, 'order' => $order]));
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
        return $post;
    }
}
