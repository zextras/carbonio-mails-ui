/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { faker } from '@faker-js/faker';
import { ErrorSoapBodyResponse } from '@zextras/carbonio-shell-ui';

import { CreateMountpointError } from '../../../api/errors/create-mountpoint-error';
import { FOLDER_VIEW } from '../../../carbonio-ui-commons/constants';
import { createSoapAPIInterceptor } from '../../../carbonio-ui-commons/test/mocks/network/msw/create-api-interceptor';
import { buildSoapErrorResponseBody } from '../../../carbonio-ui-commons/test/mocks/utils/soap';
import { ISoapFolderObj } from '../../../types';
import {
	CreateMountpointResponse,
	mountSharedFolder,
	MountSharedFolderParams
} from '../mount-shared-folder';

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

		expect(mountSharedFolder(params)).rejects.toBeInstanceOf(CreateMountpointError);
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

		const result = await mountSharedFolder(params);
		expect(result).toEqual(link);
	});
});
