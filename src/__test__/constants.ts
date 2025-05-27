/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { FOLDERS } from '../constants/folders';

export const FOLDERS_DESCRIPTORS = {
	userRoot: {
		id: FOLDERS.USER_ROOT,
		desc: 'user root'
	},
	inbox: {
		id: FOLDERS.INBOX,
		desc: 'inbox'
	},
	sent: {
		id: FOLDERS.SENT,
		desc: 'sent'
	},
	draft: {
		id: FOLDERS.DRAFTS,
		desc: 'drafts'
	},
	spam: {
		id: FOLDERS.SPAM,
		desc: 'junk'
	},
	trash: {
		id: FOLDERS.TRASH,
		desc: 'trash'
	},
	userDefined: {
		id: '1234567',
		desc: 'user defined'
	},
	contacts: {
		id: FOLDERS.CONTACTS,
		desc: 'contacts'
	},
	autoContacts: {
		id: FOLDERS.AUTO_CONTACTS,
		desc: 'emailed contacts'
	},
	calendar: {
		id: FOLDERS.CALENDAR,
		desc: 'calendar'
	}
};
