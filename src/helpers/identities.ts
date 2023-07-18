/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { Account, AccountSettings } from '@zextras/carbonio-shell-ui';
import { TFunction } from 'i18next';
import { isArray } from 'lodash';
import { v4 as uuid } from 'uuid';

import { getMessageOwnerAccountName } from './folders';
import { ParticipantRole } from '../carbonio-ui-commons/constants/participants';
import type { Folders } from '../carbonio-ui-commons/types/folder';
import type { MailMessage, Participant } from '../types';

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
 * - delegation: the identity is a shared account for which the user is a delegate
 */
type IdentityType = 'primary' | 'alias' | 'delegation';

/**
 * The type describe the possibility of a match between the account that owns the message's folder
 * and the account that owns an identity
 */
type AccountOwnershipMatchType = 'match' | 'nomatch';

/**
 * The type describe all the available addresses for an account
 */
type AvailableAddress = {
	address: string;
	type: IdentityType;
	right?: string;
	ownerAccount: string;
};

/**
 * The type describe the identity, its type and the addresses used to
 * receive and send the message
 */
type IdentityDescriptor = {
	id: string;
	ownerAccount: string;
	identityName: string;
	identityDisplayName: string;
	fromDisplay: string | undefined;
	receivingAddress: string;
	fromAddress: string;
	type: IdentityType;
	right?: string;
	defaultSignatureId?: string;
	forwardReplySignatureId?: string;
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
	matchingIdentity?: IdentityDescriptor;
	matchingAddress?: boolean;
	weight?: number;
};

/**
 * Weights of the match/nomatch between the owner of a folder and the owner of an identity
 */
const AccountOwnershipWeights: Record<AccountOwnershipMatchType, number> = {
	match: 1000,
	nomatch: 1
};

/**
 * Weights of the recipient based on its role in the message (e.g. the
 * recipient in the TO field has a higher weight)
 */
const RoleWeights = {
	[ParticipantRole.TO]: 100,
	[ParticipantRole.CARBON_COPY]: 10,
	[ParticipantRole.BLIND_CARBON_COPY]: 1
};

/**
 * Weights of the identity based on its type (e.g. the primary identity
 * has a higher weight)
 */
const IdentityTypeWeights = {
	primary: 3,
	alias: 2,
	delegation: 1
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
		type: 'primary',
		ownerAccount: account.name
	});

	// Adds all the aliases
	if (settings.attrs.zimbraMailAlias) {
		if (isArray(settings.attrs.zimbraMailAlias)) {
			result.push(
				...(settings.attrs.zimbraMailAlias as string[]).map<AvailableAddress>((alias: string) => ({
					address: alias,
					type: 'alias',
					ownerAccount: account.name
				}))
			);
		} else {
			result.push({
				address: settings.attrs.zimbraMailAlias as string,
				type: 'alias',
				ownerAccount: account.name
			});
		}
	}

	// Adds the email addresses of all the delegation accounts
	if (account.rights?.targets) {
		account.rights?.targets.forEach((target) => {
			if (target.target && (target.right === 'sendAs' || target.right === 'sendOnBehalfOf')) {
				target.target.forEach((user) => {
					if (user.type === 'account' && user.email) {
						user.email.forEach((email) => {
							result.push({
								address: email.addr,
								type: 'delegation',
								right: target.right,
								ownerAccount: email.addr
							});
						});
					}
				});
			}
		});
	}

	return result;
};

/**
 *
 * @param address
 * @param primaryAccount
 * @param settings
 */
const getAddressOwnerAccount = (
	address: string,
	primaryAccount: Account,
	settings: AccountSettings
): string | null => {
	if (!address) {
		return null;
	}
	const addressInfo = getAvailableAddresses(primaryAccount, settings).filter(
		(info) => info.address === address
	);
	if (addressInfo.length === 0) {
		return null;
	}

	return addressInfo[0].ownerAccount;
};

/**
 * Returns the list of all the identities for the account. For each identity a type
 * is give, by matching the email address with all the available addresses, or by
 * setting a default one if the address does not match any of the available addresses.
 *
 * The function returns also an identity for each account for which the user is a delegate
 * (sendAs or sendOnBehalfOf) if there is no an already existing identity
 *
 * @param account
 * @param settings
 */
