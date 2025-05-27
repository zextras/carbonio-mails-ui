/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { faker } from '@faker-js/faker';
import { cloneDeep, floor, merge, times } from 'lodash';

import { createFakeIdentity, FakeIdentity } from '../accounts/fakeAccounts';

/**
 * Number of alias identities to generate
 */
const DEFAULT_ALIASES_IDENTITIES_COUNT = 2;

/**
 * Number of accounts on which the current user has the "sendAs" right
 */
const DEFAULT_SENDAS_IDENTITIES_COUNT = 1;

/**
 * Number of accounts on which the current user has the "sendOnBehalfOf" right
 */
const DEFAULT_SENDONBEHALF_IDENTITIES_COUNT = 1;

/**
 * Number of accounts on which the current user has the "view free/busy status" right
 */
const DEFAULT_VIEWFREEBUSY_IDENTITIES_COUNT = 2;

/**
 * Number of accounts to create and to use for mock grants
 */
const DEFAULT_OTHER_USERS_COUNT = 10;

/**
 * Indicates if the signatures should be generated
 */
const DEFAULT_GENERATE_SIGNATURES = true;

type SignItemType = {
	name: string;
	id: string;
	description: string;
	label: string;
	content?: [
		{
			type: 'text/plain' | 'text/html';
			_content: string;
		}
	];
};

type MocksContextIdentity = {
	identity: FakeIdentity;
	userRootId?: string;
	signatures?: {
		newEmailSignature: SignItemType;
		forwardReplySignature: SignItemType;
	};
};

type MocksContext = {
	identities: {
		primary: MocksContextIdentity;
		aliases: Array<MocksContextIdentity>;
		sendAs: Array<MocksContextIdentity>;
		sendOnBehalf: Array<MocksContextIdentity>;
	};
	aliasAddresses: Array<string>;
	viewFreeBusyIdentities: Array<FakeIdentity>;
	otherUsersIdentities: Array<FakeIdentity>;
};

type MocksContextGenerationParams = {
	aliasIdentitiesCount?: number;
	sendAsIdentitiesCount?: number;
	sendOnBehalfIdentitiesCount?: number;
	viewFreeBusyIdentitiesCount?: number;
	otherUsersIdentitiesCount?: number;
	generateSignatures?: boolean;
};

/**
 * Generate a signature
 */
const generateSignature = (): SignItemType => {
	const title = faker.person.jobTitle();
	return {
		name: title,
		id: faker.string.uuid(),
		label: title,
		description: title,
		content: [
			{
				type: 'text/html',
				_content: `<div>${title}</div>\n<div><span style="color: #ff0000;"><em>${faker.person.jobType()}</em></span></div>\n<div>&nbsp;</div>`
			}
		]
	};
};

/**
 * Generates a default context with consistent random data
 * @param params
 */
const generateDefaultContext = ({
	aliasIdentitiesCount = DEFAULT_ALIASES_IDENTITIES_COUNT,
	sendAsIdentitiesCount = DEFAULT_SENDAS_IDENTITIES_COUNT,
	sendOnBehalfIdentitiesCount = DEFAULT_SENDONBEHALF_IDENTITIES_COUNT,
	viewFreeBusyIdentitiesCount = DEFAULT_VIEWFREEBUSY_IDENTITIES_COUNT,
	generateSignatures = DEFAULT_GENERATE_SIGNATURES,
	otherUsersIdentitiesCount = DEFAULT_OTHER_USERS_COUNT
}: MocksContextGenerationParams): MocksContext => {
	const primary = createFakeIdentity();
	const aliases = times(aliasIdentitiesCount, () => createFakeIdentity());

	return {
		identities: {
			primary: {
				identity: primary,
				userRootId: faker.string.uuid(),
				...(generateSignatures && {
					signatures: {
						newEmailSignature: generateSignature(),
						forwardReplySignature: generateSignature()
					}
				})
			},
			aliases: aliases.map((alias) => ({
				identity: alias,
				...(generateSignatures && {
					signatures: {
						newEmailSignature: generateSignature(),
						forwardReplySignature: generateSignature()
					}
				})
			})),
			sendAs: times(sendAsIdentitiesCount, () => ({
				identity: createFakeIdentity(),
				userRootId: faker.string.uuid(),
				...(generateSignatures && {
					signatures: {
						newEmailSignature: generateSignature(),
						forwardReplySignature: generateSignature()
					}
				})
			})),
			sendOnBehalf: times(sendOnBehalfIdentitiesCount, () => ({
				identity: createFakeIdentity(),
				userRootId: faker.string.uuid(),
				...(generateSignatures && {
					signatures: {
						newEmailSignature: generateSignature(),
						forwardReplySignature: generateSignature()
					}
				})
			}))
		},
		aliasAddresses: aliases.map((alias) => alias.email),
		viewFreeBusyIdentities: times(viewFreeBusyIdentitiesCount, () => createFakeIdentity()),
		otherUsersIdentities: times(otherUsersIdentitiesCount, () => createFakeIdentity())
	};
};

// The current context, preset with random data
let context: MocksContext = generateDefaultContext({});

// Set custom values for the part of the context
const updateMocksContext = (customContext: Partial<MocksContext>): MocksContext =>
	merge(context, customContext);

// Set custom values for the part of the context
const setMocksContext = (customContext: MocksContext): void => {
	context = cloneDeep(customContext);
};

// Return a copy of the current context
const getMocksContext = (): MocksContext => cloneDeep(context);

/**
 * Returns an identity randomly picked from the given identities array.
 * If the identities array is undefined or empty, undefined is returned
 * @param identities
 */
const getRandomIdentity = (identities: Array<FakeIdentity>): FakeIdentity | undefined => {
	if (!identities || !identities.length) {
		return undefined;
	}
	return identities[floor(Math.random() * identities.length)];
};

/**
 * Returns an identity randomly picked from the given identities array.
 * If the identities array is undefined or empty, undefined is returned
 * @param identities
 */
const getRandomIdentities = (
	identities: Array<FakeIdentity>,
	count: number
): Array<FakeIdentity> => {
	if (!identities || !identities.length) {
		return [];
	}

	const shuffledIdentities = faker.helpers.shuffle<FakeIdentity>(identities);
	return shuffledIdentities.filter((identity, index) => index < count);
};

export {
	type MocksContext,
	type MocksContextIdentity,
	getMocksContext,
	setMocksContext,
	updateMocksContext,
	generateDefaultContext,
	getRandomIdentity,
	getRandomIdentities
};
