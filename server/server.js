var restify = require('restify');
var calc = require('./calc.js');

var vars = {
    localhost: '127.0.0.1'
};
initServer();

function configureRoutes(server)
{
    // Routes
    server.get('/deposit/year/:year/month/:month/percent/:percent/premiumpercent/:premiumpercent/init/:init/monthadd/:monthadd', function respond(req, res, next)
    {
        //res.setHeader('Access-Control-Allow-Origin', '*');

        var p = req.params;

        if (p.month > 12)
        {
            res.send(new Error('Month must be from 0 to 12, sent ' + p.month));
        }

        var result = calc.calculateDeposit(p.year, p.month, p.percent, p.premiumpercent, p.init, p.monthadd);

        res.send(result);
        return next();
    });
}

function initVars()
{
    //c9.io || cloudfoundry.com || localhost
    vars.port = process.env.PORT || process.env.VCAP_APP_PORT || 3000;
    vars.ip = process.env.IP || process.env.VCAP_APP_HOST || vars.localhost;

    if (vars.ip === vars.localhost)
    {
        vars.siteDir = process.cwd() + '/../public';
    }
    else// c9
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
                name: 'moneyflock'
            });

    // serve static content
    server.get(/\/site\/?.*/, restify.serveStatic(
            {
                directory: vars.siteDir
            }));

    // configure handlers
    server.use(restify.queryParser(
            {
                mapParams: false // put only in req.query and not in req.param
            }));

    server.use(restify.throttle({
        burst: 6,
        rate: 5,
        ip: true
    }));

    configureRoutes(server);

    process.on('exit', function() {
        console.log('Application closed.');
    });

    setInterval(function() {
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
    var result = 'Memory: '
    var mem = process.memoryUsage();
    for (var prop in mem)
    {
        var val = parseInt(mem[prop]);
        result += prop + ' ' + parseFloat(val / 1024 / 1024).toFixed(2) + 'Mb; ';
    }
    console.log(result);
}
