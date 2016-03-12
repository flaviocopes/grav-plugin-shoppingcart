var assert = require('assert');
var ShoppingCart = require('../../../js/shoppingcart_lib.js');

describe('ShoppingCart Lib', function() {
    describe('ShoppingCart.getCodeOfCountry()', function () {
        it('should return IT when the value is Italy', function () {
            assert.equal('IT', window.ShoppingCart.getCodeOfCountry('Italy'));
        });
        it('should return US when the value is United States', function () {
            assert.equal('US', window.ShoppingCart.getCodeOfCountry('United States'));
        });
    });

    describe('ShoppingCart.getContinentOfCountry()', function () {
        it('should return Europe when the value is Italy', function () {
            assert.equal('Europe', window.ShoppingCart.getContinentOfCountry('Italy'));
        });
        it('should return North America when the value is United States', function () {
            assert.equal('North America', window.ShoppingCart.getContinentOfCountry('United States'));
        });
    });
});
