/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React from 'react';

import { screen } from '@testing-library/react';
import { forEach, noop, reduce } from 'lodash';

import { setupTest } from '../../carbonio-ui-commons/test/test-setup';
import { FOLDERS_DESCRIPTORS, MessageActionsDescriptors } from '../../constants';
import { ASSERTIONS, MSG_CONV_STATUS_DESCRIPTORS } from '../../tests/constants';
import { generateMessage } from '../../tests/generators/generateMessage';
import { generateStore } from '../../tests/generators/store';
import type { MailMessage } from '../../types';
import { MultipleSelectionActionsPanel } from '../../views/app/folder-panel/parts/multiple-selection-actions-panel';

const generalFolders = {
	desc: 'general folders',
	value: [
		FOLDERS_DESCRIPTORS.INBOX.id,
		FOLDERS_DESCRIPTORS.SENT.id,
		FOLDERS_DESCRIPTORS.USER_DEFINED.id
	]
};
const foldersExcludedMarkReadUnread = {
	desc: 'folders excluded mark read unread',
	value: [FOLDERS_DESCRIPTORS.DRAFTS.id, FOLDERS_DESCRIPTORS.SPAM.id, FOLDERS_DESCRIPTORS.TRASH.id]
};
const foldersExcludedTrash = [FOLDERS_DESCRIPTORS.TRASH];
const foldersIncludedDeletePermanently = [FOLDERS_DESCRIPTORS.TRASH];

function getSelectedIds(messages: MailMessage[]): Array<string> {
	return messages.map((message) => message.id);
}

function getFoldersExcluded(
	_generalFolders: { desc: string; value: Array<string> },
	excludedFolder: string
): { desc: string; value: Array<string> } {
	return {
		...generalFolders,
		value: [...generalFolders.value, excludedFolder]
	};
}

function getFoldersAllowed(
	_generalFolders: { desc: string; value: Array<string> },
	excludedFolder: string
): { desc: string; value: Array<string> } {
	const filteredFolderValues = reduce(
		generalFolders.value,
		(acc, folder) => {
			if (!excludedFolder.includes(folder)) acc.push(folder);
			return acc;
		},
		[] as Array<string>
	);
	return {
		...generalFolders,
		value: filteredFolderValues
	};
}

const deselectAll = jest.fn();
const selectAll = jest.fn();
const store = generateStore();

