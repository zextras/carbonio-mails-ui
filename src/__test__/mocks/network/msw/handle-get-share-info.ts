/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { faker } from '@faker-js/faker';
import { map } from 'lodash';
import { HttpResponse, HttpResponseResolver } from 'msw';

import { getRandomView } from '../../folders/soap-roots-generator';

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types,@typescript-eslint/explicit-function-return-type
export const getMSWShareInfo = (context?: any) => {
	const firstName = faker.person.firstName();
	const lastName = faker.person.lastName();
	const ownerEmail = faker.internet.email({ firstName, lastName });
	const fakeMid = faker.number.int();
	const fakeId = faker.number.int();
	return {
		ownerId: faker.string.uuid(),
		ownerEmail,
		ownerName: `${firstName} ${lastName}`,
		folderId: fakeId,
		folderUuid: faker.string.uuid(),
		folderPath: '/',
		view: getRandomView(),
		rights: 'rwidx',
		granteeType: 'grp',
		granteeId: faker.string.uuid(),
		granteeName: `_grp_rw_${ownerEmail}`,
		mid: `${fakeMid}`,
		...(context ?? {})
	};
};

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types,@typescript-eslint/explicit-function-return-type
const getShareInfoResponse = () => {
	const sharedAccount = getMSWShareInfo({
		folderId: 1,
		rights: 'rwidx',
		view: 'unknown',
		granteeType: 'grp'
	});
	const randomLength = faker.number.int({ min: 50, max: 200 });
	const randomShares = [
		sharedAccount,
		...map(Array.from({ length: randomLength }), () => getMSWShareInfo())
	];
	return {
		Header: {
			context: {
				session: {
					id: faker.number.int({ min: 1, max: 999999 }),
					_content: faker.number.int({ min: 1, max: 999999 })
				}
			}
		},
		Body: {
			GetShareInfoResponse: {
				share: randomShares,
				_jsns: 'urn:zimbraAccount'
			}
		}
	};
};

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types,@typescript-eslint/explicit-function-return-type
const getEmptyShareInfoResponse = () => ({
	Header: {
		context: {
			session: {
				id: faker.number.int({ min: 1, max: 999999 }),
				_content: faker.number.int({ min: 1, max: 999999 })
			}
		}
	},
	Body: {
		GetShareInfoResponse: {
			share: [],
			_jsns: 'urn:zimbraAccount'
		}
	}
});
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types,@typescript-eslint/explicit-function-return-type
export const getEmptyMSWShareInfoResponse = () => {
	const randomLength = faker.number.int({ min: 50, max: 200 });
	const randomShares = map(Array.from({ length: randomLength }), getMSWShareInfo);
	return {
		Header: {
			context: {
				session: {
					id: faker.number.int({ min: 1, max: 999999 }),
					_content: faker.number.int({ min: 1, max: 999999 })
				}
			}
		},
		Body: {
			GetShareInfoResponse: {
				share: randomShares,
				_jsns: 'urn:zimbraAccount'
			}
		}
	};
};

export const handleGetShareInfoRequest: HttpResponseResolver<never, any> = async ({ request }) =>
	HttpResponse.json(getShareInfoResponse());

export const handleEmptyGetShareInfoRequest: HttpResponseResolver<never, any> = async ({
	request
}) => HttpResponse.json(getEmptyShareInfoResponse());
