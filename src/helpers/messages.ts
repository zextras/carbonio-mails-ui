/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { ParticipantRoleType } from '../carbonio-ui-commons/constants/participants';
import { MailMessage, Participant } from '../types';

/**
 *
 * @param message
 * @param type
 */
export const collectParticipantsFromMessage = (
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
 * @param messages
 * @param type
 */
export const collectParticipantsFromMessages = (
	messages: Array<MailMessage>,
	type?: ParticipantRoleType
): Array<Participant> => {
	if (!messages || !messages.length) {
		return [];
	}

	// Collect and return the filtered participant from each message
	return messages.reduce<Array<Participant>>((result, message): Array<Participant> => {
		result.push(...collectParticipantsFromMessage(message, type));
		return result;
	}, []);
};
