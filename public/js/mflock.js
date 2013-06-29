$(document).ready(function()
{
    util.init();

    initComponents();
    setValuesFromQuery();

    $('.spacifyme').change();
    populateCFSelectOptions();
    runActionFromQuery();
});

var capFrequencyOptions = {};

function runActionFromQuery()
{
    if (util.queryParams['a'] == 'deposit')
    {
        calculateDeposit();
    }
}

function setValuesFromQuery()
{
    if (util.queryParams['a'] == 'deposit')
    {
        util.setValueFromParam('years', 0, 'int');
        util.setValueFromParam('months', 0, 'int');
        util.setValueFromParam('percent', 0, 'float');
        util.setValueFromParam('premiumpercent', 0, 'float');
        util.setValueFromParam('init', 0, 'float');
        util.setValueFromParam('monthadd', 0, 'float');
        util.setValueFromParam('capfrequency', 1, 'float');
    }
}

function initComponents()
{
    capFrequencyOptions['0.5'] = new Option('half of month', '0.5', false, false)
    capFrequencyOptions['1'] = new Option('each month', '1', true, true)
    capFrequencyOptions['3'] = new Option('each 3 month', '3', false, false)
    capFrequencyOptions['4'] = new Option('each 4 month', '4', false, false)
    capFrequencyOptions['6'] = new Option('each 6 month', '6', false, false)
    capFrequencyOptions['12'] = new Option('each year', '12', false, false)
    capFrequencyOptions['0'] = new Option('deposit end', '0', false, false)

    $(document).keypress(function(e)
    {
        var charCode = util.charCode(e);
        if (charCode == 13) //enter
        {
            calculateDeposit();
        }
    });

    $(document).keydown(function(e)
    {
        var charCode = util.charCode(e);
        if (charCode == 27 && !$('.help-popup').hasClass('hiddenstyle')) //escape
        {
            closeHelpPopup();
        }
        else if (charCode == 82) // 'R'
        {
            clearAll();
        }
    })

    $('#calculateButton').click(function()
    {
        calculateDeposit();
    });

    $('.intnumvalidate').keypress(allowOnlyIntNumberKey);
    $('.floatnumvalidate').keypress(isFloatNumberKey);
    $('.fixify').keyup(fixify);
    $('.fixify').keypress(function(e)
    {
        if (util.charCode(e) == 13)
        {
            fixify(e);
        }
    });

    $('.spacifyme').change(function()
    {
        this.value = spacify(this.value);
    });

    //help
    $('#helpa').click(function()
    {
        $('.help-popup').removeClass('hiddenstyle');
        $('.disabler').removeClass('hiddenstyle');
        return false;
    });

    $('#help-popup-close').click(function()
    {
        closeHelpPopup();
        return false;
    });

    $('#months').keyup(function()
    {
        populateCFSelectOptions();
    });
    
    $('#capfrequency').change(function()
    {
        calculateDeposit();
    });
}

// 0 % x == 0
function populateCFSelectOptions()
{
        var months = $('#months').val();

        var select = util.byId('capfrequency');
        var prevSelectedValue= select.options[select.selectedIndex].value;

        select.options.length = 0;

        select.add(capFrequencyOptions['0.5']);
        select.add(capFrequencyOptions['1']);

        if (months % 3 == 0)
        {
            select.add(capFrequencyOptions['3']);
        }
        
        if (months % 4 == 0)
        {
            select.add(capFrequencyOptions['4']);
        }
        
        if (months % 6 == 0)
        {
            select.add(capFrequencyOptions['6']);
        }

        if (months == 0 || months % 12 == 0)
        {
            select.add(capFrequencyOptions['12']);
        }

        if (months == 0)
        {
            select.add(capFrequencyOptions['0']);//deposit end
        }

        // select prev value, or default
        var idx = -1;
        for (var i = 0; i < select.options.length; i++)
        {
            if (select.options[i].value == prevSelectedValue)
            {
                idx = i;
                break;
            }
        }
        select.selectedIndex = idx != -1 ? idx : 1;
}

