'use strict';

const REGEXP_SECTION = /^\s*\[(.*?)\]\s*$/;
const REGEXP_COMMENT = /^;.*/;
const REGEXP_SINGLE_LINE = /^\s*(.*?)\s*?=\s*?(\S.*?)$/;
const REGEXP_MULTI_LINE = /^\s*(.*?)\s*?=\s*?"(.*?)$/;
const REGEXP_NOT_ESCAPED_MULTI_LINE_END = /^(.*?)\\"$/;
const REGEXP_MULTI_LINE_END = /^(.*?)"$/;
const REGEXP_ARRAY = /^(.*?)\[\]$/;

const STATUS_OK = 0;
const STATUS_INVALID = 1;

const defaults = {
    ignore_invalid: true,
    keep_quotes: false,
    oninvalid: (line: string) => true,
    filters: [],
    constants: {},
};

export type X = {
	ignore_invalid: boolean,
	keep_quotes: boolean,
	oninvalid: (line: string) => boolean,
	filters: any[],
	constants: object,
}

export default class Parser {
	options: X
	handlers: any[]

	constructor(options = {}) {
        this.options = Object.assign({}, defaults, options);

        this.handlers = [
            this.handleMultiLineStart,
            this.handleMultiLineEnd,
            this.handleMultiLineAppend,
            this.handleComment,
            this.handleSection,
            this.handleSingleLine,
        ];
    }

    parse(lines: string[]) {
        const ctx = {
            ini: {},
            current: {},
            multiLineKeys: false,
            multiLineValue: '',
        }

        for (let line of lines) {
            for (let handler of this.handlers) {
                const stop = handler.call(this, ctx, line);

                if (stop) {
                    break;
                }
            }
        }

        return ctx.ini;
    }

    isSection(line: string) {
        return line.match(REGEXP_SECTION);
    }

    getSection(line: string) {
        return (<string[]>line.match(REGEXP_SECTION))[1]
    }

    isComment(line: string) {
        return line.match(REGEXP_COMMENT);
    }

    isSingleLine(line: string) {
        const result = line.match(REGEXP_SINGLE_LINE);

        if (!result) {
            return false;
        }

        const check = result[2].match(/"/g);

        return !check || (check.length % 2 === 0);
    }

    isMultiLine(line: string) {
        const result = line.match(REGEXP_MULTI_LINE);

        if (!result) {
            return false;
        }

        const check = result[2].match(/"/g);

        return !check || (check.length % 2 === 0);
    }

    isMultiLineEnd(line: string) {
        return line.match(REGEXP_MULTI_LINE_END) && !line.match(REGEXP_NOT_ESCAPED_MULTI_LINE_END);
    }

    isArray(line: string) {
        return line.match(REGEXP_ARRAY);
    }

    assignValue(element: any, keys: string|string[], value: any) {
        value = this.applyFilter(value);

        let current = element;
        let previous = element;
        let array = false;
        let key

        for (key of keys) {
            if (this.isArray(key)) {
                key = this.getArrayKey(key);
                array = true;
            }

            if (current[key] == null) {
                current[key] = array ? [] : {};
            }

            previous = current;
            current = current[key];
        }

        if (array) {
            current.push(value);
        }
        else {
            previous[key as string] = value;
        }

        return element;
    }

    applyFilter(value: any) {
        for (let filter of this.options.filters) {
			// @ts-ignore
            value = filter(value, this.options);
        }

        return value;
    }

    getKeyValue(line: string) {
        const result = line.match(REGEXP_SINGLE_LINE);

        if (!result) {
            throw new Error();
        }

        let [, key, value] = result;

        if (!this.options.keep_quotes) {
            value = value.replace(/^\s*?"(.*?)"\s*?$/, "$1");
        }

        return {key, value, status: STATUS_OK};
    }

    getMultiKeyValue(line: string) {
        const result = line.match(REGEXP_MULTI_LINE);

        if (!result) {
            throw new Error();
        }

        let [, key, value] = result;

        if (this.options.keep_quotes) {
            value = '"' + value;
        }

        return {key, value};
    }

    getMultiLineEndValue(line: string) {
        const result = line.match(REGEXP_MULTI_LINE_END);

        if (!result) {
            throw new Error();
        }

        let [, value] = result;

        if (this.options.keep_quotes) {
            value = value + '"';
        }

        return {value, status: STATUS_OK};
    }

    getArrayKey(line: string) {
        const result = line.match(REGEXP_ARRAY);

		return (<RegExpMatchArray>result)[1];
    }

    handleMultiLineStart(ctx: any, line: string) {
        if (!this.isMultiLine(line.trim())) {
            return false;
        }

        const {key, value} = this.getMultiKeyValue(line);
        const keys = key.split('.');

        ctx.multiLineKeys = keys;
        ctx.multiLineValue = value;

        return true;
    }

    handleMultiLineEnd(ctx: any, line: string) {
        if (!ctx.multiLineKeys || !this.isMultiLineEnd(line.trim())) {
            return false;
        }

        const {value, status} = this.getMultiLineEndValue(line);

        // abort on false of onerror callback if we meet an invalid line
        if (status === STATUS_INVALID && !this.options.oninvalid(line)) {
            return ;
        }

        // ignore whole multiline on invalid
        if (status === STATUS_INVALID && this.options.ignore_invalid) {
            ctx.multiLineKeys = false;
            ctx.multiLineValue = "";

            return true;
        }

        ctx.multiLineValue += '\n' + value;

        this.assignValue(ctx.current, ctx.multiLineKeys, ctx.multiLineValue);

        ctx.multiLineKeys = false;
        ctx.multiLineValue = "";

        return true;
    }

    handleMultiLineAppend(ctx: any, line: string) {
        if (!ctx.multiLineKeys || this.isMultiLineEnd(line.trim())) {
            return false;
        }

        ctx.multiLineValue += '\n' + line;

        return true;
    }

    handleComment(ctx: any, line: string) {
        return this.isComment(line.trim());
    }

    handleSection(ctx: any, line: string) {
        line = line.trim();

        if (!this.isSection(line)) {
            return false;
        }

        const section = this.getSection(line);

        if (typeof ctx.ini[section] === 'undefined') {
            ctx.ini[section] = {};
        }

        ctx.current = ctx.ini[section];

        return true;
    }

    handleSingleLine(ctx: any, line: string) {
        line = line.trim();

        if (!this.isSingleLine(line)) {
            return false;
        }

        const {key, value, status} = this.getKeyValue(line);

        // abort on false of onerror callback if we meet an invalid line
        if (status === STATUS_INVALID && !this.options.oninvalid(line)) {
            throw new Error('Abort');
        }

        // skip entry
        if (status === STATUS_INVALID && !this.options.ignore_invalid) {
            return true;
        }

        const keys = key.split('.');

        this.assignValue(ctx.current, keys, value)

        return true;
    }
}