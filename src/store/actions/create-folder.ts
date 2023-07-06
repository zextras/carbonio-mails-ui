/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { FOLDERS, soapFetch } from '@zextras/carbonio-shell-ui';
import { type CreateFolderResponse } from '../../types';

export async function createFolder({
	parentFolderId,
	name
}: {
	parentFolderId: string;
	name: string;
}): CreateFolderResponse {
	const response = await soapFetch('CreateFolder', {
		_jsns: 'urn:zimbraMail',
		folder: {
			view: 'message',
			l: parentFolderId || FOLDERS.INBOX,
			name
		}
	});
	return response as CreateFolderResponse;
}