function clearAll()
{
    $('#years').val(0);
    $('#months').val(0);
    $('#init').val(0);
    $('#percent').val(0);
    $('#premiumpercent').val(0);
    $('#monthadd').val(0);
    $('#capfrequency').val(1);

    $('#endsumresult').text(0);
    $('#percentsresult').text(0);
    $('#premiumpercentresult').text(0);
    $('#manualaddresult').text(0);

    $('#errormessage').empty();
    $('.monthincomepanel').addClass('hiddenstyle');
}

function closeHelpPopup()
{
    $('.help-popup').addClass('hiddenstyle');
    $('.disabler').addClass('hiddenstyle');
}

function validateFields()
{
    if ($('#years').val() == 0 && $('#months').val() == 0)
    {
        $('#years').val(1);
    }
}

var calcInProgress = false;
function calculateDeposit()
{
    if (calcInProgress)
    {
        return;
    }
    calcInProgress = true;

    validateFields();

    //empty fields
    $('#endsumresult').empty();
    $('#percentsresult').empty();
    $('#premiumpercentresult').empty();
    $('#manualaddresult').empty();
    $('#errormessage').empty();

    $('#calculateButton').prop('disabled', true);
    
    $('.loaderimgpanel').removeClass('hiddenstyle');
    $('.monthincomepanel').addClass('hiddenstyle');

    $('#resulttbody').empty();
    $('.monthincomecontainer').empty();

    var init = rmspce($('#init').val());
    var monthadd = rmspce($('#monthadd').val());
    var capfreq = util.getSelectValue('capfrequency');

    var deposit = createDepositUrls($('#years').val(), $('#months').val(), $('#percent').val(), $('#premiumpercent').val(), init, monthadd, capfreq);
    util.ajax.get(deposit.restUrl, function success(data)
    {
       createShowResultOutput(data);
    }, function always()
    {
        $('#calculateButton').prop('disabled', false);
        $('.loaderimgpanel').addClass('hiddenstyle');
        calcInProgress = false;
    });

    util.changeBrowserUrl(deposit.permUrl);
}

function createDepositUrls(years, months, percent, premiumpercent, init, monthadd, capfreq)
{
    var rest = util.format(util.depositRestTemplate, years, months, percent, premiumpercent, init, monthadd, capfreq);
    var perm = util.format(util.depositSiteTemplate, years, months, percent, premiumpercent, init, monthadd, capfreq);

    return {
        restUrl: rest,
        permUrl: perm
    }
}

function createShowResultOutput(data)
{
    var result = data.result;

    // #1
    $('#endsumresult').text(result.endSum);
    $('#percentsresult').text(result.percents);
    $('#premiumpercentresult').text(result.premiumpercent);
    $('#manualaddresult').text(result.manualAdded);

    // #2
    var income = data.result.monthIncome;
    if (!income)
    {
        return;
    }

    var colCount = columnsCount(income);

    var mi = '';
    mi += '<table class="zebra">'
    mi += '<thead><tr>' + incomeHeaders(colCount) + '</tr></thead>';
    mi += '<tbody>';

    var j = 0;
    var year = 1;
    for (var prop in income)
    {
        if (j == 0)
        {
            mi += year % 2 === 0 ? '<tr>' : '<tr class="odd">';
            mi += util.td(year);
        }

        mi += util.td(income[prop]);
        j++;

        if (j == colCount)
        {
            j = 0;
            year++;
            mi += '</tr>';
        }

    }

    mi += '</tbody>'
    mi += '</table>'

    $('.monthincomecontainer').html(mi);
    $('.monthincomepanel').removeClass('hiddenstyle');
}

function columnsCount(income)
{
    var colCount = 0;
    for (var prop in income)
    {
        if (prop.lastIndexOf('y1p') == 0)
        {
            colCount++;
            if (colCount > 12)
            {
                break;
            }
        }
    }
    return colCount;
}

/* create income table headers, can be less 12 month*/
function incomeHeaders(colCount)
{
    var headers = util.th('Year', 'min-width: 40px;');

    for (var i = 1; i <= colCount; i++)
    {
        headers += util.th('M' + i * 12 / colCount);
    }

    return headers;
}

