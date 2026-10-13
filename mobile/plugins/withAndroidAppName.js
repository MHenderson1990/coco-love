let { withStringsXml, AndroidConfig } = require('@expo/config-plugins');

module.exports = function withAndroidAppName(config, { name }) {
  return withStringsXml(config, (c) => {
    c.modResults = AndroidConfig.Strings.setStringItem(
      [{ $: { name: 'app_name', translatable: 'false' }, _: name }],
      c.modResults
    );
    return c;
  });
};