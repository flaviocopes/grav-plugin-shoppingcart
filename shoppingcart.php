<?php
namespace Grav\Plugin;

use Grav\Common\Data;
use Grav\Common\Filesystem\Folder;
use Grav\Common\Page\Page;
use Grav\Common\Page\Types;
use Grav\Common\Plugin;
use Grav\Common\Twig\Twig;
use Grav\Common\Uri;
use RocketTheme\Toolbox\Event\Event;
use RocketTheme\Toolbox\File\File;
use Symfony\Component\Yaml\Yaml;

/**
 * Class ShoppingcartPlugin
 * @package Grav\Plugin
 */
class ShoppingcartPlugin extends Plugin
{
    protected $baseURL;
    protected $checkoutURL;
    protected $saveOrderURL;
    protected $orderURL;
    protected $order_id;
    protected $route = 'shoppingcart';

    /** @var ShoppingCart */
    protected $shoppingcart;

    /**
     * @return array
     */
    public static function getSubscribedEvents()
    {
        return [
            //Add 10 as we want to hook onDataTypeExcludeFromDataManagerPluginHook prior to Data Manager fetching it
            'onPluginsInitialized' => ['onPluginsInitialized', 10],
            'onGetPageTemplates' => ['onGetPageTemplates', 0],
            'onShoppingCartSaveOrder' => ['onShoppingCartSaveOrder', 0],
            'onBlueprintCreated' => ['onBlueprintCreated', 0]
        ];
    }

