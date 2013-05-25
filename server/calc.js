exports.calculateDeposit = calculateDeposit;

function calculateDeposit(years, months, percent, premiumPercent, init, everyMonthAdd)
{
    var response = {
        params: {
            "years": years,
            "months": months,
            "percent": percent,
            "premiumPercent": premiumPercent,
            "init": init,
            "everyMonthAdd": everyMonthAdd
        },
        result: {
            monthIncome: {},
            endSum: 0.0,
            percents: 0.0,
            premiumPercent: 0.0,
            manualAdded: 0.0
        }
    };

   var result = response.result;

    var sum = parseFloat(init);
    everyMonthAdd = parseFloat(everyMonthAdd);
    var percentsTotal = 0.0;
    var manualAdded = 0.0;
    var premiumIncome = 0.0;

    var yearsLoop = parseInt(years, 10);
    var monthLoop = 12;
    var yearAndMonth = false;
    // 1. if time < year
    if (years === '0' && months !== '0')
    {
        yearsLoop = 1;
        monthLoop = parseInt(months, 10);
    }
    // 2. both year and month set
    else if (years !== '0' && months !== '0')
    {
        yearsLoop += 1;
        yearAndMonth = true;
    }


    for (var y = 0; y < yearsLoop; y++)
    {
        for (var m = 0; m < monthLoop; m++)
        {
            var percentsForMonth = sum * percent / 100 / 12;
            var premiumIncomMoth = sum * premiumPercent / 100 / 12;
            sum += (percentsForMonth + everyMonthAdd);
            percentsTotal += percentsForMonth;
            premiumIncome += premiumIncomMoth;
            manualAdded += everyMonthAdd;

            var id = 'y' + (y + 1) + 'm' + (m + 1);
            result.monthIncome[id] = fmtMoney(percentsForMonth);
        }

        if (yearAndMonth && (y == yearsLoop - 2))
        {
            monthLoop = months;
        }
    }

    sum += premiumIncome;

    result.endSum = fmtMoney(sum);
    result.percents = fmtMoney(percentsTotal);
    result.premiumPercent = fmtMoney(premiumIncome);
    result.manualAdded = fmtMoney(manualAdded);

    return response;
}

function fmtMoney(money)
{
    money = parseFloat(money).toFixed(2);
    return money.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
}