function spacify(s)
{
    s = rmspce(s);

    if (s.split('.').length > 2) //format only with 1 dot max
    {
        return s;
    }

    var postfix = '';
    var dotIdx = s.indexOf('.');
    if (dotIdx != -1)
    {
        postfix = s.substr(dotIdx, slen);
        s = s.substr(0, dotIdx);
    }

    var slen = s.length;
    if (slen > 3)
    {
        var j = 0;
        for (var i = slen - 1; i > 0; i--)
        {
            j++;

            if (j == 3)
            {
                var strstart = s.substr(0, i);
                var strend = s.substr(i, slen + 1);

                s = strstart + ' ' + strend;
                j = 0;
            }
        }
    }

    return s + postfix;
}

function isFloatNumberKey(evt)
{
    var charCode = util.charCode(evt);
    var num = charCode == 46 ? 1 : 0; // if dot was pressed
    if (evt.target.value.split('.').length + num > 2) //already has dot
    {
        stopEvent(true, evt);

        var val = evt.target.value;
        evt.target.value = val.substr(0, val.length);
        return;
    }

    var isAllowed = isNumKey(charCode) || charCode == 46 || isSpecialKey(charCode);

    stopEvent(!isAllowed, evt);
}

function allowOnlyIntNumberKey(evt)
{
    var charCode = util.charCode(evt);
    var isAllowed = isNumKey(charCode) || isSpecialKey(charCode);

    stopEvent(!isAllowed, evt);
}

function isSpecialKey(charCode)
{
    //8 - backspace
    return charCode == 8;
}

function isNumKey(charCode)
{
    return charCode >= 48 && charCode <= 57;
}

function fixify(evt)
{
    //1. zero like
    var val = evt.target.value;
    if (util.isBlank(val) || val.match('^[0\\.]0*\\.?0*$'))
    {
        evt.target.value = '0';
    }

    //2.

    //3. max value 
    val = evt.target.value;
    var max = $(evt.target).attr('maxvalue');
    if (parseFloat(val) > parseFloat(max))
    {
        evt.target.value = max;
    }
}

function stopEvent(doStop, evt)
{
    if (doStop)
    {
        evt.returnValue = false;
        if (evt.preventDefault)
        {
            evt.preventDefault();
        }
    }
}

function rmspce(str)
{
    if (str !== null && typeof str === 'string')
    {
        return str.replace(/\s/g, '');
    }

    return str;
}


