/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import type { Account, BatchRequest, BatchResponse } from '@zextras/carbonio-shell-ui';
import { Folder } from '@zextras/carbonio-ui-commons';
import { legacySoapFetch } from '@zextras/carbonio-ui-soap-lib';
import { trim } from 'lodash';

import { FolderActionGrant, FolderActionRequest } from 'types/soap/soap';

export type ShareFolderDataType = {
	sendNotification?: boolean;
	standardMessage?: string;
	contacts: Array<{ email: string }>;
	folder: Folder;
	shareWithUserRole: string;
	accounts: Array<Account>;
};

export async function shareFolderSoapApi(data: ShareFolderDataType): Promise<BatchResponse> {
	const requests = data?.contacts?.map((contact, index) => ({
		_jsns: 'urn:zimbraMail',
		requestId: index,
		action: {
			id: data.folder.id,
			op: 'grant',
			grant: {
				gt: 'usr',
				d: trim(contact.email, '<>'),
				perm: data.shareWithUserRole,
				pw: '',
				inh: '1'
			}
		} as FolderActionGrant
	}));

	return legacySoapFetch<
		BatchRequest & { FolderActionRequest?: Array<FolderActionRequest> },
		BatchResponse
	>('Batch', {
		_jsns: 'urn:zimbra',
		FolderActionRequest: requests
	});
}
