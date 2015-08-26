<?php
namespace Grav\Plugin;

use Grav\Common\Plugin;
use Grav\Common\Grav;
use Grav\Common\Page\Page;
use Grav\Common\Page\Types;
use RocketTheme\Toolbox\Event\Event;

class ShoppingcartPlugin extends Plugin
{
    /**
     * @return array
     */
    public static function getSubscribedEvents()
    {
        return [
            'onPluginsInitialized' => ['onPluginsInitialized', 0],
            'onGetPageTemplates' => ['onGetPageTemplates', 0]
        ];
    }

    /**
     * Enable search only if url matches to the configuration.
     */
    public function onPluginsInitialized()
    {
        if ($this->isAdmin()) {
            $this->active = false;
            return;
        }

        $this->enable([
            'onPageInitialized' => ['onPageInitialized', 0],
            'onTwigTemplatePaths' => ['onTwigTemplatePaths', 0]
        ]);

        // Register route to checkout page if it has been set.
        $this->checkout_url = $this->config->get('plugins.shoppingcart.checkout_url');
        if ($this->checkout_url) {
            $this->enable([
                'onPagesInitialized' => ['addCheckoutPage', 0]
            ]);
        }
    }

    public function addCheckoutPage()
    {
        $pages = $this->grav['pages'];
        $page = $pages->dispatch($this->checkout_url);

        if (!$page) {
            // Only add checkout page if it hasn't already been defined.
            $page = new Page;
            $page->init(new \SplFileInfo(__DIR__ . "/pages/shoppingcart_checkout.md"));
            $page->slug(basename($this->checkout_url));

            $pages->addPage($page, $this->checkout_url);
        }
    }

    /**
     * Add page template types.
     */
    public function onGetPageTemplates(Event $event)
    {
        /** @var Types $types */
        $types = $event->types;
        $types->scanTemplates('plugins://shoppingcart/templates');
    }

    /**
     * Initialize configuration
     */
    public function onPageInitialized()
    {
        $defaults = (array) $this->config->get('plugins.shoppingcart');

        /** @var Page $page */
        $page = $this->grav['page'];
        if (isset($page->header()->shoppingcart)) {
            $page->header()->shoppingcart = array_merge($defaults, $page->header()->shoppingcart);
        } else {
            $page->header()->shoppingcart = $defaults;
        }

        $this->enable([
            'onTwigSiteVariables' => ['onTwigSiteVariables', 0]
        ]);

        /**
         * Add translations needed in JavaScript code
         */
        $assets = $this->grav['assets'];
        $translations  = 'if (!window.translations) window.PLUGIN_SHOPPINGCART = {}; ' . PHP_EOL . 'window.PLUGIN_SHOPPINGCART.translations = {};' . PHP_EOL;


        $strings = ['SHOPPING_CART',
            'YOU_ARE_PURCHASING_THESE_ITEMS',
            'ITEMS_PURCHASED',
            'ITEM',
            'PRICE',
            'QUANTITY',
            'TOTAL',
            'REMOVE',
            'CONTINUE_SHOPPING',
            'CHECKOUT',
            'PLEASE_FILL_ALL_THE_REQUIRED_FIELDS',
            'SORRY_THE_EMAIL_IS_NOT_VALID_DID_YOU_MEAN',
            'SORRY_THE_EMAIL_IS_NOT_VALID',

        ];

        foreach($strings as $string) {
            $translations .= 'PLUGIN_SHOPPINGCART.translations.' . $string .' = "' . $this->grav['language']->translate(['PLUGIN_SHOPPINGCART.' . $string]) . '"; ' . PHP_EOL;;
        }

        $assets->addInlineJs($translations);

        /**
         * Add settings needed in JavaScript code
         */
        $checkout_url = $this->config->get('plugins.shoppingcart.checkout_url');
        if (!$checkout_url) {
            echo 'Checkout URL not configured. Exiting';
            return;
        }

        $assets->addInlineJs('PLUGIN_SHOPPINGCART.checkout_url = "' . $this->grav['base_url_relative'] . $checkout_url . '"');

        /**
         * Add plugin settings as JavaScript code
         */

        $settings = $this->config->get('plugins.shoppingcart');
        var_dump($settings); exit();
    }

    /**
     * Add current directory to twig lookup paths.
     */
    public function onTwigTemplatePaths()
    {
        $this->grav['twig']->twig_paths[] = __DIR__ . '/templates';
    }

    /**
     * Set needed variables to display cart.
     */
    public function onTwigSiteVariables()
    {
        if ($this->config->get('plugins.shoppingcart.built_in_css')) {

            $this->grav['assets']
                ->add('plugin://shoppingcart/css/shoppingcart.css');

        }
    }
}
