/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
describe('Conversation list item component', () => {
	describe('in any folders', () => {
		test.todo(
			'if the conversation contains more than 1 message then a badge with the messages count is visible'
		);

		test.todo('the avatar is visible');

		test.todo('the date is visible');

		test.todo('if set, the subject is visible');

		test.todo('if subject is not set the <No Subject> placeholder string is visible');

		test.todo("if set, the recipients' names are visible");
	});

	describe('in the drafts folder', () => {
		test.todo('the string [DRAFT] is visible');

		test.todo('the sender name is visible');

		test.todo('if the body content is set, the fragment is visible');
	});

	describe('in the trash folder', () => {
		test.todo('the sender name is visible');

		test.todo('if the body content is set, the fragment is visible');
	});
});
