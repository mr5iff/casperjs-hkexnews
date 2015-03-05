'use strict';
var baseUrl = 'http://www.hkexnews.hk';
var advSearchUrl = '/listedco/listconews/advancedsearch/search_active_main.aspx';
var downloadPath = './download/';
var outputPath = './output/';
// var outputFilename = 'output.json';

var pageCountSelector = '#ctl00_gvMain_ctl01_lbPageCount';
var fs = require('fs');

function main(criteria) {
    var options = {
        verbose: true,
        logLevel: "debug",
        waitTimeout: 60000,
        pageSettings: {
            userAgent: "Mozilla/5.0 (Windows NT 6.1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/34.0.1847.131 Safari/537.36"
        },
        onDie: function() {
            writeData();
        }
    };
    var filename = outputFilename();

    var casper = require('casper').create(options);

    var stockCode, stockName, headlineCategoryAndDocType, headlineCategory, documentType, newsTitle, dateOfRelease;


    var allData = {
        // metadata:{},
        pages: []
    };

    casper.on('done', function() {
        allData.metadata.complete = true;
        writeData();

        //do the process again for the last period
        
        criteria = shiftCriteriaMonth(criteria);
        this.log('finished 1 round!', 'info');
        require('utils').dump(criteria);
        casper.open(baseUrl + advSearchUrl).then(newSearch);

        // hack for removing the error message:
        // 'Unsafe JavaScript attempt to access frame with URL about:blank from frame with URL file:///usr/local/lib/node_modules/casperjs/bin/bootstrap.js. Domains, protocols and ports must match.'
        // setTimeout(function() {
        // 	casper.exit();
        // }, 0);

        //hack

        // inputSearchCriteria.call(this, shiftCriteriaMonth(criteria));
        // submitForm.call(this);
        // this.waitForSelector(pageCountSelector, function() {
        //     allData.metadata = getSearchInfo.call(this);
        //     allData.metadata.complete = false;
        //     getRowInfo.call(this, allData);
        // });
    });

    casper.on('error', function() {
        writeData();
    });

    casper.on('waitFor.timeout', function() {
        var error_timestamp = (Date.now() / 1000 | 0);
        var error_path = './errorLog/';
        writeData();
        fs.wrtie(error_path + error_timestamp + '.txt', this.getHTML(), 'w');
        this.capture(error_path + error_timestamp + '.png');
    });

    casper.on('page.read', function() {
        writeData();
    });

    casper.start(baseUrl + advSearchUrl, newSearch);

    function newSearch(){
        inputSearchCriteria.call(this, criteria);
        submitForm.call(this);
        this.waitForSelector(pageCountSelector, function() {
            allData.metadata = getSearchInfo.call(this);
            allData.metadata.complete = false;
            getRowInfo.call(this, allData);
        });
        // _downloadFiles.call(this, getFileLinks.call(this));
        // downloadAllFiles.call(this);
    }

    function writeData() {
        fs.write(outputPath + filename, JSON.stringify(allData), 'w');
    }

    casper.run(function() {
        // writeData();
        // console.log(this.getCurrentUrl());
        // require('utils').dump(pageRecord.call(this));
        // downloadFiles.call(this, getFileLinks.call(this));
    });

}


function hkexCriteria(criteria){
    return{
        startDate_day : convertNumToStr(criteria.startDate.getDate()+1),
        startDate_month : convertNumToStr(criteria.startDate.getMonth()+1),
        startDate_year : criteria.startDate.getFullYear()+'',
        endDate_day : convertNumToStr(criteria.endDate.getDate()+1),
        endDate_month : convertNumToStr(criteria.endDate.getMonth()+1),
        endDate_year : criteria.endDate.getFullYear()+''
    };
}

function newCriteria(startDate, endDate){
    if (startDate)
        var _startDate = new Date(startDate);
    else
        var _startDate = new Date();

    if (endDate)
        var _endDate = new Date(endDate);
    else{
        var _endDate = new Date(_startDate.getTime());
        _endDate.setMonth(_endDate.getMonth()+1);
    }

    // }
    return {
        startDate: _startDate,
        endDate: _endDate
    };
}

function shiftCriteriaMonth(criteria){
    criteria.endDate.setMonth(criteria.endDate.getMonth()-1);
    criteria.startDate.setMonth(criteria.startDate.getMonth()-1);
    return criteria;
}

var init_criteria = newCriteria("09/02/2013");
main(init_criteria);

