/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { soapFetch } from '@zextras/carbonio-shell-ui';

import { FOLDERS } from '../../carbonio-ui-commons/constants/folders';
import { type CreateFolderResponse } from '../../types';

export function createFolder({
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
