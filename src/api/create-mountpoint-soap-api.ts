/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { FOLDERS, SharedObject } from '@zextras/carbonio-ui-commons';
import { legacySoapFetch } from '@zextras/carbonio-ui-soap-lib';
import { map } from 'lodash';

export const createMountpointSoapApi = async (links: Array<SharedObject>): Promise<unknown> =>
	legacySoapFetch('Batch', {
		CreateMountpointRequest: map(links, (link) => ({
			link: {
				l: FOLDERS.USER_ROOT,
				name: `${link.name} ${link.of} ${link.ownerName}`,
				rid: link.folderId,
				view: 'message',
				zid: link.ownerId
			},
			_jsns: 'urn:zimbraMail'
		})),
		_jsns: 'urn:zimbra'
	});
