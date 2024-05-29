/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { Account, getUserAccount, getUserSettings, t } from '@zextras/carbonio-shell-ui';
import { TFunction } from 'i18next';
import { filter, findIndex, flatten, isArray, map, remove } from 'lodash';

import { getMessageOwnerAccountName } from './folders';
import { ParticipantRole } from '../carbonio-ui-commons/constants/participants';
import type { Folders } from '../carbonio-ui-commons/types/folder';
import { NO_ACCOUNT_NAME } from '../constants';
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
	defaultSignatureId?: string;
	forwardReplySignatureId?: string;
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

const getNoIdentityPlaceholder = (): string =>
	t('label.no_identity_selected', '<No identity selected>');

/**
 * Returns the list of all the available addresses for the account and their type
 */
const getAvailableAddresses = (): Array<AvailableAddress> => {
	const account = getUserAccount();
	const settings = getUserSettings();
	const result: Array<AvailableAddress> = [];

	// Adds the email address of the primary account
	result.push({
		address: account?.name ?? NO_ACCOUNT_NAME,
		type: 'primary',
		ownerAccount: account?.name ?? NO_ACCOUNT_NAME
	});

	// Adds all the aliases
	if (settings.attrs.zimbraMailAlias) {
		if (isArray(settings.attrs.zimbraMailAlias)) {
			result.push(
				...(settings.attrs.zimbraMailAlias as string[]).map<AvailableAddress>((alias: string) => ({
					address: alias,
					type: 'alias',
					ownerAccount: account?.name ?? NO_ACCOUNT_NAME
				}))
			);
		} else {
			result.push({
				address: settings.attrs.zimbraMailAlias as string,
				type: 'alias',
				ownerAccount: account?.name ?? NO_ACCOUNT_NAME
			});
		}
	}

	// Adds the email addresses of all the delegation accounts
	if (account?.rights?.targets) {
		account.rights.targets.forEach((target) => {
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
 * Returns the name of the account that owns the given address
 *
 * @param address
 */
const getAddressOwnerAccount = (address: string): string | null => {
	if (!address) {
		return null;
	}
	const addressInfo = getAvailableAddresses().filter((info) => info.address === address);
	if (addressInfo.length === 0) {
		return null;
	}

	return addressInfo[0].ownerAccount;
};

/**
 * @param email
 * @param rights
 */
const generateIdentityId = (email: string, rights: string): string => email + rights;

/**
 *
 * @param identities
 */
const sortIdentities = (
	identities: Account['identities']['identity']
): Account['identities']['identity'] => {
	const allIdentities = [...identities];
	const defaultIdentity = remove(
		allIdentities,
		(identity) => identity.name === PRIMARY_IDENTITY_NAME
	);
	return [...defaultIdentity, ...allIdentities];
};

/**
 * Returns the list of all the identities for the account. For each identity a type
 * is give, by matching the email address with all the available addresses, or by
 * setting a default one if the address does not match any of the available addresses.
 *
 * The function returns also an identity for each account for which the user is a delegate
 * (sendAs or sendOnBehalfOf) if there is no an already existing identity
 */
const getIdentitiesDescriptors = (): Array<IdentityDescriptor> => {
	const account = getUserAccount();
	const identities: Array<IdentityDescriptor> = [];

	// Get the list of all the available email addresses for the account and their type
	const availableEmailAddresses = getAvailableAddresses();

	// sortIdentities(account.identities?.identity)?.forEach((identity) => {
	account?.identities?.identity &&
		sortIdentities(account.identities.identity)?.forEach((identity) => {
			const fromAddress = identity._attrs?.zimbraPrefFromAddress ?? '';
			const fromDisplay = identity._attrs?.zimbraPrefFromDisplay;

			// The receiving address for the primary identity is the account name
			const receivingAddress = identity.name === PRIMARY_IDENTITY_NAME ? account.name : fromAddress;

			// Find the first match between the identity receiving email address and the available email addresses
			const matchingReceivingAddress = availableEmailAddresses.find(
				(availableAddress) => availableAddress.address === receivingAddress
			);

			const type = matchingReceivingAddress
				? matchingReceivingAddress.type
				: UNKNOWN_IDENTITY_DEFAULT_TYPE;

			const right =
				type === 'delegation' && matchingReceivingAddress
					? matchingReceivingAddress.right
					: undefined;

			identities.push({
				ownerAccount: matchingReceivingAddress?.ownerAccount ?? account.name,
				receivingAddress,
				id: identity._attrs?.zimbraPrefIdentityId ?? '',
				identityName: identity.name ?? '',
				identityDisplayName: identity._attrs?.zimbraPrefIdentityName ?? '',
				fromDisplay,
				fromAddress,
				type,
				right,
				defaultSignatureId: identity._attrs?.zimbraPrefDefaultSignatureId,
				forwardReplySignatureId: identity._attrs?.zimbraPrefForwardReplySignatureId
			});
		});

	const delegationAccounts = filter(
		account?.rights?.targets,
		(rts) => rts.right === 'sendAs' || rts.right === 'sendOnBehalfOf'
	);

	const delegationIdentities = flatten(
		map(delegationAccounts, (ele) =>
			map(ele?.target, (item: { d: string; type: string; email: Array<{ addr: string }> }) => ({
				ownerAccount: item.email[0].addr ?? account?.name ?? NO_ACCOUNT_NAME,
				receivingAddress: item.email[0].addr,
				id: generateIdentityId(item.email[0].addr, ele.right),
				identityName: item.d,
				identityDisplayName: item.d,
				fromDisplay: item.d,
				fromAddress: item.email[0].addr,
				type: 'delegation',
				right: ele.right
			}))
		)
	);

	const uniqueIdentityList: IdentityDescriptor[] = [...identities];
	if (delegationIdentities?.length) {
		map(delegationIdentities, (ele: IdentityDescriptor) => {
			const uniqIdentity = findIndex(identities, { fromAddress: ele.fromAddress });
			if (uniqIdentity < 0) uniqueIdentityList.push(ele);
		});
		return uniqueIdentityList;
	}

	return identities;
};

/**
 *
 * @param id
 */
export const getIdentityDescriptor = (id: string): IdentityDescriptor | null =>
	getIdentitiesDescriptors().find((identityDescriptor) => identityDescriptor.id === id) ?? null;

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
 * @param folderOwnerAccount
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
 *
 */
const getDefaultIdentity = (): IdentityDescriptor =>
	getIdentitiesDescriptors().reduce((result, identity) =>
		identity.identityName === PRIMARY_IDENTITY_NAME ? identity : result
	);

/**
 * Analyze the message and return the identity that should be used to reply it.
 * @param folderRoots - The list of all the folder roots
 * @param message - The message to analyze
 */
const getRecipientReplyIdentity = (
	folderRoots: Folders,
	message: MailMessage
): MatchingReplyIdentity => {
	// Get all the available identities for the account
	const identities = getIdentitiesDescriptors();

	const messageFolderOwnerAccount = getMessageOwnerAccountName(message, folderRoots);

	// Extract all the recipients addresses from the message
	const recipients = getRecipients(message);

	// Check if the recipient address matches one of the account available addresses
	const recipientsWithMatchingAddress = checkMatchingAddress(recipients, getAvailableAddresses());

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

	if (!replyIdentity) {
		// Return the default identity if not getting the matching recipient
		const defaultIdentity = getDefaultIdentity();
		return {
			name: defaultIdentity?.fromDisplay ?? '',
			address: defaultIdentity?.fromAddress ?? defaultIdentity?.receivingAddress ?? '',
			identityId: defaultIdentity?.id,
			identityName: defaultIdentity?.identityName,
			defaultSignatureId: defaultIdentity?.defaultSignatureId,
			forwardReplySignatureId: defaultIdentity?.forwardReplySignatureId
		};
	}
	// Return the identity with the highest weight
	return {
		name: replyIdentity?.recipientFullName ?? '',
		address: replyIdentity?.matchingIdentity?.fromAddress ?? replyIdentity?.recipientAddress ?? '',
		identityId: replyIdentity?.matchingIdentity?.id,
		identityName: replyIdentity?.matchingIdentity?.identityName,
		defaultSignatureId: replyIdentity?.matchingIdentity?.defaultSignatureId,
		forwardReplySignatureId: replyIdentity?.matchingIdentity?.forwardReplySignatureId
	};
};

/**
 *
 * @param participant
 */
const getIdentityFromParticipant = (participant: Participant): IdentityDescriptor | null =>
	getIdentitiesDescriptors().reduce<IdentityDescriptor | null>((result, identity) => {
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
 */
const getMessageSenderAccount = (message: MailMessage): string | null => {
	const address = getMessageSenderAddress(message);
	if (!address) {
		return null;
	}

	return getAddressOwnerAccount(address);
};

/**
 *
 * @param identity
 * @param t
 */
const getIdentityDescription = (identity: IdentityDescriptor, t: TFunction): string | null => {
	if (!identity) {
		return null;
	}

	const defaultIdentity = getDefaultIdentity();

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
	getNoIdentityPlaceholder,
	getDefaultIdentity,
	checkMatchingAddress,
	computeIdentityWeight,
	filterMatchingRecipients,
	getAddressOwnerAccount,
	getAvailableAddresses,
	getIdentitiesDescriptors,
	getIdentityFromParticipant,
	getMessageSenderAccount,
	getMessageSenderAddress,
	getRecipientReplyIdentity,
	getRecipients,
	getIdentityDescription
};
