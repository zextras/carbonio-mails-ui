/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { ZimbraRequest } from './zimbra-request';

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
	| '!spam';

export type ConvActionRequest = ZimbraRequest & {
	action: {
		id?: string;
		op?: ConvActionOperation;
		tn?: string;
		l?: string;
	};
};

export type ConvActionResponse = {
	action: {
		id: string;
		op: ConvActionOperation;
	};
};
