var restify = require('restify');
var calc = require('./calc.js');

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

function initServer()
{
    // create server
    var server = restify.createServer(
    {
        name: 'moneyflock'
    });

    // serve static content
    var siteDir = process.cwd() + '/public';
    server.get(/\/site\/?.*/, restify.serveStatic(
    {
        directory: siteDir
    }));

    // configure handlers
    server.use(restify.queryParser(
    {
        mapParams: false // put only in req.query and not in req.param
    }));

    configureRoutes(server);

    server.listen(process.env.PORT, process.env.IP, function()
    {
        console.log('%s listening at %s', server.name, server.url);
        console.log('running dir %s', process.cwd());
    });
}
