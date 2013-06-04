exports.calculateDeposit = calculateDeposit;

function calculateDeposit(years, months, percent, premiumpercent, init, everyMonthAdd)
{
    var response = {
        params: {
            "years": years,
            "months": months,
            "percent": percent,
            "premiumpercent": premiumpercent,
            "init": init,
            "everyMonthAdd": everyMonthAdd
        },
        result: {
            monthIncome: {},
            endSum: 0.0,
            percents: 0.0,
            premiumpercent: 0.0,
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

    var finite = true;
    outer: for (var y = 0; y < yearsLoop; y++)
    {
        for (var m = 0; m < monthLoop; m++)
        {
            if (!finite)
            {
                break outer;
            }

            var percentsForMonth = sum * percent / 100 / 12;
            var premiumIncomMoth = sum * premiumpercent / 100 / 12;
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

        finite = isFinite(sum) && isFinite(percentsTotal) && isFinite(premiumIncome) && isFinite(manualAdded);
    }

    if (finite)
    {
        sum += premiumIncome;

        result.endSum = fmtMoney(sum);
        result.percents = fmtMoney(percentsTotal);
        result.premiumpercent = fmtMoney(premiumIncome);
        result.manualAdded = fmtMoney(manualAdded);
    }
    else
    {
        response = {
            code: 'InfiniteResult',
            message: 'Please use smaller arguments, result is too big.'
        }
    }

    return response;
}

function fmtMoney(money)
{
    money = parseFloat(money);
    if (money < 10000 && money !== 0)
    {
        money = money.toFixed(2);
    }
    else
    {
        money = money.toFixed(0);
    }
    return money.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
}
