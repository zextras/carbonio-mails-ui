/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { FOLDERS } from '@zextras/carbonio-ui-commons';
import { legacySoapFetch } from '@zextras/carbonio-ui-soap-lib';

import { CreateFolderResponse } from 'types/soap/soap';

export function createFolderSoapApi({
	parentFolderId,
	name
}: {
	parentFolderId: string;
	name: string;
}): Promise<CreateFolderResponse> {
	return legacySoapFetch('CreateFolder', {
		_jsns: 'urn:zimbraMail',
		folder: {
			view: 'message',
			l: parentFolderId || FOLDERS.INBOX,
			name
		}
	});
}
