/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { Account, AccountSettings } from '@zextras/carbonio-shell-ui';
import { isArray } from 'lodash';
import { MailMessage } from '../types';
import { ParticipantRole } from '../carbonio-ui-commons/constants/participants';

/**
 * The name of the primary identity
 */
const PRIMARY_IDENTITY_NAME = 'DEFAULT';

/**
 * The type of the identities whose address does not match with any of the available addresses
 */
const UNKNOWN_IDENTITY_DEFAULT_TYPE = 'alias';

/**
 * The type of the address that doesn't match with any of the listed identities' addresses
 */
const UNKNOWN_ADDRESS_DEFAULT_TYPE = 'alias';

/**
 * The type of the identities:
 * - primary: the identity is the primary identity of the account
 * - alias: the identity is an alias of the primary account
 * - shared: the identity is a shared account for which the user has the "sendAs" right
 */
type IdentityType = 'primary' | 'alias' | 'shared';

/**
 * The type describe all the available addresses for an account
 */
type AvailableAddress = { address: string; type: IdentityType };

/**
 * The type describe the identity, its type and the addresses used to
 * receive and send the message
 */
type Identity = {
	id: string;
	identityName: string;
	receivingAddress: string;
	fromAddress: string;
	type: IdentityType;
};

type MatchingReplyIdentity = {
	address: string;
	name: string;
	identityId: string | undefined;
	identityName: string | undefined;
};

/**
 * The type describe the recipient of a message, its matching identity
 * and the weight to sort it within the list of other recipients
 */
type RecipientWeight = {
	recipientAddress: string;
	recipientFullName: string | undefined;
	role:
		| typeof ParticipantRole.TO
		| typeof ParticipantRole.CARBON_COPY
		| typeof ParticipantRole.BLIND_CARBON_COPY;
	matchingIdentity?: Identity;
	matchingAddress?: boolean;
	weight?: number;
};

/**
 * Weight of the recipient based on its role in the message (e.g. the
 * recipient in the TO field has a higher weight)
 */
const RoleWeights = {
	[ParticipantRole.TO]: 100,
	[ParticipantRole.CARBON_COPY]: 10,
	[ParticipantRole.BLIND_CARBON_COPY]: 1
};

/**
 * Weight of the identity based on its type (e.g. the primary identity
 * has a higher weight)
 */
const IdentityTypeWeights = {
	primary: 3,
	alias: 2,
	shared: 1
};

/**
 * Returns the list of all the available addresses for the account and their type
 * @param account
 * @param settings
 */
const getAvailableAddresses = (
	account: Account,
	settings: AccountSettings
): Array<AvailableAddress> => {
	const result: Array<AvailableAddress> = [];

	// Adds the email address of the primary account
	result.push({
		address: account.name,
		type: 'primary'
	});

	// Adds all the aliases
	if (settings.attrs.zimbraMailAlias) {
		if (isArray(settings.attrs.zimbraMailAlias)) {
			result.push(
				...settings.attrs.zimbraMailAlias.map<AvailableAddress>((alias: string) => ({
					address: alias,
					type: 'alias'
				}))
			);
		} else {
			result.push({
				address: settings.attrs.zimbraMailAlias as string,
				type: 'alias'
			});
		}
	}

	// Adds the email addresses of all the shared accounts
	if (account.rights?.targets) {
		account.rights?.targets.forEach((target) => {
			if (target.right === 'sendAs' && target.target) {
				target.target.forEach((user) => {
					if (user.type === 'account' && user.email) {
						user.email.forEach((email) => {
							result.push({ address: email.addr, type: 'shared' });
						});
					}
				});
			}
		});
	}

	return result;
};

/**
 * Returns the list of all the identities for the account. For each identity a type
 * is give, by matching the email address with all the available addresses, or by
 * setting a default one if the address does not match any of the available addresses.
 *
 * @param account
 * @param settings
 */
const getIdentities = (account: Account, settings: AccountSettings): Array<Identity> => {
	const identities: Array<Identity> = [];

	// Get the list of all the available email addresses for the account and their type
	const availableEmailAddresses = getAvailableAddresses(account, settings);

	account.identities?.identity?.forEach((identity: any) => {
		const fromAddress = identity._attrs.zimbraPrefFromAddress;

		// The receiving address for the primary identity is the account name
		const receivingAddress = identity.name === PRIMARY_IDENTITY_NAME ? account.name : fromAddress;

		// Find the first match between the identity receiving email address and the available email addresses
		const matchingReceivingAddress = availableEmailAddresses.find(
			(availableAddress) => availableAddress.address === receivingAddress
		);

		const type = matchingReceivingAddress
			? matchingReceivingAddress.type
			: UNKNOWN_IDENTITY_DEFAULT_TYPE;

		identities.push({
			receivingAddress,
			id: identity._attrs.zimbraPrefIdentityId,
			identityName: identity.name,
			fromAddress,
			type
		});
	});

	return identities;
};

