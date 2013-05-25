$(document).ready(function()
{
    util.init();

    setValuesFromQuery();
    initComponents();
});

function setValuesFromQuery()
{
    if (util.queryParams['a'] == 'deposit')
    {
        util.setValueFromParam('years');
        util.setValueFromParam('months');
        util.setValueFromParam('percent');
        util.setValueFromParam('premiumPercent');
        util.setValueFromParam('init');
        util.setValueFromParam('monthadd');
    }
}

function initComponents()
{
    $(document).keypress(function(e)
    {
        if (e.which == 13 || e.which == 32)
        {
            calculateDeposit();
        }
    });

    $('#calculateButton').click(function()
    {
        calculateDeposit();
    });

    $('.intnumvalidate').keypress(isIntNumberKey);
    $('.floatnumvalidate').keypress(isFloatNumberKey);

    $('.spacifyme').change(function()
    {
        this.value = spacify(this.value);
    });
    $('.spacifyme').change();

    //run action from query
    if (util.queryParams['a'] == 'deposit')
    {
        calculateDeposit();
    }
}

function calculateDeposit()
{
    //check if calculation is in progress
    var disabled = $('#calculateButton').attr('disabled');
    if (disabled)
    {
        return;
    }

    $('#calculateButton').prop('disabled', true);
    $('.loaderimgpanel').removeClass('hiddenstyle');
    $('.monthincomepanel').addClass('hiddenstyle');

    $('#resulttbody').empty();
    $('.monthincomecontainer').empty();

    var urlTemplate = '/deposit/year/{0}/month/{1}/percent/{2}/premiumpercent/{3}/init/{4}/monthadd/{5}';

    var init = rmspce($('#init').val());
    var monthadd = rmspce($('#monthadd').val());
    $.get(util.format(urlTemplate, $('#years').val(), $('#months').val(), $('#percent').val(), $('#premiumPercent').val(), init, monthadd), function success(data)
    {
        createResultTables(data);
        $('.monthincomepanel').removeClass('hiddenstyle');
    }).always(function()
    {
        $('#calculateButton').prop('disabled', false);
        $('.loaderimgpanel').addClass('hiddenstyle');
    });
}

function createResultTables(data)
{
    // #1
    var result = data.result;
    var t = '<tr>' + util.td(result.endSum) + util.td(result.percents) + util.td(result.premiumPercent) + util.td(result.manualAdded) + '</tr>';
    $('#resulttbody').html(t);

    // #2
    var income = data.result.monthIncome;
    var mi = '';

    mi += '<table class="zebra">'
    mi += '<thead><tr>' + incomeHeaders(income) + '</tr></thead>';
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

        if (j == 12)
        {
            j = 0;
            year++;
            mi += '</tr>';
        }

    }

    mi += '</tbody>'
    mi += '</table>'

    $('.monthincomecontainer').html(mi);
}


/* create income table headers, can be less 12 month*/
function incomeHeaders(income)
{
    var headers = util.th('Year');

    var propIdx = 1;
    for (var prop in income)
    {
        headers += util.th('M' + propIdx);
        propIdx++;

        if (propIdx > 12)
        {
            break;
        }
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
    var charCode = (evt.which) ? evt.which : event.keyCode;
    var num = charCode == 46 ? 1 : 0;
    if (evt.target.value.split('.').length + num > 2) //already has dot
    {
        stopEvent(true, evt);

        var val = evt.target.value;
        evt.target.value = val.substr(0, val.length);
        return;
    }


    var isNumber = (charCode >= 48 && charCode <= 57) || charCode == 46;

    stopEvent(!isNumber, evt);
}

function isIntNumberKey(evt)
{
    var charCode = (evt.which) ? evt.which : event.keyCode;
    var isNumber = (charCode >= 48 && charCode <= 57);

    stopEvent(!isNumber, evt);
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

    init: function()
    {
        this.queryParams = this.getUrlParams();
    },

    trim: function(text)
    {
        return text === null ? '' : (text + ').replace(rtrim, ');
    },

    isBlank: function(str)
    {

        return str === null || str === '' || this.trim(str) === '';
    },

    setValueFromParam: function(id)
    {
        var input = $('#' + id);
        if (input !== null)
        {
            var param = this.queryParams[id];
            if (!this.isBlank(param))
            {
                input.val(param);
            }
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

    //remove and get 1st, not array required
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

    th: function(name)
    {
        return '<th scope="col">' + name + '</th>';
    },

    td: function(val)
    {
        return '<td>' + val + '</td>';
    }
}