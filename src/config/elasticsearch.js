'use strict';

const { Client } = require('@elastic/elasticsearch');
const config = require('./index');

const clientOptions = {
  node: config.elasticsearch.node,
};

if (config.elasticsearch.username && config.elasticsearch.password) {
  clientOptions.auth = {
    username: config.elasticsearch.username,
    password: config.elasticsearch.password,
  };
}

const client = new Client(clientOptions);

module.exports = client;
