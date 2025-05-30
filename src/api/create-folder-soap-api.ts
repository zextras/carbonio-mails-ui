/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { soapFetch } from '@zextras/carbonio-shell-ui';
import { FOLDERS } from '@zextras/carbonio-ui-commons';

import { type CreateFolderResponse } from 'types/index.d';

export function createFolderSoapApi({
	parentFolderId,
	name
}: {
	parentFolderId: string;
	name: string;
}): Promise<CreateFolderResponse> {
	return soapFetch('CreateFolder', {
		_jsns: 'urn:zimbraMail',
		folder: {
			view: 'message',
			l: parentFolderId || FOLDERS.INBOX,
			name
		}
	});
}
