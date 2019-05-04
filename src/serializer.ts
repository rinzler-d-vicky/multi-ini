'use strict';

const _ = require('lodash');
import Constants from "./constants";

const defaults = {
	line_breaks: 'unix' as "unix",
    keep_quotes: false,
};

export type X = {
	line_breaks: "unix"|"windows",
	keep_quotes: boolean
}

export default class Serializer {
	options: X

    constructor(options = {}) {
        this.options = Object.assign({}, defaults, options);
    }

    needToBeQuoted(value: string) {
        if (this.options.keep_quotes) {
            return false;
		}
		if(typeof value !== "string") value = (<any>value).toString()

        // wrapped with quotes
        if (value.match(/^"[\s\S]*?"$/g)) {
            return false;
        }

        // escaped quote at the end
        if (value.match(/^[\s\S]*?\\"$/g)) {
            return true;
        }

        // ends or starts with a quote
        if (value.match(/^[\s\S]*?"$/g) || value.match(/^"[\s\S]*?$/g)) {
            return false;
        }

        return true;
    }

    serialize(content: object) {
        return _.reduce(content, (output: string, sectionContent: object, section: string) => {
            output += `[${section}]` + Constants.line_breaks[this.options.line_breaks];
            output += this.serializeContent(sectionContent, '');
            return output;
        }, '');
    }

	serializeContent(content: string|object|any[], path: string) {
        return _.reduce(content, (serialized: string, subContent: typeof content, key: string) => {
            if (_.isArray(subContent)) {
                for (let value of <any[]>subContent) {
                    if (this.needToBeQuoted(value)) {
                        value = `"${value}"`;
                    }

                    serialized += path + (path.length > 0 ? '.' : '') + key + "[]=" + value + Constants.line_breaks[this.options.line_breaks];
                }
            }
            else if (_.isObject(subContent)) {
                serialized += this.serializeContent(subContent, path + (path.length > 0 ? '.' : '') + key);
            }
            else {
                if (this.needToBeQuoted(subContent.toString())) {
                    subContent = `"${subContent}"`;
                }

                serialized += path + (path.length > 0 ? '.' : '') + key + "=" + subContent + Constants.line_breaks[this.options.line_breaks];
            }

            return serialized;
        }, '');
    }
}