    /**
     * Enable search only if url matches to the configuration.
     */
    public function onPluginsInitialized()
    {
        require_once __DIR__ . '/vendor/autoload.php';

        $this->baseURL = $this->grav['uri']->rootUrl();
        $this->checkoutURL = $this->config->get('plugins.shoppingcart.urls.checkoutURL');
        $this->saveOrderURL = $this->config->get('plugins.shoppingcart.urls.saveOrderURL');
        $this->orderURL =  $this->config->get('plugins.shoppingcart.urls.orderURL');

        /** @var Uri $uri */
        $uri = $this->grav['uri'];

        if ($this->isAdmin()) {
            //Admin
            $this->enable([
                'onTwigTemplatePaths' => ['onTwigAdminTemplatePaths', 0],
                'onAdminMenu' => ['onAdminMenu', 0],
                'onDataTypeExcludeFromDataManagerPluginHook' => ['onDataTypeExcludeFromDataManagerPluginHook', 0],
            ]);

            if (strpos($uri->path(), $this->config->get('plugins.admin.route') . '/' . $this->route) === false) {
                return;
            }

            $page = $this->grav['uri']->param('page');
            $orders = $this->getLastOrders($page);

            if ($page > 0) {
                echo json_encode($orders);
                exit();
            }

            $this->grav['twig']->orders = $orders;

        } else {
            // Site
            $this->enable([
                'onPageInitialized' => ['onPageInitialized', 0],
                'onTwigTemplatePaths' => ['onTwigTemplatePaths', 0],
                'onShoppingCartReturnOrderPageUrlForAjax' => ['onShoppingCartReturnOrderPageUrlForAjax', 10],
                'onShoppingCartRedirectToOrderPageUrl' => ['onShoppingCartRedirectToOrderPageUrl', 10]
            ]);

            if ($this->checkoutURL && $this->checkoutURL == $uri->path()) {
                $this->enable([
                    'onPagesInitialized' => ['addCheckoutPage', 0]
                ]);
            }

            if ($this->saveOrderURL && $this->saveOrderURL == $uri->path()) {
                $this->enable([
                    'onPagesInitialized' => ['saveOrder', 0]
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

    public function saveOrder()
    {
        /** @var Uri $uri */
        $uri = $this->grav['uri'];
        $task = $uri->query('task');
        $post = !empty($_POST) ? $_POST : [];

        require_once __DIR__ . '/classes/controller.php';
        $controller = new ShoppingCartController($this->grav, $task, $post);
        $controller->execute();
    }

    public function addOrderPage()
    {
        $url = $this->orderURL;
        $filename = 'shoppingcart_order.md';
        $this->addPage($url, $filename);

        /** @var Uri $uri */
        $uri = $this->grav['uri'];

        $ext = '.yaml';
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
        $twig->twig_vars['order_amount'] = $order['amount'];
        $twig->twig_vars['order_token'] = $order['token'];
        $twig->twig_vars['order_paid'] = $order['paid'];
        $twig->twig_vars['currency'] = $this->config->get('plugins.shoppingcart.general.currency');
    }

    /**
     * @param $url
     * @param $filename
     */
    protected function addPage($url, $filename)
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
     *
     * @param Event $event
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
        /** @var Page $page */
        $page = $this->grav['page'];

        $template = $page->template();

        if (!in_array($template, ['categories',
                                  'products',
                                  'payment',
                                  'product',
                                  'checkout',
                                  'order'])) {
            return;
        }

        $defaults = (array) $this->config->get('plugins.shoppingcart');

        if ($page->header() != null) {
            if (isset($page->header()->shoppingcart)) {
                $page->header()->shoppingcart = array_merge($defaults, $page->header()->shoppingcart);
            } else {
                $page->header()->shoppingcart = $defaults;
            }
        }

        // Create ShoppingCart.
        require_once(__DIR__ . '/classes/shoppingcart.php');
        $this->shoppingcart = new ShoppingCart($page);

        $this->enable([
            'onTwigSiteVariables' => ['onTwigSiteVariables', 0]
        ]);

        /**
         * Add translations needed in JavaScript code
         */
        $assets = $this->grav['assets'];
        $translations = 'if (!window.PLUGIN_SHOPPINGCART) { window.PLUGIN_SHOPPINGCART = {}; } ' . PHP_EOL . 'window.PLUGIN_SHOPPINGCART.translations = {};' . PHP_EOL;

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
            'TERMS_AND_CONDITIONS',
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
            $translations .= 'PLUGIN_SHOPPINGCART.translations.' . $string .' = "' . $this->grav['language']->translate(['PLUGIN_SHOPPINGCART.' . $string]) . '"; ' . PHP_EOL;
        }

        $assets->addInlineJs($translations);

        /**
         * Add plugin settings as JavaScript code
         */
        $settings = $this->config->get('plugins.shoppingcart');

        $settings_js = 'if (!window.PLUGIN_SHOPPINGCART) { window.PLUGIN_SHOPPINGCART = {}; } ' . PHP_EOL . 'window.PLUGIN_SHOPPINGCART.settings = {};' . PHP_EOL;
        $settings_js .= "PLUGIN_SHOPPINGCART.settings.baseURL = '$this->baseURL';" . PHP_EOL;

        $settings_js .= $this->recurse_settings('', $settings);
        $assets->addInlineJs($settings_js);

        $this->grav->fireEvent('onShoppingCartOutputPageProductBeforeAddToCart', new Event());
    }

    /**
     * @param $base
     * @param $settings
     *
     * @return string
     */
    protected function recurse_settings($base, $settings)
    {
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

                    if (!is_numeric($value)) {
                        $value = '"' . $value . '"';
                    }
                    $output .= 'PLUGIN_SHOPPINGCART.settings' . $base . $key .' = ' . $value . '; ' . PHP_EOL;
                }

            } else {
                if (is_numeric($key)) {
                    $key = '[' . $key . ']';
                } else {
                    $key = '.' . $key;
                }
                $output .= 'PLUGIN_SHOPPINGCART.settings' . $base . $key .' = {}; ' . PHP_EOL;
                $output .= $this->recurse_settings($base . $key, $value);
            }
        }

        return $output;
    }

    /**
     * Add templates directory to twig lookup paths.
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
        if ($this->config->get('plugins.shoppingcart.ui.useOwnCSS')) {
            $this->grav['assets']->add('plugin://shoppingcart/css/shoppingcart.css');
        }

        $this->grav['twig']->twig_vars['shoppingcart'] = $this->shoppingcart;
    }

    public function shoppingCartController()
    {
        /** @var Uri $uri */
        $uri = $this->grav['uri'];
        $task = !empty($_POST['task']) ? $_POST['task'] : $uri->param('task');
        $post = !empty($_POST) ? $_POST : [];

