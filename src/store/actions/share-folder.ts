/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { createAsyncThunk } from '@reduxjs/toolkit';
import { soapFetch } from '@zextras/carbonio-shell-ui';
import type { Account, BatchRequest, BatchResponse } from '@zextras/carbonio-shell-ui';
import { trim } from 'lodash';

import { Folder } from '../../carbonio-ui-commons/types/folder';
import { FolderActionGrant, FolderActionRequest } from '../../types';

export type ShareFolderDataType = {
	sendNotification?: boolean;
	standardMessage?: string;
	contacts: Array<{ email: string }>;
	folder: Folder;
	shareWithUserRole: string;
	accounts: Array<Account>;
};

export const shareFolder = createAsyncThunk(
	'mail/shareFolder',
	async (data: ShareFolderDataType) => {
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

		const response = await soapFetch<
			BatchRequest & { FolderActionRequest?: Array<FolderActionRequest> },
			BatchResponse
		>('Batch', {
			_jsns: 'urn:zimbra',
			FolderActionRequest: requests
		});

		return { response };
	}
);
