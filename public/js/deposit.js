var capFrequencyOptions = {};
var depositRestTemplate = '/deposit/years/{0}/months/{1}/percent/{2}/premiumpercent/{3}/init/{4}/monthadd/{5}/capfrequency/{6}';
var depositSiteTemplate = '/deposit.html?a=deposit&years={0}&months={1}&percent={2}&premiumpercent={3}&init={4}&monthadd={5}&capfrequency={6}';

$(document).ready(function()
{
    util.init();

    initComponents();
    setValuesFromQuery();

    $('.spacifyme').change();
    populateCFSelectOptions();
    runActionFromQuery();
});

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

    $('.intnumvalidate').keypress(util.allowOnlyIntNumberKey);
    $('.floatnumvalidate').keypress(util.allowOnlyFloatNumberKey);
    $('.fixify').keyup(util.fixify);
    $('.fixify').keypress(function(e)
    {
        if (util.charCode(e) == 13)
        {
            util.fixify(e);
        }
    });

    $('.spacifyme').change(function()
    {
        this.value = util.spacify(this.value);
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
    var prevSelectedValue = select.options[select.selectedIndex].value;

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
        select.add(capFrequencyOptions['0']); //deposit end
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

    var init = util.rmspace($('#init').val());
    var monthadd = util.rmspace($('#monthadd').val());
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
    var rest = util.format(depositRestTemplate, years, months, percent, premiumpercent, init, monthadd, capfreq);
    var perm = util.format(depositSiteTemplate, years, months, percent, premiumpercent, init, monthadd, capfreq);

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
    mi += '<thead><tr>' + incomeHeaders(colCount, data.params.capfrequency) + '</tr></thead>';
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
function incomeHeaders(colCount, capfrequency)
{
    var freq = capfrequency;
    if (freq == 0 || freq == 0.5) //zero not expected
    {
        freq = 1;
    }

    var headers = util.th('Year', 'min-width: 40px;');

    for (var i = 1; i <= colCount; i++)
    {
        var num = i * freq;
        headers += util.th('M' + num);
    }

    return headers;
}
