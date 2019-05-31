module.exports = {
  /**
   * Application configuration section
   * http://pm2.keymetrics.io/docs/usage/application-declaration/
   */
  apps : [

    // First application
    {
      script    : './server.js',
      env: {
        COMMON_VARIABLE: 'true'
      },
      env_production : {
        NODE_ENV: 'production',
        name    : 'krypto-cloud-production'
      },
      env_prod_china : {
        NODE_ENV: 'production_chinacloud',
        name    : 'krypto-cloud-prod-china'
      },
      env_test : {
        NODE_ENV: 'test',
        name    : 'krypto-cloud-test'
      },
      env_test_china : {
        NODE_ENV: 'test_chinacloud',
        name    : 'krypto-cloud-test-china'
      },
      env_development : {
        NODE_ENV: 'development',
        name    : 'krypto-cloud-development'
      }
    },

    // Second application
    //{
    //  name      : 'WEB',
    //  script    : 'web.js'
    //}
  ],

  /**
   * Deployment section
   * http://pm2.keymetrics.io/docs/usage/deployment/
   */
  deploy : {
    production : {
      user : 'node',
      host : '212.83.163.1',
      ref  : 'origin/master',
      repo : 'git@github.com:repo.git',
      path : '/var/www/production',
      'post-deploy' : 'npm install && pm2 reload ecosystem.config.js --env production'
    },
    dev : {
      user : 'node',
      host : '212.83.163.1',
      ref  : 'origin/master',
      repo : 'git@github.com:repo.git',
      path : '/var/www/development',
      'post-deploy' : 'npm install && pm2 reload ecosystem.config.js --env dev',
      env  : {
        NODE_ENV: 'dev'
      }
    }
  }
};
