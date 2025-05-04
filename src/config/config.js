// config.js
const config = {
    development: {
      baseURL: 'http://127.0.0.1:5000',
    },
    production: {
      baseURL: 'https://ace7esports.com:5500',
    },
  };
  
  const ENV = process.env.NODE_ENV || 'development';
  export default config[ENV];
  