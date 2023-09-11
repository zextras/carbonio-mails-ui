/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { Participant } from '../types';

/**
 * Compares the mandatory fields and then, if set, the optional fields
 *
 * @param participant
 * @param other
 */
export const equalsParticipant = (participant: Participant, other: Participant): boolean => {
	if (participant.type !== other.type) {
		return false;
	}
	if (participant.address !== other.address) {
		return false;
	}
	if (participant.name && participant.name !== other.name) {
		return false;
	}
	if (participant.fullName && participant.fullName !== other.fullName) {
		return false;
	}

	return true;
};
