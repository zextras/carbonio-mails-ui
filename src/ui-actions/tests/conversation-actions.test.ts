/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
describe('Actions visibility', () => {
	test.todo(
		'primary actions for an unread conversation in any folder except drafts contain the mark as read action'
	);
	test.todo(
		'primary actions for a read conversation in any folder except drafts contain the mark as unread action'
	);
	test.todo(
		'primary actions for a conversation in any folder except trash contain the trash action'
	);
	test.todo('primary actions for a conversation in any folder contain the flag action');
	test.todo(
		'when hovering a conversation in the trash folder contain the delete permanently action'
	);

	test.todo('secondary actions for a conversation in any folder contain the tag submenu');
	test.todo(
		'secondary actions for a conversation in any folder except draft contain the flag action'
	);
	test.todo(
		'secondary actions for a read conversation in any folder except drafts contain the mark as unread action'
	);
	test.todo(
		'secondary actions for an unread conversation in any folder except drafts contain the mark as read action'
	);
	test.todo('secondary actions for a conversation in any folder contain the print action');
	test.todo(
		'secondary actions for a conversation in any folder except junk and drafts contain the move action'
	);
	test.todo(
		'secondary actions for a conversation in any folder except trash contain the trash action'
	);
	test.todo(
		'secondary actions for a conversation in the trash folder contain the delete permanently action'
	);
});
