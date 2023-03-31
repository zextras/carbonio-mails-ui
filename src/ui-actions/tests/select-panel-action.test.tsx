/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
describe('Actions visibility', () => {
	test.todo(
		'primary actions contain the mark as read action if the selection doesn’t involve a trashed, junk or draft message and at least one message is unread'
	);
	test.todo(
		'primary actions contain the mark as unread action if the selection doesn’t involve a trashed, junk or draft message and at least one message is read'
	);
	test.todo(
		'primary actions don’t contain the mark as read action if the selection involve a trashed, junk or draft message'
	);
	test.todo(
		'primary actions don’t contain the mark as unread action if the selection involve a trashed, junk or draft message'
	);
	test.todo(
		'primary actions contain the delete permanently action if the selection involve trashed messages only'
	);
	test.todo(
		'primary actions contain the trash action if the selection doesn’t involve a trashed message'
	);
	test.todo(
		'secondary actions don’t contain the mark as unread action if the selection involve a trashed, junk or draft message'
	);
	test.todo(
		'secondary actions don’t contain the mark as unread action if the selection involve a trashed, junk or draft message'
	);
	test.todo('secondary actions contain the flag action');
	test.todo(
		'secondary actions don’t contain the move action if the selection involve a trashed or draft message'
	);
	test.todo('secondary actions contain the tag submenu');
	test.todo(
		'secondary actions don’t contain the mark as spam action if the selection involve a trashed, junk or draft message'
	);
	test.todo(
		'secondary actions contain the restore action if the selection involve trashed messages only'
	);
	test.todo(
		'secondary actions contain the delete permanently action if the selection involve trashed messages only'
	);
});
