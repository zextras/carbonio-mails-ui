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
	CreateMountPointRequest,
	CreateMountpointResponse,
	MountSharedFolderParams,
	mountSharedFolderSoapApi
} from 'api/mount-shared-folder-soap-api';
import { createMountpointResponse } from 'api/tests/fixtures/create-mountpoint-response';

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
			rgb: faker.color.rgb(),
			accounts: [{ name: faker.word.noun() }]
		};

		expect(mountSharedFolderSoapApi(params)).rejects.toBeInstanceOf(CreateMountpointError);
	});

	it('sends the chosen color as rgb', async () => {
		const interceptor = createSoapAPIInterceptor<CreateMountPointRequest, never>(
			'CreateMountpoint'
		);

		mountSharedFolderSoapApi({
			zid: faker.string.uuid(),
			view: FOLDER_VIEW.message,
			rid: faker.string.uuid(),
			folderName: faker.word.noun(),
			rgb: '#123456',
			accounts: [{ name: faker.word.noun() }]
		}).catch(() => undefined);

		const { link } = await interceptor;
		expect(link.rgb).toBe('#123456');
		expect(link.color).toBeUndefined();
	});

	it('returns the mounted link from the array the server sends', async () => {
		createSoapAPIInterceptor<never, CreateMountpointResponse>(
			'CreateMountpoint',
			createMountpointResponse
		);

		const result = await mountSharedFolderSoapApi({
			zid: faker.string.uuid(),
			view: FOLDER_VIEW.message,
			rid: '257',
			folderName: 'Mounted F',
			rgb: '#FF0000',
			accounts: [{ name: faker.word.noun() }]
		});

		expect(result).toEqual(createMountpointResponse.link[0]);
	});
});
