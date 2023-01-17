/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { Account, AccountSettings, Folder, Roots } from '@zextras/carbonio-shell-ui';
import { find, isArray } from 'lodash';
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
 * The type describe the possibility of a match between the account that owns the message's folder
 * and the account that owns an identity
 */
type AccountOwnershipMatchType = 'match' | 'nomatch';

/**
 * The type describe all the available addresses for an account
 */
type AvailableAddress = { address: string; type: IdentityType; ownerAccount: string };

/**
 * The type describe the identity, its type and the addresses used to
 * receive and send the message
 */
type Identity = {
	id: string;
	ownerAccount: string;
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
		type: 'primary',
		ownerAccount: account.name
	});

	// Adds all the aliases
	if (settings.attrs.zimbraMailAlias) {
		if (isArray(settings.attrs.zimbraMailAlias)) {
			result.push(
				...settings.attrs.zimbraMailAlias.map<AvailableAddress>((alias: string) => ({
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

	// Adds the email addresses of all the shared accounts
	if (account.rights?.targets) {
		account.rights?.targets.forEach((target) => {
			if (target.right === 'sendAs' && target.target) {
				target.target.forEach((user) => {
					if (user.type === 'account' && user.email) {
						user.email.forEach((email) => {
							result.push({ address: email.addr, type: 'shared', ownerAccount: email.addr });
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
			ownerAccount: matchingReceivingAddress?.ownerAccount ?? account.name,
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
 * the the message's folder
 *
 * @param recipients
 * @param identities
 *
 * @returns the list of recipients with their weight
 */
const computeIdentityWeight = (
	recipients: Array<RecipientWeight>,
	identities: Array<Identity>,
	folderOwnerAccount: string
): Array<RecipientWeight> => {
	const result: Array<RecipientWeight> = [];

	// Cicle for every recipient in the message
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

const getMessageOwnerAccount = (
	message: MailMessage,
	account: Account,
	folderRoots: Record<string, Folder & { owner: string }>
): string => {
	/*
	 * Get the message parent folder's id and the optional zid, based on the format:
	 *
	 * [<zid>:]<folderId>
	 *
	 * e.g. a79fa996-e90e-4f04-97c4-c84209bb8277:2
	 */
	const folderId = message.parent;
	const zid = folderId?.split(':')?.[0];

	// If the id doesn't contain the zid the primary account is considered the owner
	if (!zid) {
		return account.name;
	}

	// If the id contains the zid, the account is considered the owner if the zid matches the account id
	const matchingFolderRoot = find(folderRoots, { zid });
	if (!matchingFolderRoot) {
		return account.name;
	}

	return matchingFolderRoot?.owner ?? account.name;
};

/**
 * Analyze the message and return the identity that should be used to reply it.
 * @param folderRoots - The list of all the folder roots
 * @param account - The primary account infos
 * @param settings - The settings of the account
 * @param message - The message to analyze
 */
const getRecipientReplyIdentity = (
	folderRoots: Record<string, Folder & { owner: string }>,
	account: Account,
	settings: AccountSettings,
	message: MailMessage
): MatchingReplyIdentity => {
	// Get all the available identities for the account
	const identities = getIdentities(account, settings);

	const messageFolderOwnerAccount = getMessageOwnerAccount(message, account, folderRoots);

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
