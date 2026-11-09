/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { ZimbraRequest } from 'types/soap/zimbra-request';

export type ConvActionOperation =
	| 'move'
	| 'flag'
	| '!flag'
	| 'read'
	| '!read'
	| 'tag'
	| '!tag'
	| 'trash'
	| 'delete'
	| 'spam'
	| '!spam'
	| 'update';

/**
 * Limits a conversation action to the messages in a group of folders:
 * t = Trash and the folders inside it, j = Junk, s = Sent, d = Drafts, o = every other folder
 */
export type ConvActionTargetConstraint = 't' | 'j' | 's' | 'd' | 'o';

export type ConvActionRequest = ZimbraRequest & {
	action: {
		id?: string;
		op?: ConvActionOperation;
		tn?: string;
		l?: string;
		tcon?: ConvActionTargetConstraint;
	};
};

export type ConvActionResponse = {
	action: {
		id: string;
		op: ConvActionOperation;
	};
};
