/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { fireEvent, screen, within } from '@testing-library/react';
import { noop } from 'lodash';
import React from 'react';
import { ParticipantRole } from '../../../../../carbonio-ui-commons/constants/participants';
import { FOLDERS } from '../../../../../carbonio-ui-commons/test/mocks/carbonio-shell-ui';
import { setupTest } from '../../../../../carbonio-ui-commons/test/test-setup';
import { FOLDERS_DESCRIPTORS, VISIBILITY_ASSERTION } from '../../../../../tests/constants';
import { generateMessage } from '../../../../../tests/generators/generateMessage';
import { generateStore } from '../../../../../tests/generators/store';
import type { MessageListItemProps } from '../../../../../types';
import { MessageListItem } from '../message-list-item';

describe('Message list item component', () => {
	describe('in any folders', () => {
		test.each`
			case | folder                              | assertion
			${1} | ${FOLDERS_DESCRIPTORS.INBOX}        | ${VISIBILITY_ASSERTION.IS_VISIBLE}
			${1} | ${FOLDERS_DESCRIPTORS.SENT}         | ${VISIBILITY_ASSERTION.IS_VISIBLE}
			${1} | ${FOLDERS_DESCRIPTORS.DRAFTS}       | ${VISIBILITY_ASSERTION.IS_VISIBLE}
			${1} | ${FOLDERS_DESCRIPTORS.TRASH}        | ${VISIBILITY_ASSERTION.IS_VISIBLE}
			${1} | ${FOLDERS_DESCRIPTORS.SPAM}         | ${VISIBILITY_ASSERTION.IS_VISIBLE}
			${1} | ${FOLDERS_DESCRIPTORS.USER_DEFINED} | ${VISIBILITY_ASSERTION.IS_VISIBLE}
		`(
			`(case #$case) the avatar $assertion.desc for a message in $folder.desc folder`,
			async ({ folder, assertion }) => {
				const msg = generateMessage({ folderId: folder.id });

				const props: MessageListItemProps = {
					item: msg,
					selected: false,
					selecting: false,
					isConvChildren: false,
					visible: true,
					active: true,
					toggle: noop,
					deselectAll: noop,
					currentFolderId: folder.id
				};

				const store = generateStore({
					messages: {
						searchedInFolder: {},
						messages: [msg],
						status: {}
					}
				});

				setupTest(<MessageListItem {...props} />, { store });

				const avatar = screen.queryByTestId('AvatarContainer');
				assertion.value ? expect(avatar).toBeVisible() : expect(avatar).not.toBeInTheDocument();
			}
		);

		test.each`
			case | folder                              | assertion
			${2} | ${FOLDERS_DESCRIPTORS.INBOX}        | ${VISIBILITY_ASSERTION.IS_VISIBLE}
			${2} | ${FOLDERS_DESCRIPTORS.SENT}         | ${VISIBILITY_ASSERTION.IS_VISIBLE}
			${2} | ${FOLDERS_DESCRIPTORS.DRAFTS}       | ${VISIBILITY_ASSERTION.IS_VISIBLE}
			${2} | ${FOLDERS_DESCRIPTORS.TRASH}        | ${VISIBILITY_ASSERTION.IS_VISIBLE}
			${2} | ${FOLDERS_DESCRIPTORS.SPAM}         | ${VISIBILITY_ASSERTION.IS_VISIBLE}
			${2} | ${FOLDERS_DESCRIPTORS.USER_DEFINED} | ${VISIBILITY_ASSERTION.IS_VISIBLE}
		`(
			`(case #$case) the date $assertion.desc for a message in $folder.desc folder`,
			async ({ folder, assertion }) => {
				const receiveDate = Date.parse('2023-04-07T12:59:06');
				const msg = generateMessage({ receiveDate, folderId: folder.id });

				const props: MessageListItemProps = {
					item: msg,
					selected: false,
					selecting: false,
					isConvChildren: false,
					visible: true,
					active: true,
					toggle: noop,
					deselectAll: noop,
					currentFolderId: folder.id
				};

				const store = generateStore({
					messages: {
						searchedInFolder: {},
						messages: [msg],
						status: {}
					}
				});

				setupTest(<MessageListItem {...props} />, { store });

				const dateLabel = screen.queryByTestId('DateLabel');
				if (assertion.value) {
					expect(dateLabel).toBeVisible();
				} else {
					expect(dateLabel).not.toBeInTheDocument();
				}
			}
		);

		test.each`
			case | folder                              | assertion
			${3} | ${FOLDERS_DESCRIPTORS.INBOX}        | ${VISIBILITY_ASSERTION.IS_VISIBLE}
			${3} | ${FOLDERS_DESCRIPTORS.SENT}         | ${VISIBILITY_ASSERTION.IS_VISIBLE}
			${3} | ${FOLDERS_DESCRIPTORS.DRAFTS}       | ${VISIBILITY_ASSERTION.IS_VISIBLE}
			${3} | ${FOLDERS_DESCRIPTORS.TRASH}        | ${VISIBILITY_ASSERTION.IS_VISIBLE}
			${3} | ${FOLDERS_DESCRIPTORS.SPAM}         | ${VISIBILITY_ASSERTION.IS_VISIBLE}
			${3} | ${FOLDERS_DESCRIPTORS.USER_DEFINED} | ${VISIBILITY_ASSERTION.IS_VISIBLE}
		`(
			`(case #$case) if set, the subject $assertion.desc for a message in $folder.desc folder`,
			async ({ folder, assertion }) => {
				const subject = 'This is an interesting subject';
				const msg = generateMessage({ subject, folderId: folder.id });

				const props: MessageListItemProps = {
					item: msg,
					selected: false,
					selecting: false,
					isConvChildren: false,
					visible: true,
					active: true,
					toggle: noop,
					deselectAll: noop,
					currentFolderId: folder.id
				};

				const store = generateStore({
					messages: {
						searchedInFolder: {},
						messages: [msg],
						status: {}
					}
				});

				setupTest(<MessageListItem {...props} />, { store });

				const subjectLabel = screen.queryByTestId('Subject');
				if (assertion.value) {
					expect(subjectLabel).toBeVisible();
					expect(subjectLabel).toHaveTextContent(subject);
				} else {
					expect(subjectLabel).not.toBeInTheDocument();
				}
			}
		);

		test.each`
			case | folder                              | assertion
			${4} | ${FOLDERS_DESCRIPTORS.INBOX}        | ${VISIBILITY_ASSERTION.IS_VISIBLE}
			${4} | ${FOLDERS_DESCRIPTORS.SENT}         | ${VISIBILITY_ASSERTION.IS_VISIBLE}
			${4} | ${FOLDERS_DESCRIPTORS.DRAFTS}       | ${VISIBILITY_ASSERTION.IS_VISIBLE}
			${4} | ${FOLDERS_DESCRIPTORS.TRASH}        | ${VISIBILITY_ASSERTION.IS_VISIBLE}
			${4} | ${FOLDERS_DESCRIPTORS.SPAM}         | ${VISIBILITY_ASSERTION.IS_VISIBLE}
			${4} | ${FOLDERS_DESCRIPTORS.USER_DEFINED} | ${VISIBILITY_ASSERTION.IS_VISIBLE}
		`(
			`(case #$case) if set, the subject $assertion.desc for a message in $folder.desc folder`,
			async ({ folder, assertion }) => {
				const subject = '';
				const msg = generateMessage({ subject, folderId: folder.id });

				const props: MessageListItemProps = {
					item: msg,
					selected: false,
					selecting: false,
					isConvChildren: false,
					visible: true,
					active: true,
					toggle: noop,
					deselectAll: noop,
					currentFolderId: folder.id
				};

				const store = generateStore({
					messages: {
						searchedInFolder: {},
						messages: [msg],
						status: {}
					}
				});

				setupTest(<MessageListItem {...props} />, { store });

				const subjectLabel = screen.queryByTestId('Subject');
				if (assertion.value) {
					expect(subjectLabel).toBeVisible();
					expect(subjectLabel).toHaveTextContent('label.no_subject_with_tags');
				} else {
					expect(subjectLabel).not.toBeInTheDocument();
				}
			}
		);

		test.each`
			case | folder                              | assertion
			${5} | ${FOLDERS_DESCRIPTORS.INBOX}        | ${VISIBILITY_ASSERTION.IS_VISIBLE}
			${5} | ${FOLDERS_DESCRIPTORS.SENT}         | ${VISIBILITY_ASSERTION.IS_VISIBLE}
			${5} | ${FOLDERS_DESCRIPTORS.DRAFTS}       | ${VISIBILITY_ASSERTION.IS_VISIBLE}
			${5} | ${FOLDERS_DESCRIPTORS.TRASH}        | ${VISIBILITY_ASSERTION.IS_VISIBLE}
			${5} | ${FOLDERS_DESCRIPTORS.SPAM}         | ${VISIBILITY_ASSERTION.IS_VISIBLE}
			${5} | ${FOLDERS_DESCRIPTORS.USER_DEFINED} | ${VISIBILITY_ASSERTION.IS_VISIBLE}
		`(
			`(case #$case) the sender label $assertion.desc for a message in $folder.desc folder`,
			async ({ folder, assertion }) => {
				const msg = generateMessage({ folderId: folder.id });

				const props: MessageListItemProps = {
					item: msg,
					selected: false,
					selecting: false,
					isConvChildren: false,
					visible: true,
					active: true,
					toggle: noop,
					deselectAll: noop,
					currentFolderId: folder.id
				};

				const store = generateStore({
					messages: {
						searchedInFolder: {},
						messages: [msg],
						status: {}
					}
				});

				setupTest(<MessageListItem {...props} />, { store });

				const senderLabel = screen.queryByTestId('participants-name-label');
				if (assertion.value) {
					expect(senderLabel).toBeVisible();
				} else {
					expect(senderLabel).not.toBeInTheDocument();
				}
			}
		);

		test.each`
			case | folder                              | senderAddress      | labelContent
			${6} | ${FOLDERS_DESCRIPTORS.INBOX}        | ${'luigi@foo.bar'} | ${'luigi'}
			${6} | ${FOLDERS_DESCRIPTORS.DRAFTS}       | ${'luigi@foo.bar'} | ${'luigi'}
			${6} | ${FOLDERS_DESCRIPTORS.TRASH}        | ${'luigi@foo.bar'} | ${'luigi'}
			${6} | ${FOLDERS_DESCRIPTORS.SPAM}         | ${'luigi@foo.bar'} | ${'luigi'}
			${6} | ${FOLDERS_DESCRIPTORS.USER_DEFINED} | ${'luigi@foo.bar'} | ${'luigi'}
		`(
			`(case #$case) the sender name must contain the sender name for a message in $folder.desc folder`,
			async ({ folder, senderAddress, labelContent }) => {
				const from = { type: ParticipantRole.FROM, address: senderAddress };
				const msg = generateMessage({ from, folderId: folder.id });

				const props: MessageListItemProps = {
					item: msg,
					selected: false,
					selecting: false,
					isConvChildren: false,
					visible: true,
					active: true,
					toggle: noop,
					deselectAll: noop,
					currentFolderId: folder.id
				};

				const store = generateStore({
					messages: {
						searchedInFolder: {},
						messages: [msg],
						status: {}
					}
				});

				setupTest(<MessageListItem {...props} />, { store });

				const senderLabel = screen.queryByTestId('participants-name-label');
				expect(senderLabel).toHaveTextContent(labelContent);
			}
		);

		test.todo('(case #7) hovering on the message the primary actions container must be visible');
		// test('(case #7) hovering on the message the primary actions container must be visible', async () => {
		// 	const folderId = FOLDERS.INBOX;
		// 	const msg = generateMessage({ folderId });
		// 	const msgId = msg.id;
		//
		// 	const props: MessageListItemProps = {
		// 		item: msg,
		// 		selected: false,
		// 		selecting: false,
		// 		isConvChildren: false,
		// 		visible: true,
		// 		active: true,
		// 		toggle: noop,
		// 		deselectAll: noop,
		// 		currentFolderId: folderId
		// 	};
		//
		// 	const store = generateStore({
		// 		messages: {
		// 			searchedInFolder: {},
		// 			messages: [msg],
		// 			status: {}
		// 		}
		// 	});
		//
		// 	const { user } = setupTest(<MessageListItem {...props} />, { store });
		//
		// 	const actionsBar = await screen.findByTestId(`primary-actions-bar-${msgId}`);
		// 	const container = await screen.findByTestId(`hover-container-${msgId}`);
		// 	const aRandomChild = await screen.findByTestId('message-list-item-avatar');
		//
		// 	expect(actionsBar).not.toBeVisible();
		// 	// act(() => {
		// 	// 	user.pointer({ target: container });
		// 	// });
		// 	user.hover(aRandomChild);
		//
		// 	// act(() => {
		// 	// 	user.hover(container);
		// 	// });
		// 	expect(actionsBar).toBeVisible();
		// });

		test('(case #8) when right-click the message the secondary actions contextual menu must be visible', async () => {
			const folderId = FOLDERS.INBOX;
			const msg = generateMessage({ folderId });
			const msgId = msg.id;

			const props: MessageListItemProps = {
				item: msg,
				selected: false,
				selecting: false,
				isConvChildren: false,
				visible: true,
				active: true,
				toggle: noop,
				deselectAll: noop,
				currentFolderId: folderId
			};

			const store = generateStore({
				messages: {
					searchedInFolder: {},
					messages: [msg],
					status: {}
				}
			});

			setupTest(<MessageListItem {...props} />, { store });
			const aRandomChild = await screen.findByTestId(`hover-container-${msgId}`);

			// Initally the context menu is not created
			expect(screen.queryByTestId('dropdown-popper-list')).not.toBeInTheDocument();

			// Trigger a right-click
			fireEvent.contextMenu(aRandomChild);

			const menu = await screen.findByTestId('dropdown-popper-list');
			expect(menu).toBeVisible();
		});
	});

	/**
	 *
	 * @param folderId
	 */
	const testRecipients = (folderId: string): void => {
		const to = [
			{ type: ParticipantRole.TO, address: 'mario@foo.bar' },
			{ type: ParticipantRole.TO, address: 'luigi@foo.bar' }
		];
		const msg = generateMessage({ to, folderId });

		const props: MessageListItemProps = {
			item: msg,
			selected: false,
			selecting: false,
			isConvChildren: false,
			visible: true,
			active: true,
			toggle: noop,
			deselectAll: noop,
			currentFolderId: folderId
		};

		const store = generateStore({
			messages: {
				searchedInFolder: {},
				messages: [msg],
				status: {}
			}
		});

		setupTest(<MessageListItem {...props} />, { store });
		const participantsLabel = screen.getByTestId('participants-name-label');
		expect(participantsLabel).toHaveTextContent('mario');
		expect(participantsLabel).toHaveTextContent('luigi');
	};

	/**
	 *
	 * @param folderId
	 */
	const testFragment = (folderId: string): void => {
		const body = 'Message body content';
		const msg = generateMessage({ body, folderId });

		const props: MessageListItemProps = {
			item: msg,
			selected: false,
			selecting: false,
			isConvChildren: false,
			visible: true,
			active: true,
			toggle: noop,
			deselectAll: noop,
			currentFolderId: folderId
		};

		const store = generateStore({
			messages: {
				searchedInFolder: {},
				messages: [msg],
				status: {}
			}
		});

		setupTest(<MessageListItem {...props} />, { store });
		const fragment = screen.getByTestId('Fragment');
		expect(fragment).toHaveTextContent(body);
	};

	describe('in the drafts folder', () => {
		test('(case #1) the string [DRAFT] is visible', async () => {
			const folderId = FOLDERS.DRAFTS;
			const msg = generateMessage({ folderId });

			const props: MessageListItemProps = {
				item: msg,
				selected: false,
				selecting: false,
				isConvChildren: false,
				visible: true,
				active: true,
				toggle: noop,
				deselectAll: noop,
				currentFolderId: folderId
			};

			const store = generateStore({
				messages: {
					searchedInFolder: {},
					messages: [msg],
					status: {}
				}
			});

			setupTest(<MessageListItem {...props} />, { store });
			expect(screen.getByText('label.draft_folder')).toBeVisible();
		});

		test("(case #2) the recipients' names, if set, must be visible", () =>
			testRecipients(FOLDERS.DRAFTS));

		test('(case #3) if the body content is set, the fragment is visible', async () =>
			testFragment(FOLDERS.DRAFTS));
	});

	describe('in the trash folder', () => {
		test("(case #1) the recipients' names, if set, must be visible", () =>
			testRecipients(FOLDERS.TRASH));

		test('(case #2) if the body content is set, the fragment is visible', async () =>
			testFragment(FOLDERS.TRASH));
	});
});
