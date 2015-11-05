_ = require('lodash');

module.exports = function (classDefinition) {
  var classClone = (function () {
    var clone = classDefinition.bind({});
    clone = _.assign(clone, classDefinition);
    clone['prototype'] = _.clone(classDefinition.prototype);
    return clone;
  })();
  var proto = classDefinition.prototype;

  return _.methods(proto).reduce(function (acc, key) {
    var method = proto[key];

    if (acc[key] != null) {
      throw new Exception('Method name collision: ' + key);
    } else {
      acc[key] = function () {
        if (arguments.length < 1) {
          throw new Error("Attempted to call a instance method with no `self` argument.");
        } else {
          var self = _.head(arguments);
          var args = _.tail(arguments);
          return method.apply(self, args);
        }
      };
      return acc;
    }
  }, classClone);
};