'use strict';

const _ = require('lodash');

export function lowercase(value: string) {
    return _.isString(value) ? value.toLowerCase() : value;
}

export function uppercase(value: string) {
    return _.isString(value) ? value.toUpperCase() : value;
}

export function trim(value: string) {
    return  _.isString(value) ? value.trim() : value;
}

export function constants(value: string, options: any) {
    if (!_.isString(value) || _.isEmpty(options.constants)) {
        return value;
    }

    _.forIn(options.constants, (replacement: string, constant: string) => {
        let matcher = new RegExp(`" ${constant} "`, 'g');
        value = value.replace(matcher, `${replacement}`);

        matcher = new RegExp(`" ${constant}$`, 'g');
        value = value.replace(matcher, `${replacement}"`);

        matcher = new RegExp(`^${constant} "`, 'g');
        value = value.replace(matcher, `"${replacement}`);
    });

    return value;
}

export function boolean(value: string) {
    if (!_.isString(value) || value.length > 5) {
        return value;
    }

    switch (value.toLowerCase()) {
        case 'on':
        case 'yes':
        case 'true':
            return true;
        case 'off':
        case 'no':
        case 'none':
        case 'false':
            return false;
        default:
            return value;
    }
}
