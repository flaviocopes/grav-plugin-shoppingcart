# v1.1.0
## xx-05-2016

1. [](#new)
    * Ability to configure the plugin options via the Admin interface
    * Ability to edit the product through the Admin Pages view. Can currently set the price and set the default picture from the page media
    * Added more events to support more addons features. Documented in the Plugin documentation site
    * Added the ability to show the cart widget on pages not directly managed by the plugin (e.g. default pages, blog or any other page). Documented in the Plugin documentation site
1. [](#improved)
    * Changed structure of the Twig files: `shoppingcart` has been removed in favor of `shoppingcart_categories`, `shoppingcart_section` is now `shoppingcart_categories`, `shoppingcart_category` is now `shoppingcart_products`. `shoppingcart_product` is the product page. Please rename your markdown pages accordingly. There's backwards compatibility, so at this point things will continue to work fine, but the old filenames are deprecated.
1. [](#bugfix)
    * Various bug fixes and improvements

# v1.0.7
## 21-04-2016

1. [](#bugfix)
    * Fix issue in multilanguage sites and Grav < 1.1

# v1.0.6
## 21-04-2016

1. [](#bugfix)
    * Fix issue in JS settings build, backported from 1.1
    * Fix issue in payment URL task fetch

# v1.0.5
## 13-03-2016

1. [](#bugfix)
    * Fix JS settings bug introduced in 1.0.4 affecting checkout

# v1.0.4
## 13-03-2016

1. [](#bugfix)
    * Correctly remove private settings from the frontend

# v1.0.3
## 02-03-2016

1. [](#bugfix)
    * Correctly show currency symbol instead of currency code

# v1.0.2
## 01-03-2016

1. [](#bugfix)
    * Move Stripe checkout JS to Stripe plugin

# v1.0.1
## 28-02-2016

1. [](#bugfix)
    * Fix the image title
    * Fixed double `;`
    * Fix currency symbol and positioning

# v1.0.0
## 16-02-2016

1. [](#new)
    * Separated Stripe to own plugin
    * Added PayPal Express checkout
    * Added a new Admin panel to visualize orders
1. [](#improved)
    * Stores orders as YAML instead of .txt files

# v0.2.0
## 28-12-2015

1. [](#new)
    * Use the Form plugin to render and validate the checkout form. Dropped custom validation
    * Use Omnipay to handle the payment
    * Added base ShoppingCartGateway and Order classes

# v0.1.5
## 24-11-2015

1. [](#bugfix)
    * Fixed a bug in the products and categories list on smaller screens

# v0.1.4
## 24-11-2015

1. [](#bugfix)
    * Fixed a bug in the Admin plugin `shoppingcart/templates/admin" directory does not exist`

# v0.1.3
## 02-11-2015

1. [](#improved)
    * Improved code
    * Added cart to all pages
1. [](#feature)
    * Quantity chooser

# v0.1.2
## 29-10-2015

1. [](#bugfix)
    * Fix loading jQuery
1. [](#improved)
    * Improve readme
    * When image is not present, avoid overlap of price and add button

# v0.1.1
## 04-10-2015

1. [](#new)
    * Drop baseURL config, get from Uri class

# v0.1.0
## 03-10-2015

1. [](#new)
    * First public release

# v0.0.1
## 24-08-2015

1. [](#new)
    * ChangeLog started...
