/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { FOLDERS, soapFetch } from '@zextras/carbonio-shell-ui';
import { map } from 'lodash';
import { SharedObject } from '../../carbonio-ui-commons/types/sidebar';

export const createMountpoint = async (links: Array<SharedObject>): Promise<unknown> => {
	const res = await soapFetch('Batch', {
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
	return res;
};
