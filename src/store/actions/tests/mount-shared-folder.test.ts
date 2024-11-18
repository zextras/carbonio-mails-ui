/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { http } from 'msw';

import { getSetupServer } from '../../../carbonio-ui-commons/test/jest-setup';
import { generateStore } from '../../../tests/generators/store';
import { handleCreateMountpointRequest } from '../../../tests/mocks/network/msw/handle-create-mountpoint';
import { mountSharedFolder } from '../mount-shared-folder';

describe('mountShareCalendar', () => {
	it('returns error if the folder already exists', async () => {
		getSetupServer().use(
			http.post('/service/soap/CreateMountpointRequest', handleCreateMountpointRequest)
		);
		const store = generateStore();

		expect(
			store.dispatch(
				// eslint-disable-next-line @typescript-eslint/ban-ts-comment
				// @ts-ignore
				mountSharedFolder({
					folderName: 'existing',
					accounts: [{ name: 'account' }]
				})
			)
		).resolves.toMatchObject({
			error: {
				message: 'mail.ALREADY_EXISTS'
			}
		});
	});
	it('returns success if the folder does not exist', async () => {
		getSetupServer().use(
			http.post('/service/soap/CreateMountpointRequest', handleCreateMountpointRequest)
		);
		const store = generateStore();

		expect(
			store.dispatch(
				// eslint-disable-next-line @typescript-eslint/ban-ts-comment
				// @ts-ignore
				mountSharedFolder({
					folderName: 'new',
					accounts: [{ name: 'account' }]
				})
			)
		).resolves.toMatchObject({
			payload: {
				response: {
					_jsns: 'urn:zimbraMail',
					link: [
						{
							name: 'new',
							absFolderPath: '/new'
						}
					]
				}
			}
		});
	});
});
