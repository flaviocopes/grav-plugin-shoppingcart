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
        $this->grav->fireEvent('onShoppingCartPay', new Event(['gateway' => 'stripe', 'order' => $this->post]));
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
