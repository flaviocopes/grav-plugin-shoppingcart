# Grav Shopping Cart Plugin

`Shopping Cart` is a [Grav](http://github.com/getgrav/grav) plugin that adds e-commerce support to Grav. Currenty Stripe is the only payment method supported.

> IMPORTANT!!! This plugin is currently in development as is to be considered an experimental **alpha release**. No backwards compatibility is guaranteed at this time.

# Installation

To install this plugin, just download the zip version of this repository and unzip it under `/your/site/grav/user/plugins`. Then, rename the folder to `shoppingcart`.

You should now have all the plugin files under

	/your/site/grav/user/plugins/shoppingcart

>> NOTE:

# Usage

Since many themes already provide styling for Snipcart, the plugin follows some Snipcart conventions.
Just make sure you rename "snipcart" to "shoppingcart".

So, to start with, just create a page of type `shoppingcart.md`.
This page will contain a list of categories, provided by its subpages.
The categories are pages of type `shoppingcart_category.md`.

In turn, those pages have subpages of type `shoppingcart_detail.md`, which are the product pages.

Here's an example of a possible page structure:

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

You can use the [Shop Site Skeleton](https://github.com/getgrav/grav-skeleton-shop-site) to jump start with the pages structure, and change the markdown page names.

The main "Shop" page, with the list of the available categories, will follow this structure:

```
---
title: Shop
body_classes: fullwidth
content:
    items: @self.children
    order:
        by: title
        dir: asc
---

Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod
tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam,
quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo
consequat.
```

The category page will follow this structure:

```
---
title: Geek Toys
category: Geek Toys
content:
    items: @self.children
    order:
        by: title
        dir: asc
---

# Geek Toys
## Anime, Gaming, Movies, Comics, we have **all your toys**
```

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

You can configure pretty much everything there. Add your own shipping methods too.

# Visualizing orders

Orders are saved in the `user/data/shoppingcart` folder. You can view them through the Data Manager plugin.

# Future

In the future there will probably be a Pro version with more advanced features such as stock management, digital downloads, product variations, shipping cost calculation etc.

Not yet started/planned anything related to that.

The focus now is on the free version.

Listing a few things here I want to do in the free version:

- Add email notifications
- Better visualization of the orders in the Data Manager
- Improve tax management
- Improve shipping options
- Allow to set options in the Admin Panel
