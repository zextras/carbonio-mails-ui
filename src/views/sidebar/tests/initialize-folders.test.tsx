/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React from 'react';

import { act } from '@testing-library/react';
import { FOLDER_VIEW } from '@zextras/carbonio-ui-commons';
import type { Folder } from '@zextras/carbonio-ui-commons';

import { MailboxRefreshedEvent } from '../../../event-bus/events/mailbox-refreshed';
import { InitializeFolders } from '../initialize-folders';
import { setupTest } from '@test-setup';
import { generateFolder } from '@test-utils/folders/folders-generator';
import { createSoapAPIInterceptor } from '@test-utils/network/msw/create-api-interceptor';

type GetFolderRequestParams = { view?: string };

function interceptGetFolder(): Promise<GetFolderRequestParams> {
	return createSoapAPIInterceptor<GetFolderRequestParams, { folder: Array<Folder> }>('GetFolder', {
		folder: [generateFolder({ name: 'USER_ROOT' })]
	});
}

describe('InitializeFolders', () => {
	beforeEach(() => {
		createSoapAPIInterceptor('GetShareInfo', { result: { share: [] } });
	});

	it('should request the folders of the message view', async () => {
		const getFolderInterceptor = interceptGetFolder();

		setupTest(<InitializeFolders />);

		await act(async () => {
			expect(await getFolderInterceptor).toEqual(
				expect.objectContaining({ view: FOLDER_VIEW.message })
			);
		});
	});

	it('should request the folders again when the mailbox is refreshed', async () => {
		const firstGetFolderInterceptor = interceptGetFolder();
		setupTest(<InitializeFolders />);
		await act(async () => {
			await firstGetFolderInterceptor;
		});

		const refreshGetFolderInterceptor = interceptGetFolder();
		act(() => {
			window.dispatchEvent(new MailboxRefreshedEvent());
		});

		await act(async () => {
			expect(await refreshGetFolderInterceptor).toEqual(
				expect.objectContaining({ view: FOLDER_VIEW.message })
			);
		});
	});
});
