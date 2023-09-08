import validator from 'validator';
import nconf from 'nconf';

import db from '../database';
import plugins from '../plugins';
import utils from '../utils';
import translator from '../translator';



const intFields: string[] = [
    'createtime', 'memberCount', 'hidden', 'system', 'private',
    'userTitleEnabled', 'disableJoinRequests', 'disableLeave',
];

type Groups_t = {
    ephemeralGroups: string[];
    getGroupsFields(gn: string[], f: string[]): Promise< string[] >;
    getEphemeralGroup(index: string): Group_t;
    getGroupsData(gn: string[]): Promise<string[]>;
    getGroupData(gn: string): Promise<string>;
    getGroupField(gn: string, f: string): Promise< string >;
    getGroupFields(gn: string, f: string[]): Promise< string >;
    setGroupField(gn: string, f: string, v: string): Promise<void>;
}
type Group_t = {
    userTitleEnabled : number;
    labelColor : string;
    textColor : string;
    icon : string;
    createtimeISO: string;
    createtime: string;
    private: number | boolean;
    memberPostCids: string;
    memberPostCidsArray: number[];
    name: string;
    nameEncoded: string;
    displayName: string;
    description: string;
    userDisplay: string;
    userTitle: string;
    userTitleEscaped: string;
    'cover:url': string;
    'cover:thumb:url': string;
}


function escapeGroupData(group : Group_t) {
    if (group) {
        group.nameEncoded = encodeURIComponent(group.name);
        group.displayName = validator.escape(String(group.name));
        group.description = validator.escape(String(group.description || ''));
        group.userTitle = validator.escape(String(group.userTitle || ''));
        group.userTitleEscaped = translator.escape(group.userTitle);
    }
}

function modifyGroup(group: Group_t, fields: string[]) {
    if (group) {
        group.userTitleEnabled = 0;
        // The next line calls a function in a module that has not been updated to TS yet
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
        db.parseIntFields(group, intFields, fields);

        escapeGroupData(group);
        group.userTitleEnabled = ([null, undefined].includes(group.userTitleEnabled)) ? 1 : 0;
        group.labelColor = validator.escape(String(group.labelColor || '#000000'));
        group.textColor = validator.escape(String(group.textColor || '#ffffff'));
        group.icon = validator.escape(String(group.icon || ''));
        group.createtimeISO = utils.toISOString(group.createtime) as string;
        group.private = ([null, undefined].includes(group.private)) ? 1 : group.private;
        group.memberPostCids = group.memberPostCids || '';
        group.memberPostCidsArray = group.memberPostCids.split(',').map(cid => parseInt(cid, 10)).filter(Boolean);

        group['cover:thumb:url'] = group['cover:thumb:url'] || group['cover:url'];

        if (group['cover:url']) {
            // The next line calls a function in a module that has not been updated to TS yet
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
            group['cover:url'] = group['cover:url'].startsWith('http') ? group['cover:url'] : (nconf.get('relative_path') as string + group['cover:url']);
        } else {
            // The next line calls a function in a module that has not been updated to TS yet
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
            import('../coverPhoto').then((coverPhotoModule) => {
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
            group['cover:thumb:url'] = group['cover:thumb:url'].startsWith('http') ? group['cover:thumb:url'] : (nconf.get('relative_path') as string + group['cover:thumb:url']);
        } else {
            // The next line calls a function in a module that has not been updated to TS yet
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
            import('../coverPhoto').then((coverPhotoModule) => {
                group['cover:thumb:url'] = coverPhotoModule.getDefaultGroupCover(group.name);
            }).catch((error) => {
                // Handle any errors that occur during dynamic import
                console.error('Error loading coverPhoto module:', error);
            });
            // import idea from ChatGPT
            // group['cover:thumb:url'] = require('../coverPhoto').getDefaultGroupCover(group.name) as string;
        }

        group['cover:position'] = validator.escape(String(group['cover:position'] || '50% 50%'));
    }
}

function groupStart(Groups : Groups_t) {
    Groups.getGroupsFields = async function (groupNames: string[], fields) {
        if (!Array.isArray(groupNames) || !groupNames.length) {
            return [];
        }

        const ephemeralIdx = groupNames.reduce((memo: number[], cur, idx) => {
            if (Groups.ephemeralGroups.includes(cur)) {
                memo.push(idx);
            }
            return memo;
        }, []);

        const keys: string[] = groupNames.map(groupName => `group:${groupName}`);
        // The next line calls a function in a module that has not been updated to TS yet
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
        const groupData: Group_t[] = await db.getObjects(keys, fields) as Group_t[];
        if (ephemeralIdx.length) {
            ephemeralIdx.forEach((idx) => {
                groupData[idx] = Groups.getEphemeralGroup(groupNames[idx]);
            });
        }

        groupData.forEach(group => modifyGroup(group, fields));
        const results: { groups: string[] } = await plugins.hooks.fire('filter:groups.get', { groups: groupData }) as { groups: string[] };

        // The next line calls a function in a module that has not been updated to TS yet
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
        return results.groups;
    };

    Groups.getGroupsData = async function (groupNames: string[]) {
        return await Groups.getGroupsFields(groupNames, []);
    };

    Groups.getGroupData = async function (groupName) {
        const groupsData = await Groups.getGroupsData([groupName]);
        return Array.isArray(groupsData) && groupsData[0] ? groupsData[0] : null;
    };

    Groups.getGroupField = async function (groupName, field) {
        const groupData = await Groups.getGroupFields(groupName, [field]);
        return String(groupData ? groupData[field] : null);
    };

    Groups.getGroupFields = async function (groupName, fields) {
        const groups = await Groups.getGroupsFields([groupName], fields);
        return groups ? groups[0] : null;
    };

    Groups.setGroupField = async function (groupName, field, value) {
        // The next line calls a function in a module that has not been updated to TS yet
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
        await db.setObjectField(`group:${groupName}`, field, value);
        await plugins.hooks.fire('action:group.set', { field: field, value: value, type: 'set' });
    };
}

export = groupStart;
