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
            'onTask.order.save' => ['shoppingCartController', 0],
            'onGetPageTemplates' => ['onGetPageTemplates', 0]

        ];
    }

    /**
     * Enable search only if url matches to the configuration.
     */
    public function onPluginsInitialized()
    {
        if ($this->isAdmin()) {
            $this->enable([
                'onPagesInitialized' => ['addCPTPage', 0]
            ]);

            // $this->active = false;
            // return;
        }

        $this->enable([
            'onPageInitialized' => ['onPageInitialized', 0],
            'onTwigTemplatePaths' => ['onTwigTemplatePaths', 0]
        ]);

        // Register route to checkout page if it has been set.
        $this->checkoutURL = $this->config->get('plugins.shoppingcart.urls.checkoutURL');
        if ($this->checkoutURL) {
            $this->enable([
                'onPagesInitialized' => ['addCheckoutPage', 0]
            ]);
        }

        /** @var Uri $uri */
        $uri = $this->grav['uri'];
        $this->saveOrderURL = $this->config->get('plugins.shoppingcart.urls.saveOrderURL');
        if ($this->saveOrderURL && $this->saveOrderURL == $uri->path()) {
            $this->enable([
                'onPagesInitialized' => ['addSaveOrderPage', 0]
            ]);
        }

    }

    public function addCheckoutPage()
    {
        $pages = $this->grav['pages'];
        $page = $pages->dispatch($this->checkoutURL);

        if (!$page) {
            // Only add checkout page if it hasn't already been defined.
            $page = new Page;
            $page->init(new \SplFileInfo(__DIR__ . "/pages/shoppingcart_checkout.md"));
            $page->slug(basename($this->checkoutURL));

            $pages->addPage($page, $this->checkoutURL);
        }
    }

    public function addSaveOrderPage()
    {
        $pages = $this->grav['pages'];
        $page = $pages->dispatch($this->saveOrderURL);

        if (!$page) {
            // Only add checkout page if it hasn't already been defined.
            $page = new Page;
            $page->init(new \SplFileInfo(__DIR__ . "/pages/save_order.md"));
            $page->slug(basename($this->saveOrderURL));
error_log(1); echo '1';


        /** @var Uri $uri */
        $uri = $this->grav['uri'];
        $task = $uri->query('task');
        $task = substr($task, strlen('order.'));
        $post = !empty($_POST) ? $_POST : [];

        require_once __DIR__ . '/classes/controller.php';
        $controller = new ShoppingCartController($this->grav, $task, $post);
        $controller->execute();
        $controller->redirect();

exit();

            $pages->addPage($page, $this->saveOrderURL);
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
            'CHECKOUT_CHOOSE_SHIPMENT_METHOD',
            'CHECKOUT_CHOOSE_SHIPMENT_METHOD_DESC',
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
            'INCLUDING_SHIPMENT',
            'ORDER_NOT_PAID_YET',
            'ORDER_CANCELLED',
            'YOU_CANCELLED_THE_ORDER',
            'VALUE_NOT_ACCEPTABLE',
            'QUANTITY_EXCEEDS_MAX_ALLOWED_VALUE',
            'CHECKOUT_PAYMENT_METHOD',
            'CHECKOUT_SHIPMENT_METHOD',
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

                $key = '["' . $key .'"]';
                if (!is_array($value)) {
                    $output .= 'PLUGIN_SHOPPINGCART.settings' . $base . $key .' = "' . $value . '"; ' . PHP_EOL;;
                } else {
                    $output .= 'PLUGIN_SHOPPINGCART.settings' . $base . $key .' = []; ' . PHP_EOL;;
                    $output .= recurse_settings($base . $key, $value);
                }
            }

            return $output;
        }

        $settings_js .= recurse_settings('', $settings);
        $assets->addInlineJs($settings_js);
    }

    /**
     * Add current directory to twig lookup paths.
     */
    public function onTwigTemplatePaths()
    {
        if ($this->isAdmin()) {
            $this->grav['twig']->twig_paths[] = __DIR__ . '/admin/templates';
        } else {
            $this->grav['twig']->twig_paths[] = __DIR__ . '/templates';
        }
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

    /**
     * Add CPT Page in the Admin Plugin
     */
    public function addCPTPage()
    {
        $route = $this->config->get('plugins.shoppingcart.admin.route.orders');
        /** @var Pages $pages */
        $pages = $this->grav['pages'];
        $page = $pages->dispatch($route);

        if (!$page) {
            // Only add login page if it hasn't already been defined.
            $page = new Page;
            $page->init(new \SplFileInfo(__DIR__ . "/admin/pages/orders.md"));
            $page->slug('orders');
            $page->folder(__DIR__ . "/admin/pages");
            $pages->addPage($page, $route);
        }
    }

    public function shoppingCartController()
    {
        exit();
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
