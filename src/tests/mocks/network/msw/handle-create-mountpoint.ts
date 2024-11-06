/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { faker } from '@faker-js/faker';
import { HttpResponse, HttpResponseResolver } from 'msw';

import { CarbonioMailboxRestGenericRequest } from '../../../../carbonio-ui-commons/test/mocks/network/msw/handlers';

type Response = { Header: any; Body: any };

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
const getSuccessfulBody = ({ name }): Response['Body'] => ({
	CreateMountpointResponse: {
		_jsns: 'urn:zimbraMail',
		link: [
			{
				id: faker.string.numeric(),
				uuid: faker.string.uuid(),
				deletable: true,
				name,
				absFolderPath: `/${name}`,
				l: faker.string.numeric(),
				luuid: faker.string.uuid(),
				f: '#',
				view: 'message',
				rev: faker.number.int({ min: 1, max: 999999 }),
				ms: faker.number.int({ min: 1, max: 999999 }),
				webOfflineSyncDays: 0,
				activesyncdisabled: false,
				zid: faker.string.uuid(),
				rid: faker.number.int({ min: 1, max: 999999 }),
				ruuid: faker.string.uuid(),
				owner: faker.internet.email(),
				reminder: false,
				n: 0,
				s: 0,
				oname: faker.string.alpha(),
				rest: faker.string.alpha(),
				perm: 'r'
			}
		]
	}
});

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
const getExistingFolderBody = (): Response['Body'] => ({
	CreateMountpointResponse: {
		_jsns: 'urn:zimbraMail',
		Fault: {
			Detail: {
				Error: {
					Code: 'mail.ALREADY_EXISTS'
				}
			}
		}
	}
});

const getDefaultCreateMountpointResponse = (
	{ name } = {} as {
		name?: string;
	}
): Response['Body'] => {
	if (name === 'existing') {
		return getExistingFolderBody();
	}
	return getSuccessfulBody({ name });
};

const getCreateMountpointResponse = (
	{ name } = {} as {
		name?: string;
	}
): Response => ({
	Header: {
		context: {
			session: {
				id: faker.number.int({ min: 1, max: 999999 }),
				_content: faker.number.int({ min: 1, max: 999999 })
			}
		}
	},
	Body: getDefaultCreateMountpointResponse({ name })
});

export const handleCreateMountpointRequest: HttpResponseResolver<
	never,
	CarbonioMailboxRestGenericRequest
> = async ({ request }) => {
	const requestContent = await request.json();
	const { link } = requestContent.Body.CreateMountpointRequest;

	const response = getCreateMountpointResponse({
		name: link?.name || ''
	});

	return HttpResponse.json(response);
};
