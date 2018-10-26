'use strict';

import MultiIni from "./multi-ini-class";
import Parser from "./parser";
import Serializer from "./serializer";
import * as filters from "./filters";

export {
    filters,
    MultiIni as Class,
    Parser,
    Serializer,
};

export function read(filename: string, options = {}) {
    const instance = new MultiIni(options);
    return instance.read(filename);
}

export function write(filename: string, content: string, options = {}) {
    const instance = new MultiIni(options);
    return instance.write(filename, content);
}
