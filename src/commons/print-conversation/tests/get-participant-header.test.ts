/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { getParticipantHeader } from 'commons/print-conversation/get-participant-header';
import { Participant } from 'types/participant';

describe('getParticipantHeader', () => {
	it('returns an empty string when there are no participants', () => {
		expect(getParticipantHeader([], 'From')).toBe('');
	});

	it('renders the provided type label', () => {
		const participants: Participant[] = [
			{ type: 'f', address: 'john@example.com', fullName: 'John Doe' }
		];
		const result = getParticipantHeader(participants, 'From');
		expect(result).toContain('From:');
	});

	it('renders the participant fullName followed by the address in angle brackets', () => {
		const participants: Participant[] = [
			{ type: 'f', address: 'john@example.com', fullName: 'John Doe' }
		];
		const result = getParticipantHeader(participants, 'From');
		expect(result).toContain('John Doe');
		expect(result).toContain('&lt;john@example.com&gt;');
	});

	it('falls back to name when fullName is missing', () => {
		const participants: Participant[] = [
			{ type: 'f', address: 'john@example.com', name: 'Johnny' }
		];
		const result = getParticipantHeader(participants, 'To');
		expect(result).toContain('Johnny');
		expect(result).toContain('&lt;john@example.com&gt;');
	});

	it('falls back to the address as display name when fullName and name are missing', () => {
		const participants: Participant[] = [{ type: 'f', address: 'john@example.com' }];
		const result = getParticipantHeader(participants, 'To');
		// display name and the angle-bracketed address are both the address
		expect(result).toContain('john@example.com');
		expect(result).toContain('&lt;john@example.com&gt;');
	});

	it('joins multiple participants with a comma separator', () => {
		const participants: Participant[] = [
			{ type: 't', address: 'jane@example.com', fullName: 'Jane Roe' },
			{ type: 't', address: 'bob@example.com', fullName: 'Bob Smith' }
		];
		const result = getParticipantHeader(participants, 'To');
		expect(result).toContain('Jane Roe');
		expect(result).toContain('&lt;jane@example.com&gt;');
		expect(result).toContain('Bob Smith');
		expect(result).toContain('&lt;bob@example.com&gt;');
		expect(result).toContain(', ');
	});

	it('produces a single table row wrapping the participants list', () => {
		const participants: Participant[] = [
			{ type: 'c', address: 'cc@example.com', fullName: 'Carbon Copy' }
		];
		const result = getParticipantHeader(participants, 'Cc');
		expect(result).toContain('<tr>');
		expect(result).toContain('</tr>');
		expect(result).toContain('<td');
		expect(result).toContain('<span');
		// only one row is rendered
		expect(result.match(/<tr>/g)).toHaveLength(1);
	});

	it('renders correctly for the typical From / To / Cc usage', () => {
		const from: Participant[] = [{ type: 'f', address: 'sender@example.com', fullName: 'Sender' }];
		const to: Participant[] = [
			{ type: 't', address: 'recipient@example.com', fullName: 'Recipient' }
		];

		expect(getParticipantHeader(from, 'From')).toContain('From: ');
		expect(getParticipantHeader(to, 'To')).toContain('To: ');
	});
});
