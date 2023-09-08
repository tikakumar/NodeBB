"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
const validator_1 = __importDefault(require("validator"));
const nconf_1 = __importDefault(require("nconf"));
const database_1 = __importDefault(require("../database"));
const plugins_1 = __importDefault(require("../plugins"));
const utils_1 = __importDefault(require("../utils"));
const translator_1 = __importDefault(require("../translator"));
const intFields = [
    'createtime', 'memberCount', 'hidden', 'system', 'private',
    'userTitleEnabled', 'disableJoinRequests', 'disableLeave',
];
function escapeGroupData(group) {
    if (group) {
        group.nameEncoded = encodeURIComponent(group.name);
        group.displayName = validator_1.default.escape(String(group.name));
        group.description = validator_1.default.escape(String(group.description || ''));
        group.userTitle = validator_1.default.escape(String(group.userTitle || ''));
        group.userTitleEscaped = translator_1.default.escape(group.userTitle);
    }
}
function modifyGroup(group, fields) {
    if (group) {
        // The next line calls a function in a module that has not been updated to TS yet
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
        database_1.default.parseIntFields(group, intFields, fields);
        escapeGroupData(group);
        group.userTitleEnabled = ([null, undefined].includes(group.userTitleEnabled)) ? 1 : 0;
        group.labelColor = validator_1.default.escape(String(group.labelColor || '#000000'));
        group.textColor = validator_1.default.escape(String(group.textColor || '#ffffff'));
        group.icon = validator_1.default.escape(String(group.icon || ''));
        group.createtimeISO = utils_1.default.toISOString(group.createtime);
        group.private = ([null, undefined].includes(group.private)) ? 1 : group.private;
        group.memberPostCids = group.memberPostCids || '';
        group.memberPostCidsArray = group.memberPostCids.split(',').map(cid => parseInt(cid, 10)).filter(Boolean);
        group['cover:thumb:url'] = group['cover:thumb:url'] || group['cover:url'];
        if (group['cover:url']) {
            // The next line calls a function in a module that has not been updated to TS yet
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
            group['cover:url'] = group['cover:url'].startsWith('http') ? group['cover:url'] : (nconf_1.default.get('relative_path') + group['cover:url']);
        }
        else {
            // The next line calls a function in a module that has not been updated to TS yet
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
            Promise.resolve().then(() => __importStar(require('../coverPhoto'))).then((coverPhotoModule) => {
                group['cover:url'] = coverPhotoModule.getDefaultGroupCover(group.name);
                // group['cover:thumb:url'] = coverPhotoModule.getDefaultGroupCover(group.name) as string;
            }).catch((error) => {
                // Handle any errors that occur during dynamic import
                console.error('Error loading coverPhoto module:', error);
            });
            // import idea from ChatGPT
            // group['cover:url'] = require('../coverPhoto').getDefaultGroupCover(group.name) as string;
        }
        if (group['cover:thumb:url']) {
            // The next line calls a function in a module that has not been updated to TS yet
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
            group['cover:thumb:url'] = group['cover:thumb:url'].startsWith('http') ? group['cover:thumb:url'] : (nconf_1.default.get('relative_path') + group['cover:thumb:url']);
        }
        else {
            // The next line calls a function in a module that has not been updated to TS yet
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
            Promise.resolve().then(() => __importStar(require('../coverPhoto'))).then((coverPhotoModule) => {
                group['cover:thumb:url'] = coverPhotoModule.getDefaultGroupCover(group.name);
            }).catch((error) => {
                // Handle any errors that occur during dynamic import
                console.error('Error loading coverPhoto module:', error);
            });
            // import idea from ChatGPT
            // group['cover:thumb:url'] = require('../coverPhoto').getDefaultGroupCover(group.name) as string;
        }
        group['cover:position'] = validator_1.default.escape(String(group['cover:position'] || '50% 50%'));
    }
}
function groupStart(Groups) {
    Groups.getGroupsFields = function (groupNames, fields) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!Array.isArray(groupNames) || !groupNames.length) {
                return [];
            }
            const ephemeralIdx = groupNames.reduce((memo, cur, idx) => {
                if (Groups.ephemeralGroups.includes(cur)) {
                    memo.push(idx);
                }
                return memo;
            }, []);
            const keys = groupNames.map(groupName => `group:${groupName}`);
            // The next line calls a function in a module that has not been updated to TS yet
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
            const groupData = yield database_1.default.getObjects(keys, fields);
            if (ephemeralIdx.length) {
                ephemeralIdx.forEach((idx) => {
                    groupData[idx] = Groups.getEphemeralGroup(groupNames[idx]);
                });
            }
            groupData.forEach(group => modifyGroup(group, fields));
            const results = yield plugins_1.default.hooks.fire('filter:groups.get', { groups: groupData });
            // The next line calls a function in a module that has not been updated to TS yet
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
            return results.groups;
        });
    };
    Groups.getGroupsData = function (groupNames) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield Groups.getGroupsFields(groupNames, []);
        });
    };
    Groups.getGroupData = function (groupName) {
        return __awaiter(this, void 0, void 0, function* () {
            const groupsData = yield Groups.getGroupsData([groupName]);
            return Array.isArray(groupsData) && groupsData[0] ? groupsData[0] : null;
        });
    };
    Groups.getGroupField = function (groupName, field) {
        return __awaiter(this, void 0, void 0, function* () {
            const groupData = yield Groups.getGroupFields(groupName, [field]);
            return String(groupData ? groupData[field] : null);
        });
    };
    Groups.getGroupFields = function (groupName, fields) {
        return __awaiter(this, void 0, void 0, function* () {
            const groups = yield Groups.getGroupsFields([groupName], fields);
            return groups ? groups[0] : null;
        });
    };
    Groups.setGroupField = function (groupName, field, value) {
        return __awaiter(this, void 0, void 0, function* () {
            // The next line calls a function in a module that has not been updated to TS yet
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
            yield database_1.default.setObjectField(`group:${groupName}`, field, value);
            yield plugins_1.default.hooks.fire('action:group.set', { field: field, value: value, type: 'set' });
        });
    };
}
module.exports = groupStart;