/**
 * Returns the list of all the recipients of the message, with their weight
 * based on their role in the message
 *
 * @param message
 */
const getRecipients = (message: MailMessage): Array<RecipientWeight> => {
	const recipients: Array<RecipientWeight> = [];

	message.participants?.forEach((participant) => {
		if (
			participant.type !== ParticipantRole.TO &&
			participant.type !== ParticipantRole.CARBON_COPY &&
			participant.type !== ParticipantRole.BLIND_CARBON_COPY
		) {
			return;
		}
		recipients.push({
			recipientAddress: participant.address,
			recipientFullName: participant.fullName,
			role: participant.type
		});
	});

	return recipients;
};

/**
 * Checks if the recipient address matches one of the account available addresses
 *
 * @param recipients
 * @param availableAddresses
 *
 * @returns the list of recipients with the matchingAddress flag set
 */ 2;
const checkMatchingAddress = (
	recipients: Array<RecipientWeight>,
	availableAddresses: Array<AvailableAddress>
): Array<RecipientWeight> =>
	recipients.map((recipient) => ({
		...recipient,
		matchingAddress: availableAddresses.some(
			(availableAddress) => availableAddress.address === recipient.recipientAddress
		)
	}));

/**
 * Computes the weight of the recipient based on its role in the message
 * and on the type of the matching identity
 *
 * @param recipients
 * @param identities
 *
 * @returns the list of recipients with their weight
 */
const computeIdentityWeight = (
	recipients: Array<RecipientWeight>,
	identities: Array<Identity>
): Array<RecipientWeight> => {
	const result: Array<RecipientWeight> = [];

	// Cicle for every recipient in the message
	recipients.forEach((recipient) => {
		// Check if the recipient has a matching identity
		const matchingIdentity = identities.find(
			(identity) => identity.fromAddress === recipient.recipientAddress
		);

		// If the recipient does not have a matching identity check if matches one of the available addresses

		// If the recipient does not have a matching identity, set the weight to 0

		result.push({
			...recipient,
			matchingIdentity,
			weight:
				RoleWeights[recipient.role] *
				IdentityTypeWeights[matchingIdentity?.type || UNKNOWN_ADDRESS_DEFAULT_TYPE]
		});
	});

	return result;
};

const filterMatchingRecipients = (recipients: Array<RecipientWeight>): Array<RecipientWeight> => {
	const result: Array<RecipientWeight> = [];

	recipients.forEach((recipient) => {
		if (recipient.matchingAddress || recipient.matchingIdentity) {
			result.push(recipient);
		}
	});

	return result;
};

/**
 * Analyze the message and return the identity that should be used to reply it.
 * @param account
 * @param settings
 * @param message
 */
const getRecipientReplyIdentity = (
	account: Account,
	settings: AccountSettings,
	message: MailMessage
): MatchingReplyIdentity => {
	// Get all the available identities for the account
	const identities = getIdentities(account, settings);

	// Extract all the recipients addresses from the message
	const recipients = getRecipients(message);

	// Check if the recipient address matches one of the account available addresses
	const recipientsWithMatchingAddress = checkMatchingAddress(
		recipients,
		getAvailableAddresses(account, settings)
	);

	/*
	 * Filter out the recipients that do not match any of the available addresses
	 * and any address of the available identities
	 */
	const filteredRecipients = filterMatchingRecipients(recipientsWithMatchingAddress);

	// For each recipient, compute the identity weight based on the recipients address and position in the message
	const recipientWeights = computeIdentityWeight(filteredRecipients, identities);

	// Sort the recipient by weight
	const replyIdentity = recipientWeights.sort((a, b) => (b.weight ?? 0) - (a.weight ?? 0))?.[0];

	// Return the identity with the highest weight
	return {
		name: replyIdentity?.recipientFullName ?? '',
		address: replyIdentity?.matchingIdentity?.fromAddress ?? replyIdentity?.recipientAddress ?? '',
		identityId: replyIdentity?.matchingIdentity?.id,
		identityName: replyIdentity?.matchingIdentity?.identityName
	};
};

export {
	MatchingReplyIdentity,
	RecipientWeight,
	getRecipientReplyIdentity,
	getIdentities,
	getAvailableAddresses,
	getRecipients,
	computeIdentityWeight,
	checkMatchingAddress,
	filterMatchingRecipients
};
