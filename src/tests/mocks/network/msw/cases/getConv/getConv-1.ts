/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { faker } from '@faker-js/faker';

import { createFakeIdentity } from '../../../../../../carbonio-ui-commons/test/mocks/accounts/fakeAccounts';

const identity1 = createFakeIdentity();
const identity2 = createFakeIdentity();

const e = [
	{
		a: identity1.email,
		d: identity1.firstName,
		p: identity1.fullName,
		t: 'f'
	},
	{
		a: identity2.email,
		d: identity2.firstName,
		p: identity2.fullName,
		t: 't'
	}
];

const message = {
	s: 1082,
	d: 1708514600000,
	l: '1',
	cid: '1',
	f: 'sr',
	rev: 10252,
	id: 1,
	fr: '1',
	e,
	su: faker.lorem.sentence(),
	sd: 1708514600000,
	mp: []
};

function createMessage(increment: number): typeof message {
	return {
		...message,
		d: message.d + increment,
		sd: message.sd + increment,
		id: message.id + increment
	};
}
export const getConvResult = {
	Header: {
		context: {
			session: {
				id: '18799',
				_content: '18799'
			},
			change: {
				token: 11050
			},
			_jsns: 'urn:zimbra'
		}
	},
	Body: {
		GetConvResponse: {
			c: [
				{
					id: '1',
					u: 0,
					n: 7,
					f: 'srd',
					d: 1709039238000,
					su: faker.lorem.sentence(),
					e,
					m: [
						createMessage(0),
						createMessage(1),
						createMessage(2),
						createMessage(3),
						createMessage(4)
					]
				}
			],
			_jsns: 'urn:zimbraMail'
		}
	},
	_jsns: 'urn:zimbraSoap'
};
