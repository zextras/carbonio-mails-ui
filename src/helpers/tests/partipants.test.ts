/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
describe('participants helpers', () => {
	describe('equalsParticipant', () => {
		test.todo('if the type of the participants differs then false is returned');

		test.todo('if the address of the participants differs then false is returned');

		test.todo(
			'if the name of the participant is set and differs from the other then false is returned'
		);

		test.todo(
			'if the fullname of the participant is set and differs from the other then false is returned'
		);

		test.todo(
			'if only the type and the address of the participants are set and they are the same then true is returned'
		);

		test.todo(
			'if the first participant has only the type and the address set and they are the same of the other participant then true is returned no matter of what values are set in the other participant optional fields'
		);
	});
});
