<?php
namespace Grav\Plugin;

use Grav\Common\Grav;
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
    protected $checkout_url;
    protected $save_order_url;
    protected $order_url;
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
            'onPluginsInitialized'    => ['onPluginsInitialized', 10],
            'onGetPageBlueprints'     => ['onGetPageBlueprints', 0],
            'onGetPageTemplates'      => ['onGetPageTemplates', 0],
            'onShoppingCartSaveOrder' => ['onShoppingCartSaveOrder', 0],
            'onTwigSiteVariables'     => ['onTwigSiteVariables', 0]
        ];
    }

    /**
     * Enable search only if url matches to the configuration.
     */
    public function onPluginsInitialized()
    {
        require_once __DIR__ . '/vendor/autoload.php';

        // Create ShoppingCart.
        require_once(__DIR__ . '/classes/shoppingcart.php');
        $this->shoppingcart = new ShoppingCart();

        /** @var Twig $twig */
        $twig = $this->grav['twig'];

        $this->baseURL = $this->grav['uri']->rootUrl();
        $this->checkout_url = $this->config->get('plugins.shoppingcart.urls.checkout_url');
        $this->save_order_url = $this->config->get('plugins.shoppingcart.urls.save_order_url');
        $this->order_url = $this->config->get('plugins.shoppingcart.urls.order_url');

        /** @var Uri $uri */
        $uri = $this->grav['uri'];

        $twig->twig_vars['currency_symbol'] = $this->shoppingcart->getSymbolOfCurrencyCode($this->config->get('plugins.shoppingcart.general.currency'));

        if ($this->isAdmin()) {
            //Admin
            $this->enable([
                'onTwigTemplatePaths'                        => ['onTwigAdminTemplatePaths', 0],
                'onAdminMenu'                                => ['onAdminMenu', 0],
                'onDataTypeExcludeFromDataManagerPluginHook' => ['onDataTypeExcludeFromDataManagerPluginHook', 0],
            ]);

            if (strpos($uri->path(), $this->config->get('plugins.admin.route') . '/' . $this->route) === false) {
                return;
            }

            $page = $this->grav['uri']->param('page') ?: 1;
            $orders = $this->getLastOrders($page);
            $twig->orders = $orders;

        } else {
            // Site
            $this->enable([
                'onPageInitialized'                       => ['onPageInitialized', 0],
                'onTwigTemplatePaths'                     => ['onTwigTemplatePaths', 0],
                'onShoppingCartReturnOrderPageUrlForAjax' => ['onShoppingCartReturnOrderPageUrlForAjax', 10],
                'onShoppingCartRedirectToOrderPageUrl'    => ['onShoppingCartRedirectToOrderPageUrl', 10],
                'onAssetsInitialized'                     => ['onAssetsInitialized', 0]
            ]);

            if ($this->checkout_url && $this->checkout_url == $uri->path()) {
                $this->enable([
                    'onPagesInitialized' => ['addCheckoutPage', 0]
                ]);
            }

            if ($this->save_order_url && $this->save_order_url == $uri->path()) {
                $this->enable([
                    'onPagesInitialized' => ['saveOrder', 0]
                ]);
            }

            if ($this->order_url && $this->order_url == $uri->path()) {
                $this->enable([
                    'onPagesInitialized' => ['addOrderPage', 0]
                ]);
            }
        }
    }

    public function addCheckoutPage()
    {
        $url = $this->checkout_url;
        $filename = 'shoppingcart_checkout.md';
        $this->addPage($url, $filename);
    }

    public function saveOrder()
    {
        /** @var Uri $uri */
        $uri = $this->grav['uri'];
        $task = !empty($_POST['task']) ? $_POST['task'] : $uri->param('task');
        $post = !empty($_POST) ? $_POST : [];

        require_once __DIR__ . '/classes/controller.php';
        $controller = new ShoppingCart\Controller($this->grav, $task, $post);
        $controller->execute();
    }

    public function addOrderPage()
    {
        $url = $this->order_url;
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

        if (!isset($order['data'])) {
            $order['data'] = $order['address'];
            unset($order['address']);
        }

        /** @var Twig $twig */
        $twig = $this->grav['twig'];
        $twig->twig_vars['order'] = $order;

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
     * Add page blueprints
     *
     * @param Event $event
     */
    public function onGetPageBlueprints(Event $event)
    {
        /** @var Types $types */
        $types = $event->types;
        $types->scanBlueprints('plugins://shoppingcart/blueprints/pages/');
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

        if (!$this->config->get('plugins.shoppingcart.general.load_js_globally')) {
            if (!in_array($page->template(), $this->shoppingcart->getOwnPageTypes())) {
                return;
            }
        }

        if ($page->header() != null) {
            $settings = (array)$this->config->get('plugins.shoppingcart');
            if (isset($page->header()->shoppingcart)) {
                $page->header()->shoppingcart = array_merge($settings, $page->header()->shoppingcart);
            } else {
                $page->header()->shoppingcart = $settings;
            }
        }

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

        foreach ($strings as $string) {
            $translations .= 'PLUGIN_SHOPPINGCART.translations.' . $string . ' = "' . $this->grav['language']->translate(['PLUGIN_SHOPPINGCART.' . $string]) . '"; ' . PHP_EOL;
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

        $this->addCartJavascript();
    }

    /**
     * Adds the cart javascript
     */
    private function addCartJavascript()
    {
        /** @var Page $page */
        $page = $this->grav['page'];

        if (!$this->config->get('plugins.shoppingcart.general.load_js_globally')) {
            if (!in_array($page->template(), $this->shoppingcart->getOwnPageTypes())) {
                return;
            }
        }

        $this->grav['assets']->add('plugin://shoppingcart/js/lib/store.min.js');
        $this->grav['assets']->add('plugin://shoppingcart/js/shoppingcart.js');
        $this->grav['assets']->add('plugin://shoppingcart/js/shoppingcart_lib.js');
        $this->grav['assets']->add('plugin://shoppingcart/js/shoppingcart_cart.js');
        $this->grav['assets']->add('plugin://shoppingcart/js/shoppingcart_cart_events.js');
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

        foreach ($settings as $key => $value) {
            if (!is_array($value)) {
                //Avoid adding private settings to the frontend
                if ($key !== 'secretKey') {
                    if (is_numeric($key)) {
                        $key = '[' . $key . ']';
                    } else {
                        $key = '.' . $key;
                    }

                    if (!is_numeric($value)) {
                        $value = '"' . $value . '"';
                    }
                    $output .= 'PLUGIN_SHOPPINGCART.settings' . $base . $key . ' = ' . $value . '; ' . PHP_EOL;
                }

            } else {
                if ($key !== 'checkout_form') {
                    if (is_numeric($key)) {
                        $key = '[' . $key . ']';
                    } else {
                        $key = '.' . $key;
                    }
                    $output .= 'PLUGIN_SHOPPINGCART.settings' . $base . $key . ' = {}; ' . PHP_EOL;

                    $output .= $this->recurse_settings($base . $key, $value);
                }
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
     * Add assets to the frontend
     */
    public function onAssetsInitialized()
    {
        if ($this->config->get('plugins.shoppingcart.ui.use_own_css')) {
            $this->grav['assets']->add('plugin://shoppingcart/css/shoppingcart.css');
        }
    }

    /**
     * Set needed variables to display cart.
     */
    public function onTwigSiteVariables()
    {
        $this->grav['twig']->twig_vars['shoppingcart'] = $this->shoppingcart;
    }

    public function shoppingCartController()
    {
        /** @var Uri $uri */
        $uri = $this->grav['uri'];
        $task = !empty($_POST['task']) ? $_POST['task'] : $uri->param('task');
        $post = !empty($_POST) ? $_POST : [];

        require_once __DIR__ . '/classes/controller.php';
        $controller = new ShoppingCart\Controller($this->grav, $task, $post);
        $controller->execute();
    }

    /**
     * Saves the order and sends the order emails
     *
     * @event onShoppingCartAfterSaveOrder triggered after the order is saved
     *
     * @param $event
     */
    public function onShoppingCartSaveOrder($event)
    {
        $order = $event['order'];
        $this->order_id = $this->saveOrderToFilesystem($order);
        $this->grav->fireEvent('onShoppingCartAfterSaveOrder', new Event([
            'order'    => $order,
            'order_id' => $this->order_id
        ]));
    }

    /**
     * Get the base URL of the site, including the language if enabled.
     *
     * @todo use Grav::Uri own method once merged
     *
     * @return string
     */
    public function baseIncludingLanguage()
    {
        $grav = Grav::instance();

        // Link processing should prepend language
        $language = $grav['language'];
        $language_append = '';
        if ($language->enabled()) {
            $language_append = $language->getLanguageURLPrefix();
        }

        $base = $grav['base_url_relative'];
        return rtrim($base . $grav['pages']->base(), '/') . $language_append;
    }

    /**
     * Saves the order and sends the order emails
     *
     * @param $event
     */
    public function onShoppingCartReturnOrderPageUrlForAjax($event)
    {
        require_once __DIR__ . '/classes/order.php';

        $order = new ShoppingCart\Order($event['order']);
        $order_page_url = $this->grav['uri']->baseIncludingLanguage() . $this->order_url . '/id:' . str_replace('.yaml', '', $this->order_id) . '/token:' . $order->token;
        echo $order_page_url;
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

        $order = new ShoppingCart\Order($event['order']);
        $order_page_url = $this->grav['uri']->baseIncludingLanguage() . $this->order_url . '/id:' . str_replace('.yaml', '', $this->order_id) . '/token:' . $order->token;
        $this->grav->redirect($order_page_url);
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
            'products'   => $order->products,
            'data'       => $order->data,
            'shipping'   => $order->shipping,
            'payment'    => $order->payment,
            'token'      => $order->token,
            'paid'       => true,
            'paid_on'    => $this->udate($format),
            'created_on' => $this->udate($format),
            'amount'     => $order->amount,
        ]);

        $file = File::instance(DATA_DIR . 'shoppingcart' . '/' . $filename);
        $file->save($body);

        return $filename;
    }

    /**
     * Create unix timestamp for storing the data into the filesystem.
     *
     * @param string $format
     * @param int    $utimestamp
     *
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
        $orders = [];
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

            $orders[] = $yaml;
        }

        $orders = array_reverse($orders);

        return $orders;
    }

    /**
     * Get the last orders, paginated ten per page
     *
     * @param int $page The page to return
     *
     * @return object
     */
    private function getLastOrders($page = 1)
    {
        $number = 10;
        $orders = $this->getAllOrders();

        $totalAvailable = count($orders);
        $orders = array_slice($orders, ($page - 1) * $number, $number);
        $totalRetrieved = count($orders);

        return (object)[
            "orders"         => $orders,
            "page"           => $page,
            "totalAvailable" => $totalAvailable,
            "totalRetrieved" => $totalRetrieved
        ];
    }

    /**
     * Add navigation item to the admin plugin
     */
    public function onAdminMenu()
    {
        $this->grav['twig']->plugins_hooked_nav['PLUGIN_SHOPPINGCART.SHOPPING_CART'] = [
            'route' => $this->route,
            'icon'  => 'fa-shopping-cart'
        ];
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

    public static function currencies()
    {
        return [
            "AED" => "AED",
            "AFN" => "AFN",
            "ALL" => "ALL",
            "AMD" => "AMD",
            "ANG" => "ANG",
            "AOA" => "AOA",
            "ARS" => "ARS",
            "AUD" => "AUD",
            "AWG" => "AWG",
            "AZN" => "AZN",
            "BAM" => "BAM",
            "BBD" => "BBD",
            "BDT" => "BDT",
            "BGN" => "BGN",
            "BHD" => "BHD",
            "BIF" => "BIF",
            "BMD" => "BMD",
            "BOB" => "BOB",
            "BRL" => "BRL",
            "BSD" => "BSD",
            "BTN" => "BTN",
            "BWP" => "BWP",
            "BYR" => "BYR",
            "BZD" => "BZD",
            "CAD" => "CAD",
            "CDF" => "CDF",
            "CHF" => "CHF",
            "CLP" => "CLP",
            "CNY" => "CNY",
            "COP" => "COP",
            "CRC" => "CRC",
            "CUC" => "CUC",
            "CVE" => "CVE",
            "CZK" => "CZK",
            "DJF" => "DJF",
            "DKK" => "DKK",
            "DOP" => "DOP",
            "DZD" => "DZD",
            "EEK" => "EEK",
            "EGP" => "EGP",
            "ERN" => "ERN",
            "ETB" => "ETB",
            "EUR" => "EUR",
            "FJD" => "FJD",
            "FKP" => "FKP",
            "GBP" => "GBP",
            "GEL" => "GEL",
            "GHS" => "GHS",
            "GIP" => "GIP",
            "GMD" => "GMD",
            "GNF" => "GNF",
            "GQE" => "GQE",
            "GTQ" => "GTQ",
            "GYD" => "GYD",
            "HKD" => "HKD",
            "HNL" => "HNL",
            "HRK" => "HRK",
            "HTG" => "HTG",
            "HUF" => "HUF",
            "IDR" => "IDR",
            "ILS" => "ILS",
            "INR" => "INR",
            "IQD" => "IQD",
            "IRR" => "IRR",
            "ISK" => "ISK",
            "JMD" => "JMD",
            "JOD" => "JOD",
            "JPY" => "JPY",
            "KES" => "KES",
            "KGS" => "KGS",
            "KHR" => "KHR",
            "KMF" => "KMF",
            "KPW" => "KPW",
            "KRW" => "KRW",
            "KWD" => "KWD",
            "KYD" => "KYD",
            "KZT" => "KZT",
            "LAK" => "LAK",
            "LBP" => "LBP",
            "LKR" => "LKR",
            "LRD" => "LRD",
            "LSL" => "LSL",
            "LTL" => "LTL",
            "LVL" => "LVL",
            "LYD" => "LYD",
            "MAD" => "MAD",
            "MDL" => "MDL",
            "MGA" => "MGA",
            "MKD" => "MKD",
            "MMK" => "MMK",
            "MNT" => "MNT",
            "MOP" => "MOP",
            "MRO" => "MRO",
            "MUR" => "MUR",
            "MVR" => "MVR",
            "MWK" => "MWK",
            "MXN" => "MXN",
            "MYR" => "MYR",
            "MZM" => "MZM",
            "NAD" => "NAD",
            "NGN" => "NGN",
            "NIO" => "NIO",
            "NOK" => "NOK",
            "NPR" => "NPR",
            "NZD" => "NZD",
            "OMR" => "OMR",
            "PAB" => "PAB",
            "PEN" => "PEN",
            "PGK" => "PGK",
            "PHP" => "PHP",
            "PKR" => "PKR",
            "PLN" => "PLN",
            "PYG" => "PYG",
            "QAR" => "QAR",
            "RON" => "RON",
            "RSD" => "RSD",
            "RUB" => "RUB",
            "SAR" => "SAR",
            "SBD" => "SBD",
            "SCR" => "SCR",
            "SDG" => "SDG",
            "SEK" => "SEK",
            "SGD" => "SGD",
            "SHP" => "SHP",
            "SLL" => "SLL",
            "SOS" => "SOS",
            "SRD" => "SRD",
            "SYP" => "SYP",
            "SZL" => "SZL",
            "THB" => "THB",
            "TJS" => "TJS",
            "TMT" => "TMT",
            "TND" => "TND",
            "TRY" => "TRY",
            "TTD" => "TTD",
            "TWD" => "TWD",
            "TZS" => "TZS",
            "UAH" => "UAH",
            "UGX" => "UGX",
            "USD" => "USD",
            "UYU" => "UYU",
            "UZS" => "UZS",
            "VEB" => "VEB",
            "VND" => "VND",
            "VUV" => "VUV",
            "WST" => "WST",
            "XAF" => "XAF",
            "XCD" => "XCD",
            "XDR" => "XDR",
            "XOF" => "XOF",
            "XPF" => "XPF",
            "YER" => "YER",
            "ZAR" => "ZAR",
            "ZMK" => "ZMK",
            "ZWR" => "ZWR"
        ];
    }

    public static function shippingCountries()
    {
        return array_merge(['*' => 'All countries without specific rule'], self::countries());
    }

    public static function countries()
    {
        return [
            'AF'  => 'Afghanistan',
            'AL'  => 'Albania',
            'DZ'  => 'Algeria',
            'AS'  => 'American Samoa',
            'AD'  => 'Andorra',
            'AO'  => 'Angola',
            'AI'  => 'Anguilla',
            'AQ'  => 'Antarctica',
            'AG'  => 'Antigua and Barbuda',
            'AR'  => 'Argentina',
            'AM'  => 'Armenia',
            'AW'  => 'Aruba',
            'AU'  => 'Australia',
            'AT'  => 'Austria',
            'AZ'  => 'Azerbaijan',
            'BH'  => 'Bahrain',
            'BD'  => 'Bangladesh',
            'BB'  => 'Barbados',
            'BY'  => 'Belarus',
            'BE'  => 'Belgium',
            'BZ'  => 'Belize',
            'BJ'  => 'Benin',
            'BM'  => 'Bermuda',
            'BT'  => 'Bhutan',
            'BO'  => 'Bolivia',
            'BA'  => 'Bosnia and Herzegovina',
            'BW'  => 'Botswana',
            'BV'  => 'Bouvet Island',
            'BR'  => 'Brazil',
            'IO'  => 'British Indian Ocean Territory',
            'VG'  => 'British Virgin Islands',
            'BN'  => 'Brunei',
            'BG'  => 'Bulgaria',
            'BF'  => 'Burkina Faso',
            'BI'  => 'Burundi',
            'CI'  => 'Côte d\'Ivoire',
            'KH'  => 'Cambodia',
            'CM'  => 'Cameroon',
            'CA'  => 'Canada',
            'CV'  => 'Cape Verde',
            'KY'  => 'Cayman Islands',
            'CF'  => 'Central African Republic',
            'TD'  => 'Chad',
            'CL'  => 'Chile',
            'CN'  => 'China',
            'CX'  => 'Christmas Island',
            'CC'  => 'Cocos (Keeling) Islands',
            'CO'  => 'Colombia',
            'KM'  => 'Comoros',
            'CG'  => 'Congo',
            'CK'  => 'Cook Islands',
            'CR'  => 'Costa Rica',
            'HR'  => 'Croatia',
            'CU'  => 'Cuba',
            'CY'  => 'Cyprus',
            'CZ'  => 'Czech Republic',
            'CD'  => 'Democratic Republic of the Congo',
            'DK'  => 'Denmark',
            'DJ'  => 'Djibouti',
            'DM'  => 'Dominica',
            'DO'  => 'Dominican Republic',
            'TP'  => 'East Timor',
            'EC'  => 'Ecuador',
            'EG'  => 'Egypt',
            'SV'  => 'El Salvador',
            'GQ'  => 'Equatorial Guinea',
            'ER'  => 'Eritrea',
            'EE'  => 'Estonia',
            'ET'  => 'Ethiopia',
            'FO'  => 'Faeroe Islands',
            'FK'  => 'Falkland Islands',
            'FJ'  => 'Fiji',
            'FI'  => 'Finland',
            'MK'  => 'Former Yugoslav Republic of Macedonia',
            'FR'  => 'France',
            'FX'  => 'France, Metropolitan',
            'GF'  => 'French Guiana',
            'PF'  => 'French Polynesia',
            'TF'  => 'French Southern Territories',
            'GA'  => 'Gabon',
            'GE'  => 'Georgia',
            'DE'  => 'Germany',
            'GH'  => 'Ghana',
            'GI'  => 'Gibraltar',
            'GR'  => 'Greece',
            'GL'  => 'Greenland',
            'GD'  => 'Grenada',
            'GP'  => 'Guadeloupe',
            'GU'  => 'Guam',
            'GT'  => 'Guatemala',
            'GN'  => 'Guinea',
            'GW'  => 'Guinea-Bissau',
            'GY'  => 'Guyana',
            'HT'  => 'Haiti',
            'HM'  => 'Heard and Mc Donald Islands',
            'HN'  => 'Honduras',
            'HK'  => 'Hong Kong',
            'HU'  => 'Hungary',
            'IS'  => 'Iceland',
            'IN'  => 'India',
            'ID'  => 'Indonesia',
            'IR'  => 'Iran',
            'IQ'  => 'Iraq',
            'IE'  => 'Ireland',
            'IL'  => 'Israel',
            'IT'  => 'Italy',
            'JM'  => 'Jamaica',
            'JP'  => 'Japan',
            'JO'  => 'Jordan',
            'KZ'  => 'Kazakhstan',
            'KE'  => 'Kenya',
            'KI'  => 'Kiribati',
            'KW'  => 'Kuwait',
            'KG'  => 'Kyrgyzstan',
            'LA'  => 'Laos',
            'LV'  => 'Latvia',
            'LB'  => 'Lebanon',
            'LS'  => 'Lesotho',
            'LR'  => 'Liberia',
            'LY'  => 'Libya',
            'LI'  => 'Liechtenstein',
            'LT'  => 'Lithuania',
            'LU'  => 'Luxembourg',
            'MO'  => 'Macau',
            'MG'  => 'Madagascar',
            'MW'  => 'Malawi',
            'MY'  => 'Malaysia',
            'MV'  => 'Maldives',
            'ML'  => 'Mali',
            'MLT' => 'Malta',
            'MT'  => 'Mayotte',
            'MH'  => 'Marshall Islands',
            'MQ'  => 'Martinique',
            'MR'  => 'Mauritania',
            'MU'  => 'Mauritius',
            'MX'  => 'Mexico',
            'FM'  => 'Micronesia',
            'MD'  => 'Moldova',
            'MC'  => 'Monaco',
            'MN'  => 'Mongolia',
            'ME'  => 'Montenegro',
            'MS'  => 'Montserrat',
            'MA'  => 'Morocco',
            'MZ'  => 'Mozambique',
            'MM'  => 'Myanmar',
            'NA'  => 'Namibia',
            'NR'  => 'Nauru',
            'NP'  => 'Nepal',
            'NL'  => 'Netherlands',
            'AN'  => 'Netherlands Antilles',
            'NC'  => 'New Caledonia',
            'NZ'  => 'New Zealand',
            'NI'  => 'Nicaragua',
            'NE'  => 'Niger',
            'NG'  => 'Nigeria',
            'NU'  => 'Niue',
            'NF'  => 'Norfolk Island',
            'KP'  => 'North Korea',
            'MP'  => 'Northern Marianas',
            'NO'  => 'Norway',
            'OM'  => 'Oman',
            'PK'  => 'Pakistan',
            'PW'  => 'Palau',
            'PA'  => 'Panama',
            'PG'  => 'Papua New Guinea',
            'PY'  => 'Paraguay',
            'PE'  => 'Peru',
            'PH'  => 'Philippines',
            'PN'  => 'Pitcairn Islands',
            'PL'  => 'Poland',
            'PT'  => 'Portugal',
            'PR'  => 'Puerto Rico',
            'QA'  => 'Qatar',
            'RE'  => 'Reunion',
            'RO'  => 'Romania',
            'RU'  => 'Russia',
            'RW'  => 'Rwanda',
            'ST'  => 'São Tomé and Príncipe',
            'SH'  => 'Saint Helena',
            'PM'  => 'St. Pierre and Miquelon',
            'KN'  => 'Saint Kitts and Nevis',
            'LC'  => 'Saint Lucia',
            'VC'  => 'Saint Vincent and the Grenadines',
            'WS'  => 'Samoa',
            'SM'  => 'San Marino',
            'SA'  => 'Saudi Arabia',
            'SN'  => 'Senegal',
            'RS'  => 'Serbia',
            'SC'  => 'Seychelles',
            'SL'  => 'Sierra Leone',
            'SG'  => 'Singapore',
            'SK'  => 'Slovakia',
            'SI'  => 'Slovenia',
            'SB'  => 'Solomon Islands',
            'SO'  => 'Somalia',
            'ZA'  => 'South Africa',
            'GS'  => 'South Georgia and the South Sandwich Islands',
            'KR'  => 'South Korea',
            'ES'  => 'Spain',
            'LK'  => 'Sri Lanka',
            'SD'  => 'Sudan',
            'SR'  => 'Suriname',
            'SJ'  => 'Svalbard and Jan Mayen Islands',
            'SZ'  => 'Swaziland',
            'SE'  => 'Sweden',
            'CH'  => 'Switzerland',
            'SY'  => 'Syria',
            'TW'  => 'Taiwan',
            'TJ'  => 'Tajikistan',
            'TZ'  => 'Tanzania',
            'TH'  => 'Thailand',
            'BS'  => 'The Bahamas',
            'GM'  => 'The Gambia',
            'TG'  => 'Togo',
            'TK'  => 'Tokelau',
            'T0'  => 'Tonga',
            'TT'  => 'Trinidad and Tobago',
            'TN'  => 'Tunisia',
            'TR'  => 'Turkey',
            'TM'  => 'Turkmenistan',
            'TC'  => 'Turks and Caicos Islands',
            'TV'  => 'Tuvalu',
            'VI'  => 'US Virgin Islands',
            'UG'  => 'Uganda',
            'UA'  => 'Ukraine',
            'AE'  => 'United Arab Emirates',
            'GB'  => 'United Kingdom',
            'US'  => 'United States',
            'UM'  => 'United States Minor Outlying Islands',
            'UY'  => 'Uruguay',
            'UZ'  => 'Uzbekistan',
            'VU'  => 'Vanuatu',
            'VA'  => 'Vatican City',
            'VE'  => 'Venezuela',
            'VN'  => 'Vietnam',
            'WF'  => 'Wallis and Futuna Islands',
            'EH'  => 'Western Sahara',
            'YE'  => 'Yemen',
            'ZM'  => 'Zambia',
            'ZW'  => 'Zimbabwe',
        ];
    }
}
