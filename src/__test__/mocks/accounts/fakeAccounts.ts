/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { faker } from '@faker-js/faker';

type FakeIdentity = {
	id: string;
	firstName: string;
	lastName: string;
	userName: string;
	email: string;
	fullName: string;
};

type GetMockedAccountItemType = {
	identity1?: FakeIdentity & { _attrs?: Record<string, string> };
	identity2?: FakeIdentity & { _attrs?: Record<string, string> };
	identity3?: FakeIdentity & { _attrs?: Record<string, string> };
};

const createFakeIdentity = (): FakeIdentity => {
	const firstName = faker.person.firstName() ?? '';
	const lastName = faker.person.lastName() ?? '';

	return {
		id: faker.string.uuid(),
		firstName,
		lastName,
		fullName: `${firstName} ${lastName}`,
		userName: `${firstName}.${lastName}`,
		email: faker.internet.email({ firstName, lastName }) ?? ''
	};
};

/**
 *
 */
const getMockedAccountItem = (context?: GetMockedAccountItemType): any => {
	const identity1 = context?.identity1 ?? createFakeIdentity();
	const identity2 = context?.identity2 ?? createFakeIdentity();
	const identity3 = context?.identity3 ?? createFakeIdentity();
	return {
		id: identity1.id,
		name: identity1.email,
		displayName: identity1.fullName,
		identities: {
			identity: [
				{
					id: identity1.id,
					name: 'DEFAULT',
					_attrs: {
						zimbraPrefIdentityName: 'DEFAULT',
						zimbraPrefIdentityId: '1',
						zimbraPrefWhenSentToEnabled: 'FALSE',
						zimbraPrefWhenInFoldersEnabled: 'FALSE',
						zimbraPrefFromAddressType: 'sendAs',
						zimbraPrefFromAddress: identity1.email,
						objectClass: 'zimbraIdentity',
						zimbraPrefFromDisplay: identity1.fullName,
						zimbraPrefReplyToEnabled: 'FALSE',
						zimbraCreateTimestamp: '20211227131653.367Z',
						...(context?.identity1?._attrs ?? {})
					}
				},
				{
					id: identity2.id,
					name: identity2.fullName,
					_attrs: {
						zimbraPrefFromAddressType: 'sendAs',
						zimbraPrefIdentityName: identity2.fullName,
						zimbraPrefIdentityId: '2',
						zimbraPrefWhenSentToEnabled: 'FALSE',
						zimbraPrefWhenInFoldersEnabled: 'FALSE',
						zimbraPrefFromAddress: identity2.email,
						objectClass: 'zimbraIdentity',
						zimbraPrefFromDisplay: identity2.fullName,
						zimbraPrefReplyToEnabled: 'FALSE',
						zimbraCreateTimestamp: '20211227131653.367Z',
						...(context?.identity2?._attrs ?? {})
					}
				},
				{
					id: identity3.id,
					name: identity3.fullName,
					_attrs: {
						zimbraPrefFromAddressType: 'sendAs',
						zimbraPrefIdentityName: identity3.fullName,
						zimbraPrefIdentityId: '3',
						zimbraPrefWhenSentToEnabled: 'FALSE',
						zimbraPrefWhenInFoldersEnabled: 'FALSE',
						zimbraPrefFromAddress: identity3.email,
						objectClass: 'zimbraIdentity',
						zimbraPrefFromDisplay: identity3.fullName,
						zimbraPrefReplyToEnabled: 'FALSE',
						zimbraCreateTimestamp: '20211227131653.367Z',
						...(context?.identity3?._attrs ?? {})
					}
				}
			]
		},
		signatures: {
			signature: [
				{
					name: identity1.fullName,
					id: identity1.id,
					content: [
						{
							type: 'text/html',
							_content: `<div><span style="color:#333333;font-family:monospace">regards</span><br style="color:#333333;font-family:monospace" /><span style="color:#333333;font-family:monospace">${identity1.fullName}</span></div>`
						}
					]
				}
			]
		},
		rights: {
			targets: [
				{
					right: 'sendAs',
					target: [
						{
							type: 'account',
							email: [
								{
									addr: identity3.email
								}
							],
							d: identity3.fullName
						}
					]
				},
				{
					right: 'viewFreeBusy',
					target: [
						{
							type: 'account',
							id: '1',
							name: identity1.email,
							d: identity1.fullName
						}
					]
				},
				{
					right: 'sendOnBehalfOf',
					target: [
						{
							type: 'account',
							email: [
								{
									addr: identity2.email
								}
							],
							d: identity2.fullName
						}
					]
				}
			]
		}
	};
};

export { type FakeIdentity, createFakeIdentity, getMockedAccountItem };
