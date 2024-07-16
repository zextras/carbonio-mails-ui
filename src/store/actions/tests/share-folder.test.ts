/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { faker } from '@faker-js/faker';
import { http, HttpResponse } from 'msw';

import { FOLDERS } from '../../../carbonio-ui-commons/constants/folders';
import { getFolder } from '../../../carbonio-ui-commons/store/zustand/folder/hooks';
import { getSetupServer } from '../../../carbonio-ui-commons/test/jest-setup';
import { populateFoldersStore } from '../../../carbonio-ui-commons/test/mocks/store/folders';
import { Folder } from '../../../carbonio-ui-commons/types/folder';
import { generateStore } from '../../../tests/generators/store';
import { FolderActionGrant } from '../../../types';
import { shareFolder, ShareFolderDataType } from '../share-folder';

const setupInterceptor = (): Promise<Array<{ action: FolderActionGrant }>> =>
	new Promise<Array<{ action: FolderActionGrant }>>((resolve, reject) => {
		getSetupServer().use(
			http.post<
				never,
				{ Body: { BatchRequest: { FolderActionRequest: Array<{ action: FolderActionGrant }> } } }
			>('/service/soap/BatchRequest', async ({ request }) => {
				if (request === undefined) {
					reject(new Error('Empty request'));
				}
				const response = (await request.json()).Body.BatchRequest.FolderActionRequest;
				resolve(response);
				return HttpResponse.json({
					Body: {
						FolderActionResponse: response
					}
				});
			})
		);
	});

describe('shareFolder', () => {
	it('does not contain the INH attribute', async () => {
		const store = generateStore();
		populateFoldersStore();
		const folder = getFolder(FOLDERS.INBOX) as Folder;
		const shareFolderArgs: ShareFolderDataType = {
			contacts: [{ email: faker.internet.email() }, { email: faker.internet.email() }],
			folder,
			shareWithUserRole: '',
			accounts: []
		};
		const interceptor = setupInterceptor();

		store.dispatch(
			// eslint-disable-next-line @typescript-eslint/ban-ts-comment
			// @ts-ignore
			shareFolder(shareFolderArgs)
		);
		const requests = await interceptor;
		requests.forEach((request) => {
			const result = request.action.grant.inh;
			expect(result).toBe('1');
		});
	});
});
