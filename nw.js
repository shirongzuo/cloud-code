var Service = require('node-windows').Service;

var svc = new Service ({
    name:'Krypto Cloud',
    description: 'The nodejs server for authenticating user data.',
    script:'.\\server.js'
});

svc.on('install', function(){
    svc.start();
})

svc.install();