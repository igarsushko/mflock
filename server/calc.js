exports.calculateDeposit = calculateDeposit;

// does not work for cases e.g.:
// capfrequency 0, 12 and we have year with monthes, or just monthes
// or month == 2, capfrequency == 3
//explicit validation expected
function calculateDeposit(years, months, percent, premiumpercent, init, everyMonthAdd, capfrequency)
{
    var response = {
        params: {
            "years": years,
            "months": months,
            "percent": percent,
            "premiumpercent": premiumpercent,
            "init": init,
            "everyMonthAdd": everyMonthAdd,
            "capfrequency": capfrequency
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
    capfrequency = parseFloat(capfrequency);
    var percentsTotal = 0.0;
    var manualAdded = 0.0;
    var premiumIncome = 0.0;

    var yearsLoop = parseInt(years, 10);
    var periodLoop = 12;
    var yearAndMonth = false;
    // 1. if time < year
    if (years == 0 && months != 0)
    {
        yearsLoop = 1;
        periodLoop = parseInt(months, 10);
    }
    // 2. both year and month set
    else if (years !== '0' && months !== '0')
    {
        yearsLoop += 1;
        yearAndMonth = true;
    }

    // 12 / [0.5|1|3|4|6|12|0]
    //if deposit end (0) then calculate % as each year but add % only on the end
    var capfrequencyUpdated = capfrequency == 0 ? 12 : capfrequency;
    periodLoop = periodLoop / capfrequencyUpdated;
    var partsInYear = 12 / capfrequencyUpdated;

    var finite = true;
    var partPeriodPercents = 0;
    outer: for (var y = 0; y < yearsLoop; y++)
    {
        for (var p = 0; p < periodLoop; p++)
        {
            if (!finite)
            {
                break outer;
            }

            var percentsForPeriod = sum * percent / 100 / partsInYear;
            var premiumIncomForPeriod = sum * premiumpercent / 100 / partsInYear;
            //not for deposit end
            if (capfrequency != 0)
            {
                sum += percentsForPeriod;
            }
            percentsTotal += percentsForPeriod;
            premiumIncome += premiumIncomForPeriod;

            //squash half month income into 1 month, for showing on UI as 1 month
            if (capfrequency == 0.5)
            {
                //first half
                if (p % 2 == 0)
                {
                    partPeriodPercents += percentsForPeriod;
                }
                //seconf half
                else
                {
                    var id = 'y' + (y + 1) + 'p' + ((p + 1) / 2);
                    result.monthIncome[id] = fmtMoney(percentsForPeriod + partPeriodPercents);
                    partPeriodPercents = 0;

                    sum += everyMonthAdd;
                    manualAdded += everyMonthAdd;
                }
            }
            else
            {
                sum += everyMonthAdd * capfrequencyUpdated;
                manualAdded += everyMonthAdd * capfrequencyUpdated;

                //not for deposit end
                if (capfrequency != 0)
                {
                    var id = 'y' + (y + 1) + 'p' + ((p + 1) * capfrequency);
                    result.monthIncome[id] = fmtMoney(percentsForPeriod);
                }
            }
        }

        // year + month, calculate for remaining month, after last year iteration
        if (yearAndMonth && (y == yearsLoop - 2))
        {
            periodLoop = months / capfrequencyUpdated;
        }

        finite = isFinite(sum) && isFinite(percentsTotal) && isFinite(premiumIncome) && isFinite(manualAdded);
    }

    if (finite)
    {
        sum += premiumIncome;
        //if on end deposit, add percents at last
        if (capfrequency == 0)
        {
            sum += percentsTotal;
            result.monthIncome = null;
        }

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
