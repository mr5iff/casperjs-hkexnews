'use strict';
var __utils__ = require('utils');
var fs = require('fs');

var options = {
    verbose: true,
    logLevel: "debug",
    waitTimeout: 60000,
    pageSettings: {
        userAgent: "Mozilla/5.0 (Windows NT 6.1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/34.0.1847.131 Safari/537.36"
    }
    // ,onDie: function() {
    //     writeData();
    // }
    // ,clientScripts: ['../node_modules/src/jquery.js']
};

function formatDate(date){
    var dd =date.getDate();
    var MM = convertNumToStr(date.getMonth()+1);
    var yyyy = date.getFullYear();
    return {
        dd: dd,
        MM: MM,
        yyyy: yyyy,
        yyyyMMdd: yyyy + '' + MM + '' + dd
    };
}

var casper = require('casper').create(options);

var baseUrl = 'http://www.hkexnews.hk';
var advSearchUrlPart = '/listedco/listconews/advancedsearch';
var advSearchUrl = '/listedco/listconews/advancedsearch/search_active_main.aspx';
var downloadPath = './download/';
var _startTime = new Date();
var startTime = formatDate(_startTime);
var outputPath = casper.cli.get('outputPath') || startTime.yyyyMMdd +'/';

casper.log(outputPath);
var opt_stopDate = casper.cli.get('stopDate') || '01/01/1999';

var opt_endDate = casper.cli.get('endDate') || startTime.MM + '/' + startTime.dd + '/' + startTime.yyyy ;
var opt_startDate = casper.cli.get('startDate') || formatDate(Date(_startTime.setMonth(_startTime.getMonth()-1))).MM + '/' + startTime.dd + '/' + startTime.yyyy ;

casper.log(opt_endDate);
casper.log(opt_startDate);

// var outputFilename = 'output.json';

var pageCountSelector = '#ctl00_gvMain_ctl01_lbPageCount';


// setting start date
var init_criteria = newCriteria(opt_startDate, opt_endDate);

main(init_criteria);