//test
// for (var i = 0;i<20; i++){
//     require('utils').dump(hkexCriteria(init_criteria));
//     init_criteria = shiftCriteriaMonth(init_criteria);
// }

function outputFilename() {
    // var currentTime = new Date();
    // var month = currentTime.getMonth() + 1;
    // var day = currentTime.getDate();
    // var year = currentTime.getFullYear();
    // return "data-"+year + month + day+".txt";
    return 'data-' + (Date.now() / 1000 | 0) + '.txt';
}

function submitForm() {
    this.thenEvaluate(function() {
        document.forms[0].submit();
    });
}



function convertNumToStr(i){
	return i<10 ? '0'+''+i : ''+i;
}

function inputSearchCriteria(criteria) {
	var criteria = hkexCriteria(criteria) || {};
    // var datePeriodType = criteria.datePeriodType || 'rbManualRange';
    var datePeriodType = 'rbManualRange';
    var startDate_day = criteria.startDate_day || '02';
    var startDate_month = criteria.startDate_month || '07';
    var startDate_year = criteria.startDate_year || '2014';
    var endDate_day = criteria.endDate_day || '01';
    var endDate_month = criteria.endDate_month || '08';
    var endDate_year = criteria.endDate_year || '2014';



    this.fill('form#aspnetForm', {

        'ctl00$rdo_SelectDateOfRelease': datePeriodType, // rbManualRange | rbDefaultRange
        // if datePeriodType == rbManualRange
        'ctl00$sel_DateOfReleaseFrom_d': startDate_day, // 01 - 31
        'ctl00$sel_DateOfReleaseFrom_m': startDate_month, // 01 - 12
        'ctl00$sel_DateOfReleaseFrom_y': startDate_year, // 1999 - 2015
        // if datePeriodType == rbDefaultRange
        'ctl00$sel_DateOfReleaseTo_d': endDate_day, // 01 - 31
        'ctl00$sel_DateOfReleaseTo_m': endDate_month, // 01 - 12
        'ctl00$sel_DateOfReleaseTo_y': endDate_year, // 1999 - 2015
    }, false);


    // this.fill('form#aspnetForm', {
    // 	'ctl00$txt_stock_code': stockCode, 
    //        'ctl00$txt_stock_name': stockName,


    //        'ctl00$rdo_SelectDocType': docType, // rbAll | rbAfter2006 | rbPrior2006
    //        // if docType == rbAfter2006
    //        'ctl00$sel_tier_1':   headlineCategory_type,
    //        // if docType == rbPrior2006
    //        'ctl00$sel_DocTypePrior2006': headlineCategory_Prior2006_type,


    //        'ctl00$txtKeyWord': keyword,


    //        'ctl00$rdo_SelectDateOfRelease': datePeriodType, // rbManualRange | rbDefaultRange
    //        // if datePeriodType == rbManualRange
    //        'ctl00$sel_DateOfReleaseFrom_d': startDate_day, // 01 - 31
    //        'ctl00$sel_DateOfReleaseFrom_m': startDate_month, // 01 - 12
    //        'ctl00$sel_DateOfReleaseFrom_y': startDate_year, // 1999 - 2015
    //        // if datePeriodType == rbDefaultRange
    //        'ctl00$sel_DateOfReleaseTo_d': endDate_day, // 01 - 31
    //        'ctl00$sel_DateOfReleaseTo_m': endDate_month, // 01 - 12
    //        'ctl00$sel_DateOfReleaseTo_y': endDate_year, // 1999 - 2015

    //        'ctl00$rdo_SelectSortBy': sortBy // rbDateTime | rbStockCode | rbStockName

    //    }, true);


    // ctl00_txt_stock_code
    // ctl00_txt_stock_name

    // // Headline Category and Document Type
    // // 1. All
    // ctl00_rbAll

    // // 2. Headline Category (For documents since 25 June 2007)  
    // ctl00_rbAfter2006
    // ctl00_sel_tier_1
    // // <select name="ctl00$sel_tier_1" id="ctl00_sel_tier_1" class="arial12black" onchange="ResetDocTypePrior2006(); OnSetTierOne()">
    // // 	<option value="-2">ALL</option>
    // // 	<option value="1">Announcements and Notices</option>
    // // 	<option value="2">Circulars</option>
    // // 	<option value="3">Listing Documents</option>
    // // 	<option value="4">Financial Statements/ESG Information</option>
    // // 	<option value="13">Next Day Disclosure Returns</option>
    // // 	<option value="14">Monthly Returns</option>
    // // 	<option value="7">Proxy Forms</option>
    // // 	<option value="11">Company Information Sheet (GEM)</option>
    // // 	<option value="12">Constitutional Documents</option>
    // // 	<option value="5">Debt and Structured Products</option>
    // // 	<option value="9">Trading Information of Exchange Traded Funds</option>
    // // 	<option value="8">Regulatory Announcement &amp; News</option>
    // // 	<option value="10">Share Buyback Reports (Before 1 January 2009)</option>
    // // 	<option value="15">Takeovers Code - dealing disclosures</option>
    // // 	<option value="16">Application Proofs and Post Hearing Information Packs or PHIPs</option>

    // // </select>

    // // 3. Document Type (For documents prior to 25 June 2007)
    // ctl00_rbPrior2006
    // ctl00_sel_DocTypePrior2006
    // // <select name="ctl00$sel_DocTypePrior2006" id="ctl00_sel_DocTypePrior2006" class="arial12black" onchange="Javascript: ResetDocTypeAfter2006(); rbPrior2006.checked = true;">
    // // 	<option value="-1">ALL</option>
    // // 	<option value="10000"> Announcement</option>
    // // 	<option value="10500"> IPO Allotment Results</option>
    // // 	<option value="11000"> Results Announcement</option>
    // // 	<option value="11500"> Financial Statements</option>
    // // 	<option value="12000"> Securities Buyback</option>
    // // 	<option value="13000"> Information Table</option>
    // // 	<option value="14000"> Trading Arrangement</option>
    // // 	<option value="15100"> Changes in Directorships</option>
    // // 	<option value="15200"> Notices of General Meetings</option>
    // // 	<option value="15250"> Proxy Form</option>
    // // 	<option value="15300"> Results of General Meetings</option>
    // // 	<option value="15500"> Company Profile (GEM only)</option>
    // // 	<option value="16000"> Others</option>
    // // 	<option value="17000"> EFN - Tender Notice</option>
    // // 	<option value="18000"> Circulars</option>
    // // 	<option value="19000"> Prospectuses</option>
    // // 	<option value="19100"> Base Listing Document</option>

    // // </select>

    // // News Title
    // ctl00_txtKeyWord

    // // Date of Release
    // ctl00_rbManualRange

    // // 1. custom period
    // // start date
    // ctl00_sel_DateOfReleaseFrom_d
    // ctl00_sel_DateOfReleaseFrom_m
    // ctl00_sel_DateOfReleaseFrom_y

    // // end date
    // ctl00_sel_DateOfReleaseTo_d
    // ctl00_sel_DateOfReleaseTo_m
    // ctl00_sel_DateOfReleaseTo_y

    // // 2. fixed period
    // ctl00_rbDefaultRange
    // ctl00_sel_defaultDateRange
    // // <select name="ctl00$sel_defaultDateRange" id="ctl00_sel_defaultDateRange" class="arial12black" onchange="Javascript:rbDefaultRange.checked=true;">
    // // 	<option selected="selected" value="SevenDays">Last 7 days</option>
    // // 	<option value="Month">Last month</option>
    // // 	<option value="ThreeMonth">Last 3 months</option>
    // // 	<option value="SixMonth">Last 6 months</option>
    // // 	<option value="Year">Last 12 months</option>

    // // </select>

    // // Sort by:
    // ctl00_rbDateTime
    // ctl00_rbStockCode
    // ctl00_rbStockName


}