var util = {
    rtrim: /^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g,
    queryParams: {},
    depositRestTemplate: '/deposit/years/{0}/months/{1}/percent/{2}/premiumpercent/{3}/init/{4}/monthadd/{5}/capfrequency/{6}',
    depositSiteTemplate: '',
    init: function()
    {
        this.queryParams = this.getUrlParams();

        var siteBase = '/deposit.html';
        this.depositSiteTemplate = siteBase + '?a=deposit&years={0}&months={1}&percent={2}&premiumpercent={3}&init={4}&monthadd={5}&capfrequency={6}';
    },
    trim: function(text)
    {
        return text === null ? '' : text.replace(this.rtrim, '');
    },
    isBlank: function(str)
    {
        return typeof str === 'undefined' || str === null || str === '' || this.trim(str) === '';
    },
    byId: function(id)
    {
        return document.getElementById(id);
    },
    getSelectValue: function(selectId)
    {
        var selectEl = this.byId(selectId);
        return selectEl.options[selectEl.selectedIndex].value;
    },
    setValueFromParam: function(id, fallback, type)
    {
        var input = $('#' + id);
        if (this.isDefined(input))
        {
            var result = this.isDefined(fallback) ? fallback : '';

            var param = this.queryParams[id];
            if (!this.isBlank(param))
            {
                if (this.isDefined(type))
                {
                    try
                    {
                        if ('int' === type)
                        {
                            result = parseInt(param);
                            if (isNaN(result))
                            {
                                result = '0';
                            }
                        }
                        else if ('float' === type)
                        {
                            result = parseFloat(param);
                            if (isNaN(result))
                            {
                                result = '0';
                            }
                        }
                    }
                    catch (e)
                    {

                        }
                }
                else
                {
                    result = param;
                }
            }

            input.val(result);
        }
    },
    getUrlParams: function()
    {
        var vars = [],
            hash;
        var hashes = window.location.href.slice(window.location.href.indexOf('?') + 1).split('&');
        for (var i = 0; i < hashes.length; i++)
        {
            hash = hashes[i].split('=');
            vars.push(hash[0]);
            vars[hash[0]] = hash[1];
        }
        return vars;
    },
    format: function()
    {
        var args = arguments; //not array
        var str = this.shift(args);
        return str.replace(/{(\d+)}/g, function(match, number)
        {
            return typeof args[number] != 'undefined' ? args[number] : match;
        });
    },
    //remove and get 1st, don't have to be array
    shift: function(arr)
    {
        var len = arr.length;
        var first = null;
        if (len > 0)
        {
            first = arr[0];
            for (var i = 1; i < len; i++)
            {
                arr[i - 1] = arr[i];
            }
            arr[len - 1] = null;
        }
        return first;
    },
    th: function(name, style)
    {
        if (this.isDefined(style))
        {
            return '<th scope="col" style="' + style + '" >' + name + '</th>';
        }
        else
        {
            return '<th scope="col">' + name + '</th>';
        }
    },
    td: function(val)
    {
        return '<td>' + val + '</td>';
    },
    isDefined: function(obj)
    {
        return typeof obj !== 'undefined' && obj !== null;
    },
    charCode: function(evt)
    {
        return evt.which ? evt.which : event.keyCode;
    },
    //forbiddenKeys like ['v']
    disableCtrlKeyCombination: function(e, forbiddenKeys)
    {
        var key;
        var isCtrl;
        if (window.event)
        {
            key = window.event.keyCode; //IE
            isCtrl = window.event.ctrlKey;
        }
        else
        {
            key = e.which; //modern browsers
            isCtrl = e.ctrlKey;
        }

        if (isCtrl)
        {
            for (var i = 0; i < forbiddenKeys.length; i++)
            {
                if (forbiddenKeys[i] == String.fromCharCode(key).toLowerCase())
                {
                    return false;
                }
            }
        }
        return true;
    },
    changeBrowserUrl: function(newUrl)
    {
        if (window.history && window.history.replaceState)
        {
            window.history.replaceState(null, null, newUrl);
        }
    },
    ajax: {
        createXHR: function()
        {
            var xhr;
            if (window.ActiveXObject)
            {
                try
                {
                    xhr = new ActiveXObject("Microsoft.XMLHTTP");
                }
                catch (e)
                {
                    xhr = null;
                }
            }
            else
            {
                xhr = new XMLHttpRequest();
            }

            return xhr;
        },
        get: function(url, success, always, error)
        {
            var xhr = this.createXHR();
            xhr.onreadystatechange = function()
            {
                if (xhr.readyState === 4)
                {
                    var status = xhr.status; // like 200
                    var statusText = xhr.statusText; //like OK

                    var response = eval('(' + xhr.responseText + ')');
                    if (status == '200')
                    {
                        if (util.isDefined(success))
                        {
                            success(response);
                        }
                    }
                    else
                    {
                        if (util.isDefined(error))
                        {
                            error(status, statusText, response);
                        }
                        else
                        {
                            util.ajax.defaultErrorHander(status, statusText, response)
                        }
                    }

                    if (util.isDefined(always))
                    {
                        always();
                    }
                }
            }

            xhr.open('GET', url, true);
            xhr.setRequestHeader('Accept', '*/*');
            xhr.send();
        },
        defaultErrorHander: function(status, statusText, response)
        {
            var mes = '';
            if (util.isDefined(response.code) && util.isDefined(response.message))
            {
                var c = response.code;
                if (c == 'InternalError' || c == 'TooManyRequestsError' || c == 'InvalidArgument')
                {
                    mes += ' ' + response.message;
                }
                else
                {
                    mes += 'Unexpected server error. Please try again later';
                }
            }

            if (!util.isBlank(mes))
            {
                $('#errormessage').text(mes);
            }
        }
    }
}