function main(criteria) {
    var defaultFilename = outputFilename();


    var stockCode, stockName, headlineCategoryAndDocType, headlineCategory, documentType, newsTitle, dateOfRelease;


    var allData = newSearchData();

    casper.on('url.changed', function(url) {
        if (/exception/i.test(url)) {
            this.back();
            this.then(function() {
                this.waitForSelector('#ctl00_gvMain_ctl01_btnNext', function() {
                    nextPage.call(this);
                });
            });
            this.then(function() {
                getRowInfo.call(this, allData);
            });
        }
    });

    casper.on('done', function() {
        allData.metadata.complete = true;
        writeData();
        //do the process again for the last period
        allData.metadata.complete = false;

        criteria = shiftCriteriaMonth(criteria);
        this.log('finished 1 round!', 'info');
        __utils__.dump(criteria);
        casper.open(baseUrl + advSearchUrl).then(newSearch);
    });

    casper.on('waitFor.timeout', function() {
        var error_timestamp = (Date.now() / 1000 | 0);
        var error_path = './errorLog/';
        writeData();
        fs.wrtie(error_path + error_timestamp + '.txt', this.getHTML(), 'w');
        this.capture(error_path + error_timestamp + '.png');
    });

    casper.on('page.read', function() {
        console.log('page read');
        // writeData();
    });

    casper.start(baseUrl + advSearchUrl, newSearch);

    function newFilename() {
        defaultFilename = outputFilename();
        return defaultFilename;
    }

    function newSearchData() {
        return {
            pages: []
        };
    }

    function newSearch() {
        allData = newSearchData();
        newFilename();

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

    function writeData(data, filename) {
        var _filename = filename || defaultFilename;
        var _data = data || allData;

        fs.write(outputPath + _filename, JSON.stringify(_data), 'w');
    }

    casper.run(function() {});

}


function hkexCriteria(criteria) {
    return {
        startDate_day: convertNumToStr(criteria.startDate.getDate()),
        startDate_month: convertNumToStr(criteria.startDate.getMonth() + 1),
        startDate_year: criteria.startDate.getFullYear() + '',
        endDate_day: convertNumToStr(criteria.endDate.getDate()),
        endDate_month: convertNumToStr(criteria.endDate.getMonth() + 1),
        endDate_year: criteria.endDate.getFullYear() + ''
    };
}

function newCriteria(startDate, endDate) {
    if (startDate)
        var _startDate = new Date(startDate);
    else
        var _startDate = new Date();

    if (endDate)
        var _endDate = new Date(endDate);
    else {
        var _endDate = new Date(_startDate.getTime());
        _endDate.setMonth(_endDate.getMonth() + 1);
    }

    // }
    return {
        startDate: _startDate,
        endDate: _endDate
    };
}

function shiftCriteriaMonth(criteria) {
    criteria.endDate.setMonth(criteria.endDate.getMonth() - 1);
    criteria.startDate.setMonth(criteria.startDate.getMonth() - 1);
    return criteria;
}

function outputFilename() {
    return 'data-' + (Date.now() / 1000 | 0) + '.txt';
}

function submitForm() {
    this.thenEvaluate(function() {
        document.forms[0].submit();
    });
}



function convertNumToStr(i) {
    return i < 10 ? '0' + '' + i : '' + i;
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
    //  'ctl00$txt_stock_code': stockCode, 
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
}

function getRowInfo(allData) {

    allData.pages.push(getPageRows.call(this));
    this.emit('page.read');
    this.log(getProgress.call(this));
    this.waitForSelector('#ctl00_gvMain_ctl01_btnNext', function() {
        nextPage.call(this);
    });

    this.waitForSelectorTextChange(pageCountSelector, function() {
        this.waitFor(function check() {
            return this.fetchText(pageCountSelector).length > 0;
        }, function then() {
            var _pageRecord = pageRecord.call(this);
            if (_pageRecord.end != _pageRecord.total) {
                getRowInfo.call(this, allData);
            } else {
                allData.pages.push(getPageRows.call(this));
                this.log(getProgress.call(this));
                this.echo('getRowInfo() completed');
                this.emit('done');
            }
        }, function () {
            console.log('timeout!!!');
        }, 60000);
    });
}

function downloadAllFiles() {
    this.waitForSelector(pageCountSelector, function() {
        var _pageRecord;
        nextPage.call(this);
        this.waitForSelectorTextChange(pageCountSelector, function() {
            _pageRecord = pageRecord.call(this);
            _downloadFiles.call(this, getFileLinks.call(this));
            downloadAllFiles.call(this);
        });
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

function parse_progress(sentence) {
    var numberArr = sentence.match(/\d+/g);
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
    // __utils__.dump(this.getHTML());
    var sentence = this.fetchText('#ctl00_gvMain_ctl01_lbPageCount');
    var progress = parse_progress(sentence);
    __utils__.dump(progress);
    for (var i = 3; i <= progress.end - progress.start + 3; ++i) {
        var i_str = i < 10 ? '0' + '' + i : i; // range: 3 to 22
        var dateTime = this.getHTML('#ctl00_gvMain_ctl' + i_str + '_lbDateTime').split(/\<br\>/ig);
        var date = dateTime[0];
        var time = dateTime[1];
        // var dateTime = this.fetchText('#ctl00_gvMain_ctl'+ i_str +'_lbDateTime').replace('<br>',';');
        var stockCode = this.getHTML('#ctl00_gvMain_ctl' + i_str + '_lbStockCode').split(/\<br\>/ig);
        var stockName = this.getHTML('#ctl00_gvMain_ctl' + i_str + '_lbStockName').split(/\<br\>/ig);
        var shortText = this.fetchText('#ctl00_gvMain_ctl' + i_str + '_lbShortText');
        var shortTextHTML = this.getHTML('#ctl00_gvMain_ctl' + i_str + '_lbShortText');

        var category_level1 = /^(.*?)\s?-/.exec(shortText);
        category_level1 = category_level1 ? category_level1[1].trim() : shortText;

        var title = this.fetchText('#ctl00_gvMain_ctl' + i_str + '_hlTitle').replace(/\n/g, ' ');
        var url = this.getElementAttribute('#ctl00_gvMain_ctl' + i_str + '_hlTitle', 'href');
        var fileName = /([^\/]*)$/.exec(url)[0];
        var fileInfo = this.fetchText('#ctl00_gvMain_ctl' + i_str + '_lbFileInfo');
            fileInfo = /\((.*)\)/.exec(fileInfo)[1].trim();
        
        var fileSize, fileType;
        try{
            fileSize = /(.*)\,/.exec(fileInfo)[1].trim();
            fileType = /\,(.*)/.exec(fileInfo)[1].trim();
        } catch (err){
            fileSize = fileType = NaN;
        }

        var category_level2;
            category_level2 = /\[(.*)\]/.exec(shortText);
            category_level2 = (category_level2 && category_level2[1]) ? category_level2[1].split('/').map(function(d) {return d.trim();}) : NaN;
        // }


        var row_obj = {
            i: i,
            date: date,
            time: time,
            stockCode: stockCode,
            stockName: stockName,
            shortText: shortText,
            category_level1: category_level1,
            category_level2: category_level2,
            title: title,
            url: url,
            fileName: fileName,
            fileInfo: fileInfo,
            fileSize: fileSize,
            fileType: fileType
        };
        rows.push(row_obj);
    }

    var page = {
        progress: sentence,
        rows: rows
    };

    return page;
}
