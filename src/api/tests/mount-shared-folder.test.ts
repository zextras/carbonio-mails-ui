/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { faker } from '@faker-js/faker';
import { ErrorSoapBodyResponse } from '@zextras/carbonio-shell-ui';
import { FOLDER_VIEW } from '@zextras/carbonio-ui-commons';

import { createSoapAPIInterceptor } from '@test-utils/network/msw/create-api-interceptor';
import { buildSoapErrorResponseBody } from '@test-utils/utils/soap';
import { CreateMountpointError } from 'api/errors/create-mountpoint-error';
import {
	CreateMountpointResponse,
	MountSharedFolderParams,
	mountSharedFolderSoapApi
} from 'api/mount-shared-folder-soap-api';
import { ISoapFolderObj } from 'types/soap/soap';

describe('mountShareCalendar', () => {
	it('raise an error if the response is an error', async () => {
		const errorResponse = buildSoapErrorResponseBody({
			detailCode: CreateMountpointError.FOLDER_ALREADY_EXISTS
		});
		createSoapAPIInterceptor<never, ErrorSoapBodyResponse>('CreateMountpoint', errorResponse);

		const params: MountSharedFolderParams = {
			zid: faker.string.uuid(),
			view: FOLDER_VIEW.message,
			rid: faker.string.uuid(),
			folderName: faker.word.noun(),
			color: faker.number.int({ min: 0, max: 9 }),
			accounts: [{ name: faker.word.noun() }]
		};

		expect(mountSharedFolderSoapApi(params)).rejects.toBeInstanceOf(CreateMountpointError);
	});

	it('returns the link if the response is success ', async () => {
		const link: ISoapFolderObj = {
			activesyncdisabled: false,
			cn: [],
			color: '',
			deletable: false,
			i4ms: 0,
			i4next: 0,
			l: '',
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
			view: FOLDER_VIEW.message
		};

		const response: CreateMountpointResponse = {
			link
		};
		createSoapAPIInterceptor<never, CreateMountpointResponse>('CreateMountpoint', response);

		const params: MountSharedFolderParams = {
			zid: faker.string.uuid(),
			view: link.view,
			rid: faker.string.uuid(),
			folderName: faker.word.noun(),
			color: faker.number.int({ min: 0, max: 9 }),
			accounts: [{ name: faker.word.noun() }]
		};

		const result = await mountSharedFolderSoapApi(params);
		expect(result).toEqual(link);
	});
});