        require_once __DIR__ . '/classes/controller.php';
        $controller = new ShoppingCartController($this->grav, $task, $post);
        $controller->execute();
    }

    /**
     * Saves the order and sends the order emails
     *
     * @param $event
     */
    public function onShoppingCartSaveOrder($event)
    {
        $this->order_id = $this->saveOrderToFilesystem($event['order']);
    }

    /**
     * Saves the order and sends the order emails
     *
     * @param $event
     */
    public function onShoppingCartReturnOrderPageUrlForAjax($event)
    {
        require_once __DIR__ . '/classes/order.php';
        $order = new Order($event['order']);
        echo $this->grav['base_url'] . $this->orderURL . '/id:' . str_replace('.yaml', '', $this->order_id) . '/token:' . $order->token;
        exit();
    }

    /**
     * Saves the order and sends the order emails
     *
     * @param $event
     */
    public function onShoppingCartRedirectToOrderPageUrl($event)
    {
        require_once __DIR__ . '/classes/order.php';
        $order = new Order($event['order']);
        $this->grav->redirect($this->orderURL . '/id:' . str_replace('.yaml', '', $this->order_id) . '/token:' . $order->token);
    }

    /**
     * Saves the order to the filesystem in the user/data/ folder
     *
     * @param $order
     *
     * @return string
     */
    private function saveOrderToFilesystem($order)
    {
        $prefix = 'order-';
        $format = 'Ymd-His-u';
        $ext = '.yaml';
        $filename = $prefix . $this->udate($format) . $ext;

        $body = Yaml::dump([
            'products' => $order->products,
            'address' => $order->address,
            'shipping' => $order->shipping,
            'payment' => $order->payment,
            'token' => $order->token,
            'paid' => true,
            'paid_on' => $this->udate($format),
            'created_on' => $this->udate($format),
            'amount' => $order->amount,
        ]);

        $file = File::instance(DATA_DIR . 'shoppingcart' . '/' . $filename);
        $file->save($body);

        return $filename;
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

    /**
     * Get all the orders
     *
     * @return array
     */
    private function getAllOrders()
    {
        $files = [];
        $path = DATA_DIR . 'shoppingcart';

        if (!file_exists($path)) {
            Folder::mkdir($path);
        }

        $list = Folder::all($path);

        // Collect files if modified in the last 7 days
        foreach ($list as $filename) {
            $yaml = Yaml::parse(file_get_contents($path . DS . $filename));

            //BC: get order date from filename
            if (!isset($yaml['created_on'])) {
                $order_date = str_replace('order-', '', $filename);
                $order_date = str_replace('.yaml', '', $order_date);
                $yaml['created_on'] = $order_date;
            }

            $files[] = $yaml;
        }

        array_reverse($files);

        return $files;
    }

    /**
     * Get the last orders, paginated ten per page
     *
     * @param int $page The page to return
     *
     * @return object
     */
    private function getLastOrders($page = 0)
    {
        $number = 10;
        $orders = $this->getAllOrders();

        $totalAvailable = count($orders);
        $orders = array_slice($orders, $page * $number, $number);
        $totalRetrieved = count($orders);

        return (object)[
            "orders" => $orders,
            "page" => $page,
            "totalAvailable" => $totalAvailable,
            "totalRetrieved" => $totalRetrieved
        ];
    }

    /**
     * Add navigation item to the admin plugin
     */
    public function onAdminMenu()
    {
        $this->grav['twig']->plugins_hooked_nav['PLUGIN_SHOPPINGCART.SHOPPING_CART'] = ['route' => $this->route, 'icon' => 'fa-shopping-cart'];
    }

    /**
     * Exclude Orders from the Data Manager plugin
     */
    public function onDataTypeExcludeFromDataManagerPluginHook()
    {
        $this->grav['admin']->dataTypesExcludedFromDataManagerPlugin[] = 'shoppingcart';
    }

    /**
     * Add plugin templates path
     */
    public function onTwigAdminTemplatePaths()
    {
        $this->grav['twig']->twig_paths[] = __DIR__ . '/admin/templates';
    }

    /**
     *
     * Extend page blueprints with configuration options.
     * @param Event $event
     *
     * @todo only extend `product` pages
     */
    public function onBlueprintCreated(Event $event)
    {
        static $inEvent = false;

        /** @var Data\Blueprint $blueprint */
        $blueprint = $event['blueprint'];

        if (!$inEvent &&  $blueprint->get('form.fields.tabs')) {
            $inEvent = true;
            $blueprints = new Data\Blueprints(__DIR__ . '/blueprints/');
            $extends = $blueprints->get('shoppingcart');
            $blueprint->extend($extends, true);
            $inEvent = false;
        }
    }
}
