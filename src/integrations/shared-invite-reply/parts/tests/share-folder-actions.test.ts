/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { faker } from '@faker-js/faker';
import { ErrorSoapBodyResponse } from '@zextras/carbonio-shell-ui';

import { CreateMountpointError } from '../../../../api/errors/create-mountpoint-error';
import { FOLDER_VIEW } from '../../../../carbonio-ui-commons/constants';
import { createSoapAPIInterceptor } from '../../../../carbonio-ui-commons/test/mocks/network/msw/create-api-interceptor';
import { buildSoapErrorResponseBody } from '../../../../carbonio-ui-commons/test/mocks/utils/soap';
import { setupHook, screen, within } from '../../../../carbonio-ui-commons/test/test-setup';
import { CreateMountpointResponse } from '../../../../store/actions/mount-shared-folder';
import { generateStore } from '../../../../tests/generators/store';
import { ISoapFolderObj } from '../../../../types';
import { useAccept } from '../share-folder-actions';

describe('share folder actions', () => {
	it('should mount shared folder on accept', async () => {
		const zid = 'zid';
		const view = FOLDER_VIEW.message;
		const rid = 'rid';
		const folderName = 'folderName';
		const color = 1;
		const accounts = [{ name: 'account name' }];
		const link: ISoapFolderObj = {
			activesyncdisabled: false,
			cn: [],
			color: '',
			deletable: false,
			i4ms: 0,
			i4next: 0,
			l: '1',
			luuid: '',
			ms: 0,
			n: 0,
			rev: 0,
			rgb: '',
			s: 0,
			webOfflineSyncDays: 0,
			id: faker.string.numeric(),
			uuid: faker.string.uuid(),
			name: faker.word.noun(),
			absFolderPath: `/${faker.word.noun()}`,
			view
		};

		const response: CreateMountpointResponse = {
			link
		};
		createSoapAPIInterceptor<never, CreateMountpointResponse>('CreateMountpoint', response);
		const msgActionResponse = {
			action: {
				id: '10',
				op: 'trash'
			}
		};
		createSoapAPIInterceptor('MsgAction', msgActionResponse);

		const store = generateStore();

		const {
			result: { current: accept }
		} = setupHook(useAccept, { store });

		const acceptParams = {
			zid,
			view,
			rid,
			folderName,
			color,
			accounts,
			msgId: 'msgId',
			sharedFolderName: folderName,
			owner: 'owner',
			participants: [],
			grantee: 'grantee',
			customMessage: 'customMessage',
			role: 'role',
			allowedActions: 'allowedActions',
			notifyOrganizer: false,
			t: jest.fn()
		};

		setupHook(accept, { initialProps: [acceptParams] });

		const snackbar = await screen.findByTestId('snackbar');
		expect(within(snackbar).getByText(/You have accepted the share request/i)).toBeVisible();
	});

	it('should display an error on existing folder', async () => {
		const zid = 'zid';
		const view = FOLDER_VIEW.message;
		const rid = 'rid';
		const folderName = 'folderName';
		const color = 1;
		const accounts = [{ name: 'account name' }];
		const response: ErrorSoapBodyResponse = buildSoapErrorResponseBody({
			detailCode: CreateMountpointError.FOLDER_ALREADY_EXISTS
		});
		createSoapAPIInterceptor<never, ErrorSoapBodyResponse>('CreateMountpoint', response);

		const store = generateStore();

		const {
			result: { current: accept }
		} = setupHook(useAccept, { store });

		const acceptParams = {
			zid,
			view,
			rid,
			folderName,
			color,
			accounts,
			msgId: 'msgId',
			sharedFolderName: folderName,
			owner: 'owner',
			participants: [],
			grantee: 'grantee',
			customMessage: 'customMessage',
			role: 'role',
			allowedActions: 'allowedActions',
			notifyOrganizer: false,
			t: jest.fn()
		};

		setupHook(accept, { initialProps: [acceptParams] });

		const snackbar = await screen.findByTestId('snackbar');
		expect(
			within(snackbar).getByText(
				/A folder\/calendar\/addressbook with the same name already exists/i
			)
		).toBeVisible();
	});
});
