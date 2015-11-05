var assert = require('assert');
var classmirror = require('../classmirror');

describe('classmirror', function() {
  beforeEach(function () {
    var ClassA = (function() {
      function ClassA() {
      }
      ClassA.prototype.foo = function(x, y, z) {
        return ('ClassA#foo' + x + y + z);
      };

      ClassA.prototype.bar = function() {
        return 'ClassA#bar';
      };

      return ClassA;

    })();

    // defines a method within constructor
    var ClassB = (function() {
      function ClassB() {
        this.foo = function() {
          return 'ClassB#foo';
        };
      }

      ClassB.prototype.bar = function() {
        return 'ClassB#bar';
      };

      return ClassB;

    })();

    // references another method within method
    var ClassC = (function() {
      function ClassC() {
      }

      ClassC.prototype.bar = function() {
        return 'ClassC#bar';
      };

      ClassC.prototype.barRef = function() {
        return this.bar();
      };

      return ClassC;
    })();

    // constructor has side effects
    var ClassD = (function() {
      function ClassD() {
        this.index = ClassD.count++;
      }
      ClassD.count = 0;
      ClassD.getSpawnCount = function () {
        return ClassD.count;
      }
      return ClassD;
    })();

    // needs constructor arguments
    var ClassE = (function() {
      function ClassE(arg1) {
        if (arg1 == null) {
          throw new Error('Needs an `arg1`!');
        }
      }

      ClassE.prototype.bar = function() {
        return 'ClassE#bar';
      };

      return ClassE;

    })();

    // class methods
    var ClassF = (function() {
      function ClassF() {}

      ClassF.classMethod1 = function () {
        return 1;
      };

      return ClassF;

    })();

    this.classes = {
      A: ClassA,
      B: ClassB,
      C: ClassC,
      D: ClassD,
      E: ClassE,
      F: ClassF
    };
  });


  it('should mirror methods', function () {
    var MirroredClassA = classmirror(this.classes.A);

    var inst_a = new this.classes.A();
    assert.equal(
      inst_a.foo('x', 'y', 'z'),
      MirroredClassA.foo(inst_a, 'x', 'y', 'z')
    );
    assert.equal(
      inst_a.bar(),
      MirroredClassA.bar(inst_a)
    );
  });


  it('should mirror methods referencing other methods', function () {
    var MirroredClassC = classmirror(this.classes.C);

    var inst_c = new this.classes.C();
    assert.equal(
      inst_c.barRef(),
      MirroredClassC.barRef(inst_c)
    );
  });


  it('should respect class side-effects', function () {
    var MirroredClassD = classmirror(this.classes.D);

    var inst_d1 = new this.classes.D();
    var inst_d2 = new this.classes.D();

    assert.equal(
      this.classes.D.getSpawnCount(),
      2
    );
    assert.equal(
      this.classes.D.getSpawnCount(),
      MirroredClassD.getSpawnCount()
    );

    var mirror_d1 = new MirroredClassD();
    var mirror_d2 = new MirroredClassD();

    assert.equal(
      this.classes.D.getSpawnCount(),
      4
    );
    assert.equal(
      this.classes.D.getSpawnCount(),
      MirroredClassD.getSpawnCount()
    );

    new this.classes.D();

    assert.equal(
      this.classes.D.getSpawnCount(),
      5
    );
    assert.equal(
      this.classes.D.getSpawnCount(),
      MirroredClassD.getSpawnCount()
    );
  });


  it('should mirror class methods', function () {
    var MirroredClassF = classmirror(this.classes.F);

    assert.equal(
      this.classes.F.classMethod1(),
      MirroredClassF.classMethod1()
    )
  });


  it('should error on class/instance method name collisions', function () {
    var CollisionClass1 = (function () {
      var CollisionClass1 = function () {};
      CollisionClass1.prototype.foo = function () {};
      CollisionClass1.foo = function () {};

      return CollisionClass1;
    })();

    // should not throw here; shouldn't mirror non-method field
    var CollisionClass2 = (function () {
      var CollisionClass2 = function () {};
      CollisionClass2.prototype.foo = 3;
      CollisionClass2.foo = function () {};

      return CollisionClass2;
    })();

    var CollisionClass3 = (function () {
      var CollisionClass3 = function () {};
      CollisionClass3.prototype.foo = function () {};
      CollisionClass3.foo = 3;

      return CollisionClass3;
    })();

    var attemptMirror = function (classDefinition) {
      return function () {
        classmirror(classDefinition);
      };
    };

    assert.throws(attemptMirror(CollisionClass1));
    assert.doesNotThrow(attemptMirror(CollisionClass2));
    assert.throws(attemptMirror(CollisionClass3));
  });


  it('should retain `constructor.name`', function () {
    var MirroredClassA = classmirror(this.classes.A);
    assert.equal(
      (new MirroredClassA()).constructor.name,
      (new this.classes.A()).constructor.name
    )
  });


  it('works on constructors with required arguments', function () {
    var MirroredClassE = classmirror(this.classes.E);

    var inst_e = new this.classes.E(true);

    assert.equal(
      inst_e.bar(),
      MirroredClassE.bar(inst_e)
    );
  });

  /*
  These specs require information about the class that is only available after
    invoking the constructor. I don't see any good way of supporting this:
    all of this should be done without invoking any code within the class.
  */

  xit('should mirror methods defined in constructor', function () {
    var MirroredClassB = classmirror(this.classes.B);

    var inst_b = new this.classes.B();
    assert.equal(
      inst_b.foo(),
      MirroredClassB.foo(inst_b)
    );
    assert.equal(
      inst_b.bar(),
      MirroredClassB.bar(inst_b)
    );
  });
});