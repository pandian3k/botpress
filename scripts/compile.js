var webpack = require('webpack');
var path = require('path');
var CopyWebpackPlugin = require('copy-webpack-plugin');
var EventEmmiter = require('eventemitter2')
var _ = require('lodash');
var fs = require('fs');

var vendorConfig = require('../config/vendor.webpack.config.js')

var modulesTemplate = _.template("export const modules = {<%= modules %>}");
var moduleTemplate = _.template("'<%= name %>': require('#/<%= name %>/views/index.jsx').default");
var landingPageTemplate = _.template("export const landing = require('<%= path %>').default");

var modulesMapPath = path.join(__dirname, '..', 'src/web/__modules.jsx')
var landingPagePath = path.join(__dirname, '..', 'src/web/__landing.jsx')

module.exports = function(options) {
  var emitter = new EventEmmiter({ wildcard: true });

  var vendorCompiler = webpack(vendorConfig);


  var projectRootDir = path.basename(options.projectLocation);
  var landingExclusion = new RegExp(projectRootDir + '/ui/');
  var sourceExclusion = new RegExp('botskin/src/web/');
  var babelExcludeExpressions = [landingExclusion, sourceExclusion];

  if(options && options.modules) {
    var modules = _.values(options.modules).map(function(mod) {
      return moduleTemplate(mod)
    });
    var inner = modules.join(',');
    var modulesFile = modulesTemplate({ modules: inner });
    fs.writeFileSync(modulesMapPath, modulesFile);

    // Adding the module to the babel exclusion filters
    _.keys(options.modules).map(function(name) {
      var regex = new RegExp(name + '/', 'i');
      babelExcludeExpressions.push(regex);
    })
  }

  if(options && options.landingPagePath) {
    var landingPageFile = landingPageTemplate({ path: options.landingPagePath })
    fs.writeFileSync(landingPagePath, landingPageFile)
  }

  vendorCompiler.run(function(err, stats) {
    if (err) return emitter.emit('error.vendor', err);
    emitter.emit('compiled.vendor');

    var appConfig = require('../config/app.webpack.config.js')
    appConfig.resolve.alias['#'] = path.join(options.projectLocation, 'node_modules')
    var babelLoader = _.find(appConfig.module.loaders, function(loader) {
      return /babel/.test(loader.loader);
    });
    babelLoader.exclude = function(path) {
      return !_.some(babelExcludeExpressions, function(reg) {
        return reg.test(path);
      });
    };

    var appCompiler = webpack(appConfig);

    var onAppCompiled = function(err, stats) {
      if (err) return emitter.emit('error.app', err);
      emitter.emit('compiled.app');
    };

    if(options && options.watch) {
      appCompiler.watch({}, onAppCompiled);
    } else {
      appCompiler.run(onAppCompiled);
    }

  });

  return emitter;
};
