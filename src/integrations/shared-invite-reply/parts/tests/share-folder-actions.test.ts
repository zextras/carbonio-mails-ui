/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { faker } from '@faker-js/faker';
import { ErrorSoapBodyResponse } from '@zextras/carbonio-shell-ui';
import { FOLDER_VIEW } from '@zextras/carbonio-ui-commons';

import { setupHook, within, screen } from '@test-setup';
import { createSoapAPIInterceptor } from '@test-utils/network/msw/create-api-interceptor';
import { buildSoapErrorResponseBody } from '@test-utils/utils/soap';
import { CreateMountpointError } from 'api/errors/create-mountpoint-error';
import { CreateMountpointResponse } from 'api/mount-shared-folder-soap-api';
import { useAccept } from 'integrations/shared-invite-reply/parts/share-folder-actions';
import { ISoapFolderObj } from 'types/soap/soap';

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

		const {
			result: { current: accept }
		} = setupHook(useAccept);

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
			t: vi.fn()
		};

		setupHook(accept, { initialProps: [acceptParams] });

		const snackbar = await screen.findByTestId('snackbar');
		expect(await within(snackbar).findByText(/You have accepted the share request/i)).toBeVisible();
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

		const {
			result: { current: accept }
		} = setupHook(useAccept);

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
			t: vi.fn()
		};

		setupHook(accept, { initialProps: [acceptParams] });

		const snackbar = await screen.findByTestId('snackbar');
		expect(
			await within(snackbar).findByText(
				/A folder\/calendar\/addressbook with the same name already exists/i
			)
		).toBeVisible();
	});
});
