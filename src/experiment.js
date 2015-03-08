'use strict';
var baseUrl = 'http://www.hkexnews.hk';
var advSearchUrl = '/listedco/listconews/advancedsearch/search_active_main.aspx';

var options = {
    verbose: true,
    logLevel: "debug",
    waitTimeout: 10000,
    pageSettings: {
        userAgent: "Mozilla/5.0 (Windows NT 6.1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/34.0.1847.131 Safari/537.36"
    }
};

var casper = require('casper').create(options);

casper.on('wait.timeout', function(){
	this.capture('timeout.png');
});

casper.start(baseUrl + advSearchUrl, function() {
            this.thenEvaluate(function() {
                document.forms[0].submit();
            });
        });

        casper.then(function() {
            // body...
            this.waitForSelector('#ctl00_gvMain_ctl01_btnNext', function() {
                this.capture('1.png');
                this.click('#ctl00_gvMain_ctl01_btnNext');
            });
        });

        casper.then(function() {
            // body...
            this.waitForSelector('#ctl00_gvMain_ctl01_btnNext', function() {
            this.capture('2.png');
            this.back();
            });
        });

        casper.then(function() {
            // body...
            this.waitForSelector('#ctl00_gvMain_ctl01_btnNext', function() {
            this.capture('1again.png');
            });
        });

        casper.then(function() {
            // body...
        	this.capture('2before.png');
            this.waitForSelector('#ctl00_gvMain_ctl01_btnNext', function() {
            this.forward();
            this.then(function(){this.capture('2again.png');});
            });
        });

        casper.run(function() {
			this.exit();
	    });
