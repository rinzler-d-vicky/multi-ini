'use strict';

import fs = require('fs');

import Parser from "./parser";
import Serializer from "./serializer";
import Constants from "./constants";

const defaults = {
    encoding: 'utf8',
    line_breaks: 'unix' as "unix",
};

export type X = {
	encoding: string,
	line_breaks: 'unix'|'windows',
}

export default class MultiIni {
	options: X
	parser: Parser
	serializer: Serializer

    constructor(options = {}) {
        this.options = Object.assign({}, defaults, options);

        this.parser = new Parser(this.options);
        this.serializer = new Serializer(this.options);
    }

    read(filename: string) {
        if (!filename) {
            throw new Error('Missing filename.');
        }

        const lines = this.fetchLines(filename);

        return this.parser.parse(lines);
    }

    fetchLines(filename: string) {
        const content = fs.readFileSync(filename, this.options);
		
        return content.split(Constants.line_breaks[this.options.line_breaks as "unix"|"windows"]);
    }

    write(filename: string, content = {}) {
        fs.writeFileSync(filename, this.serializer.serialize(content), this.options);

        return ;
    }
}