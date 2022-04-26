/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { ZimbraRequest } from './zimbra-request';

export type MsgActionOperation =
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
	| '!spam';

export type MsgActionRequest = ZimbraRequest & {
	action: {
		id?: string;
		op?: MsgActionOperation;
		tn?: string;
		l?: string;
	};
};

export type MsgActionResponse = {
	action: {
		id: string;
		op: MsgActionOperation;
	};
};
