var restify = require('restify');

var calc = require('./calc.js');

var vars = {
    localhost: '127.0.0.1',
    numRegex: new RegExp('^[0-9]*\\.?[0-9]+$')
};

initServer();

function configureRoutes(server)
{
    // Routes
    server.get('/deposit/years/:years/months/:months/percent/:percent/premiumpercent/:premiumpercent/init/:init/monthadd/:monthadd/capfrequency/:capfrequency', function respond(req, res, next)
    {
        var p = req.params;
        validateDepositParams(p, next);

        var result = calc.calculateDeposit(p.years, p.months, p.percent, p.premiumpercent, p.init, p.monthadd, p.capfrequency);
        validateDepositResult(result, next);

        res.send(result);
        return next();
    });
}

function validateDepositResult(result, next)
{
    if (typeof result.code != 'undefined' && typeof result.message != 'undefined')
    {
        return next(new restify.InvalidArgumentError(result.message));
    }
}

function validateDepositParams(p, next)
{
    var mes = null;

    //1. validate number format for ALL fields
    for (var prop in p)
    {
        var str = '' + p[prop];
        if (!vars.numRegex.test(str))
        {
            mes = 'Please use valid number for ' + prop + '.';
            return next(new restify.InvalidArgumentError(mes));
        }
    }

    //2. intial check
    if (p.init <= 0)
    {
        mes = 'Initial should be > 0.';
        return next(new restify.InvalidArgumentError(mes)); 
    }

    //3. percent check
    if (p.percent <= 0)
    {
        mes = 'Percent should be > 0.';
        return next(new restify.InvalidArgumentError(mes)); 
    }

    //4. validate capitalization rate value
    var cf = p.capfrequency;
    if (cf != '0.5' && cf != '1' && cf != '3' && cf != '4' && cf != '6' && cf != '12' && cf != '0')
    {
        mes = 'Please use valid value for capitalization frequency. Allowed 0.5, 1, 3, 4, 6, 12, 0';
        return next(new restify.InvalidArgumentError(mes));
    }

    //5. validate month with capitalization frequency
    var months = p.months;
    if (months != 0 && cf != '0.5' && cf != '1')
    {
        if (cf == '0')
        {
            mes = 'Please don\'t use months when capitalization is deposit end.';
        }
        else if ((months % cf) != 0)
        {
            mes = 'Months must be a multiple of capitalization perioud. Entered month=' + months + ' perioud=' + cf + '.';
        }

        if (mes != null)
        {
            return next(new restify.InvalidArgumentError(mes));
        }
    }

    if (p.months > 12)
    {
        mes = 'Month must be from 0 to 12, sent ' + p.months + '.';
    }
    else if (p.months == 0 && p.years == 0)
    {
        mes = 'Either years or months must not be null.';
    }
    else if (p.years > 200)
    {
        mes = 'Years must be < 200';
    }
    else if (p.percent > 1000)
    {
        mes = 'Percent must be < 1000';
    }
    else if (p.premiumpercent > 1000)
    {
        mes = 'Premium percent must be < 1000';
    }
    else if (p.init > 999999999999)
    {
        mes = 'Initial must be < 999 999 999 999';
    }
    else if (p.monthadd > 999999999999)
    {
        mes = 'Month add must be < 999 999 999 999';
    }

    if (mes !== null)
    {
        return next(new restify.InvalidArgumentError(mes));
    }
}

function initVars()
{
    //openshift.com || c9.io || cloudfoundry.com, appfog.com || localhost
    vars.port = process.env.OPENSHIFT_NODEJS_PORT || process.env.PORT || process.env.VCAP_APP_PORT || 3000;
    vars.ip = process.env.OPENSHIFT_NODEJS_IP || process.env.IP || process.env.VCAP_APP_HOST || vars.localhost;

    if (vars.ip === vars.localhost)
    {
        vars.siteDir = process.cwd() + '/../public';
    }
    else // c9
    {
        vars.siteDir = process.cwd() + '/public';
    }
}

function initServer()
{
    initVars();

    // create server
    var server = restify.createServer(
    {
        name: 'moneyflock',
        formatters: {
            'application/json': function formatJSON(req, res, body)
            {
                if (body instanceof Error)
                {
                    // snoop for RestError or HttpError, but don't rely on
                    // instanceof
                    res.statusCode = body.statusCode || 500;

                    if (body.body)
                    {
                        body = body.body;

                        if (body.code === 'TooManyRequestsError')
                        {
                            body.message = 'Please hit server at slower rate.';
                        }
                    }
                    else
                    {
                        body = {
                            message: body.message
                        };
                    }
                }
                else if (Buffer.isBuffer(body))
                {
                    body = body.toString('base64');
                }

                var data = JSON.stringify(body);
                res.setHeader('Content-Length', Buffer.byteLength(data));

                return (data);
            }
        }
    });

    //order matters!
    configureRoutes(server);

    // serve static content
    server.get(/\/\/?.*/, restify.serveStatic(
    {
        directory: vars.siteDir,
        default: 'deposit.html'
    }));

    // configure handlers
    server.use(restify.queryParser(
    {
        mapParams: false // put only in req.query and not in req.param
    }));

    server.use(restify.throttle(
    {
        burst: 6,
        rate: 5,
        ip: true
    }));

    server.on('uncaughtException', function(req, res, route, e)
    {
        //1.  not errors, restify 'feature'
        if (res._headerSent)
        {
            return (false);
        }

        //2. errors
        if (e)
        {
            console.log('Unhandled error: ' + e);
        }

        res.send(new restify.InternalError('Unexpected error on server. Please try again later.'));
        return (true);
    });

    process.on('exit', function()
    {
        console.log('Application closed.');
    });

    setInterval(function()
    {
        printMemoryUsage();
    }, 60000);

    server.listen(vars.port, vars.ip, function()
    {
        console.log('%s listening at %s', server.name, server.url);
        console.log('running dir %s', process.cwd());
        console.log('Node runtime %s, platform %s %s', process.version, process.platform, process.arch);
        printMemoryUsage();
    });
}

function printMemoryUsage()
{
    var result = 'Memory: ';
    var mem = process.memoryUsage();
    for (var prop in mem)
    {
        var val = parseInt(mem[prop], 10);
        result += prop + ' ' + parseFloat(val / 1024 / 1024).toFixed(2) + 'Mb; ';
    }
    console.log(result);
}
