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
use Grav\Plugin\ShoppingCart\Controller;
use Grav\Plugin\ShoppingCart\Order;
use Grav\Plugin\ShoppingCart\ShoppingCart;
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
                'onPagesInitialized'      => ['onPagesInitialized', 10],
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

            if ($this->order_url && $this->order_url == $uri->path()) {
                $this->enable([
                    'onPagesInitialized' => ['addOrderPage', 0]
                ]);
            }
        }
    }

    /**
     * Dynamically add the checkout page
     */
    public function addCheckoutPage()
    {
        $url = $this->checkout_url;
        $filename = 'shoppingcart_checkout.md';
        $this->addPage($url, $filename);
    }

    /**
     * Sets longer path to the home page allowing us to have list of pages when we enter to pages section.
     */
    public function onPagesInitialized()
    {
        /** @var Uri $uri */
        $uri = $this->grav['uri'];
        $task = !empty($_POST['task']) ? $_POST['task'] : $uri->param('task');
        $post = !empty($_POST) ? $_POST : [];

        if ($task) {
            $this->initializeController($task, $post);
        }
    }

    /**
     * Dynamically add the order page
     */
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
            if (isset($order['address'])) {
                $order['data'] = $order['address'];
                unset($order['address']);
            }
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

        // if I'm not in a Shop page, and I don't need to add JS globally, return
        if (!$this->config->get('plugins.shoppingcart.general.load_js_globally')) {
            if (!in_array($page->template(), $this->shoppingcart->getOwnPageTypes())) {
                return;
            }
        }

        // Init the page header by merging the ShoppingCart defaults
        if ($page->header() != null) {
            $settings = (array)$this->config->get('plugins.shoppingcart');
            if (isset($page->header()->shoppingcart)) {
                $page->header()->shoppingcart = array_merge($settings, $page->header()->shoppingcart);
            } else {
                $page->header()->shoppingcart = $settings;
            }
        }

        // Add translations needed in JavaScript code
        $this->addTranslationsToFrontend();

        // Add plugin settings as JavaScript code
        $this->addSettingsToFrontend();

        // Add the cart javascript files
        $this->addCartJavascript();
    }

    /**
     * Add translations needed in JavaScript code
     */
    private function addTranslationsToFrontend()
    {
        $assets = $this->grav['assets'];

        $translations = 'if (!window.PLUGIN_SHOPPINGCART) { window.PLUGIN_SHOPPINGCART = {}; } ' . PHP_EOL . 'window.PLUGIN_SHOPPINGCART.translations = {};' . PHP_EOL;

        $strings = $this->shoppingcart->getTranslationStringsForFrontend();
        foreach ($strings as $string) {
            $translations .= 'PLUGIN_SHOPPINGCART.translations.' . $string . ' = "' . $this->grav['language']->translate(['PLUGIN_SHOPPINGCART.' . $string]) . '"; ' . PHP_EOL;
        }

        $assets->addInlineJs($translations);
    }

    /**
     * Add plugin settings as JavaScript code
     */
    private function addSettingsToFrontend()
    {
        $assets = $this->grav['assets'];
        $settings = $this->config->get('plugins.shoppingcart');
        $settings_js = 'if (!window.PLUGIN_SHOPPINGCART) { window.PLUGIN_SHOPPINGCART = {}; } ' . PHP_EOL . 'window.PLUGIN_SHOPPINGCART.settings = {};' . PHP_EOL;
        $settings_js .= "PLUGIN_SHOPPINGCART.settings.baseURL = '$this->baseURL';" . PHP_EOL;
        $settings_js .= $this->recurse_settings('', $settings);
        $assets->addInlineJs($settings_js);
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

        $this->grav['assets']->addJs('jquery');
        $this->grav['assets']->addJs('plugin://shoppingcart/js/lib/store.min.js');
        $this->grav['assets']->addJs('plugin://shoppingcart/js/shoppingcart.js');
        $this->grav['assets']->addJs('plugin://shoppingcart/js/shoppingcart_lib.js');
        $this->grav['assets']->addJs('plugin://shoppingcart/js/shoppingcart_cart.js');
        $this->grav['assets']->addJs('plugin://shoppingcart/js/shoppingcart_cart_events.js');

        if ($page->template() === 'shoppingcart_checkout') {
            $this->grav['assets']->addJs('plugin://shoppingcart/js/shoppingcart_checkout.js');
            $this->grav['assets']->addJs('plugin://shoppingcart/js/shoppingcart_checkout_events.js');
            $this->grav['assets']->addJs('plugin://shoppingcart/js/shoppingcart_checkout_events.js');
            $this->grav['assets']->addInlineJs('(function() { ShoppingCart.currentPageIsCheckout = true; }());');
        }

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
                if (!in_array($key, ['secretKey', 'username', 'password', 'signature'], true)) {
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

    public function initializeController($task, $post)
    {

        require_once __DIR__ . '/classes/controller.php';
        $controller = new Controller($this->grav, $task, $post);
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

        $order = new Order($event['order']);
        $order_page_url = $this->baseIncludingLanguage() . $this->order_url . '/id:' . str_replace('.yaml', '', $this->order_id) . '/token:' . $order->token;
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

        $order = new Order($event['order']);
        $order_page_url = $this->baseIncludingLanguage() . $this->order_url . '/id:' . str_replace('.yaml', '', $this->order_id) . '/token:' . $order->token;
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
            'taxes'      => $order->taxes,
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


}
