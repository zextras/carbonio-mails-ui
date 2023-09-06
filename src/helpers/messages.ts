/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import {
	ParticipantRole,
	ParticipantRoleType
} from '../carbonio-ui-commons/constants/participants';
import type { Conversation, MailMessage, Participant } from '../types';

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
