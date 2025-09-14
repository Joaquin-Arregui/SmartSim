// providerResource/index.js
const PropertiesProviderResource =
  require('./PropertiesProviderResource').default
  || require('./PropertiesProviderResource');

module.exports = {
  __init__: ['propertiesProviderResource'],
  propertiesProviderResource: ['type', PropertiesProviderResource]
};
