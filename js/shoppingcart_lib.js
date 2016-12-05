if (typeof window == 'undefined') window = {};
if (typeof window.ShoppingCart == 'undefined') window.ShoppingCart = {};

(function(ShoppingCart) {

    /***********************************************************/
    /* Checks if the province field is required
    /***********************************************************/
    ShoppingCart.provinceIsRequired = function provinceIsRequired() {
        if (!ShoppingCart.checkout_form_fields) {
            return false;
        }
        
        var field = ShoppingCart.checkout_form_fields.filter(function(item) { if (item.name === 'province') return true; }).shift();

        if (!field) {
            return false;
        }

        if (!field.validate || !field.validate.required) {
            return false;
        }

        if (field.validate.required === 'true') {
            return true;
        }
    };

    /***********************************************************/
    /* Render a correctly parsed price with the currency at the right position
    /***********************************************************/
    ShoppingCart.renderPriceWithCurrency = function renderPriceWithCurrency(price) {
        var currency_symbol = ShoppingCart.currentCurrencySymbol();

        price = parseFloat(price).toFixed(2);

        if (ShoppingCart.settings.ui.remove_cents_if_zero) {
            if (price  % 1 == 0) {
                price  = parseInt(price , 10);
            }
        }

        if (ShoppingCart.showCurrencyBeforePrice()) {
            return '<span class="currency">' + currency_symbol + '</span> ' + price;
        } else {
            return price + ' <span class="currency">' + currency_symbol + '</span>';
        }
    };

    ShoppingCart.isMobile = function isMobile() {
        var isAndroid = function() {
            return navigator.userAgent.match(/Android/i);
        };

        var isBlackBerry = function() {
            return navigator.userAgent.match(/BlackBerry/i);
        };

        var isiOS = function() {
            return navigator.userAgent.match(/iPhone|iPad|iPod/i);
        };

        var isOpera = function() {
            return navigator.userAgent.match(/Opera Mini/i);
        };

        var isWindows = function() {
            return navigator.userAgent.match(/IEMobile/i);
        };

        var isAny = function() {
            if (isAndroid() || isBlackBerry() || isiOS() || isOpera() || isWindows()) {
                return true;
            }
            return false;
        };

        return isAny();
    };

    /***********************************************************/
    /* Gets a country code
    /***********************************************************/
    ShoppingCart.getCodeOfCountry = function getCodeOfCountry(countryName) {
        var countries = ShoppingCart.getCountries();
        for (var i = 0; i < countries.length; i++) {
            if (countries[i].name === countryName) {
                return countries[i].code;
            }
        }
    };

    /***********************************************************/
    /* Gets a country continent
    /***********************************************************/
    ShoppingCart.getContinentOfCountry = function getContinentOfCountry(countryName) {
        var countries = ShoppingCart.getCountries();
        for (var i = 0; i < countries.length; i++) {
            if (countries[i].name === countryName) {
                return countries[i].continent;
            }
        }
    };

    /***********************************************************/
    /* Get the US States list
    /***********************************************************/
    ShoppingCart.getUSAStates = function getUSAStates() {
        return [
            {code: "AK", name: "Alaska"},
            {code: "AL", name: "Alabama"},
            {code: "AR", name: "Arkansas"},
            {code: "AZ", name: "Arizona"},
            {code: "CA", name: "California"},
            {code: "CO", name: "Colorado"},
            {code: "CT", name: "Connecticut"},
            {code: "DE", name: "Delaware"},
            {code: "DC", name: "District of Columbia"},
            {code: "FL", name: "Florida"},
            {code: "GA", name: "Georgia"},
            {code: "HI", name: "Hawaii"},
            {code: "IA", name: "Iowa"},
            {code: "ID", name: "Idaho"},
            {code: "IL", name: "Illinois"},
            {code: "IN", name: "Indiana"},
            {code: "KS", name: "Kansas"},
            {code: "KY", name: "Kentucky"},
            {code: "LA", name: "Louisiana"},
            {code: "MA", name: "Massachusetts"},
            {code: "MD", name: "Maryland"},
            {code: "ME", name: "Maine"},
            {code: "MI", name: "Michigan"},
            {code: "MN", name: "Minnesota"},
            {code: "MS", name: "Mississippi"},
            {code: "MO", name: "Missouri"},
            {code: "MT", name: "Montana"},
            {code: "NC", name: "North Carolina"},
            {code: "ND", name: "North Dakota"},
            {code: "NE", name: "Nebraska"},
            {code: "NH", name: "New Hampshire"},
            {code: "NJ", name: "New Jersey"},
            {code: "NM", name: "New Mexico"},
            {code: "NV", name: "Nevada"},
            {code: "NY", name: "New York"},
            {code: "OH", name: "Ohio"},
            {code: "OK", name: "Oklahoma"},
            {code: "OR", name: "Oregon"},
            {code: "PA", name: "Pennsylvania"},
            {code: "RI", name: "Rhode Island"},
            {code: "SC", name: "South Carolina"},
            {code: "SD", name: "South Dakota"},
            {code: "TN", name: "Tennessee"},
            {code: "TX", name: "Texas"},
            {code: "UT", name: "Utah"},
            {code: "VA", name: "Virginia"},
            {code: "VT", name: "Vermont"},
            {code: "WA", name: "Washington"},
            {code: "WI", name: "Wisconsin"},
            {code: "WV", name: "West Virginia"},
            {code: "WY", name: "Wyoming"}];
    };

    /***********************************************************/
    /* Get the World Countries list
    /***********************************************************/
    ShoppingCart.getCountries = function getCountries() {
        return [
            {"code":"AF","name":"Afghanistan","continent":"Asia"},
            {"code":"AL","name":"Albania","continent":"Europe"},
            {"code":"DZ","name":"Algeria","continent":"Africa"},
            {"code":"AS","name":"American Samoa","continent":"Oceania"},
            {"code":"AD","name":"Andorra","continent":"Europe"},
            {"code":"AO","name":"Angola","continent":"Africa"},
            {"code":"AI","name":"Anguilla","continent":"North America"},
            {"code":"AG","name":"Antigua and Barbuda","continent":"North America"},
            {"code":"AR","name":"Argentina","continent":"South America"},
            {"code":"AM","name":"Armenia","continent":"Europe"},
            {"code":"AW","name":"Aruba","continent":"North America"},
            {"code":"AU","name":"Australia","continent":"Oceania"},
            {"code":"AT","name":"Austria","continent":"Europe"},
            {"code":"AZ","name":"Azerbaijan","continent":"Europe"},
            {"code":"BS","name":"Bahamas","continent":"North America"},
            {"code":"BH","name":"Bahrain","continent":"Asia"},
            {"code":"BD","name":"Bangladesh","continent":"Asia"},
            {"code":"BB","name":"Barbados","continent":"North America"},
            {"code":"BY","name":"Belarus","continent":"Europe"},
            {"code":"BE","name":"Belgium","continent":"Europe"},
            {"code":"BZ","name":"Belize","continent":"North America"},
            {"code":"BJ","name":"Benin","continent":"Africa"},
            {"code":"BM","name":"Bermuda","continent":"North America"},
            {"code":"BT","name":"Bhutan","continent":"Asia"},
            {"code":"BO","name":"Bolivia","continent":"South America"},
            {"code":"BA","name":"Bosnia and Herzegovina","continent":"Europe"},
            {"code":"BW","name":"Botswana","continent":"Africa"},
            {"code":"BR","name":"Brazil","continent":"South America"},
            {"code":"IO","name":"British Indian Ocean Territory","continent":"Asia"},
            {"code":"BN","name":"Brunei Darussalam","continent":"Asia"},
            {"code":"BG","name":"Bulgaria","continent":"Europe"},
            {"code":"BF","name":"Burkina Faso","continent":"Africa"},
            {"code":"BI","name":"Burundi","continent":"Africa"},
            {"code":"KH","name":"Cambodia","continent":"Asia"},
            {"code":"CM","name":"Cameroon","continent":"Africa"},
            {"code":"CA","name":"Canada","continent":"North America"},
            {"code":"CV","name":"Cape Verde","continent":"Africa"},
            {"code":"KY","name":"Cayman Islands","continent":"North America"},
            {"code":"CF","name":"Central African Republic","continent":"Africa"},
            {"code":"TD","name":"Chad","continent":"Africa"},
            {"code":"CL","name":"Chile","continent":"South America"},
            {"code":"CN","name":"China","continent":"Asia"},
            {"code":"CX","name":"Christmas Island","continent":"Asia"},
            {"code":"CC","name":"Cocos (Keeling) Islands","continent":"Asia"},
            {"code":"CO","name":"Colombia","continent":"South America"},
            {"code":"KM","name":"Comoros","continent":"Africa"},
            {"code":"CG","name":"Congo","continent":"Africa"},
            {"code":"CD","name":"Congo, the Democratic Republic of the","continent":"Africa"},
            {"code":"CK","name":"Cook Islands","continent":"Oceania"},
            {"code":"CR","name":"Costa Rica","continent":"North America"},
            {"code":"CI","name":"Cote D'Ivoire","continent":"Africa"},
            {"code":"HR","name":"Croatia","continent":"Europe"},
            {"code":"CU","name":"Cuba","continent":"North America"},
            {"code":"CY","name":"Cyprus","continent":"Europe"},
            {"code":"CZ","name":"Czech Republic","continent":"Europe"},
            {"code":"DK","name":"Denmark","continent":"Europe"},
            {"code":"DJ","name":"Djibouti","continent":"Africa"},
            {"code":"DM","name":"Dominica","continent":"North America"},
            {"code":"DO","name":"Dominican Republic","continent":"North America"},
            {"code":"EC","name":"Ecuador","continent":"South America"},
            {"code":"EG","name":"Egypt","continent":"Africa"},
            {"code":"SV","name":"El Salvador","continent":"North America"},
            {"code":"GQ","name":"Equatorial Guinea","continent":"Africa"},
            {"code":"ER","name":"Eritrea","continent":"Africa"},
            {"code":"EE","name":"Estonia","continent":"Europe"},
            {"code":"ET","name":"Ethiopia","continent":"Africa"},
            {"code":"FK","name":"Falkland Islands (Malvinas)","continent":"South America"},
            {"code":"FO","name":"Faroe Islands","continent":"Europe"},
            {"code":"FJ","name":"Fiji","continent":"Oceania"},
            {"code":"FI","name":"Finland","continent":"Europe"},
            {"code":"FR","name":"France","continent":"Europe"},
            {"code":"GF","name":"French Guiana","continent":"South America"},
            {"code":"PF","name":"French Polynesia","continent":"Oceania"},
            {"code":"GA","name":"Gabon","continent":"Africa"},
            {"code":"GM","name":"Gambia","continent":"Africa"},
            {"code":"GE","name":"Georgia","continent":"Europe"},
            {"code":"DE","name":"Germany","continent":"Europe"},
            {"code":"GH","name":"Ghana","continent":"Africa"},
            {"code":"GI","name":"Gibraltar","continent":"Europe"},
            {"code":"GR","name":"Greece","continent":"Europe"},
            {"code":"GL","name":"Greenland","continent":"North America"},
            {"code":"GD","name":"Grenada","continent":"North America"},
            {"code":"GP","name":"Guadeloupe","continent":"North America"},
            {"code":"GU","name":"Guam","continent":"Oceania"},
            {"code":"GT","name":"Guatemala","continent":"North America"},
            {"code":"GN","name":"Guinea","continent":"Africa"},
            {"code":"GW","name":"Guinea-Bissau","continent":"Africa"},
            {"code":"GY","name":"Guyana","continent":"South America"},
            {"code":"HT","name":"Haiti","continent":"North America"},
            {"code":"VA","name":"Vatican City State","continent":"Europe"},
            {"code":"HN","name":"Honduras","continent":"North America"},
            {"code":"HK","name":"Hong Kong","continent":"Asia"},
            {"code":"HU","name":"Hungary","continent":"Europe"},
            {"code":"IS","name":"Iceland","continent":"Europe"},
            {"code":"IN","name":"India","continent":"Asia"},
            {"code":"ID","name":"Indonesia","continent":"Asia"},
            {"code":"IR","name":"Iran, Islamic Republic of","continent":"Asia"},
            {"code":"IQ","name":"Iraq","continent":"Asia"},
            {"code":"IE","name":"Ireland","continent":"Europe"},
            {"code":"IL","name":"Israel","continent":"Asia"},
            {"code":"IT","name":"Italy","continent":"Europe"},
            {"code":"JM","name":"Jamaica","continent":"North America"},
            {"code":"JP","name":"Japan","continent":"Asia"},
            {"code":"JO","name":"Jordan","continent":"Asia"},
            {"code":"KZ","name":"Kazakhstan","continent":"Asia"},
            {"code":"KE","name":"Kenya","continent":"Africa"},
            {"code":"KI","name":"Kiribati","continent":"Oceania"},
            {"code":"KP","name":"Korea, Democratic People's Republic of","continent":"Asia"},
            {"code":"KR","name":"Korea, Republic of","continent":"Asia"},
            {"code":"KW","name":"Kuwait","continent":"Asia"},
            {"code":"KG","name":"Kyrgyzstan","continent":"Asia"},
            {"code":"LA","name":"Lao People's Democratic Republic","continent":"Asia"},
            {"code":"LV","name":"Latvia","continent":"Europe"},
            {"code":"LB","name":"Lebanon","continent":"Asia"},
            {"code":"LS","name":"Lesotho","continent":"Africa"},
            {"code":"LR","name":"Liberia","continent":"Africa"},
            {"code":"LY","name":"Libyan Arab Jamahiriya","continent":"Africa"},
            {"code":"LI","name":"Liechtenstein","continent":"Europe"},
            {"code":"LT","name":"Lithuania","continent":"Europe"},
            {"code":"LU","name":"Luxembourg","continent":"Europe"},
            {"code":"MO","name":"Macao","continent":"Asia"},
            {"code":"MK","name":"Macedonia, the Former Yugoslav Republic of","continent":"Europe"},
            {"code":"MG","name":"Madagascar","continent":"Africa"},
            {"code":"MW","name":"Malawi","continent":"Africa"},
            {"code":"MY","name":"Malaysia","continent":"Asia"},
            {"code":"MV","name":"Maldives","continent":"Asia"},
            {"code":"ML","name":"Mali","continent":"Africa"},
            {"code":"MT","name":"Malta","continent":"Europe"},
            {"code":"MH","name":"Marshall Islands","continent":"Oceania"},
            {"code":"MQ","name":"Martinique","continent":"North America"},
            {"code":"MR","name":"Mauritania","continent":"Africa"},
            {"code":"MU","name":"Mauritius","continent":"Africa"},
            {"code":"YT","name":"Mayotte","continent":"Africa"},
            {"code":"MX","name":"Mexico","continent":"North America"},
            {"code":"FM","name":"Micronesia, Federated States of","continent":"Oceania"},
            {"code":"MD","name":"Moldova, Republic of","continent":"Europe"},
            {"code":"MC","name":"Monaco","continent":"Europe"},
            {"code":"MN","name":"Mongolia","continent":"Asia"},
            {"code":"MS","name":"Montserrat","continent":"North America"},
            {"code":"MA","name":"Morocco","continent":"Africa"},
            {"code":"MZ","name":"Mozambique","continent":"Africa"},
            {"code":"MM","name":"Myanmar","continent":"Asia"},
            {"code":"NA","name":"Namibia","continent":"Africa"},
            {"code":"NR","name":"Nauru","continent":"Oceania"},
            {"code":"NP","name":"Nepal","continent":"Asia"},
            {"code":"NL","name":"Netherlands","continent":"Europe"},
            {"code":"AN","name":"Netherlands Antilles","continent":"North America"},
            {"code":"NC","name":"New Caledonia","continent":"Oceania"},
            {"code":"NZ","name":"New Zealand","continent":"Oceania"},
            {"code":"NI","name":"Nicaragua","continent":"North America"},
            {"code":"NE","name":"Niger","continent":"Africa"},
            {"code":"NG","name":"Nigeria","continent":"Africa"},
            {"code":"NU","name":"Niue","continent":"Oceania"},
            {"code":"NF","name":"Norfolk Island","continent":"Oceania"},
            {"code":"MP","name":"Northern Mariana Islands","continent":"Oceania"},
            {"code":"NO","name":"Norway","continent":"Europe"},
            {"code":"OM","name":"Oman","continent":"Asia"},
            {"code":"PK","name":"Pakistan","continent":"Asia"},
            {"code":"PW","name":"Palau","continent":"Oceania"},
            {"code":"PS","name":"Palestinian Territory, Occupied","continent":"Asia"},
            {"code":"PA","name":"Panama","continent":"North America"},
            {"code":"PG","name":"Papua New Guinea","continent":"Oceania"},
            {"code":"PY","name":"Paraguay","continent":"South America"},
            {"code":"PE","name":"Peru","continent":"South America"},
            {"code":"PH","name":"Philippines","continent":"Asia"},
            {"code":"PN","name":"Pitcairn","continent":"Oceania"},
            {"code":"PL","name":"Poland","continent":"Europe"},
            {"code":"PT","name":"Portugal","continent":"Europe"},
            {"code":"PR","name":"Puerto Rico","continent":"North America"},
            {"code":"QA","name":"Qatar","continent":"Asia"},
            {"code":"RE","name":"Reunion","continent":"Africa"},
            {"code":"RO","name":"Romania","continent":"Europe"},
            {"code":"RU","name":"Russian Federation","continent":"Asia"},
            {"code":"RW","name":"Rwanda","continent":"Africa"},
            {"code":"SH","name":"Saint Helena","continent":"Africa"},
            {"code":"KN","name":"Saint Kitts and Nevis","continent":"North America"},
            {"code":"LC","name":"Saint Lucia","continent":"North America"},
            {"code":"PM","name":"Saint Pierre and Miquelon","continent":"North America"},
            {"code":"VC","name":"Saint Vincent and the Grenadines","continent":"North America"},
            {"code":"WS","name":"Samoa","continent":"Oceania"},
            {"code":"SM","name":"San Marino","continent":"Europe"},
            {"code":"ST","name":"Sao Tome and Principe","continent":"Africa"},
            {"code":"SA","name":"Saudi Arabia","continent":"Asia"},
            {"code":"SN","name":"Senegal","continent":"Africa"},
            {"code":"CS","name":"Serbia and Montenegro","continent":"Europe"},
            {"code":"SC","name":"Seychelles","continent":"Africa"},
            {"code":"SL","name":"Sierra Leone","continent":"Africa"},
            {"code":"SG","name":"Singapore","continent":"Asia"},
            {"code":"SK","name":"Slovakia","continent":"Europe"},
            {"code":"SI","name":"Slovenia","continent":"Europe"},
            {"code":"SB","name":"Solomon Islands","continent":"Oceania"},
            {"code":"SO","name":"Somalia","continent":"Africa"},
            {"code":"ZA","name":"South Africa","continent":"Africa"},
            {"code":"ES","name":"Spain","continent":"Europe"},
            {"code":"LK","name":"Sri Lanka","continent":"Asia"},
            {"code":"SD","name":"Sudan","continent":"Africa"},
            {"code":"SR","name":"Suriname","continent":"South America"},
            {"code":"SJ","name":"Svalbard and Jan Mayen","continent":"Europe"},
            {"code":"SZ","name":"Swaziland","continent":"Africa"},
            {"code":"SE","name":"Sweden","continent":"Europe"},
            {"code":"CH","name":"Switzerland","continent":"Europe"},
            {"code":"SY","name":"Syrian Arab Republic","continent":"Asia"},
            {"code":"TW","name":"Taiwan, Province of China","continent":"Asia"},
            {"code":"TJ","name":"Tajikistan","continent":"Asia"},
            {"code":"TZ","name":"Tanzania, United Republic of","continent":"Africa"},
            {"code":"TH","name":"Thailand","continent":"Asia"},
            {"code":"TL","name":"Timor-Leste","continent":"Asia"},
            {"code":"TG","name":"Togo","continent":"Africa"},
            {"code":"TK","name":"Tokelau","continent":"Oceania"},
            {"code":"TO","name":"Tonga","continent":"Oceania"},
            {"code":"TT","name":"Trinidad and Tobago","continent":"North America"},
            {"code":"TN","name":"Tunisia","continent":"Africa"},
            {"code":"TR","name":"Turkey","continent":"Asia"},
            {"code":"TM","name":"Turkmenistan","continent":"Asia"},
            {"code":"TC","name":"Turks and Caicos Islands","continent":"North America"},
            {"code":"TV","name":"Tuvalu","continent":"Oceania"},
            {"code":"UG","name":"Uganda","continent":"Africa"},
            {"code":"UA","name":"Ukraine","continent":"Europe"},
            {"code":"AE","name":"United Arab Emirates","continent":"Asia"},
            {"code":"GB","name":"United Kingdom","continent":"Europe"},
            {"code":"US","name":"United States","continent":"North America"},
            {"code":"UM","name":"United States Minor Outlying Islands","continent":"Oceania"},
            {"code":"UY","name":"Uruguay","continent":"South America"},
            {"code":"UZ","name":"Uzbekistan","continent":"Asia"},
            {"code":"VU","name":"Vanuatu","continent":"Oceania"},
            {"code":"VE","name":"Venezuela","continent":"South America"},
            {"code":"VN","name":"Viet Nam","continent":"Asia"},
            {"code":"VG","name":"Virgin Islands, British","continent":"North America"},
            {"code":"VI","name":"Virgin Islands, U.s.","continent":"North America"},
            {"code":"WF","name":"Wallis and Futuna","continent":"Oceania"},
            {"code":"EH","name":"Western Sahara","continent":"Africa"},
            {"code":"YE","name":"Yemen","continent":"Asia"},
            {"code":"ZM","name":"Zambia","continent":"Africa"},
            {"code":"ZW","name":"Zimbabwe","continent":"Africa"}
        ];
    };

    /***********************************************************/
    /* Get the World Continents list
    /***********************************************************/
    ShoppingCart.getContinents = function getContinents() {
        return [
            {"code":"AF","name":"Africa"},
            {"code":"AN","name":"Antarctica"},
            {"code":"AS","name":"Asia"},
            {"code":"EU","name":"Europe"},
            {"code":"NA","name":"North America"},
            {"code":"OC","name":"Oceania"},
            {"code":"SA","name":"South America"},
        ];
    };

    /***********************************************************/
    /* Get the World Currencies list
    /***********************************************************/
    ShoppingCart.currencies = [
        {"code":"AED","symbol":"\u062f.\u0625;","name":"UAE dirham"},
        {"code":"AFN","symbol":"Afs","name":"Afghan afghani"},
        {"code":"ALL","symbol":"L","name":"Albanian lek"},
        {"code":"AMD","symbol":"AMD","name":"Armenian dram"},
        {"code":"ANG","symbol":"NA\u0192","name":"Netherlands Antillean gulden"},
        {"code":"AOA","symbol":"Kz","name":"Angolan kwanza"},
        {"code":"ARS","symbol":"$","name":"Argentine peso"},
        {"code":"AUD","symbol":"$","name":"Australian dollar"},
        {"code":"AWG","symbol":"\u0192","name":"Aruban florin"},
        {"code":"AZN","symbol":"AZN","name":"Azerbaijani manat"},
        {"code":"BAM","symbol":"KM","name":"Bosnia and Herzegovina konvertibilna marka"},
        {"code":"BBD","symbol":"Bds$","name":"Barbadian dollar"},
        {"code":"BDT","symbol":"\u09f3","name":"Bangladeshi taka"},
        {"code":"BGN","symbol":"BGN","name":"Bulgarian lev"},
        {"code":"BHD","symbol":".\u062f.\u0628","name":"Bahraini dinar"},
        {"code":"BIF","symbol":"FBu","name":"Burundi franc"},
        {"code":"BMD","symbol":"BD$","name":"Bermudian dollar"},
        {"code":"BND","symbol":"B$","name":"Brunei dollar"},
        {"code":"BOB","symbol":"Bs.","name":"Bolivian boliviano"},
        {"code":"BRL","symbol":"R$","name":"Brazilian real"},
        {"code":"BSD","symbol":"B$","name":"Bahamian dollar"},
        {"code":"BTN","symbol":"Nu.","name":"Bhutanese ngultrum"},
        {"code":"BWP","symbol":"P","name":"Botswana pula"},
        {"code":"BYR","symbol":"Br","name":"Belarusian ruble"},
        {"code":"BZD","symbol":"BZ$","name":"Belize dollar"},
        {"code":"CAD","symbol":"$","name":"Canadian dollar"},
        {"code":"CDF","symbol":"F","name":"Congolese franc"},
        {"code":"CHF","symbol":"Fr.","name":"Swiss franc"},
        {"code":"CLP","symbol":"$","name":"Chilean peso"},
        {"code":"CNY","symbol":"\u00a5","name":"Chinese/Yuan renminbi"},
        {"code":"COP","symbol":"Col$","name":"Colombian peso"},
        {"code":"CRC","symbol":"\u20a1","name":"Costa Rican colon"},
        {"code":"CUC","symbol":"$","name":"Cuban peso"},
        {"code":"CVE","symbol":"Esc","name":"Cape Verdean escudo"},
        {"code":"CZK","symbol":"K\u010d","name":"Czech koruna"},
        {"code":"DJF","symbol":"Fdj","name":"Djiboutian franc"},
        {"code":"DKK","symbol":"DKK","name":"Danish krone"},
        {"code":"DOP","symbol":"RD$","name":"Dominican peso"},
        {"code":"DZD","symbol":"\u062f.\u062c","name":"Algerian dinar"},
        {"code":"EEK","symbol":"EEK","name":"Estonian kroon"},
        {"code":"EGP","symbol":"\u00a3","name":"Egyptian pound"},
        {"code":"ERN","symbol":"Nfa","name":"Eritrean nakfa"},
        {"code":"ETB","symbol":"Br","name":"Ethiopian birr"},
        {"code":"EUR","symbol":"\u20ac","name":"European Euro"},
        {"code":"FJD","symbol":"FJ$","name":"Fijian dollar"},
        {"code":"FKP","symbol":"\u00a3","name":"Falkland Islands pound"},
        {"code":"GBP","symbol":"\u00a3","name":"British pound"},
        {"code":"GEL","symbol":"GEL","name":"Georgian lari"},
        {"code":"GHS","symbol":"GH\u20b5","name":"Ghanaian cedi"},
        {"code":"GIP","symbol":"\u00a3","name":"Gibraltar pound"},
        {"code":"GMD","symbol":"D","name":"Gambian dalasi"},
        {"code":"GNF","symbol":"FG","name":"Guinean franc"},
        {"code":"GQE","symbol":"CFA","name":"Central African CFA franc"},
        {"code":"GTQ","symbol":"Q","name":"Guatemalan quetzal"},
        {"code":"GYD","symbol":"GY$","name":"Guyanese dollar"},
        {"code":"HKD","symbol":"HK$","name":"Hong Kong dollar"},
        {"code":"HNL","symbol":"L","name":"Honduran lempira"},
        {"code":"HRK","symbol":"kn","name":"Croatian kuna"},
        {"code":"HTG","symbol":"G","name":"Haitian gourde"},
        {"code":"HUF","symbol":"Ft","name":"Hungarian forint"},
        {"code":"IDR","symbol":"Rp","name":"Indonesian rupiah"},
        {"code":"ILS","symbol":"\u20aa","name":"Israeli new sheqel"},
        {"code":"INR","symbol":"\u2089","name":"Indian rupee"},
        {"code":"IQD","symbol":"\u062f.\u0639","name":"Iraqi dinar"},
        {"code":"IRR","symbol":"IRR","name":"Iranian rial"},
        {"code":"ISK","symbol":"ISK","name":"Icelandic kr\u00f3na"},
        {"code":"JMD","symbol":"J$","name":"Jamaican dollar"},
        {"code":"JOD","symbol":"JOD","name":"Jordanian dinar"},
        {"code":"JPY","symbol":"\u00a5","name":"Japanese yen"},
        {"code":"KES","symbol":"KSh","name":"Kenyan shilling"},
        {"code":"KGS","symbol":"\u0441\u043e\u043c","name":"Kyrgyzstani som"},
        {"code":"KHR","symbol":"\u17db","name":"Cambodian riel"},
        {"code":"KMF","symbol":"KMF","name":"Comorian franc"},
        {"code":"KPW","symbol":"W","name":"North Korean won"},
        {"code":"KRW","symbol":"W","name":"South Korean won"},
        {"code":"KWD","symbol":"KWD","name":"Kuwaiti dinar"},
        {"code":"KYD","symbol":"KY$","name":"Cayman Islands dollar"},
        {"code":"KZT","symbol":"T","name":"Kazakhstani tenge"},
        {"code":"LAK","symbol":"KN","name":"Lao kip"},
        {"code":"LBP","symbol":"\u00a3","name":"Lebanese lira"},
        {"code":"LKR","symbol":"Rs","name":"Sri Lankan rupee"},
        {"code":"LRD","symbol":"L$","name":"Liberian dollar"},
        {"code":"LSL","symbol":"M","name":"Lesotho loti"},
        {"code":"LTL","symbol":"Lt","name":"Lithuanian litas"},
        {"code":"LVL","symbol":"Ls","name":"Latvian lats"},
        {"code":"LYD","symbol":"LD","name":"Libyan dinar"},
        {"code":"MAD","symbol":"MAD","name":"Moroccan dirham"},
        {"code":"MDL","symbol":"MDL","name":"Moldovan leu"},
        {"code":"MGA","symbol":"FMG","name":"Malagasy ariary"},
        {"code":"MKD","symbol":"MKD","name":"Macedonian denar"},
        {"code":"MMK","symbol":"K","name":"Myanma kyat"},
        {"code":"MNT","symbol":"\u20ae","name":"Mongolian tugrik"},
        {"code":"MOP","symbol":"P","name":"Macanese pataca"},
        {"code":"MRO","symbol":"UM","name":"Mauritanian ouguiya"},
        {"code":"MUR","symbol":"Rs","name":"Mauritian rupee"},
        {"code":"MVR","symbol":"Rf","name":"Maldivian rufiyaa"},
        {"code":"MWK","symbol":"MK","name":"Malawian kwacha"},
        {"code":"MXN","symbol":"$","name":"Mexican peso"},
        {"code":"MYR","symbol":"RM","name":"Malaysian ringgit"},
        {"code":"MZM","symbol":"MTn","name":"Mozambican metical"},
        {"code":"NAD","symbol":"N$","name":"Namibian dollar"},
        {"code":"NGN","symbol":"\u20a6","name":"Nigerian naira"},
        {"code":"NIO","symbol":"C$","name":"Nicaraguan c\u00f3rdoba"},
        {"code":"NOK","symbol":"NOK","name":"Norwegian krone"},
        {"code":"NPR","symbol":"NRs","name":"Nepalese rupee"},
        {"code":"NZD","symbol":"NZ$","name":"New Zealand dollar"},
        {"code":"OMR","symbol":"OMR","name":"Omani rial"},
        {"code":"PAB","symbol":"B./","name":"Panamanian balboa"},
        {"code":"PEN","symbol":"S/.","name":"Peruvian nuevo sol"},
        {"code":"PGK","symbol":"K","name":"Papua New Guinean kina"},
        {"code":"PHP","symbol":"\u20b1","name":"Philippine peso"},
        {"code":"PKR","symbol":"Rs.","name":"Pakistani rupee"},
        {"code":"PLN","symbol":"z\u0142","name":"Polish zloty"},
        {"code":"PYG","symbol":"\u20b2","name":"Paraguayan guarani"},
        {"code":"QAR","symbol":"QR","name":"Qatari riyal"},
        {"code":"RON","symbol":"L","name":"Romanian leu"},
        {"code":"RSD","symbol":"din.","name":"Serbian dinar"},
        {"code":"RUB","symbol":"P","name":"Russian ruble"},
        {"code":"SAR","symbol":"SR","name":"Saudi riyal"},
        {"code":"SBD","symbol":"SI$","name":"Solomon Islands dollar"},
        {"code":"SCR","symbol":"SR","name":"Seychellois rupee"},
        {"code":"SDG","symbol":"SDG","name":"Sudanese pound"},
        {"code":"SEK","symbol":"SEK","name":"Swedish krona"},
        {"code":"SGD","symbol":"S$","name":"Singapore dollar"},
        {"code":"SHP","symbol":"\u00a3","name":"Saint Helena pound"},
        {"code":"SLL","symbol":"Le","name":"Sierra Leonean leone"},
        {"code":"SOS","symbol":"Sh.","name":"Somali shilling"},
        {"code":"SRD","symbol":"$","name":"Surinamese dollar"},
        {"code":"SYP","symbol":"LS","name":"Syrian pound"},
        {"code":"SZL","symbol":"E","name":"Swazi lilangeni"},
        {"code":"THB","symbol":"\u0e3f","name":"Thai baht"},
        {"code":"TJS","symbol":"TJS","name":"Tajikistani somoni"},
        {"code":"TMT","symbol":"m","name":"Turkmen manat"},
        {"code":"TND","symbol":"DT","name":"Tunisian dinar"},
        {"code":"TRY","symbol":"TL","name":"Turkish new lira"},
        {"code":"TTD","symbol":"TT$","name":"Trinidad and Tobago dollar"},
        {"code":"TWD","symbol":"NT$","name":"New Taiwan dollar"},
        {"code":"TZS","symbol":"TZS","name":"Tanzanian shilling"},
        {"code":"UAH","symbol":"грн.","name":"Ukrainian hryvnia"},
        {"code":"UGX","symbol":"USh","name":"Ugandan shilling"},
        {"code":"USD","symbol":"$","name":"United States dollar"},
        {"code":"UYU","symbol":"$U","name":"Uruguayan peso"},
        {"code":"UZS","symbol":"UZS","name":"Uzbekistani som"},
        {"code":"VEB","symbol":"Bs","name":"Venezuelan bolivar"},
        {"code":"VND","symbol":"\u20ab","name":"Vietnamese dong"},
        {"code":"VUV","symbol":"VT","name":"Vanuatu vatu"},
        {"code":"WST","symbol":"WS$","name":"Samoan tala"},
        {"code":"XAF","symbol":"CFA","name":"Central African CFA franc"},
        {"code":"XCD","symbol":"EC$","name":"East Caribbean dollar"},
        {"code":"XDR","symbol":"SDR","name":"Special Drawing Rights"},
        {"code":"XOF","symbol":"CFA","name":"West African CFA franc"},
        {"code":"XPF","symbol":"F","name":"CFP franc"},
        {"code":"YER","symbol":"YER","name":"Yemeni rial"},
        {"code":"ZAR","symbol":"R","name":"South African rand"},
        {"code":"ZMK","symbol":"ZK","name":"Zambian kwacha"},
        {"code":"ZWR","symbol":"Z$","name":"Zimbabwean dollar"}
    ];

})(window.ShoppingCart);

if (typeof exports !== 'undefined') {
    exports.window = window;
}