function getRowInfo(allData) {

    allData.pages.push(getPageRows.call(this));
    // require('utils').dump(allData);
    this.emit('page.read');
    this.log(getProgress.call(this));
    nextPage.call(this);
    this.waitForSelectorTextChange(pageCountSelector, function() {

        var _pageRecord = pageRecord.call(this);
        if (_pageRecord.end != _pageRecord.total) {
            getRowInfo.call(this, allData);
        } else {
        	allData.pages.push(getPageRows.call(this));
        	this.log(getProgress.call(this));
            this.echo('getRowInfo() completed');
            this.emit('done');
            // this.exit();
        }
    });
}

// function getRowInfo(allData){
// 	this.waitForSelector(pageCountSelector, function() {
// 		allData.pages.push(getPageRows.call(this));
// 			// require('utils').dump(allData);
// 			this.emit('page.read');
// 			this.log(getProgress.call(this));
// 		this.waitForSelectorTextChange(pageCountSelector, function () {

// 			var _pageRecord = pageRecord.call(this);
// 			if (_pageRecord.end != _pageRecord.total){
// 				nextPage.call(this);
// 				getRowInfo.call(this,allData);
// 			}
// 			else{
// 				this.echo('getRowInfo() completed');
// 				this.exit();
// 			}
// 		});
// 	});
// }

