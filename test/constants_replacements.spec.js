'use strict';

let chai = require('chai');
let sinon = require('sinon');
let sinonChai = require('sinon-chai');
let expect = chai.expect;

chai.use(sinonChai);

describe("Constants replacement in ini files", function () {
    var MultiIni = require('../dist');

    it("Default replacement if constant found", function () {
        var ini = new MultiIni.Class({
          constants: {'CONSTANT': 'replacement'},
          filters: [MultiIni.filters.constants]
        });

        var data = ini.read('test/data/constant.ini');

        expect(data).not.to.be.null;

        expect(data['section']).not.to.be.undefined;

        expect(data['section']['key1']).to.equal('"Part1 replacement"');

        expect(data['section']['key2']).to.equal('"replacement Part2"');

        expect(data['section']['key3']).to.equal('Part1replacementPart2');
    });
});
