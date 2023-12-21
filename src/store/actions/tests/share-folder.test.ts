/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { faker } from '@faker-js/faker';
import { rest } from 'msw';

import { getFolder } from '../../../carbonio-ui-commons/store/zustand/folder/hooks';
import { getSetupServer } from '../../../carbonio-ui-commons/test/jest-setup';
import { FOLDERS } from '../../../carbonio-ui-commons/test/mocks/carbonio-shell-ui-constants';
import { populateFoldersStore } from '../../../carbonio-ui-commons/test/mocks/store/folders';
import { Folder } from '../../../carbonio-ui-commons/types/folder';
import { generateStore } from '../../../tests/generators/store';
import { BatchResponse, FolderActionGrant } from '../../../types';
import { shareFolder, ShareFolderDataType } from '../share-folder';

const setupInterceptor = (): Promise<BatchResponse> =>
	new Promise<BatchResponse>((resolve, reject) => {
		getSetupServer().use(
			rest.post('/service/soap/BatchRequest', async (req, res, ctx) => {
				if (!req) {
					reject(new Error('Empty request'));
				}
				const response = (await req.json()).Body.BatchRequest.FolderActionRequest;
				resolve(response);
				return res(
					ctx.json({
						Body: {
							FolderActionResponse: response
						}
					})
				);
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
		const requests = (await interceptor) as Array<{ action: FolderActionGrant }>;
		requests.forEach((request) => {
			const result = request.action.grant.inh;
			expect(result).toBe(undefined);
		});
	});
});