function downloadAllFiles() {
    this.waitForSelector(pageCountSelector, function() {
        var _pageRecord;
        // var _pageRecord = pageRecord.call(this);
        // while (_pageRecord.end <= _pageRecord.total){
        // this.log('working on: ' + _pageRecord.sentence, 'info');
        // _downloadFiles.call(this, getFileLinks.call(this));
        // _downloadFiles.call(this, getFileLinks.call(this));
        nextPage.call(this);
        this.waitForSelectorTextChange(pageCountSelector, function() {
                _pageRecord = pageRecord.call(this);
                _downloadFiles.call(this, getFileLinks.call(this));
                downloadAllFiles.call(this);
            })
            // }
            // this.log('done! ' +  _pageRecord.sentence, 'info');
    });
}

function _downloadFiles(links) {
    this.each(links, function(self, link) {
        var filename = /([^\/]*)$/.exec(link);
        self.download(baseUrl + link, downloadPath + filename[0]);
    });
}

function getFileLinks() {
    return this.getElementsAttribute('a[class="news"]', 'href');
}

function pageRecord() {
    var sentence = this.fetchText('#ctl00_gvMain_ctl01_lbPageCount');
    return parse_progress(sentence);
}

function parse_progress(sentence){
	var numberArr = sentence.match(/\d+/g);
    // this.log('working on: ' + sentence, 'info');
    return {
        sentence: sentence,
        start: numberArr[0],
        end: numberArr[1],
        total: numberArr[2]
    };
}

function nextPage() {
    this.click('#ctl00_gvMain_ctl01_btnNext');
}

function getSearchInfo() {
    var StockName = this.fetchText('#ctl00_lblStockName');
    var StockCode = this.fetchText('#ctl00_lblStockCode');
    var FromDate = this.fetchText('#ctl00_lblFromDate');
    var ToDate = this.fetchText('#ctl00_lblToDate');
    var KeyWord = this.fetchText('#ctl00_lblKeyWord');
    var DocType = this.fetchText('#ctl00_lblDocType');

    return {
        searchTime: new Date(),
        stockName: StockName,
        stockCode: StockCode,
        fromDate: FromDate,
        toDate: ToDate,
        keyWord: KeyWord,
        docType: DocType
    };
}

function getProgress() {
    return this.fetchText('#ctl00_gvMain_ctl01_lbPageCount');
}

function getPageRows() {
    var rows = [];
    // require('utils').dump(this.getHTML());
    var sentence = this.fetchText('#ctl00_gvMain_ctl01_lbPageCount');
    var progress = parse_progress(sentence);
    require('utils').dump(progress);
    for (var i = 3; i <= progress.end-progress.start+ 3; ++i) {
        var i_str = i < 10 ? '0' + '' + i : i; // range: 3 to 22
        var dateTime = this.getHTML('#ctl00_gvMain_ctl' + i_str + '_lbDateTime').split(/\<br\>/ig);
        var date = dateTime[0];
        var time = dateTime[1];
        // var dateTime = this.fetchText('#ctl00_gvMain_ctl'+ i_str +'_lbDateTime').replace('<br>',';');
        var stockCode = this.getHTML('#ctl00_gvMain_ctl' + i_str + '_lbStockCode').split(/\<br\>/ig);
        var stockName = this.getHTML('#ctl00_gvMain_ctl' + i_str + '_lbStockName').split(/\<br\>/ig);
        var shortText = this.fetchText('#ctl00_gvMain_ctl' + i_str + '_lbShortText');
        var title = this.fetchText('#ctl00_gvMain_ctl' + i_str + '_hlTitle');
        var url = this.getElementAttribute('#ctl00_gvMain_ctl' + i_str + '_hlTitle', 'href');
        var filename = /([^\/]*)$/.exec(url)[0];
        var fileInfo = this.fetchText('#ctl00_gvMain_ctl' + i_str + '_lbFileInfo');

        var row_obj = {
            i: i,
            date: date,
            time: time,
            stockCode: stockCode,
            stockName: stockName,
            shortText: shortText,
            title: title,
            url: url,
            filename: filename,
            fileInfo: fileInfo
        };
        rows.push(row_obj);
    }

    var page = {
        progress: sentence,
        rows: rows
    };

    // require('utils').dump(page);

    return page;
}
