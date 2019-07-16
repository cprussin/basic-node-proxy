import http from 'http';
import https from 'https';
import url from 'url';
import { StringDecoder } from 'string_decoder';
import 'request-to-curl';

const PORT = 2000;

const proxyRequest = (req, res, cb) => {
    const module = req.url.startsWith('http://') ? http : https;
    const outboundReq = module.request(req.url, {
        headers: req.headers,
        method: req.method
    }, proxyRes => {
        res.writeHead(proxyRes.statusCode, proxyRes.headers);
        proxyRes.pipe(res);
        cb(proxyRes, outboundReq.toCurl());
    });
    req.pipe(outboundReq);
}

const trackProxyRequest = (req, res, cb) => {
    const requestBodyBuf = new StringDecoder('utf8');
    let requestBody = '';
    req.on('data', chunk => { requestBody += requestBodyBuf.write(chunk); });
    req.on('end', () => { requestBody += requestBodyBuf.end(); });
    proxyRequest(req, res, (proxyRes, proxyReqCurl) => {
        const responseBodyBuf = new StringDecoder('utf8');
        let responseBody = '';
        proxyRes.on('data', chunk => { responseBody += responseBodyBuf.write(chunk); });
        proxyRes.on('end', () => cb({
            curl: proxyReqCurl,
            request: {
                url: req.url,
                headers: req.headers,
                method: req.method,
                body: requestBody
            },
            response: {
                statusCode: proxyRes.statusCode,
                headers: proxyRes.headers,
                body: responseBody + responseBodyBuf.end()
            }
        }));
    });
};

const proxyListener = (req, res) =>
    trackProxyRequest(req, res, entry => {
        console.log('========')
        console.log(`Method: ${entry.request.method}`);
        console.log(`URL: ${entry.request.url}`);
        console.log(`Request Headers: ${JSON.stringify(entry.request.headers)}`);
        console.log(`Request Body: ${entry.request.body}`);
        console.log();
        console.log(`Response Status: ${entry.response.statusCode}`);
        console.log(`Response Headers: ${JSON.stringify(entry.response.headers)}`);
        //console.log(`Response Body: ${entry.response.body}`);
        console.log();
        console.log(`Curl: ${entry.curl}`);
        console.log('========')
        console.log();
        console.log();
    });

const onServerUp = () =>
    console.log(`Server now up on port ${PORT}`);

const main = () =>
    http.createServer(proxyListener).listen(PORT, onServerUp);

main();
