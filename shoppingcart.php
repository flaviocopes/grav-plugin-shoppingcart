<?php
namespace Grav\Plugin;

use Grav\Common\Plugin;
use Grav\Common\Grav;
use Grav\Common\Page\Page;
use Grav\Common\Page\Types;
use RocketTheme\Toolbox\Event\Event;
use RocketTheme\Toolbox\File\File;
use Symfony\Component\Yaml\Yaml;

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
        require_once __DIR__ . '/vendor/autoload.php';

        $this->baseURL = $this->config->get('plugins.shoppingcart.urls.baseURL');
        $this->checkoutURL = $this->baseURL . $this->config->get('plugins.shoppingcart.urls.checkoutURL');
        $this->saveOrderURL = $this->baseURL . $this->config->get('plugins.shoppingcart.urls.saveOrderURL');
        $this->orderURL = $this->baseURL . $this->config->get('plugins.shoppingcart.urls.orderURL');

        if ($this->isAdmin()) {
            // Admin

            $this->enable([
                'onTwigTemplatePaths' => ['onTwigAdminTemplatePaths', 0]
            ]);

            $this->active = false;
            return;
        } else {
            // Site

            $this->enable([
                'onPageInitialized' => ['onPageInitialized', 0],
                'onTwigTemplatePaths' => ['onTwigTemplatePaths', 0]
            ]);

            /** @var Uri $uri */
            $uri = $this->grav['uri'];

            if ($this->checkoutURL && $this->checkoutURL == $uri->path()) {
                $this->enable([
                    'onPagesInitialized' => ['addCheckoutPage', 0]
                ]);
            }

            if ($this->saveOrderURL && $this->saveOrderURL == $uri->path()) {
                $this->enable([
                    'onPagesInitialized' => ['processOrder', 0]
                ]);
            }

            if ($this->orderURL && $this->orderURL == $uri->path()) {
                $this->enable([
                    'onPagesInitialized' => ['addOrderPage', 0]
                ]);
            }
        }

    }

    public function addCheckoutPage()
    {
        $url = $this->checkoutURL;
        $filename = 'shoppingcart_checkout.md';
        $this->addPage($url, $filename);
    }

    public function processOrder()
    {
        /** @var Uri $uri */
        $uri = $this->grav['uri'];
        $task = $uri->query('task');
        $task = substr($task, strlen('order.'));
        $post = !empty($_POST) ? $_POST : [];

        require_once __DIR__ . '/classes/controller.php';
        $controller = new ShoppingCartController($this->grav, $task, $post);
        $controller->execute();
        $controller->redirect();
    }

    public function addOrderPage()
    {
        $url = $this->orderURL;
        $filename = 'shoppingcart_order.md';
        $this->addPage($url, $filename);

        /** @var Uri $uri */
        $uri = $this->grav['uri'];

        $ext = '.txt';
        $filename = $uri->param('id');
        $file = File::instance(DATA_DIR . 'shoppingcart' . '/' . $filename . $ext);
        $order = Yaml::parse($file->content());

        if (!$order) {
            //Order not valid.
            //TODO: Manage case
        }

        /** @var Twig $twig */
        $twig = $this->grav['twig'];

        $twig->twig_vars['order_products'] = $order['products'];
        $twig->twig_vars['order_address'] = $order['address'];
        $twig->twig_vars['order_total_paid'] = $order['total_paid'];
        $twig->twig_vars['order_token'] = $order['token'];
        $twig->twig_vars['order_paid'] = $order['paid'];
        $twig->twig_vars['currency'] = $this->config->get('plugins.shoppingcart.general.currency');
    }

    private function addPage($url, $filename)
    {
        $pages = $this->grav['pages'];
        $page = $pages->dispatch($url);

        if (!$page) {
            $page = new Page;
            $page->init(new \SplFileInfo(__DIR__ . "/pages/" . $filename));
            $page->slug(basename($url));
            $pages->addPage($page, $url);
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


        $strings = [
            'DETAILS',
            'PRICE',
            'INCLUDING_TAXES',
            'EXCLUDING_TAXES',
            'ADD_TO_CART',
            'DESCRIPTION',
            'NO_PRODUCTS_FOUND',
            'CHECKOUT_PAGE_TITLE',
            'CHECKOUT_STEP1_BILLING_DETAILS_TITLE',
            'CHECKOUT_HEADLINE_YOUR_PERSONAL_DETAILS',
            'CHECKOUT_FIRST_NAME',
            'CHECKOUT_LAST_NAME',
            'CHECKOUT_EMAIL',
            'CHECKOUT_PHONE',
            'CHECKOUT_HEADLINE_YOUR_ADDRESS',
            'CHECKOUT_ADDRESS_1',
            'CHECKOUT_ADDRESS_2',
            'CHECKOUT_CITY',
            'CHECKOUT_ZIP',
            'CHECKOUT_COUNTRY',
            'CHECKOUT_STATE',
            'CHECKOUT_PROVINCE',
            'CHECKOUT_BUTTON_GO_TO_STEP_2',
            'CHECKOUT_STEP2_SHIPPING_PAYMENT_DETAILS_TITLE',
            'CHECKOUT_CHOOSE_SHIPPING_METHOD',
            'CHECKOUT_CHOOSE_SHIPPING_METHOD_DESC',
            'CHECKOUT_CHOOSE_PAYMENT_METHOD',
            'CHECKOUT_CHOOSE_PAYMENT_METHOD_QUESTION',
            'CHECKOUT_PAYMENT_SECURE_NOTE',
            'CHECKOUT_BUTTON_BACK',
            'CHECKOUT_BUTTON_PAY',
            'PRICE_DO_NOT_INCLUDE_TAXES',
            'ORDER_SUCCESSFUL_PAGE_TITLE',
            'ITEMS_PURCHASED',
            'ORDER_SUCCESSFUL_CONFIRMATION_TEXT',
            'ORDER_PAGE_WRONG_TOKEN_MESSAGE',
            'LOADING_WORD_BEFORE_ORDER_CONFIRMATION_PAGE',
            'DOWNLOAD',
            'SHOPPING_CART',
            'YOU_ARE_PURCHASING_THESE_ITEMS',
            'ITEM',
            'QUANTITY',
            'TOTAL',
            'REMOVE',
            'UPDATE_QUANTITIES',
            'CHECKOUT',
            'INCLUDING_SHIPPING',
            'ORDER_NOT_PAID_YET',
            'ORDER_CANCELLED',
            'YOU_CANCELLED_THE_ORDER',
            'VALUE_NOT_ACCEPTABLE',
            'QUANTITY_EXCEEDS_MAX_ALLOWED_VALUE',
            'CHECKOUT_PAYMENT_METHOD',
            'CHECKOUT_SHIPPING_METHOD',
            'THANK_YOU',
            'OFFLINE_ORDER_TEXT',
            'CHOOSE_AN_OPTION',
            'EDIT_CART',
            'QUANTITY_SHORT',
            'NO_ITEMS_IN_CART',
            'PRODUCT_ADDED_TO_CART',
            'PRODUCTS_BOUGHT',
            'SEE_THE_ORDER_DETAILS',
            'MESSAGE_FROM_THE_CLIENT',
            'AGREE',
            'TERMS_AND_CONDITIONS',
            'PLEASE_ACCEPT_TERMS_AND_CONDITIONS',
            'SORRY_THE_EMAIL_IS_NOT_VALID',
            'SORRY_THE_EMAIL_IS_NOT_VALID_DID_YOU_MEAN',
            'SORRY_CANNOT_SHIP_TO_YOUR_COUNTRY',
            'PLEASE_FILL_PAYMENT_INFORMATION_TEXT_AREA',
            'PLEASE_FILL_ALL_THE_REQUIRED_FIELDS',
            'READ_MORE',
            'MINIMUM_TO_PLACE_AN_ORDER',
            'OUT_OF_STOCK',
            'PAYPAL',
            'CREDITCARD',
            'ITEMS_LEFT',
            'SUBCATEGORIES_HEADING',
            'HAVE_A_DISCOUNT_CODE',
            'TOTAL_AFTER_DISCOUNT',
            'SHIPPING',
            'TAXES',
            'SUBTOTAL',
            'CONTINUE_SHOPPING',
            'DOWNLOAD_EXPIRED',
            'TOTAL_PAID',
            'ORDER_ID',
            'ORDER_DATE',
            'NO_ORDERS_FOUND',
        ];

        foreach($strings as $string) {
            $translations .= 'PLUGIN_SHOPPINGCART.translations.' . $string .' = "' . $this->grav['language']->translate(['PLUGIN_SHOPPINGCART.' . $string]) . '"; ' . PHP_EOL;;
        }

        $assets->addInlineJs($translations);

        /**
         * Add plugin settings as JavaScript code
         */
        $settings = $this->config->get('plugins.shoppingcart');
        $settings_js = 'window.PLUGIN_SHOPPINGCART.settings = {};' . PHP_EOL;

        function recurse_settings($base, $settings) {
            $output = '';

            foreach($settings as $key => $value) {
                if (!is_array($value)) {
                    //Avoid putting the secretKey in the frontend available settings
                    if ($key !== '["secretKey"]') {
                        if (is_numeric($key)) {
                            $key = '[' . $key . ']';
                        } else {
                            $key = '.' . $key;
                        }

                        if (is_numeric($value)) {
                            $value = $value;
                        } else {
                            $value = '"' . $value . '"';
                        }
                        $output .= 'PLUGIN_SHOPPINGCART.settings' . $base . $key .' = ' . $value . '; ' . PHP_EOL;;
                    }

                } else {
                    if (is_numeric($key)) {
                        $key = '[' . $key . ']';
                    } else {
                        $key = '.' . $key;
                    }
                    $output .= 'PLUGIN_SHOPPINGCART.settings' . $base . $key .' = {}; ' . PHP_EOL;;
                    $output .= recurse_settings($base . $key, $value);
                }
            }

            return $output;
        }

        $settings_js .= recurse_settings('', $settings);
        $assets->addInlineJs($settings_js);
    }

    /**
     * Add templates directory to twig lookup paths.
     */
    public function onTwigTemplatePaths()
    {
        $this->grav['twig']->twig_paths[] = __DIR__ . '/templates';
    }

    /**
     * Add admin templates directory to twig lookup paths.
     */
    public function onTwigAdminTemplatePaths()
    {
        $this->grav['twig']->twig_paths[] = __DIR__ . '/templates/admin';
    }

    /**
     * Set needed variables to display cart.
     */
    public function onTwigSiteVariables()
    {
        if ($this->config->get('plugins.shoppingcart.ui.useOwnCSS')) {
            $this->grav['assets']->add('plugin://shoppingcart/css/shoppingcart.css');
        }
    }

    public function shoppingCartController()
    {
        /** @var Uri $uri */
        $uri = $this->grav['uri'];
        $task = !empty($_POST['task']) ? $_POST['task'] : $uri->param('task');
        $task = substr($task, strlen('order.'));
        $post = !empty($_POST) ? $_POST : [];

        require_once __DIR__ . '/classes/controller.php';
        $controller = new ShoppingCartController($this->grav, $task, $post);
        $controller->execute();
        $controller->redirect();
    }

}
