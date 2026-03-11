/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { faker } from '@faker-js/faker';
import { Folder, FOLDERS, getFolder } from '@zextras/carbonio-ui-commons';
import { http, HttpResponse } from 'msw';

import { getSetupServer } from '../../__test__/vitest-setup';
import { populateFoldersStore } from '@test-utils/store/folders';
import { ShareFolderDataType, shareFolderSoapApi } from 'api/share-folder-soap-api';
import { FolderActionGrant } from 'types/soap/soap';

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
		populateFoldersStore();
		const folder = getFolder(FOLDERS.INBOX) as Folder;
		const shareFolderArgs: ShareFolderDataType = {
			contacts: [{ email: faker.internet.email() }, { email: faker.internet.email() }],
			folder,
			shareWithUserRole: '',
			accounts: []
		};
		const interceptor = setupInterceptor();
		shareFolderSoapApi(shareFolderArgs);
		const requests = await interceptor;
		requests.forEach((request) => {
			const result = request.action.grant.inh;
			expect(result).toBe('1');
		});
	});
});
