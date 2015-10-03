# Grav Shopping Cart Plugin

`Shopping Cart` is a [Grav](http://github.com/getgrav/grav) plugin that adds e-commerce support to Grav. Currenty Stripe is the only payment method supported.

> IMPORTANT!!! This plugin is currently in development as is to be considered an experimental **alpha release**. No backwards compatibility is guaranteed at this time.

# Installation

To install this plugin, just download the zip version of this repository and unzip it under `/your/site/grav/user/plugins`. Then, rename the folder to `shoppingcart`.

You should now have all the plugin files under

	/your/site/grav/user/plugins/shoppingcart

>> NOTE:

# Usage

Since many themes already provide styling for Snipcart, the plugin follows the Snipcart naming conventions. So just create a page of type `shoppingcart.md` that contains a categories list as `shoppingcart_category.md` pages, which in turn has children pages as `shoppingcart_detail.md`.

In short

```
01.shop
	shoppingcart.md
	01.t-shirts
		shoppingcart_category.md
		01.first-t-shirt
			product_image.jpg
			shoppingcart_detail.md
		02.second-t-shirt
			product_image.jpg
			shoppingcart_detail.md
	02.mugs
		shoppingcart_category.md
		01.first-mug
			product_image.jpg
			shoppingcart_detail.md
		02.second-mug
			product_image.jpg
			shoppingcart_detail.md
```

You can use the [Shop Site Skeleton](https://github.com/getgrav/grav-skeleton-shop-site) to jump start.

Product Pages using `shoppingcart_detail.md` will follow this structure:

```
---
title: Product title
price: 19.99
---

#### Product title to be shown in the page

Product description
```

# Configure the shopping cart options

Copy the `user/plugins/shoppingcart/shoppingcart.yaml` file into `user/config/plugins/shoppingcart.yaml` file, and add your own Stripe Test keys (you can find them in your Stripe Dashboard).

E.g.

```
payment:
    methods:
        stripe:
            secretKey: 'sk_test_4okloV9Jsu3IiBSc42ke2iek'
            publicKey: 'pk_test_8OfS5r77VXHMXE7N2j3i2j2i'
```

Also add your own base URL if the site is not running in the domain root:

```
urls:
    baseURL: /grav-site
```

You can configure pretty much everything there. Add your own shipping methods too.

# Visualizing orders

Orders are saved in the `user/data/shoppingcart` folder. You can view them through the Data Manager plugin.

# Future

In the future there will most probably be a Pro version with more advanced features such as stock management, digital downloads, product variations, shipping cost calculation etc. Not yet started/planned anything related to that.

The focus now is on the free version.

Listing a few things here I want to do in the free version:

- Solve all bugs (of course)
- Add email notifications
- Better visualization of the orders in the Data Manager
- Add quantity selection in product detail
- Improve tax management
- Improve shipping options
- Add PayPal Standard Payments
- Allow to set options in the Admin Panel