const getIdentities = (account: Account, settings: AccountSettings): Array<IdentityDescriptor> => {
	const identities: Array<IdentityDescriptor> = [];

	// Get the list of all the available email addresses for the account and their type
	const availableEmailAddresses = getAvailableAddresses(account, settings);
	const availableIdentities = account.identities?.identity;

	availableEmailAddresses.forEach((availableAddress) => {
		// Find the first match between the current address and the identity receiving mail
		const matchingIdentity = availableIdentities.find((identity) => {
			const fromAddress = identity._attrs?.zimbraPrefFromAddress ?? '';

			// The receiving address for the primary identity is the account name
			const receivingAddress = identity.name === PRIMARY_IDENTITY_NAME ? account.name : fromAddress;
			return availableAddress.address === receivingAddress;
		});

		/*
		 * If a match is found then the identity descriptor is added to the result
		 * Otherwise if the identity is missing and the address type is 'delegation'
		 * a virtual identity is created
		 */
		if (matchingIdentity) {
			const fromDisplay = matchingIdentity._attrs?.zimbraPrefFromDisplay;

			identities.push({
				ownerAccount: availableAddress.ownerAccount ?? account.name,
				receivingAddress: availableAddress.address,
				id: matchingIdentity._attrs?.zimbraPrefIdentityId ?? '',
				identityName: matchingIdentity.name ?? '',
				identityDisplayName: matchingIdentity._attrs?.zimbraPrefIdentityName ?? '',
				fromDisplay,
				fromAddress: availableAddress.address,
				type: availableAddress.type,
				right: availableAddress.right,
				defaultSignatureId: matchingIdentity._attrs?.zimbraPrefDefaultSignatureId,
				forwardReplySignatureId: matchingIdentity._attrs?.zimbraPrefForwardReplySignatureId
			});
		} else if (availableAddress.type === 'delegation') {
			identities.push({
				ownerAccount: availableAddress.ownerAccount ?? account.name,
				receivingAddress: availableAddress.address,
				id: uuid(),
				identityName: availableAddress.address,
				identityDisplayName: availableAddress.address,
				fromDisplay: availableAddress.address,
				fromAddress: availableAddress.address,
				type: availableAddress.type,
				right: availableAddress.right,
				defaultSignatureId: '',
				forwardReplySignatureId: ''
			});
		}
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
 */
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
 * Computes the weight of the recipient based on its role in the message, the type of
 * the matching identity, and the matching between the accounts that own the identity and
 * the message's folder
 *
 * @param recipients
 * @param identities
 *
 * @returns the list of recipients with their weight
 */
const computeIdentityWeight = (
	recipients: Array<RecipientWeight>,
	identities: Array<IdentityDescriptor>,
	folderOwnerAccount: string
): Array<RecipientWeight> => {
	const result: Array<RecipientWeight> = [];

	// Cycle for every recipient in the message
	recipients.forEach((recipient) => {
		// Check if the recipient has a matching identity
		const matchingIdentity = identities.find(
			(identity) => identity.fromAddress === recipient.recipientAddress
		);

		/*
		 * Check if the owner account of the matching identity
		 * is the same of the message's folder owner account
		 */
		const accountMatch =
			matchingIdentity?.ownerAccount === folderOwnerAccount ? 'match' : 'nomatch';

		result.push({
			...recipient,
			matchingIdentity,
			weight:
				AccountOwnershipWeights[accountMatch] *
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
 * @param folderRoots - The list of all the folder roots
 * @param account - The primary account infos
 * @param settings - The settings of the account
 * @param message - The message to analyze
 */
const getRecipientReplyIdentity = (
	folderRoots: Folders,
	account: Account,
	settings: AccountSettings,
	message: MailMessage
): MatchingReplyIdentity => {
	// Get all the available identities for the account
	const identities = getIdentities(account, settings);

	const messageFolderOwnerAccount = getMessageOwnerAccountName(message, account, folderRoots);

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
	const recipientWeights = computeIdentityWeight(
		filteredRecipients,
		identities,
		messageFolderOwnerAccount
	);

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

/**
 *
 * @param participant
 * @param 	account: Account,
 * @param settings
 */
const getIdentityFromParticipant = (
	participant: Participant,
	account: Account,
	settings: AccountSettings
): IdentityDescriptor | null =>
	getIdentities(account, settings).reduce<IdentityDescriptor | null>((result, identity) => {
		if (identity.fromAddress !== participant.address) {
			return result;
		}

		// TODO maybe handle the scenario when 2 identity has the same address but they differ by the name

		return identity;
	}, null);

/**
 * Returns the message's sender obtained from the message's participants
 * @param message
 */
const getMessageSenderAddress = (message: MailMessage): string | null => {
	if (!message || !message.participants) {
		return null;
	}

	const senders = message.participants.filter(
		(participant) => participant.type === ParticipantRole.FROM
	);
	if (senders.length === 0) {
		return null;
	}

	return senders[0].address;
};

/**
 * Returns the account of the message's sender obtained from the message's participants
 * @param message
 * @param primaryAccount
 * @param settings
 */
const getMessageSenderAccount = (
	message: MailMessage,
	primaryAccount: Account,
	settings: AccountSettings
): string | null => {
	const address = getMessageSenderAddress(message);
	if (!address) {
		return null;
	}

	return getAddressOwnerAccount(address, primaryAccount, settings);
};

/**
 *
 * @param account
 * @param settings
 */
const getDefaultIdentity = (account: Account, settings: AccountSettings): IdentityDescriptor =>
	getIdentities(account, settings).reduce((result, identity) =>
		identity.identityName === PRIMARY_IDENTITY_NAME ? identity : result
	);

/**
 *
 * @param identity
 * @param account
 * @param settings
 * @param t
 */
const getIdentityDescription = (
	identity: IdentityDescriptor,
	account: Account,
	settings: AccountSettings,
	t: TFunction
): string | null => {
	if (!identity) {
		return null;
	}

	const defaultIdentity = getDefaultIdentity(account, settings);

	return identity.right === 'sendOnBehalfOf'
		? `${defaultIdentity.fromDisplay} ${t('label.on_behalf_of', 'on behalf of')} ${
				identity.fromDisplay ?? identity.identityName
		  } <${identity.fromAddress}>`
		: `${identity.fromDisplay ?? identity.identityName} <${identity.fromAddress}>`;
};

export {
	IdentityDescriptor,
	MatchingReplyIdentity,
	RecipientWeight,
	getDefaultIdentity,
	checkMatchingAddress,
	computeIdentityWeight,
	filterMatchingRecipients,
	getAddressOwnerAccount,
	getAvailableAddresses,
	getIdentities,
	getIdentityFromParticipant,
	getMessageSenderAccount,
	getMessageSenderAddress,
	getRecipientReplyIdentity,
	getRecipients,
	getIdentityDescription
};
