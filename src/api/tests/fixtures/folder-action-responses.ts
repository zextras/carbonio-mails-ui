/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import type { FolderActionResponse } from 'types/soap/soap';

// FolderAction responses carry only the action that was applied, never the folder (real responses from
// the test server to a rename and to a grant, which adds the grantee's zid and address)
export const folderActionRenameResponse = {
	action: {
		id: '258',
		op: 'rename'
	},
	_jsns: 'urn:zimbraMail'
} satisfies FolderActionResponse;

export const folderActionGrantResponse = {
	action: {
		zid: '8a900a89-a04c-47b0-b091-65095828ac25',
		d: 'user2@example.com',
		id: '257',
		op: 'grant'
	},
	_jsns: 'urn:zimbraMail'
} satisfies FolderActionResponse;
