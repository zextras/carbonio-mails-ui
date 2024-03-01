/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { find, reverse, sortBy } from 'lodash';

import { getFolderIdParts, isDraft, isSent, isSpam, isTrash } from './folders';
import {
	ParticipantRole,
	ParticipantRoleType
} from '../carbonio-ui-commons/constants/participants';
import { useFolderStore } from '../carbonio-ui-commons/store/zustand/folder';
import { Conversation, ConvMessage, MailMessage, Participant } from '../types';

/**
 * Collect all the participants of the given type (or any type if the type params is not set)
 * from the given message
 * @param message
 * @param type
 */
export const getParticipantsFromMessage = (
	message: MailMessage,
	type?: ParticipantRoleType
): Array<Participant> => {
	if (!message || !message.participants) {
		return [];
	}

	// Filter and return the participants that match the type, or any participant if type is not specified
	return message.participants.filter((participant) => !type || participant.type === type);
};

/**
 *
 * Collect all the participants of the given type (or any type if the type params is not set)
 * from the given messages
 * @param messages
 * @param type
 */
export const getParticipantsFromMessages = (
	messages: Array<MailMessage>,
	type?: ParticipantRoleType
): Array<Participant> => {
	if (!messages || !messages.length) {
		return [];
	}

	// Collect and return the filtered participant from each message
	return messages.reduce<Array<Participant>>((result, message): Array<Participant> => {
		result.push(...getParticipantsFromMessage(message, type));
		return result;
	}, []);
};

/**
 *
 * @param message
 */
export const getFromParticipantFromMessage = (message: MailMessage): Participant | null => {
	const result = getParticipantsFromMessage(message, ParticipantRole.FROM);
	if (result.length <= 0) {
		return null;
	}

	return result[0];
};

/**
 * @param item
 */
export const isConversation = (item: MailMessage | Conversation): item is Conversation =>
	'messages' in (item || {});

/**
 *
 * @param item
 */
export const isSingleMessageConversation = (item: MailMessage | Conversation): boolean =>
	isConversation(item) && item.messages.length === 1;

export const getConversationMostRecentMessage = (
	conversation: Conversation,
	options?: {
		type: 'received' | 'sent' | 'draft' | 'trash' | 'spam';
	}
): ConvMessage | null => {
	if (conversation.messages.length === 0) {
		return null;
	}

	// Sort the message by descending date
	const sortedMessages = reverse(sortBy(conversation.messages, (message) => message.date));

	// Pick the first one that matches the options
	return (
		find(sortedMessages, (message) => {
			// If there are no matching options return the first element
			if (!options) {
				return true;
			}

			switch (options.type) {
				case 'draft':
					return isDraft(message.parent);
				case 'sent':
					return isSent(message.parent);
				case 'trash':
					return isTrash(message.parent);
				case 'spam':
					return isSpam(message.parent);
				case 'received':
					return (
						!isSpam(message.parent) &&
						!isDraft(message.parent) &&
						!isSent(message.parent) &&
						!isTrash(message.parent)
					);
				default:
					return false;
			}
		}) ?? null
	);
};

/**
 * Returns the parent folder id of the given message.
 *
 * In most of the cases the id coincide with the "parent" property of
 * the message, but they differ when the message is contained in a linked folder: in this
 * case the "parent" refers to the original owner folder zid and id, so there is the need
 * to "translate" those ids
 *
 * @param item - Message or conversation
 */
export const getParentFolderId = (item: MailMessage | Conversation): string | null => {
	if (!item) {
		return null;
	}

	const parentId = isConversation(item) ? item.messages[0].parent : item.parent;
	const parentParts = getFolderIdParts(parentId);

	/*
	 * If the zid is not present the id is referring to a normal user's folder
	 * so there is no need to search among the stored folders
	 */
	if (!parentParts.zid) {
		return parentId;
	}

	/*
	 * If the parentId is in the form zid:(r)id it could refer to a shared account folder
	 * or a linked folder.
	 */

	// First attempt: search for a shared account folder among the stored folders.
	if (useFolderStore.getState()?.folders?.[parentId]) {
		return parentId;
	}

	// Second attempt: search for an entry on the links id map, or return null otherwise
	const state = useFolderStore.getState();
	return state.linksIdMap[parentId] ?? null;
};
