process.env.HOST = process.env.HOST || '127.0.0.1';
process.env.PORT = process.env.PORT || '3210';
process.env.NODE_ENV = process.env.NODE_ENV || 'production';

require('./server.js');