const props = {
	items: [],
	selectAllModeOff: noop,
	setIsSelectModeOn: noop,
	folderId: '',
	isAllSelected: false,
	selectedIds: [],
	deselectAll,
	selectAll
};
describe('Actions visibility', () => {
	test.each`
		case | read                                    | excludedFolders                  | assertion                  | action
		${1} | ${MSG_CONV_STATUS_DESCRIPTORS.READ}     | ${foldersExcludedMarkReadUnread} | ${ASSERTIONS.CONTAINS}     | ${MessageActionsDescriptors.MARK_AS_UNREAD}
		${2} | ${MSG_CONV_STATUS_DESCRIPTORS.NOT_READ} | ${foldersExcludedMarkReadUnread} | ${ASSERTIONS.CONTAINS}     | ${MessageActionsDescriptors.MARK_AS_READ}
		${3} | ${MSG_CONV_STATUS_DESCRIPTORS.READ}     | ${foldersExcludedMarkReadUnread} | ${ASSERTIONS.NOT_CONTAINS} | ${MessageActionsDescriptors.MARK_AS_READ}
		${4} | ${MSG_CONV_STATUS_DESCRIPTORS.NOT_READ} | ${foldersExcludedMarkReadUnread} | ${ASSERTIONS.NOT_CONTAINS} | ${MessageActionsDescriptors.MARK_AS_UNREAD}
	`(
		`(case #$case) primary actions for a message in $folders.desc $assertion.desc the $action.desc action`,
		async ({ excludedFolders, action, read, assertion }) => {
			forEach(excludedFolders.value, (excludedFolder: string) => {
				const folders = getFoldersExcluded(generalFolders, excludedFolder);
				const messages = folders.value.map((folder: string) =>
					generateMessage({ folderId: folder, isRead: read.value })
				);
				const selectedIds = getSelectedIds(messages);

				const testProps = {
					...props,
					items: messages,
					folderId: excludedFolder,
					selectedIds
				};

				setupTest(<MultipleSelectionActionsPanel {...testProps} />, { store });
				expect(
					screen.queryByTestId(`primary-multi-action-button-${action.id}`)
				).not.toBeInTheDocument();
			});

			// test that the action is not visible if the message is read and the folder is excluded
			forEach(excludedFolders.value, (excludedFolder) => {
				const folders = getFoldersAllowed(generalFolders, excludedFolder);

				const messages = folders.value.map((folder: string) =>
					generateMessage({ folderId: folder, isRead: read.value })
				);
				const selectedIds = getSelectedIds(messages);
				const testProps = {
					...props,
					items: messages,
					folderId: folders.value[0],
					selectedIds
				};

				setupTest(<MultipleSelectionActionsPanel {...testProps} />, { store });
				if (assertion === true)
					expect(
						screen.getByTestId(`primary-multi-action-button-${action.id}`)
					).toBeInTheDocument();
				if (assertion === false)
					expect(
						screen.queryByTestId(`primary-multi-action-button-${action.id}`)
					).not.toBeInTheDocument();
			});
		}
	);

	test.each`
		case | excludedFolders         | assertion              | action
		${1} | ${foldersExcludedTrash} | ${ASSERTIONS.CONTAINS} | ${MessageActionsDescriptors.MOVE_TO_TRASH}
	`(
		`(case #$case) primary actions for a message in $folders.desc $assertion.desc the $action.desc action`,
		async ({ excludedFolders, action, assertion }) => {
			forEach(excludedFolders.value, (excludedFolder: string) => {
				const folders = getFoldersExcluded(generalFolders, excludedFolder);
				const messages = folders.value.map((folder: string) =>
					generateMessage({ folderId: folder })
				);
				const selectedIds = getSelectedIds(messages);

				const testProps = {
					...props,
					items: messages,
					folderId: excludedFolder,
					selectedIds
				};

				setupTest(<MultipleSelectionActionsPanel {...testProps} />, { store });
				expect(
					screen.queryByTestId(`primary-multi-action-button-${action.id}`)
				).not.toBeInTheDocument();
			});

			forEach(excludedFolders.value, (excludedFolder) => {
				const folders = getFoldersAllowed(generalFolders, excludedFolder);

				const messages = folders.value.map((folder: string) =>
					generateMessage({ folderId: folder })
				);
				const selectedIds = getSelectedIds(messages);
				const testProps = {
					...props,
					items: messages,
					folderId: folders.value[0],
					selectedIds
				};

				setupTest(<MultipleSelectionActionsPanel {...testProps} />, { store });
				if (assertion === true)
					expect(
						screen.getByTestId(`primary-multi-action-button-${action.id}`)
					).toBeInTheDocument();
				if (assertion === false)
					expect(
						screen.queryByTestId(`primary-multi-action-button-${action.id}`)
					).not.toBeInTheDocument();
			});
		}
	);

	test.each`
		case | excludedFolders                     | assertion              | action
		${1} | ${foldersIncludedDeletePermanently} | ${ASSERTIONS.CONTAINS} | ${MessageActionsDescriptors.DELETE_PERMANENTLY}
	`(
		`(case #$case) primary actions for a message in $folders.desc $assertion.desc the $action.desc action`,
		async ({ excludedFolders, action, assertion }) => {
			forEach(excludedFolders.value, (excludedFolder: string) => {
				const folders = getFoldersExcluded(generalFolders, excludedFolder);
				const messages = folders.value.map((folder: string) =>
					generateMessage({ folderId: folder })
				);
				const selectedIds = getSelectedIds(messages);

				const testProps = {
					...props,
					items: messages,
					folderId: excludedFolder,
					selectedIds
				};

				setupTest(<MultipleSelectionActionsPanel {...testProps} />, { store });
				expect(
					screen.queryByTestId(`primary-multi-action-button-${action.id}`)
				).not.toBeInTheDocument();
			});

			forEach(excludedFolders.value, (excludedFolder) => {
				const folders = excludedFolder;

				const messages = folders.value.map((folder: string) =>
					generateMessage({ folderId: folder })
				);
				const selectedIds = getSelectedIds(messages);
				const testProps = {
					...props,
					items: messages,
					folderId: folders.value[0],
					selectedIds
				};

				setupTest(<MultipleSelectionActionsPanel {...testProps} />, { store });
				if (assertion.value === true)
					expect(
						screen.getByTestId(`primary-multi-action-button-${action.id}`)
					).toBeInTheDocument();
				if (assertion.value === false)
					expect(
						screen.queryByTestId(`primary-multi-action-button-${action.id}`)
					).not.toBeInTheDocument();
			});
		}
	);
});

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
// test.todo('secondary actions contain the flag action');
// test.todo(
// 	'secondary actions don’t contain the move action if the selection involve a trashed or draft message'
// );
// test.todo('secondary actions contain the tag submenu');
// test.todo(
// 	'secondary actions don’t contain the mark as spam action if the selection involve a trashed, junk or draft message'
// );
// test.todo(
// 	'secondary actions contain the restore action if the selection involve trashed messages only'
// );
// test.todo(
// 	'secondary actions contain the delete permanently action if the selection involve trashed messages only'
// );
